# Connect Ask-about-stay chat to room-policies Knowledge Base endpoint

**Goal:** Replace the sample keyword matching in `/stay/[id]/ask` with a real policy Q&A backend. Guest types a question, Jev picks which policy entries answer it, and the chat shows their exact text as answer cards with sources.

**Status:** planning

---

## Current state

- `/stay/[id]/ask` is a sample-only chat with `TOPIC_CHIPS` (Pets / House rules / Fees / Parties) and keyword-based `replyForQuestion` in `src/lib/stay-chat.ts`. No backend, no Sanity read, no generated text.
- Each `stay` references an array of `policy` documents. Each `policy` has `title`, `policyType` (cancellation / houseRules / checkInOut / pets / smoking / quietHours / safety), `summary` (card line), and `body` (full text, shown word for word).
- `AGENTS.md` says policy answers must show only the stay's and Room's own text, and a Sanity Context endpoint in **Knowledge Base mode** should answer questions: https://www.sanity.io/docs/ai/context-migration-guide. One endpoint serves one mode.

## The plan

### 1. Create the `room-policies` Knowledge Base endpoint

- Open Sanity Manage → [your project] → Context.
- Create a new endpoint:
  - Name: `room-policies`
  - Mode: **Knowledge Base** (not GROQ)
  - Dataset: `production`
  - Include: `policy` documents
  - Embedding fields: `title`, `summary`, `body`, `policyType`
- Save the endpoint URL and note the path (will be something like `https://api.sanity.io/v2026-11-10/context/organizations/o5wcww4u4/mcp/room-policies`).
- Record the endpoint's input schema: what tool(s) it exposes and what arguments each accepts.

### 2. Wire the API route

- `POST /api/ask` (`src/app/api/ask+api.ts`):
  - Verify the Clerk session.
  - Parse the body: `{ stayId, question }`.
  - Fetch the stay's policy references from Sanity (GROQ: `*[_id == $stayId][0].policies[]->{ _id, title, policyType }`).
  - Call the `room-policies` Knowledge Base endpoint with the question. The endpoint will return policy matches.
  - Ask Jev (via `experimental_decide`) which returned policies answer the question: one `boolean` question per match ("Does this policy answer the guest's question?"). This narrows semantic search to only what's relevant.
  - For each policy Jev says yes to, fetch its full `body` from Sanity and return a card: `{ topic: title, body, source: "{policyType} · this stay" }`.
  - If nothing is relevant, return the "No answer found" card pointing to Room support.
  - Return `{ cards: ChatCard[] }`.

### 3. Update the chat to call the route

- `src/lib/stay-chat.ts`:
  - Keep `CHAT_INTRO` and `TOPIC_CHIPS`.
  - Replace `replyForQuestion` with `async function askStay(stayId: string, question: string, getToken): Promise<ChatCard[]>` that posts to `/api/ask` and returns the cards.
- `src/app/(app)/stay/[id]/ask.tsx`:
  - Import `askStay` instead of `replyForQuestion`.
  - Change the `send` function to `async`, call `await askStay(stay.id, question, () => auth.getToken())`, and set the answer message with the returned cards.
  - Show a loading state while the request is in flight (a lavender card with a spinner and "Thinking…").
  - On error, show a card with the error message and a Retry button that re-sends the question.

### 4. Wire env and error handling

- Add `SANITY_KB_MCP_URL` (the `room-policies` endpoint) to `.env.local` and `.env.example`.
- The route must handle:
  - No token → `401`.
  - Stay not found → `404`.
  - The Knowledge Base call failing → log it and fall back to "No answer found" instead of crashing.
  - Jev failing → log it and return every policy the KB matched (no narrowing).
- The chat must handle:
  - Network failure → error card with Retry.
  - `401` → redirect to sign-in (session expired).
  - `404` → "Stay not found" card.

### 5. Test and commit

- Verify:
  - Type "Are pets allowed?" → returns the stay's pet policy `body` word for word.
  - Type a question no policy answers → "No answer found" card.
  - Network unplugged → error card with Retry button works.
  - `401` → redirects to sign-in.
- Record the endpoint schema under step 1.
- Update `AGENTS.md` to reflect the new route and the KB endpoint usage.
- Commit with the verified results.

---

## Decisions

- **Transport:** the `room-policies` Knowledge Base endpoint over MCP JSON-RPC, same client pattern as `room-search`, but calling a KB tool instead of `groq_query`.
- **Decision layer:** Jev picks which KB-matched policies answer the question via `boolean` questions ("Does this policy answer the guest's question?"), one per match. If Jev is unavailable or fails, return all matches.
- **Answer text:** only the policy's `body` field, word for word. No LLM generation. The `source` is `{policyType} · this stay`.
- **Fallback:** if the KB call fails, log it and return "No answer found" instead of crashing the chat.
- **Session management:** verify the Clerk session on every `/api/ask` call. On `401`, the chat redirects to sign-in.
- **Loading state:** a lavender card with a spinner and "Thinking…" while the request is in flight.
- **Error state:** a card with the error message and a Retry button that re-sends the same question.

---

## Files to create/change

- `src/app/api/ask+api.ts` (new) — the route.
- `src/lib/sanity-kb.ts` (new) — MCP client for the Knowledge Base endpoint, parallel to `sanity-context.ts`.
- `src/lib/stay-chat.ts` — replace `replyForQuestion` with `askStay`.
- `src/app/(app)/stay/[id]/ask.tsx` — wire `askStay`, loading/error states.
- `.env.example` — add `SANITY_KB_MCP_URL` (no value).
- `AGENTS.md` — record the route, endpoint, and Jev narrowing.

---

## Remaining work after this plan

Once you create the `room-policies` endpoint in the Sanity Dashboard and supply its URL + the organization token with Context Viewer, I'll:

1. Record the endpoint's tool schema in step 1.
2. Build the MCP client.
3. Build the route with Jev narrowing.
4. Wire the chat to the route with loading/error states.
5. Verify the round trip and commit.
