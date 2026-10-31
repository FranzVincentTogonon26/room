# 10 · Sanity content model and seed

Status: done

## Goal

Room's Sanity dataset holds the content model behind the search results and stay details screens: 30 published stays, 8 shared hosts, and 14 shared policies, with typed fields for every guest filter, descriptive text on each stay for embeddings, and real image assets. Re-running the seed creates no duplicates.

## Decisions

- The stay details screen is the full listing: gallery, title, location, rating, description, guests/bedrooms/beds/baths, full amenities, neighborhood, house rules, host, policies, and aggregate reviews.
- Search filters expand beyond the current four to capacity, amenities, and place: guests, bedrooms, amenities, city/region, in addition to category, price, pets, and quiet.
- The policy set is full: cancellation, house rules, check-in/check-out, pets, smoking, quiet hours, and safety.
- The host profile is full: name, photo, bio, superhost badge, response time, joined year, and languages.
- Pricing is nightly plus a total computed in the app for the selected nights. No fees, no taxes, no `totalPrice` field in Sanity.
- Photos are a cover plus a gallery of up to 24. Seed 3 photos per stay: 1 cover + 2 gallery.
- Three document types: `stay`, `host`, `policy`, plus a `location` object. Hosts and policies are shared documents referenced by stays.
- Typed stay filter fields: `category`, `pricePerNight`, `maxGuests`, `bedrooms`, `beds`, `bathrooms`, `amenities` (fixed string list), `petsAllowed`, `quiet`, `location` (city/region/country/coordinates), and `featured`.
- Descriptive text that feeds embeddings lives on the stay itself: `summary`, `description`, `vibe`, `setting`, `nearby`, and `neighborhoodDescription`. Host and policy text is not embedded because embeddings do not see references.
- Reviews are aggregate only: `rating` and `reviewCount`. No individual review documents.
- `Pet friendly` and `Quiet` are not amenity values. They are the `petsAllowed` and `quiet` booleans; the UI renders those pills from the booleans. This avoids two sources of truth for a filter.
- `vibe` is a free array of short atmosphere words for soft intent. It may include "quiet" even though `quiet` is a boolean: the boolean is the hard filter, the word is the embedding signal.
- Images are real Sanity image assets uploaded from the Unsplash URLs already used by the app. Reuse a pool of 20 stay photos (5 per category) plus 8 host portraits; every usage has its own alt text.
- Seed idempotency uses a read-only `seedKey` on every seeded document, not deterministic `_id`s. The seed queries by `seedKey`, creates only missing documents, publishes them, and never overwrites an existing document. Sanity generates all `_id`s, per the project rule.
- The seed data source is `studio/seed/seed-data.json`. It contains no secrets and is the exact input for a re-run.
- Keep the existing 12 stays from `src/data/stays.ts` as the first 12, enriched with the new fields. Add 18 new stays. Categories: 8 cabins, 8 beach, 7 city, 7 villas.
- Seed 8 hosts, 14 policies, and 6 featured stays. Each stay references exactly one policy of each of the 7 types.
- All locations are in the United States and prices are USD. Coordinates are approximate city coordinates, never exact addresses.
- Use `@sanity/icons` already present in `studio/node_modules` (it ships with `sanity`). Do not add a dependency.
- **Deployment path deviation:** the Sanity MCP's own rules say that when a local Studio exists, schema files are edited locally and deployed with `npx sanity@latest schema deploy`; `deploy_schema` must not be used as a fallback. The request said "deploy with the Sanity MCP", so this plan uses the Studio CLI for the schema and the Sanity MCP for all content (assets, hosts, policies, stays). Approval covers this deviation.

## Content model

### `stay`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | string | yes | Guest-facing name. |
| `slug` | slug | yes | Source `title`, max 96, lowercase letters, numbers, hyphens. |
| `seedKey` | string | yes | Read-only and hidden in Studio. Stable seed identity, e.g. `modern-cabin-hot-tub`. |
| `category` | string | yes | Options: `cabins`, `beach`, `city`, `villas`. |
| `pricePerNight` | number | yes | Integer, min 1, USD. |
| `maxGuests` | number | yes | Integer, min 1. |
| `bedrooms` | number | yes | Integer, min 0 (studios are 0). |
| `beds` | number | yes | Integer, min 1. |
| `bathrooms` | number | yes | Number, min 0.5; allows 1.5 and 2.5. |
| `amenities` | array of string | yes | Fixed list below, min 1, unique. |
| `petsAllowed` | boolean | yes | Initial `false`. The pet filter. |
| `quiet` | boolean | yes | Initial `false`. The quiet filter. |
| `featured` | boolean | no | Initial `false`. Used by Home ranking. |
| `location` | object (`location`) | yes | See below. |
| `coverPhoto` | image | yes | Hotspot enabled; `alt` string required. |
| `gallery` | array of image | no | Max 23; hotspot enabled; each `alt` required; each item has `_key`. |
| `summary` | text | yes | One sentence, max 180 characters. Card and preview text. |
| `description` | text | yes | 2–4 sentences about the home itself. |
| `vibe` | array of string | yes | Min 1, max 8, unique. Lowercase atmosphere words. |
| `setting` | text | yes | 1–2 sentences about the landscape and surroundings. |
| `nearby` | text | yes | 1–2 sentences about trails, town, beach, transit. |
| `neighborhoodDescription` | text | yes | 2–3 sentences about the neighborhood. |
| `rating` | number | yes | Min 0, max 5. |
| `reviewCount` | number | yes | Integer, min 0. |
| `host` | reference to `host` | yes | Shared host document. |
| `policies` | array of reference to `policy` | yes | Min 1; the seed gives exactly 7, one per type. Each item has `_key`. |

