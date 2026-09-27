"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Search,
  X,
} from "lucide-react";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useProperties } from "@/hooks/use-properties";
import { useSettings } from "@/contexts/settings-context";
import { getGoogleMapsLoaderOptions } from "@/lib/google-maps-loader";
import { buildPropertyPath } from "@/lib/property-slug";
import { cn } from "@/lib/utils";

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

const DUMMY_REAL_ESTATE_SLIDES: HeroSlide[] = [
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

const AUTOPLAY_DURATION = 6500; // 6.5s per slide

export default function ModonHeroCarousel() {
  const router = useRouter();
  const { data: properties } = useProperties();
  const { settings } = useSettings();

  const heroCount = settings?.heroBannerPropertyCount ?? 5;
  const pinnedIds = settings?.heroBannerPropertyIds ?? [];

  // Load Google Maps Places Autocomplete
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY ?? "";
  const { isLoaded: isGoogleMapsLoaded } = useJsApiLoader(getGoogleMapsLoaderOptions(apiKey));
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Dynamic slides from database if available, otherwise high-quality dummy real estate data
  const slides = useMemo<HeroSlide[]>(() => {
    if (properties && properties.length > 0) {
      // Pick verified / active properties with photos
      const validProperties = properties.filter((p) => Boolean(p.image || p.images?.length));
      if (validProperties.length > 0) {
        let selected: typeof validProperties = [];
        if (pinnedIds && pinnedIds.length > 0) {
          const idSet = new Set(pinnedIds.map((id) => Number(id)));
          const pinned = validProperties.filter((p) => idSet.has(Number(p.id)));
          const unpinned = validProperties.filter((p) => !idSet.has(Number(p.id)));
          selected = [...pinned, ...unpinned].slice(0, heroCount);
        } else {
          selected = validProperties.slice(0, heroCount);
        }

        if (selected.length > 0) {
          return selected.map((p, idx) => {
            const fallback = DUMMY_REAL_ESTATE_SLIDES[idx % DUMMY_REAL_ESTATE_SLIDES.length];
            const primaryImage = p.image || p.images?.[0] || fallback.image;
            const displayPrice = p.price ? `${p.currency || "₹"}${p.price}` : "";
            const subtitle = p.description
              ? p.description.slice(0, 110) + "..."
              : `${p.bedrooms ? `${p.bedrooms} BHK ` : ""}${p.propertyType || "Property"}${displayPrice ? ` • ${displayPrice}` : ""} • ${p.city || "Prime Location"}`;

            return {
              id: String(p.id),
              number: String(idx + 1).padStart(2, "0"),
              title: p.title,
              tagline: p.locality ? `Prime living in ${p.locality}, ${p.city}` : fallback.tagline,
              subtitle,
              kicker: `${p.type === "rent" ? "Verified Rental" : "Exclusive Development"} • ${p.city || "Featured"}`,
              location: p.locality || p.city || "India",
              image: primaryImage,
              fallbackImage: fallback.fallbackImage,
              href: buildPropertyPath(p.id, p.title),
            };
          });
        }
      }
    }
    return DUMMY_REAL_ESTATE_SLIDES.slice(0, Math.max(1, heroCount));
  }, [properties, heroCount, pinnedIds]);

  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(slides.length);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  // Search Modal / Center Dock state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [listingType, setListingType] = useState<"buy" | "rent" | "commercial" | "services">("buy");
  const [locationQuery, setLocationQuery] = useState("");

  // Embla setup & listeners
  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
      setCount(api.scrollSnapList().length);
      setProgress(0);
    };

    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  // Autoplay timer with progress calculation
  useEffect(() => {
    if (!api || isPaused || isSearchOpen) return;

    const intervalStep = 50;
    const increment = (intervalStep / AUTOPLAY_DURATION) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          api.scrollNext();
          return 0;
        }
        return prev + increment;
      });
    }, intervalStep);

    return () => clearInterval(timer);
  }, [api, isPaused, isSearchOpen]);

  // Close search on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen]);

  const handleSelectSlide = useCallback(
    (index: number) => {
      if (!api) return;
      api.scrollTo(index);
      setProgress(0);
    },
    [api],
  );

  // Google Places Autocomplete handler
  const handlePlaceChanged = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    if (!place) return;
    const placeName =
      place.name ||
      place.formatted_address ||
      place.address_components?.[0]?.long_name ||
      "";
    if (placeName) {
      setLocationQuery(placeName);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearchOpen(false);
    if (listingType === "services") {
      const el = document.getElementById("ybdc-ecosystem");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      } else {
        router.push("/#ybdc-ecosystem");
      }
      return;
    }

    const params = new URLSearchParams();
    if (locationQuery.trim()) {
      params.set("loc", locationQuery.trim());
    }
    if (listingType === "rent") {
      params.set("type", "Rent");
    } else if (listingType === "buy") {
      params.set("type", "Sale");
    } else if (listingType === "commercial") {
      params.set("category", "Commercial");
    }
    const queryString = params.toString();
    router.push(`/browse${queryString ? `?${queryString}` : ""}`);
  };

  return (
    <div
      className="relative h-[100dvh] w-full select-none overflow-hidden bg-black"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* SHADCN CAROUSEL ROOT */}
      <Carousel
        opts={{
          loop: true,
          duration: 35,
        }}
        setApi={setApi}
        className="h-full w-full"
      >
        <CarouselContent className="ml-0 h-[100dvh]">
          {slides.map((slide, index) => {
            const isActive = index === current;
            return (
              <CarouselItem
                key={slide.id}
                className="relative h-[100dvh] basis-full pl-0 overflow-hidden"
              >
                {/* Visual Backdrop with slow ambient zoom */}
                <div className="absolute inset-0 overflow-hidden">
                  <Image
                    src={slide.image}
                    alt={slide.title}
                    fill
                    priority={index === 0}
                    sizes="100vw"
                    className={cn(
                      "object-cover object-center brightness-[0.88] transition-transform duration-[7000ms] ease-out",
                      isActive ? "scale-105" : "scale-100",
                    )}
                  />
                  {/* Modon Multi-Layer Vignettes */}
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/60"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-black/30"
                  />
                </div>

                {/* MODON LEFT-ALIGNED EDITORIAL CONTENT */}
                <div className="container relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-28 text-left sm:px-6 sm:pb-32 lg:px-8 lg:pb-36">
                  <div className="max-w-3xl">
                    <AnimatePresence mode="wait">
                      {isActive && (
                        <motion.div
                          key={`content-${slide.id}`}
                          initial={{ opacity: 0, y: 24 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -16 }}
                          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                          className="flex flex-col items-start text-left"
                        >
                          {/* Eyebrow / Kicker */}
                          <div className="flex items-center gap-2.5 text-xs font-mono uppercase tracking-[0.25em] text-amber-300 sm:text-sm">
                            <span className="inline-block size-1.5 rounded-full bg-amber-400" />
                            <span>{slide.kicker}</span>
                          </div>

                          {/* Flagship Title */}
                          <h1 className="mt-3 font-heading text-4xl font-semibold tracking-[-0.03em] text-white sm:text-6xl lg:text-7xl drop-shadow-sm">
                            {slide.title}
                          </h1>

                          {/* Evocative Tagline */}
                          <p className="mt-2 text-xl font-light tracking-tight text-white/95 sm:text-2xl lg:text-3xl">
                            {slide.tagline}
                          </p>

                          {/* Description */}
                          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base font-normal">
                            {slide.subtitle}
                          </p>

                          {/* Action Link & Search Trigger */}
                          <div className="mt-6 flex flex-wrap items-center gap-5">
                            <Link
                              href={slide.href}
                              className="group inline-flex items-center gap-2 text-sm font-medium tracking-wide text-white transition-colors hover:text-amber-300"
                            >
                              <span className="border-b border-white/50 pb-0.5 transition-all group-hover:border-amber-300">
                                Learn more
                              </span>
                              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                            </Link>

                            <button
                              type="button"
                              onClick={() => setIsSearchOpen(true)}
                              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-medium text-white backdrop-blur-md transition-all hover:bg-white/20 hover:border-white/50 active:scale-95"
                            >
                              <Search className="size-3.5 text-amber-300" />
                              <span>Search Properties</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>

      {/* CENTERED MODAL / POPUP SEARCH DOCK (Triggered by Search button) */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSearchOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />

            {/* Centered Search Element */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative z-10 w-full max-w-3xl"
            >
              <div className="rounded-2xl border border-white/20 bg-background/95 p-4 shadow-2xl backdrop-blur-2xl dark:bg-card/95 sm:p-6">
                {/* Header & Filter Switcher */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {(
                      [
                        { key: "buy", label: "Buy Properties" },
                        { key: "rent", label: "Rent Homes" },
                        { key: "commercial", label: "Commercial" },
                        { key: "services", label: "Living Services" },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setListingType(tab.key)}
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-xs font-medium transition-all sm:px-4",
                          listingType === tab.key
                            ? "bg-foreground text-background shadow-xs"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(false)}
                    aria-label="Close search"
                    className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                {/* Search Input Form with Google Places Autocomplete */}
                <form
                  onSubmit={handleSearch}
                  className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center"
                >
                  <div className="relative flex-1">
                    <MapPin className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />

                    {apiKey && isGoogleMapsLoaded ? (
                      <Autocomplete
                        onLoad={(a) => {
                          autocompleteRef.current = a;
                          a.setFields(["formatted_address", "geometry", "name", "address_components"]);
                          a.setComponentRestrictions({ country: "in" });
                        }}
                        onPlaceChanged={handlePlaceChanged}
                      >
                        <Input
                          autoFocus
                          value={locationQuery}
                          onChange={(e) => setLocationQuery(e.target.value)}
                          placeholder={
                            listingType === "services"
                              ? "Search relocation, painting, cleaning, loans..."
                              : "Enter city, locality, landmark, or project name..."
                          }
                          className="h-12 rounded-xl border-border/70 pl-10 text-xs focus-visible:ring-1 focus-visible:ring-foreground sm:text-sm"
                          autoComplete="off"
                        />
                      </Autocomplete>
                    ) : (
                      <Input
                        autoFocus
                        value={locationQuery}
                        onChange={(e) => setLocationQuery(e.target.value)}
                        placeholder={
                          listingType === "services"
                            ? "Search relocation, painting, cleaning, loans..."
                            : "Enter city, locality, landmark, or project name..."
                        }
                        className="h-12 rounded-xl border-border/70 pl-10 text-xs focus-visible:ring-1 focus-visible:ring-foreground sm:text-sm"
                      />
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="h-12 shrink-0 rounded-xl px-6 text-xs font-medium transition-transform active:scale-95 sm:text-sm"
                  >
                    <Search className="mr-1.5 size-4" />
                    {listingType === "services" ? "Explore Ecosystem" : "Discover Properties"}
                  </Button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BOTTOM PROGRESS TRACK & CONTROLS */}
      <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 via-black/40 to-transparent pb-4 pt-8 sm:pb-6">
        <div className="container mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: Segmented Progress Lines & Slide Tabs */}
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-1.5 sm:gap-2">
              {slides.map((slide, idx) => {
                const isCurrent = idx === current;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => handleSelectSlide(idx)}
                    className="group relative flex h-8 items-center justify-center px-1 sm:px-1.5 transition-all focus:outline-none"
                    aria-label={`Go to slide ${idx + 1}: ${slide.title}`}
                  >
                    {/* Slide Track Bar */}
                    <div className="relative h-[2px] w-8 sm:w-12 overflow-hidden rounded-full bg-white/25 transition-all group-hover:bg-white/40">
                      {isCurrent && (
                        <motion.div
                          className="absolute inset-y-0 left-0 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                          style={{ width: `${progress}%` }}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Counter */}
            <div className="font-mono text-xs tracking-widest text-white/70">
              <span className="font-semibold text-white">0{current + 1}</span>
              <span className="mx-1 text-white/30">/</span>
              <span>0{count || slides.length}</span>
            </div>
          </div>

          {/* Right: Prev / Next Navigation Arrows */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => {
                api?.scrollPrev();
                setProgress(0);
              }}
              className="flex size-9 sm:size-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition-all hover:bg-white/20 hover:border-white/50 active:scale-95 focus:outline-none"
              aria-label="Previous slide"
            >
              <ChevronLeft className="size-4 sm:size-5" />
            </button>
            <button
              type="button"
              onClick={() => {
                api?.scrollNext();
                setProgress(0);
              }}
              className="flex size-9 sm:size-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition-all hover:bg-white/20 hover:border-white/50 active:scale-95 focus:outline-none"
              aria-label="Next slide"
            >
              <ChevronRight className="size-4 sm:size-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
