export type ChatCard = {
  topic: string;
  body: string;
  source: string;
};

export type ChatMessage =
  | { id: string; role: "guest"; text: string }
  | { id: string; role: "stay"; cards: ChatCard[] };

export type ChatTopic = {
  label: string;
  question: string;
  cards: ChatCard[];
};

const HOUSE_RULES_SOURCE = "House rules · this stay";

const PARTY_CARDS: ChatCard[] = [
  {
    topic: "Parties",
    body: "No parties or events",
    source: HOUSE_RULES_SOURCE,
  },
  {
    topic: "Guest conduct and parties",
    body: "Parties and events are not allowed at any stay unless the stay's house rules say they are. A party is any gathering that goes beyond the number of guests on the booking.\n\nOnly the guests on the booking may stay overnight. The number of guests may not exceed the stay's maximum.\n\nRespect the stay's quiet hours and its neighbors. Smoking, including vaping, is not allowed indoors at any stay. Some stays allow smoking outside; their house rules say so.\n\nHosts may ask guests who break these rules to leave.",
    source: HOUSE_RULES_SOURCE,
  },
];

export const CHAT_INTRO =
  "Ask anything about this stay. Answers quote the stay's details and Room's policies.";

export const TOPIC_CHIPS: ChatTopic[] = [
  {
    label: "Pets",
    question: "Are pets allowed?",
    cards: [
      {
        topic: "Pets",
        body: "Pets are welcome at this stay. Keep them off the furniture and pick up after them.",
        source: "Pets · this stay",
      },
    ],
  },
  {
    label: "House rules",
    question: "What are the house rules?",
    cards: [
      {
        topic: "House rules",
        body: "Check-in is after 4:00 PM and check-out is before 11:00 AM. Quiet hours are 10:00 PM to 8:00 AM. No smoking indoors. No parties or events.",
        source: HOUSE_RULES_SOURCE,
      },
    ],
  },
  {
    label: "Fees",
    question: "Are there any extra fees?",
    cards: [
      {
        topic: "Fees",
        body: "The nightly price includes linens, towels, and firewood. No cleaning or service fees are added at checkout.",
        source: "Fees · this stay",
      },
    ],
  },
  {
    label: "Parties",
    question: "Can I host a party?",
    cards: PARTY_CARDS,
  },
];

const KEYWORD_ANSWERS: { pattern: RegExp; cards: ChatCard[] }[] = [
  { pattern: /pet|pets|dog|dogs|cat|cats|animal|animals/i, cards: TOPIC_CHIPS[0].cards },
  { pattern: /fee|fees|charge|charges|cleaning|service fee|cost|price/i, cards: TOPIC_CHIPS[2].cards },
  { pattern: /party|parties|event|events|gather|gathering|celebrate|celebration/i, cards: PARTY_CARDS },
  {
    pattern: /rule|rules|house|quiet|noise|smoke|smoking|check.?in|check.?out|guest|guests/i,
    cards: TOPIC_CHIPS[1].cards,
  },
];

const NO_ANSWER_CARD: ChatCard = {
  topic: "No answer found",
  body: "This stay's details don't answer that question. Contact support and we'll help.",
  source: "Room support",
};

const ERROR_CARD: ChatCard = {
  topic: "Something went wrong",
  body: "We couldn't get an answer right now. Check your connection and try again.",
  source: "Room support",
};

/**
 * Asks the backend about a stay's policies. Returns answer cards with the
 * policy text word for word, or an error card on failure.
 */
export async function askStay(
  stayId: string,
  question: string,
  getToken: () => Promise<string | null>,
): Promise<ChatCard[]> {
  let token: string | null;
  try {
    token = await getToken();
  } catch {
    return [ERROR_CARD];
  }

  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  const apiUrl =
    process.env.EXPO_PUBLIC_API_URL ?? `http://localhost:8081`;

  let response: Response;
  try {
    response = await fetch(`${apiUrl}/api/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ stayId, question }),
      signal: AbortSignal.timeout(12_000),
    });
  } catch (error) {
    console.error("Ask API call failed:", error);
    return [ERROR_CARD];
  }

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    console.error(`Ask API ${response.status}:`, payload.error);
    return [ERROR_CARD];
  }

  const payload = (await response.json()) as { cards?: ChatCard[] };
  return payload.cards ?? [NO_ANSWER_CARD];
}