### `host`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | string | yes | Full name. |
| `seedKey` | string | yes | Read-only and hidden in Studio, e.g. `host-maya-chen`. |
| `photo` | image | yes | Hotspot enabled; `alt` string required. |
| `bio` | text | yes | 2–3 sentences, first person or third person, consistent. |
| `superhost` | boolean | yes | Initial `false`. |
| `responseTime` | string | yes | Options: `Within an hour`, `Within a few hours`, `Within a day`. |
| `joinedYear` | number | yes | Integer, min 2008, max current year. |
| `languages` | array of string | yes | Min 1, unique. |

### `policy`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | string | yes | Card title, e.g. `Flexible cancellation`. |
| `seedKey` | string | yes | Read-only and hidden in Studio, e.g. `policy-cancellation-flexible`. |
| `policyType` | string | yes | Options: `cancellation`, `houseRules`, `checkInOut`, `pets`, `smoking`, `quietHours`, `safety`. |
| `summary` | string | yes | Short card line, max 80 characters. |
| `body` | text | yes | Full policy text, shown word for word. |

### `location` object

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `city` | string | yes | e.g. `Lake Arrowhead`. |
| `region` | string | yes | Two-letter US state code, e.g. `CA`. |
| `country` | string | yes | Initial `United States`. |
| `coordinates` | geopoint | yes | Approximate city coordinates, no exact address. |

### Fixed lists

Categories:

```text
cabins
beach
city
villas
```

Amenities (exact values; seed data may only use a subset):

```text
Hot tub
Pool
Fireplace
Wi-Fi
Full kitchen
Kitchenette
Coffee maker
Free parking
EV charger
Workspace
Gym
Ski storage
Ocean view
Mountain view
Skyline view
Garden
Patio
Balcony
Outdoor shower
Walk to beach
Steps to sand
Lake access
Walkable
Historic
Air conditioning
Heating
Washer
Dryer
BBQ grill
Fire pit
Sauna
Bikes
Crib
```

Policy types:

```text
cancellation
houseRules
checkInOut
pets
smoking
quietHours
safety
```

### Schema files

```text
studio/schemaTypes/
  index.ts      // exports [stay, host, policy, location]
  stay.ts
  host.ts
  policy.ts
  location.ts
```

Use `defineType`, `defineField`, and `defineArrayMember` from `sanity`. Use icons from `@sanity/icons/Home`, `@sanity/icons/User`, `@sanity/icons/DocumentText`, and `@sanity/icons/Pin`. Group the stay fields as Basics, Capacity, Location, Photos, Story, Host & policies, Reviews, and System; put `seedKey` in System with `readOnly: true` and `hidden: true`. `location` is a named object type used by `stay.location`.

Nested API shapes for the seed:

- `slug`: `{ "_type": "slug", "current": "..." }`
- `location`: `{ "_type": "location", "city": "...", "region": "...", "country": "United States", "coordinates": { "_type": "geopoint", "lat": 0, "lng": 0 } }`
- `coverPhoto`: `{ "_type": "image", "asset": { "_type": "reference", "_ref": "image-..." }, "alt": "..." }`
- gallery item: `{ "_key": "gallery-1", "_type": "image", "asset": { ... }, "alt": "..." }`
- `host`: `{ "_type": "reference", "_ref": "..." }`
- policy item: `{ "_key": "policy-cancellation", "_type": "reference", "_ref": "..." }`

Top-level `_type` is passed through the MCP `type` field, not inside `content`. Nested objects and references keep their `_type`.

## Seed content

### Hosts

| Seed key | Name | Superhost | Response time | Joined | Languages | Photo URL suffix |
| --- | --- | --- | --- | --- | --- | --- |
| `host-maya-chen` | Maya Chen | yes | Within an hour | 2016 | English, Mandarin | `photo-1494790108377-be9c29b29330` |
| `host-daniel-reyes` | Daniel Reyes | yes | Within a few hours | 2015 | English, Spanish | `photo-1500648767791-00dcc994a43e` |
| `host-priya-natarajan` | Priya Natarajan | yes | Within an hour | 2018 | English, Hindi, Tamil | `photo-1534528741775-53994a69daeb` |
| `host-grace-whitfield` | Grace Whitfield | yes | Within a day | 2017 | English, French | `photo-1438761681033-6461ffad8d80` |
| `host-marcus-bell` | Marcus Bell | yes | Within a few hours | 2014 | English | `photo-1507003211169-0a1dd7228f2d` |
| `host-sofia-alvarez` | Sofia Alvarez | yes | Within an hour | 2019 | English, Spanish | `photo-1544005313-94ddf0286df2` |
| `host-kenji-watanabe` | Kenji Watanabe | no | Within a few hours | 2020 | English, Japanese | `photo-1506794778202-cad84cf45f1d` |
| `host-olivia-brooks` | Olivia Brooks | yes | Within an hour | 2013 | English, French | `photo-1524504388940-b1c1722653e1` |

