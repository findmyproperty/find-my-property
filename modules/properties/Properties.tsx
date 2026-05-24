"use client";

import PropertyCard from "@/modules/properties/PropertyCard";
import { buildPropertyPath } from "@/lib/property-slug";
import { FurnishingStatus } from "@/modules/properties/PropertyCard";
import { PropertyGridSkeleton } from "@/components/skeletons/property-grid-skeleton";
import { useProperties } from "@/hooks/use-properties";
import { useBrowseLocation } from "@/hooks/use-browse-location";
import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  useQueryStates,
  parseAsString,
  parseAsInteger,
  parseAsArrayOf,
  parseAsStringLiteral,
} from "nuqs";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, X, Map, LayoutGrid, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import PropertiesMap from "@/modules/properties/PropertiesMap";
import { useAuth } from "@/contexts/auth-context";
import { buildAreaFilterOptions, matchesAreaFilter } from "@/lib/property-location-options";
import { sortPropertiesByDistance, propertyDistanceKm } from "@/lib/property-distance";

const PAGE_SIZE = 12;

const bhkOptions = [1, 2, 3, 4] as const;
const furnishingOptions: { value: FurnishingStatus; label: string }[] = [
  { value: "furnished", label: "Furnished" },
  { value: "semi-furnished", label: "Semi-Furnished" },
  { value: "unfurnished", label: "Unfurnished" },
];

/** Budget presets (min, max) for pill selection. Label shown in UI. */
const budgetRanges: { label: string; min: number; max: number }[] = [
  { label: "Under ₹25K", min: 0, max: 25000 },
  { label: "₹25K - ₹50K", min: 25000, max: 50000 },
  { label: "₹50K - ₹1 Lac", min: 50000, max: 100000 },
  { label: "₹1 Lac+", min: 100000, max: 999999999 },
];

const furnishingParser = parseAsStringLiteral([
  "furnished",
  "semi-furnished",
  "unfurnished",
] as const);

const propertyFilterParsers = {
  type: parseAsStringLiteral(["all", "rent", "buy"] as const).withDefault("all"),
  q: parseAsString.withDefault(""),
  loc: parseAsString.withDefault("All Localities"),
  bhk: parseAsArrayOf(parseAsInteger).withDefault([]),
  furn: parseAsArrayOf(furnishingParser).withDefault([]),
  min: parseAsInteger,
  max: parseAsInteger,
  budget: parseAsString,
  view: parseAsStringLiteral(["list", "map"] as const).withDefault("list"),
  page: parseAsInteger.withDefault(1),
};

