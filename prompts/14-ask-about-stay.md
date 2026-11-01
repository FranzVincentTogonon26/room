# 14 · Ask about this stay chat

Status: done

## Goal

Tapping the lavender "Ask about this stay" card on the property details screen opens a chat screen at `/stay/[id]/ask` that matches the attached design: a back header with the stay title, a guest question bubble, answer cards with one card per topic and a source label, topic chips that send a question when tapped, and a message-icon composer. Replies are sample messages only; no backend, API route, Jev, Context, or LLM call.

## Decisions

- The existing "Ask about policies" lavender card becomes "Ask about this stay" and pushes `/stay/[id]/ask`. The policy list sheet is no longer reachable from the detail screen; `stay-policy-sheet.tsx` stays in the repo unused for now (do not delete it).
- The cancellation card keeps opening `/stay/[id]/cancellation-policy`.
- The chat opens with the design's sample thread already present: guest "Can I host a party?" followed by the "Parties" and "Guest conduct and parties" answer cards.
- Replies render as answer cards, never prose bubbles: one card per topic, each with a topic title, body text, and a source label. The guest's own messages are lavender bubbles.
- Topic chips (Pets, House rules, Fees, Parties) append the guest question and that topic's sample answer cards.
- Typed questions match keywords to a sample topic (pets, fees, parties, house rules). No match shows a "No answer found" card that points to support, per the policy-answer rule in AGENTS.md.
- All reply text is static sample text. Do not read policy text from the stay, do not call Sanity, and do not generate text.
- No new dependency. Use React Native `KeyboardAvoidingView`, `ScrollView`, and `TextInput`, and the existing Reanimated setup for a subtle entrance.
- No new screen primitive. Add two Lucide icons: `wandSparkles` (answer card title) and `messageSquareMore` (composer).
- Keep the existing design-system tokens. `h-14` (56 at the project's 16 rem) covers the back button and composer height; `h-chip` (44) covers the chips; all colors, radii, and type use existing tokens.

## Out of scope

- A real backend, API route, Clerk verification, Sanity Context, Jev decisions, embeddings, or generated answers.
- Persisting chat history, multiple sessions per stay, typing indicators, retries, or streaming.
- Changing the policy sheet, the cancellation route, the Sanity schema, or any content.
- Editing Home, Search, Trips, Profile, auth, or the native tab bar.

## Design

Reference: attached `Screenshot 2026-11-01 at 11.25.53 AM.png`, 319×634 px with the phone screen at x≈16–304 (288 px). The app uses the 402 pt reference from plans 12–13, so 1 px ≈ 1.396 pt. Values marked ≈ were measured from the screenshot.

- **Screen:** `/stay/[id]/ask`, pushed on the existing Stack (no tab bar), `bg-card` white. `StatusBar style="auto"`. Header + message `ScrollView` + composer in a `KeyboardAvoidingView`.
- **Header:** horizontal 20 (`px-gutter`), top `insets.top + 8`, bottom 16. Row with 16 gap, items centered.
  - Back button: 56×56 (`h-14 w-14`) circle `bg-muted`, `chevronLeft` 24 `foreground`, `accessibilityLabel="Go back"`. Calls `router.back()`, falling back to `/stay/<id>` when it can't.
  - Text column: title `searchCardTitle` 18/22 Bold "Ask about this stay"; 2 gap; subtitle `bodyCompact` 15/20 `mutedForeground` with the stay title (e.g. "Sunset Cabin in the Pines").
- **Conversation:** `ScrollView`, `contentContainerStyle` horizontal 20, top 16, bottom 16, `gap: 10`, `showsVerticalScrollIndicator={false}`, `keyboardShouldPersistTaps="handled"`. Scroll to the end when content grows.
- **Guest bubble:** `alignSelf: "flex-end"`, `maxWidth: "85%"`, `bg-lavender`, `rounded-pill`, `px-4 py-3.5` (16/14), text `bodyCompact` tone `lavenderForeground`. Measured ≈49 pt tall.
- **Answer card:** `bg-lavender-surface`, `rounded-card` (20), `p-4` (16).
  - Title row: `wandSparkles` 20 `accent`, 8 gap, `cardTitleCompact` 17/22 Bold `foreground`.
  - Body: `bodyCompact` 15/20 `foreground`, marginTop 12. Paragraph breaks use `\n\n` and stay inside the card (design card 2).
  - Source row: marginTop 12, `fileText` 16 `mutedForeground`, 8 gap, `caption` 14/21 `mutedForeground` (e.g. "House rules · this stay"). Use a middle dot with spaces.
  - When a reply has more than one card, stack cards with 10 gap.
  - New reply groups enter with `FadeInDown` (`motion.base`, `Easing.out(Easing.cubic)`, `ReduceMotion.System`), consistent with Search.
- **Composer:** pinned below the list, horizontal 20, top 12, bottom `insets.bottom + 12`.
  - Topic chips above the field, 16 gap: horizontal `ScrollView`, `showsHorizontalScrollIndicator={false}`, `gap: 12`. `Chip` size `md` (44 high) variant `neutral` (`bg-muted`), labels Pets, House rules, Fees, Parties. The mock shows the row starting at the screen edge; use the standard 20 gutter so the first chip is fully visible.
  - Field: 56 high (`h-14`), `rounded-pill bg-muted`, horizontal 16, row items centered, 12 gap. Left `messageSquareMore` 20 `foreground`. `TextInput` flex-1, `bodyCompact` font family/size/letterSpacing, **no lineHeight** (single-line rule), placeholder "Ask about this stay", `placeholderTextColor={colors.placeholder}`, `selectionColor={colors.accent}`, `returnKeyType="send"`, `onSubmitEditing` sends. Right: 40×40 Pressable with `arrowUp` 20 `foreground`, `accessibilityLabel="Send question"`, 40% opacity when the input is empty.
  - `KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}` wraps the screen so the composer rides above the keyboard.
- **Colors:** `card` white background, `muted` chips/back button/composer, `lavender` guest bubble, `lavender-surface` answer cards, `accent` card icon, `foreground`, `mutedForeground`, `placeholder`, `border`. All flip semantically in dark mode.
- **Icons:** Lucide `chevronLeft`, `wandSparkles`, `fileText`, `messageSquareMore`, `arrowUp`.
- **No gear FAB:** the blue gear in the screenshot is the Expo dev-menu button, not part of the design.

## Sample content

Initial thread:

1. Guest: "Can I host a party?"
2. Stay reply cards:
   - **Parties** — "No parties or events" — source "House rules · this stay"
   - **Guest conduct and parties** — body:
     "Parties and events are not allowed at any stay unless the stay's house rules say they are. A party is any gathering that goes beyond the number of guests on the booking.\n\nOnly the guests on the booking may stay overnight. The number of guests may not exceed the stay's maximum.\n\nRespect the stay's quiet hours and its neighbors. Smoking, including vaping, is not allowed indoors at any stay. Some stays allow smoking outside; their house rules say so.\n\nHosts may ask guests who break these rules to leave." — source "House rules · this stay"

Topic chips (question sent + answer cards):

- **Pets** → "Are pets allowed?" → **Pets** — "Pets are welcome at this stay. Keep them off the furniture and pick up after them." — "Pets · this stay"
- **House rules** → "What are the house rules?" → **House rules** — "Check-in is after 4:00 PM and check-out is before 11:00 AM. Quiet hours are 10:00 PM to 8:00 AM. No smoking indoors. No parties or events." — "House rules · this stay"
- **Fees** → "Are there any extra fees?" → **Fees** — "The nightly price includes linens, towels, and firewood. No cleaning or service fees are added at checkout." — "Fees · this stay"
- **Parties** → "Can I host a party?" → the same two cards as the initial thread.

Typed questions, keyword order (case-insensitive):

1. `/pet|pets|dog|dogs|cat|cats|animal|animals/` → Pets
2. `/fee|fees|charge|charges|cleaning|service fee|cost|price/` → Fees
3. `/party|parties|event|events|gather|gathering|celebrate|celebration/` → Parties
4. `/rule|rules|house|quiet|noise|smoke|smoking|check.?in|check.?out|guest|guests/` → House rules
5. Otherwise → **No answer found** — "This stay's details don't answer that question. Contact support and we'll help." — "Room support"

## Steps

### 1. Add the two icons

File: `src/components/ui/icon.tsx`, `src/app/catalog.tsx`.

- Import `WandSparkles` and `MessageSquareMore` from `lucide-react-native`; add `wandSparkles` and `messageSquareMore` to `iconMap`.
- Add both names to `iconSamples` in `/catalog`.
- No other primitive changes.

Done: type check passes; `/catalog` shows both icons.

### 2. Add the sample chat data module

New file: `src/lib/stay-chat.ts`.

- Export types:
  ```ts
  export type ChatCard = { topic: string; body: string; source: string };
  export type ChatMessage =
    | { id: string; role: "guest"; text: string }
    | { id: string; role: "stay"; cards: ChatCard[] };
  export type ChatTopic = { label: string; question: string; cards: ChatCard[] };
  ```
- Export `INITIAL_THREAD: ChatMessage[]` with the design's party question and two cards from **Sample content**.
- Export `TOPIC_CHIPS: ChatTopic[]` with Pets, House rules, Fees, Parties and their questions/cards.
- Export `replyForQuestion(question: string): ChatCard[]` implementing the keyword order and fallback above.
- Text lives only here; the screen imports it. No Sanity reads.

Done: the module type-checks and every chip has a question and at least one card.

### 3. Build the chat screen

New file: `src/app/(app)/stay/[id]/ask.tsx`.

- `useLocalSearchParams<{ id: string }>()`, `useRouter()`, `useSafeAreaInsets()`, `useThemeColors()`, `useStays()`; find the stay with `useMemo`.
- States: `status === "loading" && !stay` → centered `StaysLoading`; `status === "error" && !stay` → centered `StaysError` with `retry`; `!stay` → not-found block with "Go back" (reuse the detail screen's copy style).
- Chat state: `useState<ChatMessage[]>(INITIAL_THREAD)` and `useState("")` for the input. Keep IDs local with a counter or `Date.now()`.
- Layout: `KeyboardAvoidingView` flex-1 `bg-card`; header per Design; `ScrollView` ref with `onContentSizeChange` scrolling to the end; `renderMessage` renders a guest bubble or a column of answer cards.
- `send(text)`: trim, ignore empty, append `{ role: "guest", text }`, append `{ role: "stay", cards: replyForQuestion(text) }`, clear the input. Chip press calls `send(topic.question)`.
- Back: `router.canGoBack() ? router.back() : router.replace(`/stay/${stay.id}`)`.
- Header subtitle: `stay.title`.
- Do not render the tab bar (the Stack already hides it).

Done: the screen matches the design, chips send questions, typed questions answer or fall back, the composer clears and the list scrolls.

### 4. Point the detail card at the chat

File: `src/app/(app)/stay/[id].tsx`.

- Rename the first `PolicyCard` title from "Ask about policies" to "Ask about this stay"; keep `messageCircleMore` and the subtitle "Cancellation, house rules, pets, check-in and more."
- Its `onPress` becomes `router.push(`/stay/${stay.id}/ask`)`.
- Remove the `policyOpen` state, the `StayPolicySheet` import, and the `<StayPolicySheet>` render. Keep `stay-policy-sheet.tsx` on disk.
- Leave the cancellation card and host sheet unchanged.

Done: the card opens the chat; the policy sheet is no longer reachable from detail; type check and lint pass.

### 5. Simulator comparison and polish

- Start the dev server, open a live stay, tap the card, screenshot with `xcrun simctl io booted screenshot <path>`, and compare with the attached design: header size/gap, bubble shape, card padding/gaps, chip height, composer height, and icon sizes.
- Fix every difference and re-shoot. Record values estimated from the screenshot.
- Check dark mode (`xcrun simctl ui booted appearance dark`), keyboard open/closed, a long typed question, and a narrow device.
- Deep link `room://stay/<id>/ask`; back returns to the detail screen.
- Confirm no tab bar on the chat screen.

## Verification

1. `npx tsc --noEmit` — no errors.
2. `npx expo lint` — no warnings or errors.
3. Open a stay from Home → tap "Ask about this stay" → chat opens with the party question and both cards; back returns to detail.
4. Design: the screenshot matches the header, bubble, two cards, source labels, chips, and composer. List and fix differences; report estimated values.
5. Chips: tap each of Pets, House rules, Fees, Parties → the guest question bubble appears, the matching card(s) append, and the list scrolls to the bottom.
6. Typed: send "do you allow dogs?" → Pets card; "any cleaning fee?" → Fees; "can we celebrate a birthday?" → Parties; "what time is check-in?" → House rules; "is there a pool?" → No answer found + Room support. Empty input does nothing; the field clears after send.
7. Keyboard: focus the input → the composer stays above the keyboard; dismiss → it returns above the safe area.
8. States: loading, error + Retry, and not-found render without crashing.
9. Dark mode: cards, bubble text, chips, composer, and icons stay legible.
10. `git status` shows only the intended files; nothing is committed.

## AGENTS.md updates

- **Expo → routes:** add `stay/[id]/ask` as a sibling stack route pushed above the tabs; deep link `room://stay/<id>/ask`.
- **Who owns what → Policy knowledge:** replace the line that says the policy sheet opens from "Ask about policies" with: the lavender "Ask about this stay" card opens a sample chat at `/stay/[id]/ask`; replies are one answer card per topic with a source label; topic chips send sample questions; typed questions keyword-match sample answers and otherwise point to support. No backend or generated text yet. The policy sheet is no longer reachable from detail.
- **Who owns what → Stay detail:** update the policy-card line to say the first card opens the chat and the cancellation card keeps its route.
- **Design system:** add `wandSparkles` and `messageSquareMore` icons and note the chat patterns (56 header/composer, 44 chips, lavender guest bubble, `lavender-surface` answer cards with a source row).
- Keep the file under 150 lines; replace stale lines instead of appending.

## Result

Built as planned, except the chat opens empty instead of with the design's sample thread (changed after review: the design's party question is now what the Parties chip sends, not a seeded message). The detail screen's lavender card reads "Ask about this stay" and pushes `/stay/[id]/ask`; `StayPolicySheet` is no longer rendered (the file stays on disk).

With no messages, the thread area shows a centered intro: `wandSparkles` in a 56 pt lavender circle above "Ask anything about this stay. Answers quote the stay's details and Room's policies." (`CHAT_INTRO` in `src/lib/stay-chat.ts`). The first send replaces it with the conversation, which then scrolls to the end.

- `src/lib/stay-chat.ts` (new): `ChatCard` / `ChatMessage` / `ChatTopic` types, `CHAT_INTRO`, `TOPIC_CHIPS`, and `replyForQuestion()` keyword matching with the "No answer found" fallback.
- `src/app/(app)/stay/[id]/ask.tsx` (new): header, thread, answer cards, topic chips, composer, `KeyboardAvoidingView`, and loading / error / not-found states.
- `src/app/(app)/stay/[id].tsx`: removed the `StayPolicySheet` import, `policyOpen` state, and render; the card opens the chat.
- `src/components/ui/icon.tsx` + `src/app/catalog.tsx`: added `wandSparkles` and `messageSquareMore`.

Deviations from the plan: none. The initial scroll needed a `hasSent` ref because `onContentSizeChange` fires on first layout and was jumping past the guest bubble.

Estimated from the screenshot: the 319 px mock maps to 402 pt at 1.26 pt/px, so the 56 pt back circle and composer, 44 pt chips, and 20 pt card padding are within ~2 pt of the measured values; no new tokens were needed.