Host bios:

- **Maya:** "Maya grew up in the Cascades and has hosted design-forward cabins since 2016. She leaves a local trail map and a bag of coffee at every check-in."
- **Daniel:** "Daniel is a third-generation Californian who restored his family's beach cottages. He surfs, cooks, and knows the best taco stands from Malibu to Mendocino."
- **Priya:** "Priya is a structural engineer who spends weekends skiing and trail-running. She hosts mountain homes with boot dryers, good coffee, and honest trail advice."
- **Grace:** "Grace is a preservation architect in Boston. She restored a Back Bay row house and a Cape Cod dune cottage, and she knows the quietest beaches on the Cape."
- **Marcus:** "Marcus is a former park ranger who hosts homes across the Southeast. He answers questions fast and keeps a list of the best barbecue, hikes, and rainy-day museums."
- **Sofia:** "Sofia is a landscape designer in the Southwest. Her homes are full of shade, native plants, and cold drinks in the fridge; ask her for a sunset spot."
- **Kenji:** "Kenji splits his time between Seattle and Kauai. He is a photographer and a good source for sunrise hikes, quiet beaches, and the best poke on the island."
- **Olivia:** "Olivia has lived in six cities and hosts walkable flats in four of them. She leaves a neighborhood guide with coffee, transit, and the best place to work for an afternoon."

### Policies

Each body is the exact text to store; the app shows it word for word.

- `policy-cancellation-flexible` · `cancellation` · **Flexible cancellation** · Summary: "Full refund up to 48 hours before check-in" · Body: "Cancel up to 48 hours before check-in for a full refund. Cancel within 48 hours of check-in and the first night is non-refundable."
- `policy-cancellation-moderate` · `cancellation` · **Moderate cancellation** · Summary: "Full refund up to 5 days before check-in" · Body: "Cancel up to 5 days before check-in for a full refund. Cancel within 5 days of check-in and the first night is non-refundable, plus 50% of the remaining nights."
- `policy-cancellation-strict` · `cancellation` · **Strict cancellation** · Summary: "50% refund up to 7 days before check-in" · Body: "Cancel up to 7 days before check-in for a 50% refund. Cancel within 7 days of check-in and the reservation is non-refundable."
- `policy-house-rules-standard` · `houseRules` · **House rules** · Summary: "No parties or events; max occupancy enforced" · Body: "No parties or events. The number of guests must not exceed the reservation. No unregistered visitors overnight. Please respect the neighbors and keep noise down."
- `policy-house-rules-family` · `houseRules` · **Family house rules** · Summary: "Families welcome; no parties or events" · Body: "Families welcome. No parties or events. Maximum occupancy is strictly enforced. A crib and high chair may be available on request."
- `policy-check-in-standard` · `checkInOut` · **Check-in and checkout** · Summary: "Check-in 4 PM · Checkout 11 AM" · Body: "Self check-in with a lockbox or smart lock. Check-in after 4 PM. Checkout by 11 AM. Early check-in and late checkout may be available on request."
- `policy-check-in-early` · `checkInOut` · **Check-in and checkout** · Summary: "Check-in 3 PM · Checkout 11 AM" · Body: "Self check-in with a lockbox or smart lock. Check-in after 3 PM. Checkout by 11 AM. Luggage storage may be available on request."
- `policy-check-in-late` · `checkInOut` · **Check-in and checkout** · Summary: "Check-in 4 PM · Checkout 12 PM" · Body: "Self check-in with a lockbox or smart lock. Check-in after 4 PM. Checkout by 12 PM. Early check-in may be available on request."
- `policy-pets-welcome` · `pets` · **Pets welcome** · Summary: "Up to 2 dogs; keep off furniture" · Body: "Up to 2 dogs are welcome. Pets must be kept off furniture and beds. Please pick up after your dog and do not leave pets unattended."
- `policy-pets-not-allowed` · `pets` · **No pets** · Summary: "Service animals welcome" · Body: "Pets are not allowed. Service animals are always welcome. Please let us know in advance if you are traveling with a service animal."
- `policy-smoking-none` · `smoking` · **No smoking** · Summary: "No smoking or vaping indoors" · Body: "No smoking or vaping inside the home. Smoking is allowed outdoors only, away from doors and windows. Please dispose of butts safely."
- `policy-quiet-hours-10-8` · `quietHours` · **Quiet hours** · Summary: "10 PM – 8 AM" · Body: "Quiet hours are 10 PM to 8 AM. Please keep music and voices low during this time. Outdoor spaces close at 10 PM."
- `policy-safety-standard` · `safety` · **Safety** · Summary: "Smoke and CO alarms; first aid kit" · Body: "Smoke and carbon monoxide alarms are installed. A fire extinguisher and first aid kit are in the home. Exterior cameras may be present at the entrance."
- `policy-safety-pool` · `safety` · **Pool and water safety** · Summary: "No lifeguard; supervise children" · Body: "The pool has no lifeguard. Children must be supervised at all times. No diving. Pool heating may be available on request."

