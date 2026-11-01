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

/** Sample-only matching until the real policy Q&A endpoint is wired up. */
export function replyForQuestion(question: string): ChatCard[] {
  const match = KEYWORD_ANSWERS.find(({ pattern }) => pattern.test(question));
  return match ? match.cards : [NO_ANSWER_CARD];
}
