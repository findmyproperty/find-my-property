"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MapPin, Search } from "lucide-react";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/hooks/use-categories";
import { getGoogleMapsLoaderOptions } from "@/lib/google-maps-loader";
import type { PropertySector } from "@/lib/property-posting";
import { cn } from "@/lib/utils";

const listingModes = [
  { key: "buy", label: "Buy" },
  { key: "rent", label: "Rent" },
  { key: "commercial", label: "Commercial" },
] as const;

type ListingMode = (typeof listingModes)[number]["key"];
type RentalPreference = "rent" | "pg" | "flatmates";
type CommercialIntent = "rent" | "buy";

export default function HeroSearchBanner({ imageUrl }: { imageUrl?: string | null }) {
  const router = useRouter();
  const { data: categories = [] } = useCategories();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY ?? "";
  const { isLoaded: isGoogleMapsLoaded } = useJsApiLoader(
    getGoogleMapsLoaderOptions(apiKey),
  );
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [listingMode, setListingMode] = useState<ListingMode>("buy");
  const [propertySector, setPropertySector] = useState<PropertySector>("residential");
  const [propertyType, setPropertyType] = useState("");
  const [bhk, setBhk] = useState("");
  const [rentalPreference, setRentalPreference] = useState<RentalPreference>("rent");
  const [commercialIntent, setCommercialIntent] = useState<CommercialIntent>("rent");
  const [locationQuery, setLocationQuery] = useState("");
  const propertyCategories = useMemo(
    () =>
      categories
        .filter((category) => !category.service && category.isActive)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  );

  const handleListingModeChange = (nextMode: ListingMode) => {
    setListingMode(nextMode);
    setPropertySector(nextMode === "commercial" ? "commercial" : "residential");
    setPropertyType("");
    setBhk("");
    if (nextMode === "rent") setRentalPreference("rent");
    if (nextMode === "commercial") setCommercialIntent("rent");
  };

  const handlePlaceChanged = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    if (!place) return;

    const placeName =
      place.name ||
      place.formatted_address ||
      place.address_components?.[0]?.long_name ||
      "";
    if (placeName) setLocationQuery(placeName);
  }, []);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();

    const params = new URLSearchParams();
    if (locationQuery.trim()) params.set("loc", locationQuery.trim());
    params.set(
      "type",
      listingMode === "commercial"
        ? commercialIntent
        : listingMode,
    );
    params.set("sector", listingMode === "commercial" ? "commercial" : propertySector);
    if (listingMode === "buy") params.set("posting", "resale");
    if (listingMode === "rent") params.set("posting", rentalPreference);
    if (listingMode === "commercial") {
      params.set("posting", commercialIntent === "rent" ? "rent" : "sale");
    }
    if (propertyType) params.set("propertyType", propertyType);
    if (listingMode === "buy" && propertySector === "residential" && bhk) {
      params.set("bhk", bhk);
    }
    if (listingMode === "rent" && rentalPreference === "rent" && bhk) {
      params.set("bhk", bhk);
    }

    const queryString = params.toString();
    router.push(`/browse${queryString ? `?${queryString}` : ""}`);
  };

  return (
    <section
      aria-label="Find your perfect property"
      className="relative isolate flex min-h-svh w-full items-center justify-center overflow-hidden bg-slate-950"
    >
      <Image
        src={
          imageUrl ||
          "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&crop=top&w=2070&h=1100&q=85"
        }
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-b from-slate-950/45 via-slate-950/25 to-slate-950/55"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center px-4 pb-16 pt-28 text-center sm:px-6 sm:pb-20 sm:pt-32 lg:px-8">
        <h1 className="max-w-4xl font-heading text-4xl font-semibold leading-[1.08] tracking-[-0.045em] text-white drop-shadow-sm sm:text-5xl md:text-6xl lg:text-[4.5rem]">
          Find Your Perfect Property
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/90 sm:text-base md:text-lg">
          Discover homes, apartments, and properties that fit your lifestyle.
        </p>

        <div className="mt-8 w-full max-w-5xl sm:mt-10">
          <form
            onSubmit={handleSearch}
            className="rounded-2xl border border-white/75 bg-white p-2.5 text-left shadow-[0_24px_80px_-32px_rgba(0,0,0,0.55)] sm:rounded-3xl sm:p-3"
          >
            <div
              role="group"
              aria-label="Listing intent"
              className="flex gap-1 overflow-x-auto border-b border-border px-1 pb-2 scrollbar-hide"
            >
              {listingModes.map((mode) => (
                <button
                  key={mode.key}
                  type="button"
                  aria-pressed={listingMode === mode.key}
                  onClick={() => handleListingModeChange(mode.key)}
                  className={cn(
                    "min-h-10 shrink-0 rounded-xl px-3.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:px-5 sm:text-sm",
                    listingMode === mode.key
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                  )}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 items-center gap-2 pt-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-3">
              <div className="relative flex min-w-0 items-center my-2">
                <MapPin
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 z-10 size-4.5 text-slate-500"
                />
                <label htmlFor="hero-location-search" className="sr-only">
                  Search by location
                </label>
                {apiKey && isGoogleMapsLoaded ? (
                  <Autocomplete
                    className="w-full"
                    onLoad={(autocomplete) => {
                      autocompleteRef.current = autocomplete;
                      autocomplete.setFields([
                        "formatted_address",
                        "geometry",
                        "name",
                        "address_components",
                      ]);
                      autocomplete.setComponentRestrictions({ country: "in" });
                    }}
                    onPlaceChanged={handlePlaceChanged}
                  >
                    <Input
                      id="hero-location-search"
                      value={locationQuery}
                      onChange={(event) => setLocationQuery(event.target.value)}
                      placeholder="City, locality, landmark, or property ID"
                      className="h-12 min-w-0 rounded-xl border border-slate-200 bg-transparent pl-11 text-sm text-slate-950 shadow-none placeholder:text-slate-500 focus-visible:border-primary focus-visible:ring-0 sm:h-14 sm:text-base"
                      autoComplete="off"
                    />
                  </Autocomplete>
                ) : (
                  <Input
                    id="hero-location-search"
                    value={locationQuery}
                    onChange={(event) => setLocationQuery(event.target.value)}
                    placeholder="City, locality, landmark, or property ID"
                    className="h-12 min-w-0 rounded-xl border border-slate-200 bg-transparent pl-11 text-sm text-slate-950 shadow-none placeholder:text-slate-500 focus-visible:border-primary focus-visible:ring-0 sm:h-14 sm:text-base"
                    autoComplete="off"
                  />
                )}
              </div>

              <Button
                type="submit"
                className="mt-2 h-12 w-full rounded-xl bg-primary px-7 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.99] sm:mt-0 sm:h-14 sm:w-auto sm:min-w-44"
              >
                <Search aria-hidden="true" className="mr-2 size-4" />
                Search properties
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 px-1 pt-2">
              {listingMode === "buy" && (
                <>
                  <div role="group" aria-label="Property sector" className="flex flex-wrap gap-1">
                    {(
                      [
                        { value: "residential", label: "Residential" },
                        { value: "plot", label: "Land/Plot" },
                      ] as const
                    ).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={propertySector === option.value}
                        onClick={() => {
                          setPropertySector(option.value);
                          setPropertyType("");
                          if (option.value === "plot") setBhk("");
                        }}
                        className={cn(
                          "min-h-9 rounded-lg px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                          propertySector === option.value
                            ? "bg-primary/10 text-primary"
                            : "text-slate-600 hover:bg-slate-100",
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {propertySector === "residential" && (
                    <Select value={bhk || "all"} onValueChange={(value) => setBhk(value === "all" ? "" : value)} >
                      <SelectTrigger aria-label="BHK type" className="h-9 w-32 rounded-lg border-slate-200 bg-white text-xs text-slate-950 data-placeholder:text-slate-500">
                        <SelectValue placeholder="BHK type" />
                      </SelectTrigger>
                      <SelectContent >
                        <SelectItem value="all">Any BHK</SelectItem>
                        {[1, 2, 3, 4].map((count) => (
                          <SelectItem key={count} value={String(count)}>
                            {count} BHK
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </>
              )}

              {listingMode === "rent" && (
                <>
                  <div role="group" aria-label="Rental preference" className="flex flex-wrap gap-1">
                    {(
                      [
                        { value: "rent", label: "Full House" },
                        { value: "pg", label: "PG/Hostel" },
                        { value: "flatmates", label: "Flatmates" },
                      ] as const
                    ).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={rentalPreference === option.value}
                        onClick={() => {
                          setRentalPreference(option.value);
                          if (option.value !== "rent") setBhk("");
                        }}
                        className={cn(
                          "min-h-9 rounded-lg px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                          rentalPreference === option.value
                            ? "bg-primary/10 text-primary"
                            : "text-slate-600 hover:bg-slate-100",
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {rentalPreference === "rent" && (
                    <Select value={bhk || "all"} onValueChange={(value) => setBhk(value === "all" ? "" : value)}>
                      <SelectTrigger aria-label="BHK type" className="h-9 w-32 rounded-lg border-slate-200 bg-white text-xs text-slate-950 data-[placeholder]:text-slate-500">
                        <SelectValue placeholder="BHK type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any BHK</SelectItem>
                        {[1, 2, 3, 4].map((count) => (
                          <SelectItem key={count} value={String(count)}>
                            {count} BHK
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </>
              )}

              {listingMode === "commercial" && (
                <div role="group" aria-label="Commercial transaction intent" className="flex gap-1">
                  {(
                    [
                      { value: "rent", label: "Rent" },
                      { value: "buy", label: "Buy" },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={commercialIntent === option.value}
                      onClick={() => setCommercialIntent(option.value)}
                      className={cn(
                        "min-h-9 rounded-lg px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                        commercialIntent === option.value
                          ? "bg-primary/10 text-primary"
                          : "text-slate-600 hover:bg-slate-100",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}

              {propertyCategories.length > 0 && (
                <Select
                  value={propertyType || "all"}
                  onValueChange={(value) => setPropertyType(value === "all" ? "" : value)}
                >
                  <SelectTrigger aria-label="Property type" className="h-9 w-40 rounded-lg border-slate-200 bg-white text-xs text-slate-950 data-[placeholder]:text-slate-500">
                    <SelectValue placeholder="Property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any property type</SelectItem>
                    {propertyCategories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