Policy assignment:

- Cancellation: `pricePerNight < 250` → flexible; `250–349` → moderate; `>= 350` → strict.
- House rules: `maxGuests >= 6` → family; otherwise standard.
- Check-in: `pricePerNight >= 400` → late; otherwise `cabins` or `villas` → early; otherwise standard.
- Pets: `petsAllowed` → welcome; otherwise not allowed.
- Smoking: always `policy-smoking-none`.
- Quiet hours: always `policy-quiet-hours-10-8`.
- Safety: `"Pool" in amenities` → pool safety; otherwise standard.
- Write the resulting 7 `policySeedKeys` explicitly into the seed JSON, so the seed does not compute them at run time.

### Stays

Prices are USD per night. `Sleeps` is `maxGuests`. `BR/Beds/Baths` are the three numbers. `Pets` and `Quiet` are the boolean fields. `★` marks `featured`. Host is the short key from the host table.

| # | Seed key | Title | City, Region | Category | $ | Sleeps | BR/Beds/Baths | Pets | Quiet | Host |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `modern-cabin-hot-tub` | ★ Modern Cabin with Hot Tub | Lake Arrowhead, CA | cabins | 280 | 6 | 2/3/2 | yes | yes | maya |
| 2 | `cedar-ridge-cabin` | Cedar Ridge Retreat | Big Bear Lake, CA | cabins | 215 | 4 | 2/3/1 | yes | yes | priya |
| 3 | `pine-a-frame` | Pine A-Frame Hideaway | Tahoe City, CA | cabins | 245 | 5 | 2/4/2 | yes | yes | priya |
| 4 | `ocean-view-beach-house` | ★ Ocean View Beach House | Malibu, CA | beach | 420 | 8 | 4/5/3 | no | no | daniel |
| 5 | `gullwing-cottage` | Gullwing Beach Cottage | Santa Cruz, CA | beach | 265 | 4 | 2/2/1 | yes | yes | daniel |
| 6 | `mendocino-coast-cottage` | Mendocino Coast Cottage | Mendocino, CA | beach | 295 | 4 | 2/3/2 | yes | yes | daniel |
| 7 | `downtown-arts-loft` | Downtown Arts Loft | Portland, OR | city | 185 | 2 | 1/1/1 | no | no | maya |
| 8 | `skyline-studio` | Skyline Studio | Seattle, WA | city | 230 | 2 | 1/1/1 | yes | no | kenji |
| 9 | `brick-rowhouse-suite` | Brick Rowhouse Suite | Boston, MA | city | 210 | 3 | 1/2/1 | no | yes | grace |
| 10 | `palm-springs-pool-villa` | ★ Palm Springs Pool Villa | Palm Springs, CA | villas | 395 | 8 | 4/4/3 | no | yes | sofia |
| 11 | `hillside-garden-villa` | Hillside Garden Villa | Ojai, CA | villas | 340 | 6 | 3/4/2 | no | yes | sofia |
| 12 | `saguaro-desert-villa` | Saguaro Desert Villa | Scottsdale, AZ | villas | 310 | 6 | 3/3/2 | no | yes | sofia |
| 13 | `aspen-grove-cabin` | Aspen Grove Cabin | Bend, OR | cabins | 240 | 4 | 2/3/1 | yes | yes | maya |
| 14 | `blue-spruce-chalet` | Blue Spruce Chalet | Breckenridge, CO | cabins | 320 | 8 | 4/6/3 | yes | yes | priya |
| 15 | `smoky-mountain-hideaway` | Smoky Mountain Hideaway | Gatlinburg, TN | cabins | 195 | 4 | 2/3/2 | yes | yes | marcus |
| 16 | `lakeside-cedar-cabin` | Lakeside Cedar Cabin | Coeur d'Alene, ID | cabins | 275 | 6 | 3/4/2 | no | yes | maya |
| 17 | `redwood-creek-cabin` | Redwood Creek Cabin | Mendocino, CA | cabins | 230 | 4 | 1/2/1 | yes | yes | priya |
| 18 | `cape-cod-dune-house` | ★ Cape Cod Dune House | Wellfleet, MA | beach | 350 | 6 | 3/4/2 | yes | yes | grace |
| 19 | `outer-banks-bungalow` | Outer Banks Beach Bungalow | Nags Head, NC | beach | 225 | 4 | 2/3/1 | yes | no | marcus |
| 20 | `santa-monica-sun-suite` | Santa Monica Sun Suite | Santa Monica, CA | beach | 310 | 3 | 1/1/1 | no | no | kenji |
| 21 | `hanalei-bay-cottage` | ★ Hanalei Bay Cottage | Hanalei, HI | beach | 480 | 4 | 2/2/2 | no | yes | kenji |
| 22 | `cannon-beach-cottage` | Cannon Beach Cottage | Cannon Beach, OR | beach | 260 | 4 | 2/3/1 | yes | yes | maya |
| 23 | `soho-loft` | ★ SoHo Loft | New York, NY | city | 390 | 4 | 2/2/2 | no | no | olivia |
| 24 | `mission-district-flat` | Mission District Flat | San Francisco, CA | city | 275 | 4 | 1/2/1 | yes | no | olivia |
| 25 | `capitol-hill-rowhouse` | Capitol Hill Rowhouse | Washington, DC | city | 245 | 4 | 2/2/2 | no | yes | olivia |
| 26 | `wicker-park-studio` | Wicker Park Studio | Chicago, IL | city | 165 | 2 | 1/1/1 | yes | no | olivia |
| 27 | `sonoma-vineyard-villa` | Sonoma Vineyard Villa | Sonoma, CA | villas | 450 | 8 | 4/5/4 | no | yes | sofia |
| 28 | `santa-fe-adobe-villa` | Santa Fe Adobe Villa | Santa Fe, NM | villas | 330 | 6 | 3/4/3 | yes | yes | sofia |
| 29 | `austin-hill-country-villa` | Austin Hill Country Villa | Austin, TX | villas | 365 | 8 | 4/6/3 | yes | yes | marcus |
| 30 | `miami-beach-villa` | Miami Beach Villa | Miami Beach, FL | villas | 425 | 8 | 4/5/4 | no | no | marcus |

