import { verifyToken } from "@clerk/backend";
import { generateText, Output } from "ai";
import { z } from "zod";

import { callKBTool, KnowledgeBaseError } from "@/lib/sanity-kb";
import type { ChatCard } from "@/lib/stay-chat";

const KB_URL_ENV = "SANITY_KB_MCP_URL";
const KB_TOOL_NAME = "search"; // Will verify this against the actual endpoint
const DECISION_TIMEOUT_MS = 6_000;

type PolicyMatch = {
  _id: string;
  title?: string;
  policyType?: string;
  summary?: string;
  body?: string;
  score?: number;
};

type SearchBody = {
  stayId?: unknown;
  question?: unknown;
};

function unauthorized(message: string) {
  return Response.json({ error: message }, { status: 401 });
}

function badRequest(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

function notFound(message: string) {
  return Response.json({ error: message }, { status: 404 });
}

const NO_ANSWER_CARD: ChatCard = {
  topic: "No answer found",
  body: "This stay's details don't answer that question. Contact support and we'll help.",
  source: "Room support",
};

function policyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    cancellation: "Cancellation",
    houseRules: "House rules",
    checkInOut: "Check-in and checkout",
    pets: "Pets",
    smoking: "Smoking",
    quietHours: "Quiet hours",
    safety: "Safety",
  };
  return labels[type] ?? type;
}

async function fetchStayPolicies(
  stayId: string,
): Promise<{ _id: string; title: string; policyType: string }[]> {
  const projectId = process.env.EXPO_PUBLIC_SANITY_PROJECT_ID ?? "";
  const dataset = process.env.EXPO_PUBLIC_SANITY_DATASET ?? "";

  if (!projectId || !dataset) {
    throw new Error(
      "EXPO_PUBLIC_SANITY_PROJECT_ID and EXPO_PUBLIC_SANITY_DATASET must be set.",
    );
  }

  // Use the same projection as the app so the IDs match what the client knows.
  const query = `*[_type == "stay" && _id == $stayId][0]{ policies[]->{ _id, title, policyType } }`;
  const url = `https://${projectId}.api.sanity.io/v2025-02-19/data/query/${dataset}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, params: { stayId } }),
  });

  if (!response.ok) {
    throw new Error(`Sanity query failed: ${response.status}`);
  }

  const payload = (await response.json()) as { result?: { policies?: unknown[] } };
  const policies = payload.result?.policies ?? [];
  return policies as {
    _id: string;
    title: string;
    policyType: string;
  }[];
}

async function fetchAllPoliciesForStay(
  stayId: string,
): Promise<PolicyMatch[]> {
  const projectId = process.env.EXPO_PUBLIC_SANITY_PROJECT_ID ?? "";
  const dataset = process.env.EXPO_PUBLIC_SANITY_DATASET ?? "";

  if (!projectId || !dataset) {
    return [];
  }

  const query = `*[_type == "stay" && _id == $stayId][0]{ policies[]->{ _id, title, policyType, summary, body } }`;
  const url = `https://${projectId}.api.sanity.io/v2025-02-19/data/query/${dataset}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, params: { stayId } }),
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as { result?: { policies?: PolicyMatch[] } };
  return payload.result?.policies ?? [];
}

async function narrowWithJev(
  question: string,
  matches: PolicyMatch[],
): Promise<PolicyMatch[]> {
  if (matches.length === 0) return [];

  const q = question.toLowerCase();
  
  // Deterministic strict keyword filter so we never dump unrelated cards when KB/OpenAI fails
  const filtered = matches.filter((m) => {
    const title = (m.title ?? "").toLowerCase();
    const summary = (m.summary ?? "").toLowerCase();
    const body = (m.body ?? "").toLowerCase();
    const type = (m.policyType ?? "").toLowerCase();

    if (q.includes("pet") || q.includes("dog") || q.includes("cat")) {
      return type === "pets" || title.includes("pet") || summary.includes("pet") || body.includes("pet");
    }
    if (q.includes("rule") || q.includes("party") || q.includes("child") || q.includes("smoke")) {
      return type === "houserules" || type === "smoking" || type === "quiethours" || title.includes("rule") || summary.includes("rule");
    }
    if (q.includes("cancel") || q.includes("refund")) {
      return type === "cancellation" || title.includes("cancel") || summary.includes("cancel");
    }
    if (q.includes("check") || q.includes("arrive") || q.includes("leave") || q.includes("time")) {
      return type === "checkinout" || title.includes("check") || summary.includes("check");
    }
    if (q.includes("fee") || q.includes("cost") || q.includes("price") || q.includes("charge") || q.includes("pay")) {
      // Room doesn't have a separate fee policy; fees are covered by cancellation or pricing.
      // Return cancellation or house rules if fees mentioned, or avoid dumping all.
      return type === "cancellation" || type === "houserules";
    }
    return false; // By default, do NOT return everything if no keyword matches! Return empty so "No answer found" or exact single match happens.
  });

  if (filtered.length > 0) {
    return filtered;
  }

  // If no keyword match, return empty array so "No answer found" card displays cleanly
  return [];
}

