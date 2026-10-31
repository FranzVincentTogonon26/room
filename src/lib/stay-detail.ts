import type { IconName } from "@/components/ui/icon";
import type { Stay } from "@/data/stays";

/** Nightly prices are whole dollars, so no cents and no locale surprises. */
export function formatUsd(value: number) {
  return value.toLocaleString("en-US");
}

/** Cover photo first, then the gallery, without duplicates. */
export function galleryFor(stay: Stay) {
  return Array.from(new Set([stay.image, ...(stay.gallery ?? [])].filter(Boolean)));
}

export type StayHighlight = { icon: IconName; label: string };

const VIEW_HIGHLIGHTS: { pattern: RegExp; icon: IconName; label: string }[] = [
  { pattern: /forest|woods|wooded|pine|cedar|redwood|tree/i, icon: "trees", label: "Forest Views" },
  { pattern: /mountain|alpine|peak|ridge|hill/i, icon: "mountain", label: "Mountain Views" },
  { pattern: /ocean|sea|coast|beach|shore|surf/i, icon: "waves", label: "Ocean Views" },
  { pattern: /lake|river|water/i, icon: "waves", label: "Lake Views" },
  { pattern: /city|downtown|skyline|urban|loft/i, icon: "building2", label: "City Views" },
  { pattern: /desert|saguaro|adobe/i, icon: "sun", label: "Desert Views" },
  { pattern: /garden|olive|vineyard|orchard/i, icon: "treePine", label: "Garden Views" },
];

const EXTRA_HIGHLIGHTS: { pattern: RegExp; icon: IconName; label: string }[] = [
  { pattern: /pool/i, icon: "waves", label: "Pool" },
  { pattern: /fireplace|wood stove/i, icon: "flame", label: "Fireplace" },
  { pattern: /kitchen/i, icon: "coffee", label: "Full Kitchen" },
  { pattern: /parking|garage|ev charger/i, icon: "car", label: "Free Parking" },
  { pattern: /workspace|desk/i, icon: "briefcase", label: "Workspace" },
  { pattern: /air conditioning|a\/c/i, icon: "wind", label: "Air Conditioning" },
  { pattern: /garden|patio|deck|balcony/i, icon: "treePine", label: "Outdoor Space" },
  { pattern: /gym/i, icon: "sparkles", label: "Gym" },
];

function stayText(stay: Stay) {
  return [
    stay.title,
    stay.location,
    stay.description,
    stay.setting,
    stay.nearby,
    ...stay.amenities,
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * The four facts the design shows under the location. Hard facts come first
 * (hot tub, pets, Wi-Fi, the view), then the next matching amenity.
 */
export function highlightsFor(stay: Stay): StayHighlight[] {
  const text = stayText(stay);
  const highlights: StayHighlight[] = [];
  const seen = new Set<string>();
  const add = (highlight: StayHighlight) => {
    if (seen.has(highlight.label) || highlights.length >= 4) return;
    seen.add(highlight.label);
    highlights.push(highlight);
  };

  if (/hot tub|jacuzzi/i.test(text)) add({ icon: "bath", label: "Hot Tub" });
  if (stay.petsAllowed || /pet|dog/i.test(text)) {
    add({ icon: "pawPrint", label: "Pet Friendly" });
  }
  if (/wi-?fi|internet/i.test(text)) add({ icon: "wifi", label: "Fast Wi-Fi" });

  const view = VIEW_HIGHLIGHTS.find((candidate) => candidate.pattern.test(text));
  if (view) add({ icon: view.icon, label: view.label });

  for (const extra of EXTRA_HIGHLIGHTS) {
    if (highlights.length >= 4) break;
    if (extra.pattern.test(text)) add({ icon: extra.icon, label: extra.label });
  }

  return highlights;
}

/** "English and Mandarin" / "English, Mandarin and Spanish". */
export function listPhrase(items: string[]) {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;

  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
