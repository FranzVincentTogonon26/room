#!/usr/bin/env node
/**
 * Generates guest-facing copy for every stay with Sanity Agent Actions and
 * checks it against that stay's own facts before anything is written.
 *
 *   node scripts/generate-stay-copy.mjs          # generate + validate
 *   node scripts/generate-stay-copy.mjs --merge  # copy the artifact into seed-data.json
 *
 * The script never writes to Sanity. It writes seed/generated-copy.json, which
 * the build patches and publishes through the Sanity MCP.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SEED_PATH = path.join(ROOT, "seed/seed-data.json");
const PLACES_PATH = path.join(ROOT, "seed/local-places.json");
const SCHEMA_PATH = path.join(ROOT, "schemaTypes/stay.ts");
const OUT_PATH = path.join(ROOT, "seed/generated-copy.json");
const REJECTED_PATH = path.join(ROOT, "seed/generated-copy.rejected.json");

const PROJECT_ID = "4clz1593";
const DATASET = "production";
const API_VERSION = "v2025-02-19";
const SCHEMA_ID = "_.schemas.default";
const GENERATE_URL = `https://${PROJECT_ID}.api.sanity.io/vX/agent/action/generate/${DATASET}`;
const QUERY_URL = `https://${PROJECT_ID}.api.sanity.io/${API_VERSION}/data/query/${DATASET}`;

const COPY_FIELDS = [
  "summary",
  "description",
  "vibe",
  "setting",
  "nearby",
  "neighborhoodDescription",
];
const MAX_ATTEMPTS = 3;

const STAY_QUERY = `*[_type == "stay"]{
  _id, seedKey, title, category, location, maxGuests, bedrooms, beds,
  bathrooms, amenities, petsAllowed, quiet
}`;

const INSTRUCTION = `Write the guest-facing copy for one vacation rental. Use only the facts in $facts. The sourceCopy key in the JSON is the only source for concrete details. Do not use outside knowledge and do not invent any detail.

Voice: concrete, calm, specific. No marketing adjectives.

Fields:
- summary: one sentence, max 180 characters. Lead with the home's most distinctive feature named in facts.title, then one supporting detail. Do not list bedrooms or guests.
- description: 3-4 sentences about the home itself: materials, light, layout, deck, fireplace. Mention the feature the title promises. Only mention amenities in facts.amenities.
- vibe: 3-5 lowercase single words describing atmosphere. No duplicates. Use only words supported by the facts.
- setting: 1-2 sentences about the landscape and surroundings.
- nearby: 1-2 sentences about places to go. Use only place names in facts.placeNames.
- neighborhoodDescription: 2-3 sentences about the area, walkability, noise, and what is close. Use only place names in facts.placeNames.

Hard rules:
- Do not mention price, fees, ratings, reviews, host names, availability, or exact addresses.
- Do not claim a view, feature, amenity, material, color, room count, or building level that is not in facts.
- Do not introduce a material, color, appliance, or architectural detail that is not in the source copy.
- Rewrite every field in your own words; do not copy a source sentence verbatim.
- Do not use "best", "perfect", "luxury", "stunning", "unforgettable", "dream", or "ideal".
- Every field must say something different.
- US English, sentence case.

$facts is JSON. Use it as the only source.`;

const NUMBER_WORDS = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
  thousand: 1000,
};

const BANNED_WORDS = [
  "best",
  "perfect",
  "luxury",
  "luxurious",
  "stunning",
  "unforgettable",
  "dream",
  "ideal",
  "amazing",
  "breathtaking",
  "oasis",
  "paradise",
  "gem",
  "nestled",
  "boasts",
];

const FEATURE_OVERRIDES = {
  "Wi-Fi": /\bwi-?fi\b/i,
  "Full kitchen": /\b(full\s+)?kitchen\b/i,
  "Free parking": /\bparking\b/i,
  "EV charger": /\bev\s+charger\b/i,
  "Air conditioning": /\bair conditioning\b|\ba\/c\b/i,
  "BBQ grill": /\bbbq\b|\bgrill\b/i,
  "Walk to beach": /\bwalk(?:ing)? to (?:the )?beach\b/i,
  "Steps to sand": /\bsteps? to (?:the )?sand\b/i,
  "Ocean view": /\bocean view\b/i,
  "Mountain view": /\bmountain view\b/i,
  "Skyline view": /\bskyline view\b/i,
  "Lake access": /\blake access\b/i,
  "Outdoor shower": /\boutdoor shower\b/i,
  "Fire pit": /\bfire ?pit\b/i,
  "Coffee maker": /\bcoffee maker\b/i,
  "Ski storage": /\bski storage\b/i,
  "Bikes": /\bbikes?\b/i,
  "Hot tub": /\bhot tub\b/i,
};

/** Source phrasings that mean the same physical fact as a term. */
const FEATURE_SYNONYMS = {
  "east-facing": /\bfacing east\b/i,
  "west-facing": /\bfacing west\b/i,
  "north-facing": /\bfacing north\b/i,
  "south-facing": /\bfacing south\b/i,
  "ocean-facing": /\bfacing (?:the )?(?:ocean|sea)\b/i,
  "lake-facing": /\bfacing (?:the )?lake\b/i,
  "two-story": /\b(?:two|2)\s+stor(?:y|ies)\b/i,
  "single-story": /\b(?:one|single)\s+stor(?:y|ies)\b/i,
  "wraparound": /\bwrap[- ]?around\b/i,
};

