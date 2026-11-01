/**
 * A minimal MCP client for the `room-search` Sanity Context endpoint.
 *
 * The endpoint serves GROQ mode, so the app calls its `groq_query` tool with a
 * query that code built. No model drives these tools: there is no agent loop
 * here, only a JSON-RPC call.
 */

const TIMEOUT_MS = 8_000;
const PROTOCOL_VERSION = "2025-06-18";

export class SanityContextError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "SanityContextError";
  }
}

type JsonRpcError = {
  code: number;
  message: string;
  data?: unknown;
};

type JsonRpcMessage = {
  id?: number | string;
  result?: unknown;
  error?: JsonRpcError;
};

type ToolCallResult = {
  content?: { type: string; text?: string }[];
  structuredContent?: unknown;
  isError?: boolean;
};

function config() {
  const url = process.env.SANITY_CONTEXT_MCP_URL;
  const token = process.env.SANITY_ORGANIZATION_TOKEN;

  if (!url || !token) {
    throw new SanityContextError(
      "SANITY_CONTEXT_MCP_URL and SANITY_ORGANIZATION_TOKEN must both be set.",
    );
  }

  return { url, token };
}

/** Reads either a plain JSON body or an SSE stream of `data:` frames. */
async function readMessages(response: Response): Promise<JsonRpcMessage[]> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("text/event-stream")) {
    const body = await response.text();
    if (!body.trim()) return [];

    try {
      return [JSON.parse(body) as JsonRpcMessage];
    } catch {
      throw new SanityContextError(`Context returned a non-JSON body: ${body.slice(0, 200)}`);
    }
  }

  const body = await response.text();
  const messages: JsonRpcMessage[] = [];

  for (const frame of body.split(/\r?\n\r?\n/)) {
    const data = frame
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");

    if (!data) continue;

    try {
      messages.push(JSON.parse(data) as JsonRpcMessage);
    } catch {
      // A keep-alive or an incomplete frame; ignore it.
    }
  }

  return messages;
}

function pickResponse(messages: JsonRpcMessage[], id: number) {
  return messages.find((message) => message.id === id);
}

/**
 * One JSON-RPC round trip. `sessionId` is threaded through after `initialize`,
 * because the endpoint may bind the conversation to it.
 */
async function post(
  payload: Record<string, unknown>,
  sessionId?: string,
): Promise<{ messages: JsonRpcMessage[]; sessionId?: string }> {
  const { url, token } = config();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
    Authorization: `Bearer ${token}`,
  };
  if (sessionId) headers["Mcp-Session-Id"] = sessionId;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    throw new SanityContextError(
      error instanceof Error && error.name === "TimeoutError"
        ? "Sanity Context did not answer in time."
        : "Could not reach Sanity Context.",
    );
  }

  if (response.status === 401) {
    throw new SanityContextError(
      "Sanity Context rejected the organization token.",
      response.status,
    );
  }
  if (response.status === 403) {
    throw new SanityContextError(
      "The organization token needs Context Viewer access. Create one under Manage > API > Tokens.",
      response.status,
    );
  }
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new SanityContextError(
      `Sanity Context responded ${response.status}. ${detail.slice(0, 200)}`.trim(),
      response.status,
    );
  }

  return {
    messages: await readMessages(response),
    sessionId: response.headers.get("mcp-session-id") ?? sessionId,
  };
}

function throwIfError(message: JsonRpcMessage | undefined) {
  if (!message?.error) return;

  throw new SanityContextError(
    `Sanity Context: ${message.error.message}`,
  );
}

/** Escapes a value so it can sit inside a GROQ query as a literal. */
function groqLiteral(value: unknown): string {
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (value === null) return "null";

  return JSON.stringify(value);
}

/** Replaces `$name` parameters with literals, longest names first. */
export function inlineParams(query: string, params: Record<string, unknown>) {
  return Object.keys(params)
    .sort((a, b) => b.length - a.length)
    .reduce(
      (result, name) =>
        result.split(`$${name}`).join(groqLiteral(params[name])),
      query,
    );
}

function resultText(result: ToolCallResult) {
  const text = (result.content ?? [])
    .filter((part) => part.type === "text" && part.text)
    .map((part) => part.text as string)
    .join("\n");

  return text;
}

async function callGroqQuery(
  sessionId: string | undefined,
  args: Record<string, unknown>,
) {
  const id = 3;
  const { messages } = await post(
    {
      jsonrpc: "2.0",
      id,
      method: "tools/call",
      params: { name: "groq_query", arguments: args },
    },
    sessionId,
  );

  const response = pickResponse(messages, id);
  throwIfError(response);

  const result = response?.result as ToolCallResult | undefined;
  if (!result) {
    throw new SanityContextError("Sanity Context returned an empty tool result.");
  }
  if (result.isError) {
    throw new SanityContextError(resultText(result) || "The GROQ query failed.");
  }

  return result;
}

/**
 * Runs a GROQ query through the Context endpoint and returns its documents.
 * Parameters are sent as tool arguments when the tool accepts them, and
 * inlined as literals when it does not.
 */
export async function runGroq<T = unknown>(
  query: string,
  params: Record<string, unknown> = {},
): Promise<T[]> {
  const init = await post({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: { name: "room-search", version: "1.0.0" },
    },
  });

  throwIfError(pickResponse(init.messages, 1));

  // Best effort: some servers require the notification, others ignore it.
  await post(
    { jsonrpc: "2.0", method: "notifications/initialized" },
    init.sessionId,
  ).catch(() => undefined);

  let result: ToolCallResult;
  try {
    result = await callGroqQuery(init.sessionId, { query, params });
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    const rejectsParams =
      message.includes("param") ||
      message.includes("unknown argument") ||
      message.includes("additional properties");

    if (!rejectsParams) throw error;

    result = await callGroqQuery(init.sessionId, {
      query: inlineParams(query, params),
    });
  }

  const text = resultText(result);
  if (!text) {
    return Array.isArray(result.structuredContent)
      ? (result.structuredContent as T[])
      : [];
  }

  try {
    const parsed = JSON.parse(text) as unknown;

    if (Array.isArray(parsed)) return parsed as T[];

    if (parsed && typeof parsed === "object" && "result" in parsed) {
      const inner = (parsed as { result?: unknown }).result;
      if (Array.isArray(inner)) return inner as T[];
    }

    return [];
  } catch {
    throw new SanityContextError(
      `Sanity Context returned unreadable JSON: ${text.slice(0, 200)}`,
    );
  }
}
