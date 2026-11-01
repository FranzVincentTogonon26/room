/**
 * The fields a stay card needs. Shared by the live stays fetch and the
 * server-side search query so both map through the same `mapStay`.
 */
export const STAY_PROJECTION = `{
  _id,
  title,
  "slug": slug.current,
  location,
  category,
  pricePerNight,
  rating,
  reviewCount,
  maxGuests,
  bedrooms,
  beds,
  bathrooms,
  amenities,
  petsAllowed,
  quiet,
  vibe,
  summary,
  description,
  setting,
  nearby,
  neighborhoodDescription,
  "image": coverPhoto.asset->url,
  "gallery": gallery[].asset->url,
  "host": host->{
    _id,
    name,
    bio,
    superhost,
    responseTime,
    joinedYear,
    languages,
    "photo": photo.asset->url,
    "photoAlt": photo.alt
  },
  featured,
  "policies": policies[]->{
    _id,
    title,
    policyType,
    summary,
    body
  }
}`;