Existing 12: keep the current titles, locations, prices, ratings, review counts, and cover images from `src/data/stays.ts`. Normalize their amenities to the fixed list: remove `Pet friendly`, `Dog friendly`, `Quiet`, and `Secluded`; map `Kitchen` to `Full kitchen` or `Kitchenette`; keep the rest when they match a fixed value. Add the new descriptive fields.

New 18: assign ratings 4.6–4.9 and review counts 80–450, realistic for the home. Use the city coordinates from the location map below.

Coordinates:

```text
Lake Arrowhead, CA   34.2483, -117.1892
Big Bear Lake, CA    34.2439, -116.9114
Tahoe City, CA       39.1667, -120.1458
Malibu, CA           34.0259, -118.7798
Santa Cruz, CA       36.9741, -122.0308
Mendocino, CA        39.3077, -123.7995
Portland, OR         45.5152, -122.6784
Seattle, WA          47.6062, -122.3321
Boston, MA           42.3601, -71.0589
Palm Springs, CA     33.8303, -116.5453
Ojai, CA             34.4480, -119.2429
Scottsdale, AZ       33.4942, -111.9261
Bend, OR             44.0582, -121.3153
Breckenridge, CO     39.4817, -106.0384
Gatlinburg, TN       35.7143, -83.5102
Coeur d'Alene, ID    47.6777, -116.7805
Wellfleet, MA        41.9376, -70.0328
Nags Head, NC        35.9574, -75.6241
Santa Monica, CA     34.0195, -118.4912
Hanalei, HI          22.2017, -159.5007
Cannon Beach, OR     45.8918, -123.9615
New York, NY         40.7128, -74.0060
San Francisco, CA    37.7749, -122.4194
Washington, DC       38.9072, -77.0369
Chicago, IL          41.8781, -87.6298
Sonoma, CA           38.2919, -122.4580
Santa Fe, NM         35.6870, -105.9378
Austin, TX           30.2672, -97.7431
Miami Beach, FL      25.7907, -80.1300
```

### Stay copy voice

- `summary`: one concrete sentence, max 180 characters, no marketing adjectives.
- `description`: 2–4 sentences about the home: materials, light, deck, fireplace, layout. Mention the feature the title promises.
- `vibe`: 3–5 lowercase words, e.g. `["quiet", "wooded", "cozy"]`.
- `setting`: 1–2 sentences about the landscape and surroundings.
- `nearby`: 1–2 sentences with named, plausible places, trails, beaches, or transit. No exact addresses.
- `neighborhoodDescription`: 2–3 sentences about the area, walkability, noise, and what is close.
- Use US English and sentence case. Do not mention Room, Sanity, seed data, or prices. Do not put host names in stay copy. Avoid unverifiable claims such as "the best".
- Each text field must say something different; do not repeat the same sentence in `description`, `setting`, and `neighborhoodDescription`.

### Image pool

All URLs use `https://images.unsplash.com/<suffix>?auto=format&fit=crop&w=1200&q=80`. All 28 were checked with `curl` during planning and returned 200. The build still preflights every URL before uploading.

Stay photos:

