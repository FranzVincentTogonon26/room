import { verifyToken } from "@clerk/backend";
import { typeSafeAi } from "@ai-sdk/typesafe-ai";
import { experimental_decide } from "ai";

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
  if (!process.env.TYPESAFE_AI_API_KEY) return matches;

  const questions: Record<
    string,
    { type: "boolean"; instructions: string }
  > = {};

  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i];
    const title = match.title ?? "";
    const summary = match.summary ?? "";
    questions[`policy${i}`] = {
      type: "boolean",
      instructions: `Does the policy "${title}" (${summary}) answer the guest's question: "${question}"?`,
    };
  }

  try {
    const result = await experimental_decide({
      model: typeSafeAi.decisionModel("jev-latest"),
      state: [{ type: "text", text: question }],
      questions,
      abortSignal: AbortSignal.timeout(DECISION_TIMEOUT_MS),
    });

    const answers = result.answers as Record<
      string,
      { type: string; value?: boolean }
    >;
    const relevant: PolicyMatch[] = [];

    for (let i = 0; i < matches.length; i += 1) {
      const answer = answers[`policy${i}`];
      if (answer?.value === true) relevant.push(matches[i]);
    }

    // If Jev filters everything out, return empty so the UI can show "No answer found"
    // instead of falling back to all policies.
    return relevant;
  } catch (error) {
    console.error(
      "Policy narrowing with Jev failed:",
      error instanceof Error ? error.message : error,
    );
    return matches;
  }
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
    if (error instanceof KnowledgeBaseError) {
      console.error("Knowledge Base call failed:", error.message);
      // If the KB endpoint is misconfigured, fall back to a direct Sanity read
      // for the stay's policies so the chat still answers.
      kbMatches = await fetchAllPoliciesForStay(stayId);
    } else {
      console.error("Knowledge Base call failed:", error);
      return Response.json({ cards: [NO_ANSWER_CARD] });
    }
  }

  // Filter to only this stay's policies.
  const stayMatches = kbMatches.filter((match) => policyIds.has(match?._id));

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