const EXTRA_FEATURES = [
  ["dock", /\bdocks?\b/i],
  ["kayak", /\bkayaks?\b/i],
  ["canoe", /\bcanoes?\b/i],
  ["paddleboard", /\bpaddle ?boards?\b/i],
  ["boat", /\bboats?\b/i],
  ["pier", /\bpiers?\b/i],
  ["deck", /\bdecks?\b/i],
  ["yard", /\byards?\b/i],
  ["garage", /\bgarages?\b/i],
  ["elevator", /\belevators?\b/i],
  ["wood stove", /\bwood stove\b/i],
  ["king bed", /\bking(?:-size)? bed\b/i],
  ["queen bed", /\bqueen(?:-size)? bed\b/i],
  ["bunk bed", /\bbunk beds?\b/i],
  ["soaking tub", /\bsoaking tub\b/i],
  ["rooftop", /\brooftops?\b/i],
  ["courtyard", /\bcourtyards?\b/i],
  ["lawn", /\blawns?\b/i],
  ["orchard", /\borchards?\b/i],
];

/**
 * Physical details that must come from the stay's own copy or amenities.
 * Generic atmosphere words (bright, quiet, spacious) are not listed on
 * purpose; these are the claims a guest could hold the listing to.
 */
const FACTUAL_TERMS = [
  ["oak", /\boak\b/i],
  ["pine", /\bpines?\b/i],
  ["cedar", /\bcedars?\b/i],
  ["redwood", /\bredwoods?\b/i],
  ["spruce", /\bspruces?\b/i],
  ["fir", /\bfirs?\b/i],
  ["timber", /\btimber\b/i],
  ["wood", /\bwood(?:en)?\b/i],
  ["stone", /\bstone\b/i],
  ["brick", /\bbricks?\b/i],
  ["glass", /\bglass\b/i],
  ["steel", /\bsteel\b/i],
  ["concrete", /\bconcrete\b/i],
  ["stucco", /\bstucco\b/i],
  ["adobe", /\badobe\b/i],
  ["plaster", /\bplaster\b/i],
  ["marble", /\bmarble\b/i],
  ["granite", /\bgranite\b/i],
  ["tile", /\btiles?\b|\btiled\b/i],
  ["terracotta", /\bterracotta\b/i],
  ["shingle", /\bshingles?\b/i],
  ["beadboard", /\bbeadboard\b/i],
  ["shiplap", /\bshiplap\b/i],
  ["hardwood", /\bhardwood\b/i],
  ["bamboo", /\bbamboo\b/i],
  ["brass", /\bbrass\b/i],
  ["copper", /\bcopper\b/i],
  ["leather", /\bleather\b/i],
  ["linen", /\blinen\b/i],
  ["velvet", /\bvelvet\b/i],
  ["wool", /\bwool\b/i],
  ["rattan", /\brattan\b/i],
  ["wicker", /\bwicker\b/i],
  ["walnut", /\bwalnut\b/i],
  ["maple", /\bmaple\b/i],
  ["cherry", /\bcherry\b/i],
  ["mahogany", /\bmahogany\b/i],
  ["teak", /\bteak\b/i],
  ["saltwater", /\bsaltwater\b/i],
  ["kiva", /\bkiva\b/i],
  ["portal", /\bportals?\b/i],
  ["wraparound", /\bwrap[- ]?around\b/i],
  ["two-story", /\btwo[- ]stor(?:y|ies)\b/i],
  ["single-story", /\bsingle[- ]stor(?:y|ies)\b/i],
  ["double-height", /\bdouble[- ]height\b/i],
  ["vaulted", /\bvaulted\b/i],
  ["pitched roof", /\bpitched roof\b/i],
  ["flat roof", /\bflat roof\b/i],
  ["skylight", /\bskylights?\b/i],
  ["dormer", /\bdormers?\b/i],
  ["bay window", /\bbay windows?\b/i],
  ["window seat", /\bwindow seats?\b/i],
  ["french door", /\bfrench doors?\b/i],
  ["sliding door", /\bsliding (?:glass )?doors?\b/i],
  ["staircase", /\bstaircases?\b/i],
  ["spiral staircase", /\bspiral staircase\b/i],
  ["loft", /\blofts?\b/i],
  ["mezzanine", /\bmezzanine\b/i],
  ["basement", /\bbasements?\b/i],
  ["attic", /\battic\b/i],
  ["siding", /\bsiding\b/i],
  ["cladding", /\bcladding\b/i],
  ["facade", /\bfacades?\b/i],
  ["porch", /\bporches?\b/i],
  ["patio", /\bpatios?\b/i],
  ["balcony", /\bbalcon(?:y|ies)\b/i],
  ["terrace", /\bterraces?\b/i],
  ["pergola", /\bpergolas?\b/i],
  ["gazebo", /\bgazebos?\b/i],
  ["shed", /\bsheds?\b/i],
  ["carport", /\bcarports?\b/i],
  ["driveway", /\bdriveways?\b/i],
  ["fence", /\bfences?\b/i],
  ["fenced", /\bfenced\b/i],
  ["gate", /\bgates?\b/i],
  ["hedge", /\bhedges?\b/i],
  ["garden", /\bgardens?\b/i],
  ["vineyard", /\bvineyards?\b/i],
  ["boat lift", /\bboat lift\b/i],
  ["spa", /\bspa\b/i],
  ["steam room", /\bsteam room\b/i],
  ["gym", /\bgyms?\b/i],
  ["foyer", /\bfoyers?\b/i],
  ["mudroom", /\bmudrooms?\b/i],
  ["pantry", /\bpantr(?:y|ies)\b/i],
  ["closet", /\bclosets?\b/i],
  ["walk-in", /\bwalk-in\b/i],
  ["en suite", /\ben suite\b/i],
  ["primary suite", /\bprimary suite\b/i],
  ["guest suite", /\bguest suite\b/i],
  ["bunk room", /\bbunk room\b/i],
  ["den", /\bden\b/i],
  ["study", /\bstud(?:y|ies)\b/i],
  ["office", /\boffices?\b/i],
  ["nook", /\bnooks?\b/i],
  ["alcove", /\balcoves?\b/i],
  ["kitchen island", /\bkitchen island\b/i],
  ["countertop", /\bcountertops?\b/i],
  ["backsplash", /\bbacksplash\b/i],
  ["cabinet", /\bcabinets?\b/i],
  ["built-in", /\bbuilt-ins?\b/i],
  ["bookshelf", /\bbookshel(?:f|ves)\b/i],
  ["bathtub", /\bbathtubs?\b/i],
  ["shower", /\bshowers?\b/i],
  ["bidet", /\bbidets?\b/i],
  ["dishwasher", /\bdishwashers?\b/i],
  ["refrigerator", /\brefrigerators?\b/i],
  ["oven", /\bovens?\b/i],
  ["stove", /\bstoves?\b/i],
  ["microwave", /\bmicrowaves?\b/i],
  ["television", /\btelevisions?\b|\btvs?\b/i],
  ["projector", /\bprojectors?\b/i],
  ["sound system", /\bsound system\b/i],
  ["wifi", /\bwi-?fi\b|\binternet\b/i],
  ["radiator", /\bradiators?\b/i],
  ["ceiling fan", /\bceiling fans?\b/i],
  ["solar", /\bsolar\b/i],
  ["king bed", /\bking(?:-size)? bed\b/i],
  ["queen bed", /\bqueen(?:-size)? bed\b/i],
  ["full bed", /\bfull(?:-size)? bed\b/i],
  ["twin bed", /\btwin(?:-size)? beds?\b/i],
  ["sofa bed", /\bsofa bed\b/i],
  ["futon", /\bfutons?\b/i],
  ["crib", /\bcribs?\b/i],
  ["daybed", /\bdaybeds?\b/i],
  ["murphy bed", /\bmurphy bed\b/i],
  ["ocean view", /\bocean view\b/i],
  ["sea view", /\bsea view\b/i],
  ["lake view", /\blake view\b/i],
  ["mountain view", /\bmountain view\b/i],
  ["city view", /\bcity view\b/i],
  ["skyline view", /\bskyline view\b/i],
  ["garden view", /\bgarden view\b/i],
  ["pool view", /\bpool view\b/i],
  ["waterfront", /\bwaterfront\b/i],
  ["beachfront", /\bbeachfront\b/i],
  ["oceanfront", /\boceanfront\b/i],
  ["lakefront", /\blakefront\b/i],
  ["ski-in", /\bski-in\b/i],
  ["ski-out", /\bski-out\b/i],
  ["north-facing", /\bnorth[- ]facing\b/i],
  ["south-facing", /\bsouth[- ]facing\b/i],
  ["east-facing", /\beast[- ]facing\b/i],
  ["west-facing", /\bwest[- ]facing\b/i],
  ["ocean-facing", /\bocean[- ]facing\b/i],
  ["lake-facing", /\blake[- ]facing\b/i],
  ["sunrise", /\bsunrise\b/i],
  ["sunset", /\bsunset\b/i],
  ["shaded", /\bshaded\b/i],
  ["covered", /\bcovered (?:porch|patio|deck|balcony|terrace)\b/i],
  ["screened", /\bscreened\b/i],
  ["white", /\bwhite\b/i],
  ["black", /\bblack\b/i],
  ["gray", /\bgr[ae]y\b/i],
  ["blue", /\bblue\b/i],
  ["green", /\bgreen\b/i],
  ["red", /\bred\b/i],
  ["yellow", /\byellow\b/i],
  ["brown", /\bbrown\b/i],
  ["beige", /\bbeige\b/i],
  ["cream", /\bcream\b/i],
  ["ivory", /\bivory\b/i],
  ["navy", /\bnavy\b/i],
  ["charcoal", /\bcharcoal\b/i],
];

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exitCode = 1;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function normalize(text) {
  return String(text ?? "")
    .replace(/[’]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsPhrase(haystack, phrase) {
  if (!phrase) return false;
  const cleaned = normalize(phrase).replace(/'s(?=\s|$)/g, "");
  if (!cleaned) return false;
  const pattern = new RegExp(
    `(?<![a-z0-9])${escapeRegex(cleaned)}(?![a-z0-9])`,
    "i",
  );
  return pattern.test(haystack);
}

const SMALL_NUMBERS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];
const TENS = [
  "",
  "",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
];

function numberToWords(value) {
  if (!Number.isInteger(value) || value < 0 || value > 999) return null;
  if (value < 20) return SMALL_NUMBERS[value];
  if (value < 100) {
    const tens = Math.floor(value / 10);
    const rest = value % 10;
    return rest === 0 ? TENS[tens] : `${TENS[tens]}-${SMALL_NUMBERS[rest]}`;
  }
  const hundreds = Math.floor(value / 100);
  const rest = value % 100;
  const head = `${SMALL_NUMBERS[hundreds]} hundred`;
  if (rest === 0) return head;
  return `${head} ${numberToWords(rest)}`;
}

function containsNumberWord(haystack, value) {
  const word = numberToWords(value);
  if (!word) return false;
  return (
    containsPhrase(haystack, word) ||
    containsPhrase(haystack, word.replace("-", " "))
  );
}

function sentencesOf(text) {
  return String(text)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => normalize(sentence).replace(/[.!?]+$/, "").trim())
    .filter(Boolean);
}

function readAmenityNames() {
  const source = fs.readFileSync(SCHEMA_PATH, "utf8");
  const block = source.match(/const AMENITIES = \[([\s\S]*?)\]/);
  if (!block) throw new Error("Could not read AMENITIES from schemaTypes/stay.ts");
  return [...block[1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
}

function featurePatterns() {
  const amenities = readAmenityNames().map((name) => [
    name,
    FEATURE_OVERRIDES[name] ?? new RegExp(`\\b${escapeRegex(name)}\\b`, "i"),
  ]);
  const byLabel = new Map([...amenities, ...EXTRA_FEATURES, ...FACTUAL_TERMS]);
  return [...byLabel.entries()];
}

function readToken() {
  if (process.env.SANITY_API_TOKEN) return process.env.SANITY_API_TOKEN;

  const configPath = path.join(os.homedir(), ".config/sanity/config.json");
  if (fs.existsSync(configPath)) {
    const config = readJson(configPath);
    if (typeof config.authToken === "string" && config.authToken.length > 0) {
      return config.authToken;
    }
  }

  throw new Error(
    "No Sanity token found. Run `npx sanity login` or set SANITY_API_TOKEN.",
  );
}

function stayFacts(seedStay, doc, places) {
  return {
    title: doc.title,
    category: doc.category,
    city: doc.location?.city,
    region: doc.location?.region,
    country: doc.location?.country,
    maxGuests: doc.maxGuests,
    bedrooms: doc.bedrooms,
    beds: doc.beds,
    bathrooms: doc.bathrooms,
    amenities: doc.amenities,
    petsAllowed: doc.petsAllowed,
    quiet: doc.quiet,
    placeNames: [
      doc.location?.city,
      doc.location?.region,
      doc.location?.country,
      ...(places[seedStay.seedKey] ?? []),
    ].filter(Boolean),
    sourceCopy: Object.fromEntries(
      COPY_FIELDS.map((field) => [field, seedStay[field]]),
    ),
  };
}

function validateStayCopy(facts, copy) {
  const errors = [];
  const warnings = [];
  const allowedText = normalize(JSON.stringify(facts));
  const featureGrounding = normalize(
    [
      facts.title,
      ...COPY_FIELDS.map((field) => facts.sourceCopy[field]),
      ...facts.amenities,
    ].join(" "),
  );
  const allowedDigits = new Set(
    (allowedText.match(/\d+(?:\.\d+)?/g) ?? []).map(Number),
  );
  for (const value of [
    facts.maxGuests,
    facts.bedrooms,
    facts.beds,
    facts.bathrooms,
  ]) {
    if (typeof value === "number") allowedDigits.add(value);
  }
  const factCountWords = new Set(
    [facts.maxGuests, facts.bedrooms, facts.beds, facts.bathrooms]
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value))
      .map((value) => Object.keys(NUMBER_WORDS).find((word) => NUMBER_WORDS[word] === value))
      .filter(Boolean),
  );

  for (const field of COPY_FIELDS) {
    const value = copy[field];
    if (field === "vibe") {
      if (!Array.isArray(value) || value.length === 0) {
        errors.push("vibe must be a non-empty array");
      }
      continue;
    }
    if (typeof value !== "string" || value.trim().length === 0) {
      errors.push(`${field} is missing`);
    }
  }

  const summary = typeof copy.summary === "string" ? copy.summary.trim() : "";
  if (summary.length > 180) {
    errors.push(`summary is ${summary.length} characters (max 180)`);
  }

  const vibe = Array.isArray(copy.vibe) ? copy.vibe : [];
  if (vibe.length > 0) {
    if (vibe.length < 3 || vibe.length > 5) {
      errors.push(`vibe has ${vibe.length} words (expected 3-5)`);
    }
    const seen = new Set();
    for (const raw of vibe) {
      if (typeof raw !== "string" || !/^[a-z][a-z-]*$/.test(raw)) {
        errors.push(`vibe word "${raw}" is not a lowercase single word`);
        continue;
      }
      if (seen.has(raw)) errors.push(`vibe repeats "${raw}"`);
      seen.add(raw);
      if (!containsPhrase(allowedText, raw)) {
        errors.push(`vibe word "${raw}" is not supported by the facts`);
      }
    }
  }

  const text = COPY_FIELDS.filter((field) => field !== "vibe")
    .map((field) => (typeof copy[field] === "string" ? copy[field] : ""))
    .join("\n");

  // Proper nouns: any name that is not already in the facts or source copy.
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    const trimmed = sentence.trimStart();
    const matches = trimmed.matchAll(
      /\b[A-Z][A-Za-z'’]*(?:-[A-Za-z][A-Za-z'’]*)*(?:\s+[A-Z][A-Za-z'’]*(?:-[A-Za-z][A-Za-z'’]*)*)*\b/g,
    );
    for (const match of matches) {
      const phrase = match[0];
      const words = phrase.split(/\s+/);
      if (containsPhrase(allowedText, phrase)) continue;

      if (match.index === 0) {
        // A single capitalized word at the start of a sentence is just a
        // sentence start, not a name.
        if (words.length === 1) continue;
        const rest = words.slice(1).join(" ");
        if (!rest || containsPhrase(allowedText, rest)) continue;
        errors.push(`new proper noun "${rest}"`);
      } else {
        errors.push(`new proper noun "${phrase}"`);
      }
    }
  }

  // Numbers: no value that is not already in the stay's facts.
  const allowedNumberWords = new Set(
    (allowedText.match(/\b[a-z]+\b/g) ?? []).filter(
      (word) => word in NUMBER_WORDS,
    ),
  );
  for (const word of factCountWords) allowedNumberWords.add(word);

  for (const raw of text.match(/\b\d+(?:\.\d+)?\b/g) ?? []) {
    const value = Number(raw);
    if (allowedDigits.has(value) || containsNumberWord(allowedText, value)) {
      continue;
    }
    errors.push(`new number "${raw}"`);
  }
  for (const word of normalize(text).match(/\b[a-z]+\b/g) ?? []) {
    if (!(word in NUMBER_WORDS)) continue;
    if (allowedNumberWords.has(word) || allowedDigits.has(NUMBER_WORDS[word])) {
      continue;
    }
    errors.push(`new number "${word}"`);
  }

  // Features and amenities that the stay does not have.
  for (const [label, pattern] of featurePatterns()) {
    if (!pattern.test(text)) continue;
    if (pattern.test(featureGrounding)) continue;
    if (FEATURE_SYNONYMS[label]?.test(featureGrounding)) continue;
    errors.push(`unsupported feature "${label}"`);
  }

  // Claims the copy must never make.
  const forbidden = [
    [/\$\s?\d/, "a price"],
    [/\b(per night|nightly|price|pricing|fee|fees|deposit|tax|taxes)\b/i, "price or fees"],
    [/\b(rating|rated|reviews?|stars?)\b/i, "ratings or reviews"],
    [/\b(host|hosted|superhost)\b/i, "a host"],
    [
      /\b(availability|booked|vacancy|book now|minimum stay|nightly minimum)\b/i,
      "availability",
    ],
    [
      /\b\d+\s+[A-Z][a-z]+\s+(street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|way|court|ct)\b/i,
      "an exact address",
    ],
    [/you['’]ll/i, "second-person marketing"],
  ];
  for (const [pattern, label] of forbidden) {
    if (pattern.test(text)) errors.push(`mentions ${label}`);
  }

  // Months are allowed only when the source copy already names them.
  const sourceText = normalize(
    COPY_FIELDS.map((field) => facts.sourceCopy[field]).join(" "),
  );
  for (const match of text.matchAll(
    /\b(january|february|march|april|june|july|august|september|october|november|december)\b/gi,
  )) {
    if (!containsPhrase(sourceText, match[0])) {
      errors.push(`new month "${match[0]}"`);
    }
  }

  for (const word of BANNED_WORDS) {
    if (new RegExp(`\\b${word}\\b`, "i").test(text)) {
      errors.push(`uses banned word "${word}"`);
    }
  }

  // Each field must say something different.
  const sentenceFields = new Map();
  for (const field of COPY_FIELDS.filter((name) => name !== "vibe")) {
    for (const sentence of sentencesOf(copy[field] ?? "")) {
      const fields = sentenceFields.get(sentence) ?? new Set();
      fields.add(field);
      sentenceFields.set(sentence, fields);
    }
  }
  for (const [sentence, fields] of sentenceFields) {
    if (fields.size > 1) {
      errors.push(`the same sentence appears in ${[...fields].join(" and ")}`);
    }
  }

  // Warnings: source-grounded but not backed by an amenity, or long sentences.
  if (/\bviews?\b/i.test(text) && !facts.amenities.some((a) => /view/i.test(a) || a === "Lake access")) {
    warnings.push("mentions a view without a view amenity in the facts");
  }
  for (const field of COPY_FIELDS.filter((name) => name !== "vibe")) {
    for (const sentence of String(copy[field] ?? "").split(/(?<=[.!?])\s+/)) {
      const count = sentence.trim().split(/\s+/).filter(Boolean).length;
      if (count > 30) warnings.push(`${field} has a ${count}-word sentence`);
    }
    if (normalize(copy[field]) === normalize(facts.sourceCopy[field])) {
      warnings.push(`${field} is unchanged from the source copy`);
    }
  }

  return { errors, warnings };
}

async function requestGenerate(token, documentId, facts, previousErrors) {
  let instruction = INSTRUCTION;
  if (previousErrors.length > 0) {
    instruction += `\n\nPrevious attempt errors to fix:\n${previousErrors
      .slice(0, 8)
      .map((error) => `- ${error}`)
      .join("\n")}`;
  }

  const body = {
    schemaId: SCHEMA_ID,
    documentId,
    noWrite: true,
    instruction,
    instructionParams: {
      facts: { type: "constant", value: JSON.stringify(facts) },
    },
    target: { operation: "set", include: COPY_FIELDS },
  };

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await fetch(GENERATE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("retry-after") ?? "2");
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      continue;
    }

    const json = await response.json();
    if (!response.ok) {
      throw new Error(
        `Generate failed with ${response.status}: ${JSON.stringify(json).slice(0, 500)}`,
      );
    }

    return Object.fromEntries(COPY_FIELDS.map((field) => [field, json[field]]));
  }

  throw new Error("Generate was rate limited three times in a row");
}

