/**
 * MCP client for Sanity Context endpoints in Knowledge Base mode.
 *
 * Knowledge Base endpoints serve semantic search over a dataset's documents.
 * The app calls their tools (typically `search` or similar) with a natural
 * language query, and the endpoint returns matching documents with scores.
 */

const TIMEOUT_MS = 8_000;
const PROTOCOL_VERSION = "2025-06-18";

export class KnowledgeBaseError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "KnowledgeBaseError";
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

function config(urlEnv: string) {
  const url = process.env[urlEnv];
  const token = process.env.SANITY_ORGANIZATION_TOKEN;

  if (!url || !token) {
    throw new KnowledgeBaseError(
      `${urlEnv} and SANITY_ORGANIZATION_TOKEN must both be set.`,
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
      throw new KnowledgeBaseError(
        `Context returned a non-JSON body: ${body.slice(0, 200)}`,
      );
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

async function post(
  url: string,
  token: string,
  payload: Record<string, unknown>,
  sessionId?: string,
): Promise<{ messages: JsonRpcMessage[]; sessionId?: string }> {
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
    throw new KnowledgeBaseError(
      error instanceof Error && error.name === "TimeoutError"
        ? "Sanity Context did not answer in time."
        : "Could not reach Sanity Context.",
    );
  }

  if (response.status === 401) {
    throw new KnowledgeBaseError(
      "Sanity Context rejected the organization token.",
      response.status,
    );
  }
  if (response.status === 403) {
    throw new KnowledgeBaseError(
      "The organization token needs Context Viewer access. Create one under Manage > API > Tokens.",
      response.status,
    );
  }
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new KnowledgeBaseError(
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

  throw new KnowledgeBaseError(`Sanity Context: ${message.error.message}`);
}

function resultText(result: ToolCallResult) {
  const text = (result.content ?? [])
    .filter((part) => part.type === "text" && part.text)
    .map((part) => part.text as string)
    .join("\n");

  return text;
}

/**
 * Calls a Knowledge Base endpoint's tool. The tool name and arguments come from
 * the endpoint's schema, which you must inspect first with `listTools`.
 */
export async function callKBTool<T = unknown>(
  urlEnv: string,
  toolName: string,
  args: Record<string, unknown>,
): Promise<T[]> {
  const { url, token } = config(urlEnv);

  const init = await post(
    url,
    token,
    {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {},
        clientInfo: { name: "room-kb", version: "1.0.0" },
      },
    },
  );

  throwIfError(pickResponse(init.messages, 1));

  // Best effort: some servers require the notification, others ignore it.
  await post(
    url,
    token,
    { jsonrpc: "2.0", method: "notifications/initialized" },
    init.sessionId,
  ).catch(() => undefined);

  const id = 3;
  const { messages } = await post(
    url,
    token,
    {
      jsonrpc: "2.0",
      id,
      method: "tools/call",
      params: { name: toolName, arguments: args },
    },
    init.sessionId,
  );

  const response = pickResponse(messages, id);
  throwIfError(response);

  const result = response?.result as ToolCallResult | undefined;
  if (!result) {
    throw new KnowledgeBaseError(
      "Sanity Context returned an empty tool result.",
    );
  }
  if (result.isError) {
    throw new KnowledgeBaseError(
      resultText(result) || "The Knowledge Base call failed.",
    );
  }

  // Knowledge Base endpoints may return structured content directly.
  if (result.structuredContent && Array.isArray(result.structuredContent)) {
    return result.structuredContent as T[];
  }

  const text = resultText(result);
  if (!text) return [];

  try {
    const parsed = JSON.parse(text) as unknown;

    if (Array.isArray(parsed)) return parsed as T[];

    if (parsed && typeof parsed === "object" && "result" in parsed) {
      const inner = (parsed as { result?: unknown }).result;
      if (Array.isArray(inner)) return inner as T[];
    }

    // Some KB tools wrap hits in an object with a `hits` or `documents` array.
    if (parsed && typeof parsed === "object") {
      const obj = parsed as Record<string, unknown>;
      if (Array.isArray(obj.hits)) return obj.hits as T[];
      if (Array.isArray(obj.documents)) return obj.documents as T[];
    }

    return [];
  } catch {
    throw new KnowledgeBaseError(
      `Sanity Context returned unreadable JSON: ${text.slice(0, 200)}`,
    );
  }
}

/**
 * Lists the tools a Knowledge Base endpoint exposes. Call this once to discover
 * the tool name and argument schema before calling `callKBTool`.
 */
export async function listKBTools(
  urlEnv: string,
): Promise<{ name: string; description?: string; inputSchema: unknown }[]> {
  const { url, token } = config(urlEnv);

  const init = await post(
    url,
    token,
    {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {},
        clientInfo: { name: "room-kb", version: "1.0.0" },
      },
    },
  );

  throwIfError(pickResponse(init.messages, 1));

  await post(
    url,
    token,
    { jsonrpc: "2.0", method: "notifications/initialized" },
    init.sessionId,
  ).catch(() => undefined);

  const id = 2;
  const { messages } = await post(
    url,
    token,
    {
      jsonrpc: "2.0",
      id,
      method: "tools/list",
      params: {},
    },
    init.sessionId,
  );

  const response = pickResponse(messages, id);
  throwIfError(response);

  const result = response?.result as { tools?: unknown[] } | undefined;
  if (!result?.tools) return [];

  return result.tools as {
    name: string;
    description?: string;
    inputSchema: unknown;
  }[];
}