const Properties = () => {
  const { data, isLoading } = useProperties();
  const { isAuthenticated } = useAuth();
  const { location: browseLocation, isResolving: isLocationResolving } = useBrowseLocation();
  const allProperties = data ?? [];
  const router = useRouter();
  const [
    {
      type: filter,
      q: search,
      loc: locality,
      bhk: selectedBHK,
      furn: selectedFurnishing,
      min: priceMin,
      max: priceMax,
      budget: selectedBudgetPreset,
      view: viewMode,
      page: currentPage,
    },
    setQuery,
  ] = useQueryStates(propertyFilterParsers, { history: "replace", shallow: true });
  const searchLocation = search;
  const [filtersOpen, setFiltersOpen] = useState(false);
  /** Narrows the area chip list without touching URL search */
  const [areaChipQuery, setAreaChipQuery] = useState("");

  const areaOptions = useMemo(() => buildAreaFilterOptions(allProperties), [allProperties]);

  const visibleAreaChips = useMemo(() => {
    const q = areaChipQuery.trim().toLowerCase();
    let list = q
      ? areaOptions.filter((o) => o.name.toLowerCase().includes(q))
      : areaOptions;
    if (locality !== "All Localities" && locality && !list.some((o) => o.name === locality)) {
      const sel = areaOptions.find((o) => o.name === locality);
      list = [sel ?? { name: locality, count: 0 }, ...list];
    }
    return list;
  }, [areaOptions, areaChipQuery, locality]);

  const maxPrice = useMemo(() => {
    if (allProperties.length === 0) return 1_000_000;
    return Math.max(...allProperties.map((p) => p.priceValue));
  }, [allProperties]);

  const priceRange = useMemo<[number, number]>(
    () => [priceMin ?? 0, priceMax ?? maxPrice],
    [priceMin, priceMax, maxPrice],
  );

  const activeFilterCount = [
    selectedBHK.length > 0,
    locality !== "All Localities",
    selectedFurnishing.length > 0,
    priceRange[0] > 0 || priceRange[1] < maxPrice,
    !!search,
    !!searchLocation,
  ].filter(Boolean).length;

  const isFiltered = activeFilterCount > 0;

  const clearFilters = () => {
    void setQuery({
      type: "all",
      q: "",
      loc: "All Localities",
      bhk: [],
      furn: [],
      min: null,
      max: null,
      budget: null,
      page: 1,
    });
  };

  const selectBudgetPreset = (preset: (typeof budgetRanges)[number]) => {
    void setQuery({
      min: preset.min,
      max: preset.max,
      budget: preset.label,
    });
  };
  const isBudgetPresetActive = (preset: (typeof budgetRanges)[number]) =>
    selectedBudgetPreset === preset.label ||
    (priceRange[0] === preset.min && priceRange[1] === preset.max);

  const toggleBHK = (bhk: number) => {
    void setQuery((prev) => ({
      bhk: prev.bhk.includes(bhk) ? prev.bhk.filter((b) => b !== bhk) : [...prev.bhk, bhk],
    }));
  };

  const toggleFurnishing = (status: FurnishingStatus) => {
    void setQuery((prev) => ({
      furn: prev.furn.includes(status)
        ? prev.furn.filter((s) => s !== status)
        : [...prev.furn, status],
    }));
  };

  const filtered = useMemo(
    () =>
      allProperties.filter((p) => {
        const matchType = filter === "all" || p.type === filter;
        const matchSearch =
          !search ||
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.location.toLowerCase().includes(search.toLowerCase());
        const matchSearchLocation =
          !searchLocation || p.location.toLowerCase().includes(searchLocation.toLowerCase());
        const matchBHK = selectedBHK.length === 0 || selectedBHK.includes(p.bedrooms);
        const matchLocality = matchesAreaFilter(p, locality);
        const matchFurnishing =
          selectedFurnishing.length === 0 || selectedFurnishing.includes(p.furnishing);
        const matchPrice = p.priceValue >= priceRange[0] && p.priceValue <= priceRange[1];
        return (
          matchType &&
          matchSearch &&
          matchSearchLocation &&
          matchBHK &&
          matchLocality &&
          matchFurnishing &&
          matchPrice
        );
      }),
    [
      allProperties,
      filter,
      search,
      searchLocation,
      selectedBHK,
      locality,
      selectedFurnishing,
      priceRange,
    ],
  );

  const sortedFiltered = useMemo(() => {
    if (!browseLocation) return filtered;
    return sortPropertiesByDistance(filtered, browseLocation);
  }, [filtered, browseLocation]);

  const totalPages = Math.max(1, Math.ceil(sortedFiltered.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedList = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return sortedFiltered.slice(start, start + PAGE_SIZE);
  }, [sortedFiltered, safePage]);

  useEffect(() => {
    if (currentPage !== safePage) {
      void setQuery({ page: safePage });
    }
  }, [currentPage, safePage, setQuery]);

  const filterSignature = useMemo(
    () =>
      JSON.stringify({
        filter,
        search,
        locality,
        bhk: selectedBHK,
        furn: selectedFurnishing,
        min: priceMin,
        max: priceMax,
      }),
    [filter, search, locality, selectedBHK, selectedFurnishing, priceMin, priceMax],
  );

  const prevFilterSignature = useRef(filterSignature);

  useEffect(() => {
    if (prevFilterSignature.current === filterSignature) return;
    prevFilterSignature.current = filterSignature;
    if (currentPage !== 1) {
      void setQuery({ page: 1 });
    }
  }, [filterSignature, currentPage, setQuery]);

  const renderFilterFields = () => (
    <>
      <div className="rounded-xl bg-card border border-border p-4">
        <Label className="text-sm font-medium text-foreground mb-2 block">Search</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Name or location..."
            value={search}
            onChange={(e) => {
              void setQuery({ q: e.target.value });
            }}
            className="pl-9 h-9 text-sm bg-muted/50 border-border rounded-lg"
          />
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border p-4">
        <div className="mb-3 flex flex-col gap-1">
          <Label className="text-sm font-medium text-foreground">Area &amp; city</Label>
          <p className="text-xs text-muted-foreground">
            Pulled from your listings · sorted by how often each area appears
          </p>
        </div>
        <div className="mb-3">
          <Input
            placeholder="Filter this list…"
            value={areaChipQuery}
            onChange={(e) => setAreaChipQuery(e.target.value)}
            className="h-9 text-sm bg-muted/40"
            aria-label="Filter area chips"
          />
        </div>
        <div className="flex max-h-44 flex-wrap gap-2 overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => void setQuery({ loc: "All Localities" })}
            className={`shrink-0 rounded-full px-3 py-2 text-left text-sm font-medium transition-all ${
              locality === "All Localities"
                ? "bg-foreground text-background"
                : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            All areas
          </button>
          {visibleAreaChips.map((opt) => (
            <button
              key={opt.name}
              type="button"
              onClick={() => void setQuery({ loc: opt.name })}
              className={`inline-flex max-w-[min(100%,14rem)] shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-left text-sm font-medium transition-all ${
                locality === opt.name
                  ? "bg-foreground text-background"
                  : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              title={opt.count > 0 ? `${opt.count} listing${opt.count === 1 ? "" : "s"}` : undefined}
            >
              <span className="min-w-0 truncate">{opt.name}</span>
              {opt.count > 0 ? (
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
                    locality === opt.name ? "bg-background/20 text-background" : "bg-background/60 text-foreground"
                  }`}
                >
                  {opt.count}
                </span>
              ) : null}
            </button>
          ))}
        </div>
        {allProperties.length > 0 && areaOptions.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            No locality or city saved on listings yet — use search above to filter by address text.
          </p>
        ) : null}
      </div>

      <div className="rounded-xl bg-card border border-border p-4">
        <Label className="text-sm font-medium text-foreground mb-3 block">Listing Type</Label>
        <div className="flex flex-wrap gap-2">
          {(["rent", "buy"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => void setQuery({ type: filter === type ? "all" : type })}
              className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                filter === type
                  ? "bg-foreground text-background"
                  : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {type === "rent" ? "Rent" : "Sales"}
            </button>
          ))}
          <button
            type="button"
            onClick={() => void setQuery({ type: "all" })}
            className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
              filter === "all"
                ? "bg-foreground text-background"
                : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            All
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border p-4">
        <Label className="text-sm font-medium text-foreground mb-3 block">Bedroom</Label>
        <div className="flex flex-wrap gap-2">
          {bhkOptions.map((bhk) => (
            <button
              key={bhk}
              type="button"
              onClick={() => toggleBHK(bhk)}
              className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                selectedBHK.includes(bhk)
                  ? "bg-foreground text-background"
                  : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {bhk}
            </button>
          ))}
          <button
            type="button"
            onClick={() => toggleBHK(4)}
            className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
              selectedBHK.includes(4)
                ? "bg-foreground text-background"
                : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            4+
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border p-4">
        <Label className="text-sm font-medium text-foreground mb-3 block">Budget</Label>
        <div className="flex flex-wrap gap-2">
          {budgetRanges.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                if (isBudgetPresetActive(preset)) {
                  void setQuery({ min: null, max: null, budget: null });
                } else {
                  selectBudgetPreset(preset);
                }
              }}
              className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                isBudgetPresetActive(preset)
                  ? "bg-foreground text-background"
                  : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border p-4">
        <Label className="text-sm font-medium text-foreground mb-3 block">Furnishing</Label>
        <div className="flex flex-wrap gap-2">
          {furnishingOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleFurnishing(opt.value)}
              className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                selectedFurnishing.includes(opt.value)
                  ? "bg-foreground text-background"
                  : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );

  const viewModeGroup = (
    <div
      className="flex shrink-0 flex-nowrap rounded-lg border border-border bg-muted/50 p-0.5"
      role="group"
      aria-label="View mode"
    >
      <Button
        type="button"
        variant={viewMode === "list" ? "secondary" : "ghost"}
        size="sm"
        className="shrink-0 rounded-md"
        onClick={() => void setQuery({ view: "list" })}
        aria-pressed={viewMode === "list"}
      >
        <LayoutGrid className="mr-1.5 h-4 w-4" />
        List
      </Button>
      <Button
        type="button"
        variant={viewMode === "map" ? "secondary" : "ghost"}
        size="sm"
        className="shrink-0 rounded-md"
        onClick={() => void setQuery({ view: "map" })}
        aria-pressed={viewMode === "map"}
      >
        <Map className="mr-1.5 h-4 w-4" />
        Map
      </Button>
    </div>
  );

  const filterCardHeader = (
    <section className="flex items-center justify-between border-b border-border bg-background/80 px-5 py-4">
      <div>
        <h2 className="font-heading text-lg font-semibold text-foreground">Filters</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {isFiltered ? "Filtered view — results match your choices" : "Showing all listings"}
        </p>
      </div>
      {activeFilterCount > 0 && (
        <Badge variant="secondary" className="text-xs">
          {activeFilterCount} active
        </Badge>
      )}
    </section>
  );

  const filterCardFooter = (
    <section className="border-t border-border bg-background/80 px-4 pb-4 pt-3">
      <Button
        variant={isFiltered ? "default" : "outline"}
        className="w-full rounded-xl sm:w-auto"
        onClick={clearFilters}
        disabled={!isFiltered}
      >
        <X className="mr-2 h-4 w-4" />
        {isFiltered ? "Clear all filters" : "No filters applied"}
      </Button>
    </section>
  );

  const activeFilterBadges =
    activeFilterCount > 0 ? (
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {selectedBHK.length > 0 && (
          <Badge variant="secondary" className="gap-1">
            {selectedBHK.join(", ")} BHK
            <X className="h-3 w-3 cursor-pointer" onClick={() => void setQuery({ bhk: [] })} />
          </Badge>
        )}
        {locality !== "All Localities" && (
          <Badge variant="secondary" className="gap-1">
            {locality}
            <X className="h-3 w-3 cursor-pointer" onClick={() => void setQuery({ loc: "All Localities" })} />
          </Badge>
        )}
        {selectedFurnishing.length > 0 && (
          <Badge variant="secondary" className="gap-1">
            {selectedFurnishing.join(", ")}
            <X className="h-3 w-3 cursor-pointer" onClick={() => void setQuery({ furn: [] })} />
          </Badge>
        )}
      </div>
    ) : null;

  const locationBanner =
    browseLocation && !isLocationResolving ? (
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground">
        <MapPin className="h-4 w-4 shrink-0 text-primary" />
        <span>
          Sorted by distance from{" "}
          <span className="font-medium">
            {browseLocation.label ??
              (browseLocation.source === "gps" ? "your current location" : "your saved profile location")}
          </span>
        </span>
      </div>
    ) : isLocationResolving ? (
      <div className="mb-4 rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        Finding your location…
      </div>
    ) : null;

  const paginationControls =
    sortedFiltered.length > PAGE_SIZE && viewMode === "list" ? (
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Page {safePage} of {totalPages} · showing {(safePage - 1) * PAGE_SIZE + 1}–
          {Math.min(safePage * PAGE_SIZE, sortedFiltered.length)} of {sortedFiltered.length}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={safePage <= 1}
            onClick={() => void setQuery({ page: safePage - 1 })}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={safePage >= totalPages}
            onClick={() => void setQuery({ page: safePage + 1 })}
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    ) : null;

  const resultsBlock = (
    <>
      {locationBanner}
      {isLoading ? (
        <PropertyGridSkeleton count={6} columns="list" />
      ) : sortedFiltered.length > 0 ? (
        <>
          {viewMode === "list" && (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {paginatedList.map((property, i) => (
                  <div
                    key={property.id}
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(buildPropertyPath(property.id, property.title));
                    }}
                  >
                      <PropertyCard
                        property={property}
                        index={i}
                        distanceKm={
                          browseLocation ? propertyDistanceKm(property, browseLocation) : null
                        }
                      />
                  </div>
                ))}
              </div>
              {paginationControls}
            </>
          )}
          {viewMode === "map" && (
            <PropertiesMap
              properties={sortedFiltered}
              height={520}
              userCenter={browseLocation}
              onPropertyClick={(p) => router.push(buildPropertyPath(p.id, p.title))}
            />
          )}
        </>
      ) : (
        <div className="py-20 text-center">
          <SlidersHorizontal className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="font-heading mb-2 text-xl font-semibold text-foreground">No properties found</h3>
          <p className="mb-4 text-muted-foreground">Try adjusting your search or filters</p>
          <Button variant="outline" onClick={clearFilters}>
            Clear all filters
          </Button>
        </div>
      )}
    </>
  );

  return (
    <div className={isAuthenticated ? "pb-12" : "pb-20 pt-24"}>
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <div className="container mx-auto">
          {/* Mobile & tablet: filters button + list/map */}
            <div className="mb-4 flex flex-col gap-3 lg:hidden">
            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                variant={isFiltered ? "default" : "outline"}
                size="sm"
                className="shrink-0 gap-2"
                onClick={() => setFiltersOpen(true)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>{isFiltered ? "Edit filters" : "Filters"}</span>
                {activeFilterCount > 0 ? (
                  <Badge variant="secondary" className="border border-background/20 text-xs">
                    {activeFilterCount}
                  </Badge>
                ) : null}
              </Button>
              {viewModeGroup}
            </div>
            <p className="min-w-0 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{sortedFiltered.length}</span> of{" "}
              <span className="text-foreground">{allProperties.length}</span> properties
              {isFiltered ? (
                <span className="ml-1.5 rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                  filtered
                </span>
              ) : (
                <span className="ml-1.5 text-xs">(all)</span>
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <aside className="hidden min-w-0 lg:block">
              <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-muted/30">
                {filterCardHeader}
                <section className="grid grid-cols-1 gap-4 p-4">{renderFilterFields()}</section>
                {filterCardFooter}
              </div>
            </aside>

            <div className="min-w-0 lg:col-span-2">
              {isFiltered && (
                <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground">
                  <span className="font-medium">Filtered results</span>
                  <span className="text-muted-foreground">
                    {sortedFiltered.length} of {allProperties.length} properties match
                  </span>
                </div>
              )}
              <div className="mb-4 hidden flex-row items-center justify-between gap-3 lg:flex">
                <p className="min-w-0 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{sortedFiltered.length}</span> of{" "}
                  <span className="text-foreground">{allProperties.length}</span> shown
                  {!isFiltered ? <span className="ml-1 text-xs">(no filters)</span> : null}
                </p>
                {viewModeGroup}
              </div>
              {activeFilterBadges}
              {resultsBlock}
            </div>
          </div>
        </div>

        <SheetContent
          side="left"
          className="flex w-full max-w-md flex-col gap-0 overflow-hidden p-0 sm:max-w-lg lg:hidden"
        >
          <SheetHeader className="border-b border-border px-4 py-4 text-left">
            <SheetTitle className="font-heading">Filters</SheetTitle>
            {activeFilterCount > 0 ? (
              <Badge variant="secondary" className="mt-2 w-fit text-xs">
                {activeFilterCount} active
              </Badge>
            ) : null}
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <div className="grid grid-cols-1 gap-4">{renderFilterFields()}</div>
          </div>
          <div className="flex shrink-0 flex-col gap-2 border-t border-border bg-background/95 px-4 py-4">
            <Button
              variant={isFiltered ? "default" : "outline"}
              className="w-full rounded-xl"
              onClick={() => {
                clearFilters();
                setFiltersOpen(false);
              }}
              disabled={!isFiltered}
            >
              <X className="mr-2 h-4 w-4" /> {isFiltered ? "Clear all filters" : "No filters to clear"}
            </Button>
            <Button className="w-full" onClick={() => setFiltersOpen(false)}>
              {isFiltered ? `Show ${sortedFiltered.length} filtered results` : "Show all results"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Properties;