```text
C1 photo-1542718610-a1d656d1884c  cabin among tall pines
C2 photo-1449158743715-0a90ebb6d2d8  A-frame cabin in a snowy forest
C3 photo-1510798831971-661eb04b3739  A-frame cabin with a wall of windows
C4 photo-1470770841072-f978cf4d019e  cabin on a lake at dusk
C5 photo-1587061949409-02df41d5e562  modern cabin with a wooden deck
B1 photo-1499793983690-e29da59ef1c2  beach house with ocean views
B2 photo-1507525428034-b723cf961d3e  sandy beach and turquoise water
B3 photo-1518780664697-55e3ad937233  coastal cottage near the water
B4 photo-1500375592092-40eb2168fd21  waves breaking on a sandy shore
B5 photo-1473116763249-2faaef81ccda  sunset over the surf at the beach
T1 photo-1502672260266-1c1ef2d93688  loft with exposed brick and large windows
T2 photo-1522708323590-d24dbb6b0267  bright apartment living room
T3 photo-1600607687939-ce8a6c25118c  row house interior with original details
T4 photo-1493809842364-78817add7ffb  modern city apartment
T5 photo-1560448204-e02f11c3d0e2  minimal apartment with a city view
V1 photo-1613490493576-7fde63acd811  pool villa with mountain views
V2 photo-1600585154340-be6161a56a0c  hillside villa surrounded by trees
V3 photo-1600047509807-ba8f99d2cdde  desert adobe villa with a patio
V4 photo-1600566753086-00f18fb6b3ea  modern villa interior with warm wood
V5 photo-1600607687920-4e2a09cf159d  villa patio with outdoor seating
```

Host portraits:

```text
H1 photo-1494790108377-be9c29b29330  Maya
H2 photo-1500648767791-00dcc994a43e  Daniel
H3 photo-1534528741775-53994a69daeb  Priya
H4 photo-1438761681033-6461ffad8d80  Grace
H5 photo-1507003211169-0a1dd7228f2d  Marcus
H6 photo-1544005313-94ddf0286df2  Sofia
H7 photo-1506794778202-cad84cf45f1d  Kenji
H8 photo-1524504388940-b1c1722653e1  Olivia
```

Assignment:

- Existing 12 stays keep their current cover image from `src/data/stays.ts`.
- New stays use the category pool in order: cover = the first unused pool image for that category, wrapping after 5. Gallery = the next two images in the same category, wrapping and skipping the cover.
- Every stay's 3 photos are distinct. Every usage gets its own alt text describing the photo. If an image's subject is ambiguous, use a generic but accurate description such as "Cabin exterior among trees"; do not repeat the stay title.

### Seed data file

`studio/seed/seed-data.json` shape:

```json
{
  "hosts": [
    {
      "seedKey": "host-maya-chen",
      "name": "Maya Chen",
      "photoUrl": "https://images.unsplash.com/photo-...",
      "photoAlt": "Portrait of Maya Chen",
      "bio": "...",
      "superhost": true,
      "responseTime": "Within an hour",
      "joinedYear": 2016,
      "languages": ["English", "Mandarin"]
    }
  ],
  "policies": [
    {
      "seedKey": "policy-cancellation-flexible",
      "title": "Flexible cancellation",
      "policyType": "cancellation",
      "summary": "Full refund up to 48 hours before check-in",
      "body": "..."
    }
  ],
  "stays": [
    {
      "seedKey": "modern-cabin-hot-tub",
      "title": "Modern Cabin with Hot Tub",
      "slug": "modern-cabin-with-hot-tub",
      "category": "cabins",
      "pricePerNight": 280,
      "maxGuests": 6,
      "bedrooms": 2,
      "beds": 3,
      "bathrooms": 2,
      "amenities": ["Hot tub", "Fireplace", "Wi-Fi", "Full kitchen", "Free parking"],
      "petsAllowed": true,
      "quiet": true,
      "featured": true,
      "location": {
        "city": "Lake Arrowhead",
        "region": "CA",
        "country": "United States",
        "coordinates": { "lat": 34.2483, "lng": -117.1892 }
      },
      "coverPhotoUrl": "https://images.unsplash.com/photo-...",
      "coverPhotoAlt": "...",
      "gallery": [
        { "url": "https://images.unsplash.com/photo-...", "alt": "..." },
        { "url": "https://images.unsplash.com/photo-...", "alt": "..." }
      ],
      "summary": "...",
      "description": "...",
      "vibe": ["quiet", "wooded", "cozy"],
      "setting": "...",
      "nearby": "...",
      "neighborhoodDescription": "...",
      "rating": 4.9,
      "reviewCount": 342,
      "hostSeedKey": "host-maya-chen",
      "policySeedKeys": [
        "policy-cancellation-moderate",
        "policy-house-rules-family",
        "policy-check-in-early",
        "policy-pets-welcome",
        "policy-smoking-none",
        "policy-quiet-hours-10-8",
        "policy-safety-standard"
      ]
    }
  ]
}
```

The file contains no secrets. It is the source for every seed run.

## Out of scope

- Wiring Sanity into the app. `src/data/stays.ts` remains the app's stay source until Sanity search is wired in.
- The stay detail screen, new search filter UI, booking, availability, trips, map UI, and persisted favorites.
- Individual review documents, review submission, and review moderation.
- Sanity Context, policy Q&A, embeddings, and Jev. This task only makes the content ready for them.
- Studio hosting (`sanity deploy`). Schema documents are deployed; the Studio can be inspected locally with `npx sanity dev`.
- Localized content, Portable Text bodies, fees, taxes, and payments.
- Any change to the app's design tokens or screens.

## Steps

### 1. Write the schema files

