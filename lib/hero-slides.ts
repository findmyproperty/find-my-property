import { buildPropertyPath } from "@/lib/property-slug";
import type { Property } from "@/lib/property-view-model";
import type { Settings } from "@/schema/setting";

export type HeroSlide = {
  id: string;
  number: string;
  title: string;
  tagline: string;
  subtitle: string;
  kicker: string;
  location: string;
  image: string;
  fallbackImage: string;
  href: string;
};

const FALLBACK_SLIDES: HeroSlide[] = [
  {
    id: "hudayriyat",
    number: "01",
    title: "Hudayriyat Golf Estates",
    tagline: "Where life finds its swing",
    subtitle: "Championship fairway villas with panoramic coastal green and skyline views.",
    kicker: "Signature Golf & Waterfront Living",
    location: "South Bay Horizon",
    image: "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=2070&auto=format&fit=crop",
    fallbackImage: "/images/hero-bg.jpg",
    href: "/browse?type=Sale",
  },
  {
    id: "tara-park",
    number: "02",
    title: "Tara Park Residences",
    tagline: "Where you belong",
    subtitle: "Contemporary architectural sky homes with panoramic central park vistas.",
    kicker: "Metropolitan Skyline Collection",
    location: "Central Boulevard",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2070&auto=format&fit=crop",
    fallbackImage: "/images/hero-bg.jpg",
    href: "/browse?type=Sale",
  },
  {
    id: "wadeem-gardens",
    number: "03",
    title: "Wadeem Gardens",
    tagline: "Where everything aligns",
    subtitle: "Private sanctuaries blending biophilic architecture with bespoke concierge.",
    kicker: "Ultra-Luxury Villas & Estates",
    location: "Emerald Hills",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop",
    fallbackImage: "/images/hero-bg.jpg",
    href: "/browse?category=Residential",
  },
  {
    id: "bashayer",
    number: "04",
    title: "Bashayer Coastal Bay",
    tagline: "Where water welcomes you",
    subtitle: "Timeless maritime residences crafted for elevated shoreline living.",
    kicker: "Waterfront Marina Promenade",
    location: "Coastal Harbour",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop",
    fallbackImage: "/images/hero-bg.jpg",
    href: "/browse?type=Sale",
  },
];

function toHeroSlide(property: Property, index: number): HeroSlide {
  const fallback = FALLBACK_SLIDES[index % FALLBACK_SLIDES.length];
  const primaryImage = property.image || property.images?.[0] || fallback.image;
  const displayPrice = property.price
    ? `${property.currency || "₹"}${property.price}`
    : "";
  const subtitle = property.description
    ? `${property.description.slice(0, 110)}...`
    : `${property.bedrooms ? `${property.bedrooms} BHK ` : ""}${property.propertyType || "Property"}${displayPrice ? ` • ${displayPrice}` : ""} • ${property.city || "Prime Location"}`;

  return {
    id: String(property.id),
    number: String(index + 1).padStart(2, "0"),
    title: property.title,
    tagline: property.locality
      ? `Prime living in ${property.locality}, ${property.city}`
      : fallback.tagline,
    subtitle,
    kicker: `${property.type === "rent" ? "Verified Rental" : "Exclusive Development"} • ${property.city || "Featured"}`,
    location: property.locality || property.city || "India",
    image: primaryImage,
    fallbackImage: fallback.fallbackImage,
    href: buildPropertyPath(property.id, property.title),
  };
}

/** Build homepage hero slides from the public catalog and admin banner settings. */
export function buildHeroSlides(
  properties: Property[],
  settings?: Pick<Settings, "heroBannerPropertyCount" | "heroBannerPropertyIds"> | null,
): HeroSlide[] {
  const heroCount = settings?.heroBannerPropertyCount ?? 5;
  const pinnedIds = settings?.heroBannerPropertyIds ?? [];
  const validProperties = properties.filter((property) =>
    Boolean(property.image || property.images?.length),
  );

  if (validProperties.length === 0) {
    return FALLBACK_SLIDES.slice(0, Math.max(1, heroCount));
  }

  const byId = new Map(
    validProperties.map((property) => [Number(property.id), property]),
  );
  const pinned = pinnedIds.flatMap((id) => {
    const property = byId.get(Number(id));
    return property ? [property] : [];
  });
  const pinnedSet = new Set(pinned.map((property) => Number(property.id)));
  const unpinned = validProperties.filter(
    (property) => !pinnedSet.has(Number(property.id)),
  );
  const selected = [...pinned, ...unpinned].slice(0, heroCount);

  if (selected.length === 0) {
    return FALLBACK_SLIDES.slice(0, Math.max(1, heroCount));
  }

  return selected.map((property, index) => toHeroSlide(property, index));
}
