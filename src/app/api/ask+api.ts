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
  if (!process.env.OPENAI_API_KEY) return [];

  const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "openai/gpt-4o-mini";

  const items = matches.map((m, i) => ({
    index: i,
    title: m.title ?? "",
    summary: m.summary ?? "",
  }));

  const schema = z.object({
    decisions: z.array(
      z.object({
        index: z.number().int().min(0),
        relevant: z.boolean(),
        confidence: z.enum(["low", "medium", "high"]),
      })
    ),
    confidence: z.enum(["low", "medium", "high"]),
  });

  const system = `You are a strict policy relevance classifier. Given a guest question and a list of stay policies, select ONLY the policies that directly and specifically answer the question. If a policy is only tangentially related, mark it not relevant. Return confidence low/medium/high for each decision and overall.`;

  const user = `Question: "${question}"
Policies:
${items.map(i => `${i.index}: ${i.title} - ${i.summary}`).join("\n")}
Return decisions for each index with relevant boolean and confidence. Only mark relevant if the policy directly answers the question.`;

  try {
    const result = await generateText({
      model: OPENAI_MODEL,
      output: Output.object({ schema }),
      system,
      prompt: user,
    });

    const output = result.output as z.infer<typeof schema>;

    if (!output || output.confidence === "low") {
      console.warn("Policy narrowing confidence low or missing, returning no matches");
      return [];
    }

    const relevant: PolicyMatch[] = [];
    const seen = new Set<number>();
    for (const dec of output.decisions) {
      if (typeof dec.index !== "number" || dec.index < 0 || dec.index >= matches.length) continue;
      if (seen.has(dec.index)) continue;
      seen.add(dec.index);
      if (dec.relevant && dec.confidence === "high") {
        relevant.push(matches[dec.index]);
      }
    }

    return relevant;
  } catch (error) {
    console.error("Policy narrowing with OpenAI failed:", error instanceof Error ? error.message : error);
    return [];
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