Create `studio/schemaTypes/location.ts`, `host.ts`, `policy.ts`, and `stay.ts`, and update `studio/schemaTypes/index.ts` to export `[stay, host, policy, location]`. Follow the field tables above, use `defineType`/`defineField`/`defineArrayMember`, and use the `@sanity/icons` subpath imports. Put `seedKey` in a System group with `readOnly: true` and `hidden: true`. Use `options.list` for `category`, `amenities`, `policyType`, and `responseTime`. Add the validations in the tables.

Done when `cd studio && npx tsc --noEmit` passes and `cd studio && npx sanity build` completes without schema errors. Do not run `sanity deploy`.

### 2. Deploy the schema

From `studio/`, run:

```bash
npx sanity@latest schema deploy
```

If the latest CLI cannot read the v6 Studio config, fall back to the local CLI (`npx sanity schema deploy`) and report which one ran. This is the approved deviation from "deploy with the MCP": the MCP refuses `deploy_schema` when a local Studio exists.

Done when `npx sanity@latest schema list` lists `stay`, `host`, and `policy`, and the Sanity MCP `list_workspace_schemas` shows a deployed schema for the `production` dataset. Also call `get_schema` for `stay` and confirm the fields match the tables.

### 3. Write and validate the seed data

Create `studio/seed/seed-data.json` with the 8 hosts, 14 policies, and 30 stays above. Write the full copy for every stay, not placeholders. Compute each stay's 7 `policySeedKeys` with the assignment rules and write them explicitly. Use the image pool and the cover/gallery assignment rules.

Validate the file with a throwaway Node script in the session temp folder. It must assert:

- 8 hosts, 14 policies, 30 stays; unique `seedKey` per type.
- Every `hostSeedKey` and `policySeedKey` exists.
- Every stay has exactly 7 policies and exactly one of each `policyType`.
- Every category and amenity is in the fixed lists.
- Every stay has 1 cover + 2 gallery photos, all distinct within the stay.
- Every slug is unique and matches `/^[a-z0-9-]+$/`.
- Every price, guest count, bedroom, bed, and bathroom value is valid.
- Every rating is 0–5 and every review count is a non-negative integer.
- Every image URL is HTTPS and belongs to the pool.

Done when the script prints the counts and exits 0.

### 4. Upload the image assets

Collect the unique image URLs from the seed file: 20 stay photos + 8 host portraits = 28. Preflight each with `curl -s -o /dev/null -w "%{http_code}"`; stop if any is not 200. Submit each URL with the Sanity MCP `dataset_assets_upload_from_url` (`assetType: "image"`, a descriptive filename, and `creditLine: "Unsplash"`). Submit uploads individually; collect the operation IDs. Poll `assets_upload_status` in batches of up to 20 until every operation is `completed`. If an upload returns `asset_already_exists`, use `existingAssetId` instead of retrying. Build a `url → assetId` map.

Done when every one of the 28 URLs maps to an image asset ID and the dataset has 28 image assets.

### 5. Seed hosts and policies

Load the seed file. For each type, query existing documents by `seedKey` with both `published` and `drafts` perspectives:

```groq
*[_type == "host" && seedKey in $keys]{seedKey, _id}
```

```groq
*[_type == "policy" && seedKey in $keys]{seedKey, _id}
```

Skip keys that already have a published document. Publish any key that exists only as a draft. Create the remaining hosts in one `create_documents` call and the remaining policies in one call. Include the image asset reference and alt text on host photos. Publish the returned draft IDs with `publish_documents`. Re-query the published documents by `seedKey` to build a `seedKey → published _id` map.

Done when 8 hosts and 14 policies are published, every key appears once, and no drafts remain.

### 6. Seed stays

Query existing stays by `seedKey` with both perspectives, as above. Skip published keys; publish draft-only keys. Create the remaining stays in 3 batches of 10 with `create_documents`, staying under the 100 KB request limit. Each stay gets its `host` reference, 7 `policies` references, cover image, and 2 gallery images from the asset map. Include `_key` on every reference and gallery item. Publish each batch with `publish_documents`.

Done when 30 stays are published, each with a host, exactly 7 policies, 3 photos, and all required fields.

### 7. Verify and close out

Run the verification queries and filters below. Run the seed procedure again from step 5 and confirm counts do not change. Update `AGENTS.md` as described. Add a short `## Result` to this plan and set `Status: done`.

## Verification

Schema:

```bash
cd studio && npx tsc --noEmit
cd studio && npx sanity build
cd studio && npx sanity@latest schema list
```

- ✅ `schema list` shows `stay`, `host`, `policy`.
- ✅ MCP `list_workspace_schemas` shows a deployed schema; `get_schema` for `stay` matches the field table.
- ✅ `sanity build` completes.

Counts and integrity (run through the Sanity MCP `query_documents` with `perspective: "published"`; run the draft check with `perspective: "raw"`):

```groq
count(*[_type == "stay"])
```

```groq
count(*[_type == "host"])
```

```groq
count(*[_type == "policy"])
```

```groq
count(*[_type == "sanity.imageAsset"])
```

```groq
count(*[_id in path("drafts.**")])
```

```groq
count(*[_type == "stay" && !defined(host._ref)])
```