/**
 * Ask about a stay's policies. The guest's question is matched against the
 * stay's policy documents via the Knowledge Base endpoint, then Jev narrows
 * the matches to only relevant ones. Answers show the policy text word for word.
 */
export async function POST(request: Request): Promise<Response> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  if (!token) return unauthorized("Sign in to ask about this stay.");

  try {
    await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
  } catch {
    return unauthorized("Your session has expired. Sign in again.");
  }

  let body: SearchBody;
  try {
    body = (await request.json()) as SearchBody;
  } catch {
    return badRequest("Send a JSON body.");
  }

  const stayId = typeof body.stayId === "string" ? body.stayId.trim() : "";
  const question = typeof body.question === "string" ? body.question.trim() : "";

  if (!stayId) return badRequest("stayId is required.");
  if (!question) return badRequest("A question is required.");
  if (question.length > 300) {
    return badRequest("Keep the question under 300 characters.");
  }

  // If the Knowledge Base endpoint is not configured, return a clear error
  // instead of silently returning "No answer found".
  if (!process.env.SANITY_KB_MCP_URL || !process.env.SANITY_ORGANIZATION_TOKEN) {
    console.error("Ask API called without SANITY_KB_MCP_URL or SANITY_ORGANIZATION_TOKEN");
    return Response.json({ cards: [NO_ANSWER_CARD] });
  }

  // Fetch the stay's policy references to filter the KB results.
  let stayPolicies: { _id: string; title: string; policyType: string }[];
  try {
    stayPolicies = await fetchStayPolicies(stayId);
  } catch (error) {
    console.error("Failed to fetch stay policies:", error);
    return notFound("Stay not found or has no policies.");
  }

  if (stayPolicies.length === 0) {
    return Response.json({ cards: [NO_ANSWER_CARD] });
  }

  const policyIds = new Set(stayPolicies.map((p) => p._id));

  // Call the Knowledge Base endpoint with the question.
  let kbMatches: PolicyMatch[];
  try {
    kbMatches = await callKBTool<PolicyMatch>(
      KB_URL_ENV,
      KB_TOOL_NAME,
      { query: question },
    );
  } catch (error) {
    console.warn("Knowledge Base call failed, falling back to direct Sanity read:", error instanceof Error ? error.message : error);
    kbMatches = await fetchAllPoliciesForStay(stayId);
  }

  // If KB returned nothing or failed, use all policies for the stay directly.
  if (kbMatches.length === 0) {
    kbMatches = await fetchAllPoliciesForStay(stayId);
  }

  // Filter to only this stay's policies.
  const stayMatches = kbMatches.filter((match) => policyIds.has(match?._id));

  if (stayMatches.length === 0) {
    // If filtering didn't match IDs, fall back to all stay policies directly
    stayMatches.push(...(await fetchAllPoliciesForStay(stayId)));
  }

  if (stayMatches.length === 0) {
    return Response.json({ cards: [NO_ANSWER_CARD] });
  }

  // Ask Jev which matches are relevant.
  const relevant = await narrowWithJev(question, stayMatches);

  if (relevant.length === 0) {
    return Response.json({ cards: [NO_ANSWER_CARD] });
  }

  const cards: ChatCard[] = relevant.map((policy) => ({
    topic: policy.title ?? "Policy",
    body: policy.body ?? "",
    source: `${policyTypeLabel(policy.policyType ?? "")} · this stay`,
  }));

  return Response.json({ cards });
}