async function generateCopy() {
  const seed = readJson(SEED_PATH);
  const places = readJson(PLACES_PATH);
  const token = readToken();

  const response = await fetch(
    `${QUERY_URL}?query=${encodeURIComponent(STAY_QUERY)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const json = await response.json();
  if (!response.ok) {
    throw new Error(`Stay query failed: ${JSON.stringify(json).slice(0, 500)}`);
  }

  const docs = json.result ?? [];
  const docsBySeed = new Map(docs.map((doc) => [doc.seedKey, doc]));
  const seedKeys = new Set(seed.stays.map((stay) => stay.seedKey));
  for (const doc of docs) {
    if (!seedKeys.has(doc.seedKey)) {
      throw new Error(`Published stay "${doc.seedKey}" is not in seed-data.json`);
    }
  }
  for (const stay of seed.stays) {
    if (!docsBySeed.has(stay.seedKey)) {
      throw new Error(`Seed stay "${stay.seedKey}" is not published in Sanity`);
    }
  }

  const artifact = [];
  const rejected = [];
  let totalWarnings = 0;

  for (const seedStay of seed.stays) {
    const doc = docsBySeed.get(seedStay.seedKey);
    const facts = stayFacts(seedStay, doc, places);
    let best = null;
    let attemptsMade = 0;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      attemptsMade = attempt;
      const copy = await requestGenerate(
        token,
        doc._id,
        facts,
        best?.errors ?? [],
      );
      const { errors, warnings } = validateStayCopy(facts, copy);
      const candidate = { copy, errors, warnings, attempt };

      if (!best || errors.length < best.errors.length) best = candidate;
      if (errors.length === 0) break;

      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    totalWarnings += best.warnings.length;
    const line = `${seedStay.seedKey.padEnd(28)} ${attemptsMade} attempt(s)  ${
      best.errors.length
    } error(s)  ${best.warnings.length} warning(s)`;
    console.log(line);
    for (const warning of best.warnings) console.log(`  ! ${warning}`);

    if (best.errors.length > 0) {
      for (const error of best.errors) console.log(`  ✖ ${error}`);
      rejected.push({
        seedKey: seedStay.seedKey,
        _id: doc._id,
        copy: best.copy,
        errors: best.errors,
        warnings: best.warnings,
      });
    } else {
      artifact.push({
        seedKey: seedStay.seedKey,
        _id: doc._id,
        copy: best.copy,
      });
    }
  }

  if (rejected.length > 0) {
    writeJson(REJECTED_PATH, {
      generatedAt: new Date().toISOString(),
      projectId: PROJECT_ID,
      dataset: DATASET,
      stays: rejected,
    });
    fail(
      `${rejected.length} stay(s) still had errors after ${MAX_ATTEMPTS} attempts. Nothing was written to Sanity. See ${path.relative(
        process.cwd(),
        REJECTED_PATH,
      )}.`,
    );
    return;
  }

  writeJson(OUT_PATH, {
    generatedAt: new Date().toISOString(),
    projectId: PROJECT_ID,
    dataset: DATASET,
    stays: artifact,
  });
  if (fs.existsSync(REJECTED_PATH)) fs.unlinkSync(REJECTED_PATH);

  console.log(
    `\n✔ ${artifact.length} stays, 0 errors, ${totalWarnings} warning(s). Wrote ${path.relative(
      process.cwd(),
      OUT_PATH,
    )}.`,
  );
}

function selfTest() {
  const seed = readJson(SEED_PATH);
  const places = readJson(PLACES_PATH);
  const stay = seed.stays[0];
  const facts = stayFacts(stay, stay, places);
  const base = Object.fromEntries(COPY_FIELDS.map((field) => [field, stay[field]]));
  const bad = {
    ...base,
    summary: `${base.summary} The rooftop sauna is two minutes from Lake Tahoe.`,
    description: `${base.description} White oak floors and a kiva fireplace fill the saltwater pool room.`,
    setting: `${base.setting} A private dock sits on the water.`,
    nearby: `${base.nearby} Ask the host about July availability for $250 a night, rated 4.9.`,
    neighborhoodDescription: `${base.neighborhoodDescription} Built in 1998.`,
  };

  const { errors } = validateStayCopy(facts, bad);
  const expectations = [
    ["new proper noun", /new proper noun/],
    ["unsupported feature", /unsupported feature/],
    ["host", /mentions a host/],
    ["price", /mentions (?:a )?price/],
    ["rating", /mentions ratings or reviews/],
    ["availability", /mentions availability/],
    ["month", /new month/],
    ["number", /new number/],
  ];

  let failed = 0;
  for (const [label, pattern] of expectations) {
    const found = errors.some((error) => pattern.test(error));
    console.log(`${found ? "✔" : "✖"} ${label}`);
    if (!found) failed += 1;
  }

  if (failed > 0) {
    fail(`${failed} self-test expectation(s) failed. Errors: ${errors.join(" | ")}`);
    return;
  }
  console.log(`✔ fact checker caught every injected invention (${errors.length} errors).`);
}

function mergeSeed() {
  if (!fs.existsSync(OUT_PATH)) {
    fail(`No artifact at ${path.relative(process.cwd(), OUT_PATH)}. Run the generator first.`);
    return;
  }

  const artifact = readJson(OUT_PATH);
  const seed = readJson(SEED_PATH);
  const copyBySeed = new Map(artifact.stays.map((stay) => [stay.seedKey, stay.copy]));
  const seedKeys = new Set(seed.stays.map((stay) => stay.seedKey));

  for (const stay of artifact.stays) {
    if (!seedKeys.has(stay.seedKey)) {
      fail(`Artifact contains unknown stay "${stay.seedKey}"`);
      return;
    }
  }
  for (const stay of seed.stays) {
    const copy = copyBySeed.get(stay.seedKey);
    if (!copy) {
      fail(`Artifact has no copy for "${stay.seedKey}"`);
      return;
    }
    for (const field of COPY_FIELDS) {
      if (copy[field] === undefined) {
        fail(`Artifact has no ${field} for "${stay.seedKey}"`);
        return;
      }
      stay[field] = copy[field];
    }
  }

  writeJson(SEED_PATH, seed);
  console.log(
    `✔ Merged copy for ${seed.stays.length} stays into ${path.relative(process.cwd(), SEED_PATH)}.`,
  );
}

if (process.argv.includes("--merge")) {
  mergeSeed();
} else if (process.argv.includes("--self-test")) {
  selfTest();
} else {
  generateCopy().catch((error) => fail(error.message));
}