```groq
count(*[_type == "stay" && count(policies) != 7])
```

```groq
count(*[_type == "stay" && count(gallery) != 2])
```

```groq
count(*[_type == "stay" && !defined(coverPhoto.asset._ref)])
```

```groq
count(*[_type == "stay" && !defined(location.coordinates)])
```

```groq
count(*[_type == "stay" && !defined(seedKey)])
```

```groq
count(array::unique(*[_type == "stay"].seedKey))
```

```groq
count(array::unique(*[_type == "host"].seedKey))
```

```groq
count(array::unique(*[_type == "policy"].seedKey))
```

Expected: 30 stays, 8 hosts, 14 policies, 28 image assets, 0 drafts (the dataset starts clean; editor drafts are not touched by the seed), 0 missing hosts, 0 stays without 7 policies, 0 stays without 2 gallery images, 0 missing covers, 0 missing coordinates, 0 missing seed keys, and 30/8/14 unique seed keys.

Policy types per stay: fetch:

```groq
*[_type == "stay"]{
  "seedKey": seedKey,
  "policyTypes": policies[]->policyType
}
```

Assert in the verification script that every stay has 7 unique types and all 7 types are present. Also assert every `host->name` and every policy `->title` resolves.

Filter smoke tests:

```groq
count(*[_type == "stay" && category == "cabins" && pricePerNight < 300])
```

```groq
count(*[_type == "stay" && category == "cabins" && pricePerNight < 300 && petsAllowed == true])
```

```groq
count(*[_type == "stay" && category == "city" && maxGuests >= 2])
```

```groq
count(*[_type == "stay" && category == "villas" && "Pool" in amenities])
```

```groq
count(*[_type == "stay" && category == "beach" && quiet == true])
```

```groq
count(*[_type == "stay" && location.region == "CA"])
```

```groq
count(*[_type == "stay" && "Hot tub" in amenities])
```

Each must return at least 1 and match the seed table. Check one stay end to end:

```groq
*[_type == "stay" && seedKey == "modern-cabin-hot-tub"][0]{
  title,
  "host": host->{name, superhost, responseTime, joinedYear, languages},
  "policies": policies[]->{title, policyType, summary, body},
  "cover": coverPhoto{alt, "assetId": asset._ref},
  "gallery": gallery[]{alt, "assetId": asset._ref},
  location,
  amenities,
  pricePerNight,
  maxGuests,
  bedrooms,
  beds,
  bathrooms,
  rating,
  reviewCount
}
```

Expected: Maya Chen, 7 policies, 3 photos, Lake Arrowhead coordinates, and the fixed amenity values.

Idempotency:

- Re-run steps 5–6. Expected: no new documents; counts stay 30/8/14/28; every `seedKey` still appears once; no drafts.
- Re-run step 4. Expected: `asset_already_exists` for each URL or the same asset IDs; no duplicate assets.

App checks (the app is not changed, so these must still pass):

```bash
npx tsc --noEmit
npx expo lint
```

Studio visual check (manual): `cd studio && npx sanity dev`, open the Studio, and confirm Stay shows 30, Host 8, Policy 14; open one stay and confirm the host, policies, cover, gallery, and location fields render. Mark this as not checked in the report if it cannot be opened in a browser.

## AGENTS.md updates

Replace the current **Content** bullet in "Who owns what" with:

> **Content:** Sanity (stays, hosts, policies). Studio is a standalone app in `studio/`; schema files live in `studio/schemaTypes/` and deploy with `npx sanity@latest schema deploy` from `studio/`. The Sanity MCP refuses `deploy_schema` when a local Studio exists, so schema changes go through the local Studio, not the MCP. Content seeding and content changes go through the Sanity MCP; generated property copy uses Agent Actions. The model is `stay` → `host` + `policies`; `stay` holds the typed filter fields and all descriptive text for embeddings, while `host` and `policy` are shared documents. Reviews are aggregate (`rating`, `reviewCount`). Seeded documents carry a read-only `seedKey`; re-running the seed skips existing keys and never duplicates.

Add a new bullet immediately after the **Content** bullet in "Who owns what":

> **Stay photos:** Sanity image assets with required alt text: `coverPhoto` plus `gallery` (max 23). Seed 3 per stay.

Add under "Rules":

> Seed data lives in `studio/seed/seed-data.json`. Seeding is create-only: query by `seedKey` first, skip existing documents, and never overwrite editor changes. Use Sanity-generated `_id`s; `seedKey` is the stable identity, not a document ID.

This replaces the old "Schema deploys and content changes go through the Sanity MCP" statement. The rest of "Who owns what", including the Context and Jev bullets, stays unchanged.

## Result

Deployed the `stay`, `host`, `policy`, and `location` schema and seeded the `production` dataset with 30 published stays, 8 hosts, 14 policies, and 28 image assets. Every stay has a host, 7 policies covering all 7 types, a cover plus 2 gallery photos, and coordinates. No drafts remain. Re-uploading an image returns the same asset, and a re-run of the seed skips every existing `seedKey`, so counts stay 30/8/14/28. The seed source is `studio/seed/seed-data.json`; the app still reads `src/data/stays.ts`.
