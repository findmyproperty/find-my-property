"use client";

import PropertyCard from "@/modules/properties/PropertyCard";
import { buildPropertyPath } from "@/lib/property-slug";
import { FurnishingStatus } from "@/modules/properties/PropertyCard";
import { PropertyGridSkeleton } from "@/components/skeletons/property-grid-skeleton";
import { useProperties } from "@/hooks/use-properties";
import { useBrowseLocation } from "@/hooks/use-browse-location";
import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import {
  useQueryStates,
  parseAsString,
  parseAsInteger,
  parseAsArrayOf,
  parseAsStringLiteral,
} from "nuqs";
import { Input } from "@/components/ui/input";
import {
  Search,
  SlidersHorizontal,
  X,
  Map,
  LayoutGrid,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import PropertiesMap from "@/modules/properties/PropertiesMap";
import { useAuth } from "@/contexts/auth-context";
import { buildAreaFilterOptions, matchesAreaFilter } from "@/lib/property-location-options";
import { getGoogleMapsLoaderOptions } from "@/lib/google-maps-loader";
import { sortPropertiesByDistance, propertyDistanceKm } from "@/lib/property-distance";
import {
  isAllowedPair,
  listingTypeForPosting,
  POSTING_LABELS,
  POSTING_TYPES,
  PROPERTY_SECTORS,
  SECTOR_LABELS,
} from "@/lib/property-posting";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZE = 12;

const bhkOptions = [1, 2, 3, 4] as const;
const furnishingOptions: { value: FurnishingStatus; label: string }[] = [
  { value: "furnished", label: "Furnished" },
  { value: "semi-furnished", label: "Semi-Furnished" },
  { value: "unfurnished", label: "Unfurnished" },
];

type TransactionType = "all" | "rent" | "buy";
type PropertySector = (typeof PROPERTY_SECTORS)[number];
type PostingType = (typeof POSTING_TYPES)[number];

type BudgetPreset = { label: string; min: number; max: number | null };

const rentBudgetRanges: BudgetPreset[] = [
  { label: "Under ₹25K / month", min: 0, max: 24999 },
  { label: "₹25K–₹50K / month", min: 25000, max: 49999 },
  { label: "₹50K–₹1L / month", min: 50000, max: 99999 },
  { label: "₹1L+ / month", min: 100000, max: null },
];

const buyBudgetRanges: BudgetPreset[] = [
  { label: "Under ₹25L", min: 0, max: 2499999 },
  { label: "₹25L–₹50L", min: 2500000, max: 4999999 },
  { label: "₹50L–₹1Cr", min: 5000000, max: 9999999 },
  { label: "₹1Cr+", min: 10000000, max: null },
];

type BrowseFilters = {
  type: TransactionType;
  q: string;
  loc: string;
  propertyType: string;
  bhk: number[];
  furn: FurnishingStatus[];
  min: number | null;
  max: number | null;
  budget: string | null;
  sector: PropertySector | null;
  posting: PostingType | null;
};

const EMPTY_FILTERS: BrowseFilters = {
  type: "all",
  q: "",
  loc: "All Localities",
  propertyType: "",
  bhk: [],
  furn: [],
  min: null,
  max: null,
  budget: null,
  sector: null,
  posting: null,
};

const furnishingParser = parseAsStringLiteral([
  "furnished",
  "semi-furnished",
  "unfurnished",
] as const);

const propertyFilterParsers = {
  type: parseAsStringLiteral(["all", "rent", "buy"] as const).withDefault("all"),
  q: parseAsString.withDefault(""),
  loc: parseAsString.withDefault("All Localities"),
  propertyType: parseAsString.withDefault(""),
  bhk: parseAsArrayOf(parseAsInteger).withDefault([]),
  furn: parseAsArrayOf(furnishingParser).withDefault([]),
  min: parseAsInteger,
  max: parseAsInteger,
  budget: parseAsString,
  view: parseAsStringLiteral(["list", "map"] as const).withDefault("list"),
  page: parseAsInteger.withDefault(1),
  sector: parseAsStringLiteral(PROPERTY_SECTORS),
  posting: parseAsStringLiteral(POSTING_TYPES),
};

const Properties = () => {
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY ?? "";
  const { isLoaded: isGoogleMapsLoaded } = useJsApiLoader(
    getGoogleMapsLoaderOptions(mapsApiKey),
  );
  const areaAutocompleteRefs = useRef<
    Record<"desktop" | "mobile", google.maps.places.Autocomplete | null>
  >({ desktop: null, mobile: null });
  const { data, isLoading } = useProperties();
  const { isAuthenticated } = useAuth();
  const { location: browseLocation } = useBrowseLocation();
  const allProperties = useMemo(() => data ?? [], [data]);
  const router = useRouter();
  const [
    {
      type: filter,
      q: search,
      loc: locality,
      propertyType,
      bhk: selectedBHK,
      furn: selectedFurnishing,
      min: priceMin,
      max: priceMax,
      budget: selectedBudgetPreset,
      view: viewMode,
      page: currentPage,
      sector,
      posting,
    },
    setQuery,
  ] = useQueryStates(propertyFilterParsers, { history: "replace", shallow: true });
  const queryFilters = useMemo<BrowseFilters>(
    () => ({
      type: filter,
      q: search,
      loc: locality,
      propertyType,
      bhk: selectedBHK,
      furn: selectedFurnishing,
      min: priceMin,
      max: priceMax,
      budget: selectedBudgetPreset,
      sector,
      posting,
    }),
    [
      filter,
      search,
      locality,
      propertyType,
      selectedBHK,
      selectedFurnishing,
      priceMin,
      priceMax,
      selectedBudgetPreset,
      sector,
      posting,
    ],
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<BrowseFilters>(queryFilters);
  const [draftDirty, setDraftDirty] = useState(false);
  const [secondaryFiltersOpen, setSecondaryFiltersOpen] = useState(
    Boolean(propertyType || selectedBHK.length || selectedFurnishing.length),
  );
  const activeFilters = filtersOpen ? draftFilters : queryFilters;
  const areaOptions = useMemo(() => buildAreaFilterOptions(allProperties), [allProperties]);
  const visibleAreaChips = useMemo(() => {
    const query = activeFilters.loc === "All Localities" ? "" : activeFilters.loc.trim().toLowerCase();
    const options = query
      ? areaOptions.filter((option) => option.name.toLowerCase().includes(query))
      : areaOptions;
    if (
      query &&
      !options.some((option) => option.name.toLowerCase() === query)
    ) {
      options.unshift({
        name: activeFilters.loc,
        count: allProperties.filter((property) => matchesAreaFilter(property, activeFilters.loc)).length,
      });
    }
    return options;
  }, [activeFilters.loc, allProperties, areaOptions]);

  const compatiblePostingTypes = useMemo(
    () =>
      POSTING_TYPES.filter(
        (item) =>
          (!activeFilters.sector || isAllowedPair(activeFilters.sector, item)) &&
          (activeFilters.type === "all" ||
            listingTypeForPosting(item) ===
              (activeFilters.type === "rent" ? "Rent" : "Sale")),
      ),
    [activeFilters.sector, activeFilters.type],
  );

  const propertyTypeOptions = useMemo(() => {
    const availableTypes = new Set(
      allProperties
        .filter(
          (property) =>
            (!activeFilters.sector || property.propertySector === activeFilters.sector) &&
            (activeFilters.type === "all" || property.type === activeFilters.type) &&
            (!activeFilters.posting || property.postingType === activeFilters.posting),
        )
        .map((property) => property.propertyType)
        .filter(Boolean),
    );
    if (activeFilters.propertyType) availableTypes.add(activeFilters.propertyType);
    return [...availableTypes].sort((a, b) => a.localeCompare(b));
  }, [
    allProperties,
    activeFilters.sector,
    activeFilters.type,
    activeFilters.posting,
    activeFilters.propertyType,
  ]);

  const maxPrice = useMemo(() => {
    return allProperties.reduce((maximum, property) => Math.max(maximum, property.priceValue), 0);
  }, [allProperties]);

  const priceRange = useMemo<[number, number]>(
    () => [activeFilters.min ?? 0, activeFilters.max ?? maxPrice],
    [activeFilters.min, activeFilters.max, maxPrice],
  );

  const activeFilterCount = [
    activeFilters.type !== "all",
    !!activeFilters.q,
    activeFilters.loc !== "All Localities",
    !!activeFilters.sector,
    !!activeFilters.posting,
    !!activeFilters.propertyType,
    activeFilters.bhk.length > 0,
    activeFilters.furn.length > 0,
    activeFilters.min !== null || activeFilters.max !== null,
  ].filter(Boolean).length;

  const isFiltered = activeFilterCount > 0;

  const writeFilters = (filters: BrowseFilters) => {
    void setQuery({
      ...filters,
      page: 1,
    });
  };

  const updateFilters = (patch: Partial<BrowseFilters>) => {
    if (filtersOpen) {
      setDraftFilters((previous) => ({ ...previous, ...patch }));
      setDraftDirty(true);
    } else {
      void setQuery({ ...patch, page: 1 });
    }
    if ("propertyType" in patch || "bhk" in patch || "furn" in patch) {
      setSecondaryFiltersOpen(true);
    }
  };

  const clearFilters = () => {
    if (filtersOpen) {
      setDraftFilters(EMPTY_FILTERS);
      setDraftDirty(true);
    } else {
      writeFilters(EMPTY_FILTERS);
    }
  };

  const applyDraftFilters = () => {
    writeFilters(draftFilters);
    setDraftDirty(false);
    setFiltersOpen(false);
  };

  const changeFiltersOpen = (open: boolean) => {
    if (open && !draftDirty) {
      setDraftFilters(queryFilters);
    }
    setFiltersOpen(open);
  };

  const selectTransaction = (type: TransactionType) => {
    const nextSector = type === "rent" && activeFilters.sector === "plot"
      ? null
      : activeFilters.sector;
    const isPostingCompatible =
      !activeFilters.posting ||
      (type === "all" ||
        listingTypeForPosting(activeFilters.posting) === (type === "rent" ? "Rent" : "Sale")) &&
        (!nextSector || isAllowedPair(nextSector, activeFilters.posting));
    updateFilters({
      type,
      sector: nextSector,
      ...(!isPostingCompatible ? { posting: null } : {}),
    });
  };

  const selectSector = (nextSector: PropertySector | null) => {
    const sector = nextSector;
    const type = sector === "plot" && activeFilters.type === "rent" ? "buy" : activeFilters.type;
    const supportsBedroomsAndFurnishing =
      sector !== "commercial" && sector !== "plot";
    updateFilters({
      sector,
      type,
      propertyType: "",
      ...(supportsBedroomsAndFurnishing ? {} : { bhk: [], furn: [] }),
      posting:
        activeFilters.posting &&
        (!sector || isAllowedPair(sector, activeFilters.posting)) &&
        (type === "all" ||
          listingTypeForPosting(activeFilters.posting) === (type === "rent" ? "Rent" : "Sale"))
          ? activeFilters.posting
          : null,
    });
  };

  const toggleBHK = (bhk: number) => {
    updateFilters({
      bhk: activeFilters.bhk.includes(bhk)
        ? activeFilters.bhk.filter((value) => value !== bhk)
        : [...activeFilters.bhk, bhk],
    });
  };

  const toggleFurnishing = (status: FurnishingStatus) => {
    updateFilters({
      furn: activeFilters.furn.includes(status)
        ? activeFilters.furn.filter((value) => value !== status)
        : [...activeFilters.furn, status],
    });
  };

  const isBudgetPresetActive = (preset: BudgetPreset, type: "rent" | "buy") =>
    activeFilters.type === type &&
    activeFilters.min === preset.min &&
    activeFilters.max === preset.max &&
    (activeFilters.budget === preset.label ||
      (activeFilters.budget === null && priceRange[0] === preset.min && priceRange[1] === (preset.max ?? maxPrice)));

  const selectBudgetPreset = (preset: BudgetPreset, type: "rent" | "buy") => {
    if (isBudgetPresetActive(preset, type)) {
      updateFilters({ min: null, max: null, budget: null });
    } else {
      const sector = type === "rent" && activeFilters.sector === "plot"
        ? null
        : activeFilters.sector;
      const posting =
        activeFilters.posting &&
        (!sector || isAllowedPair(sector, activeFilters.posting)) &&
        listingTypeForPosting(activeFilters.posting) === (type === "rent" ? "Rent" : "Sale")
          ? activeFilters.posting
          : null;
      updateFilters({
        type,
        sector,
        posting,
        min: preset.min,
        max: preset.max,
        budget: preset.label,
      });
    }
  };

  const handleAreaPlaceChanged = (idSuffix: "desktop" | "mobile") => {
    const place = areaAutocompleteRefs.current[idSuffix]?.getPlace();
    const selectedPlace =
      place?.name ||
      place?.formatted_address?.split(",")[0]?.trim() ||
      place?.address_components?.find((component) =>
        component.types.some((type) =>
          ["locality", "sublocality", "neighborhood", "route"].includes(type),
        ),
      )?.long_name ||
      "";
    if (selectedPlace) updateFilters({ loc: selectedPlace });
  };

  const filtered = useMemo(
    () => {
      const searchTerms = activeFilters.q.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);

      return allProperties.filter((p) => {
        const matchType = activeFilters.type === "all" || p.type === activeFilters.type;
        const matchSector = !activeFilters.sector || p.propertySector === activeFilters.sector;
        const matchPosting = !activeFilters.posting || p.postingType === activeFilters.posting;
        const matchPropertyType =
          !activeFilters.propertyType || p.propertyType === activeFilters.propertyType;
        const searchableText = [
          p.title,
          p.location,
          p.locality,
          p.city,
          p.propertyType,
          p.categoryLabel,
          p.id,
          p.description,
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase();
        const matchSearch = searchTerms.every((term) => searchableText.includes(term));
        const matchBHK =
          activeFilters.bhk.length === 0 || activeFilters.bhk.includes(p.bedrooms);
        const matchLocality = matchesAreaFilter(p, activeFilters.loc);
        const matchFurnishing =
          activeFilters.furn.length === 0 || activeFilters.furn.includes(p.furnishing);
        const matchPrice = p.priceValue >= priceRange[0] && p.priceValue <= priceRange[1];
        return (
          matchType &&
          matchSector &&
          matchPosting &&
          matchPropertyType &&
          matchSearch &&
          matchBHK &&
          matchLocality &&
          matchFurnishing &&
          matchPrice
        );
      });
    },
    [
      allProperties,
      activeFilters,
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
    () => JSON.stringify(queryFilters),
    [queryFilters],
  );

  const prevFilterSignature = useRef(filterSignature);

  useEffect(() => {
    if (prevFilterSignature.current === filterSignature) return;
    prevFilterSignature.current = filterSignature;
    if (currentPage !== 1) {
      void setQuery({ page: 1 });
    }
  }, [filterSignature, currentPage, setQuery]);

  const filterChipClass = (selected: boolean) =>
    `rounded-full px-3 py-2 text-sm font-medium transition-colors ${
      selected
        ? "bg-primary text-primary-foreground"
        : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;

  const renderListingSearch = (id: string) => (
    <div className="relative min-w-0 w-full sm:max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id={id}
        aria-label="Search listings by name or location"
        placeholder="Search property name or location"
        value={activeFilters.q}
        onChange={(event) => updateFilters({ q: event.target.value })}
        className="h-10 rounded-lg border-border bg-muted/50 pl-9 text-sm"
      />
    </div>
  );

  const renderBudgetGroup = (
    type: "rent" | "buy",
    label: string,
    presets: BudgetPreset[],
  ) => {
    const selectedPreset = presets.find((preset) => isBudgetPresetActive(preset, type));
    const hasCustomRange =
      activeFilters.type === type &&
      (activeFilters.min !== null || activeFilters.max !== null) &&
      !selectedPreset;

    return (
      <div className="flex flex-col gap-2">
        <Label
          className="text-xs font-medium text-muted-foreground"
          htmlFor={`browse-budget-${type}`}
        >
          {label}
        </Label>
        {type === "buy" ? (
          <Select
            value={selectedPreset?.label ?? (hasCustomRange ? "custom" : "all")}
            onValueChange={(value) => {
              if (value === "all") {
                updateFilters({ min: null, max: null, budget: null });
                return;
              }
              const preset = presets.find((item) => item.label === value);
              if (preset) selectBudgetPreset(preset, type);
            }}
          >
            <SelectTrigger id={`browse-budget-${type}`} className="w-full">
              <SelectValue placeholder="Select purchase range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any purchase price</SelectItem>
              {hasCustomRange ? (
                <SelectItem value="custom" disabled>
                  Custom range
                </SelectItem>
              ) : null}
              {presets.map((preset) => (
                <SelectItem key={preset.label} value={preset.label}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => {
              const selected = isBudgetPresetActive(preset, type);
              return (
                <button
                  key={preset.label}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => selectBudgetPreset(preset, type)}
                  className={filterChipClass(selected)}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderFilterFields = (idSuffix: "desktop" | "mobile") => (
    <>
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex flex-col gap-1">
          <Label
            className="text-sm font-medium text-foreground"
            htmlFor={`browse-area-search-${idSuffix}`}
          >
            Area &amp; city
          </Label>
          <p className="text-xs text-muted-foreground">
            Search a street, locality, landmark, or city
          </p>
        </div>
        {mapsApiKey && isGoogleMapsLoaded ? (
          <Autocomplete
            className="w-full"
            onLoad={(autocomplete) => {
              areaAutocompleteRefs.current[idSuffix] = autocomplete;
              autocomplete.setFields([
                "formatted_address",
                "geometry",
                "name",
                "address_components",
              ]);
              autocomplete.setComponentRestrictions({ country: "in" });
            }}
            onUnmount={() => {
              areaAutocompleteRefs.current[idSuffix] = null;
            }}
            onPlaceChanged={() => handleAreaPlaceChanged(idSuffix)}
          >
            <Input
              id={`browse-area-search-${idSuffix}`}
              aria-label="Search area or city"
              placeholder="Search street, locality, or city"
              value={activeFilters.loc === "All Localities" ? "" : activeFilters.loc}
              onChange={(event) =>
                updateFilters({
                  loc: event.target.value.trim() ? event.target.value : "All Localities",
                })
              }
              className="h-10 rounded-lg border-border bg-muted/50 text-sm"
              autoComplete="off"
            />
          </Autocomplete>
        ) : (
          <Input
            id={`browse-area-search-${idSuffix}`}
            aria-label="Search area or city"
            placeholder="Search street, locality, or city"
            value={activeFilters.loc === "All Localities" ? "" : activeFilters.loc}
            onChange={(event) =>
              updateFilters({
                loc: event.target.value.trim() ? event.target.value : "All Localities",
              })
            }
            className="h-10 rounded-lg border-border bg-muted/50 text-sm"
            autoComplete="off"
          />
        )}
        <div className="mt-3 flex max-h-44 flex-wrap gap-2 overflow-y-auto pr-1">
          <button
            type="button"
            aria-pressed={activeFilters.loc === "All Localities"}
            onClick={() => updateFilters({ loc: "All Localities" })}
            className={`shrink-0 text-left ${filterChipClass(activeFilters.loc === "All Localities")}`}
          >
            All areas
          </button>
          {visibleAreaChips.map((option) => (
            <button
              key={option.name}
              type="button"
              aria-pressed={activeFilters.loc === option.name}
              onClick={() => updateFilters({ loc: option.name })}
              className={`inline-flex max-w-[min(100%,14rem)] shrink-0 items-center gap-1.5 text-left ${filterChipClass(activeFilters.loc === option.name)}`}
              title={`${option.count} listing${option.count === 1 ? "" : "s"}`}
            >
              <span className="min-w-0 truncate">{option.name}</span>
              {option.count > 0 ? (
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
                    activeFilters.loc === option.name
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-background/60 text-foreground"
                  }`}
                >
                  {option.count}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Listing</h3>
        <div className="flex flex-col gap-4">
          <fieldset>
            <legend className="mb-2 text-xs font-medium text-muted-foreground">Transaction</legend>
            <div className="flex flex-wrap gap-2">
              {([
                ["all", "Any"],
                ["rent", "Rent"],
                ["buy", "Buy"],
              ] as const).map(([type, label]) => (
                <button
                  key={type}
                  type="button"
                  aria-pressed={activeFilters.type === type}
                  onClick={() => selectTransaction(type)}
                  className={filterChipClass(activeFilters.type === type)}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-xs font-medium text-muted-foreground">
              Property category
            </legend>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                aria-pressed={!activeFilters.sector}
                onClick={() => selectSector(null)}
                className={filterChipClass(!activeFilters.sector)}
              >
                Any
              </button>
              {PROPERTY_SECTORS.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={activeFilters.sector === item}
                  onClick={() => selectSector(activeFilters.sector === item ? null : item)}
                  className={filterChipClass(activeFilters.sector === item)}
                >
                  {SECTOR_LABELS[item]}
                </button>
              ))}
            </div>
          </fieldset>

          {(activeFilters.type !== "all" || activeFilters.sector || activeFilters.posting) &&
          compatiblePostingTypes.length > 1 ? (
            <fieldset>
              <legend className="mb-2 text-xs font-medium text-muted-foreground">
                {activeFilters.type === "rent" ? "Rental preference" : "Listing preference"}
              </legend>
              <div className="flex flex-wrap gap-2">
                {compatiblePostingTypes.map((item) => {
                  const selected = activeFilters.posting === item;
                  const label =
                    item === "rent" && activeFilters.type === "rent"
                      ? "Standard rental"
                      : POSTING_LABELS[item];
                  return (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => updateFilters({ posting: selected ? null : item })}
                      className={filterChipClass(selected)}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3">
          <Label className="text-sm font-semibold text-foreground">Budget</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            {activeFilters.type === "rent"
              ? "Monthly rent"
              : activeFilters.type === "buy"
                ? "Purchase price"
                : "Choose a monthly rent or purchase-price range"}
          </p>
        </div>
        <div className="flex flex-col gap-4">
          {activeFilters.type !== "buy" &&
            renderBudgetGroup("rent", "Monthly rent", rentBudgetRanges)}
          {activeFilters.type !== "rent" &&
            renderBudgetGroup("buy", "Purchase price", buyBudgetRanges)}
        </div>
      </div>

      <Collapsible
        open={secondaryFiltersOpen}
        onOpenChange={setSecondaryFiltersOpen}
        className="rounded-xl border border-border bg-card p-4"
      >
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="flex w-full justify-between px-0 text-left hover:bg-transparent"
          >
            <span>
              More filters
              {(activeFilters.propertyType || activeFilters.bhk.length || activeFilters.furn.length) ? (
                <span className="ml-2 text-xs text-muted-foreground">Applied</span>
              ) : null}
            </span>
            <ChevronDown
              className={`size-4 transition-transform ${secondaryFiltersOpen ? "rotate-180" : ""}`}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="flex flex-col gap-4 pt-3">
          <div>
            <Label
              className="mb-2 block text-sm font-medium text-foreground"
              htmlFor={`property-type-${idSuffix}`}
            >
              Property type
            </Label>
            <Select
              value={activeFilters.propertyType || "all"}
              onValueChange={(value) =>
                updateFilters({ propertyType: value === "all" ? "" : value })
              }
            >
              <SelectTrigger id={`property-type-${idSuffix}`} aria-label="Property type">
                <SelectValue placeholder="Any property type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Any property type</SelectItem>
                  {propertyTypeOptions.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {activeFilters.sector !== "commercial" && activeFilters.sector !== "plot" ? (
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-foreground">Bedrooms</legend>
              <div className="flex flex-wrap gap-2">
                {bhkOptions.map((bhk) => (
                  <button
                    key={bhk}
                    type="button"
                    aria-pressed={activeFilters.bhk.includes(bhk)}
                    onClick={() => toggleBHK(bhk)}
                    className={filterChipClass(activeFilters.bhk.includes(bhk))}
                  >
                    {bhk}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}

          {activeFilters.sector !== "commercial" && activeFilters.sector !== "plot" ? (
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-foreground">Furnishing</legend>
              <div className="flex flex-wrap gap-2">
                {furnishingOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={activeFilters.furn.includes(option.value)}
                    onClick={() => toggleFurnishing(option.value)}
                    className={filterChipClass(activeFilters.furn.includes(option.value))}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}
        </CollapsibleContent>
      </Collapsible>
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

  const filterBadge = (key: string, label: string, patch: Partial<BrowseFilters>) => (
    <Badge key={key} variant="secondary" className="gap-1.5 py-1">
      <span>{label}</span>
      <button
        type="button"
        aria-label={`Remove ${label} filter`}
        onClick={() => updateFilters(patch)}
        className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="size-3" />
      </button>
    </Badge>
  );

  const budgetSummary =
    activeFilters.budget ||
    [
      activeFilters.min !== null
        ? `from ₹${activeFilters.min.toLocaleString("en-IN")}`
        : "",
      activeFilters.max !== null
        ? `to ₹${activeFilters.max.toLocaleString("en-IN")}`
        : "",
    ]
      .filter(Boolean)
      .join(" ");

  const activeFilterBadges =
    activeFilterCount > 0 ? (
      <div className="mb-3 flex flex-wrap items-center gap-2" aria-label="Active filters">
        {activeFilters.type !== "all" &&
          filterBadge(
            "transaction",
            activeFilters.type === "rent" ? "Rent" : "Buy",
            { type: "all" },
          )}
        {activeFilters.sector &&
          filterBadge("sector", SECTOR_LABELS[activeFilters.sector], { sector: null, posting: null })}
        {activeFilters.posting &&
          filterBadge(
            "posting",
            activeFilters.posting === "rent" && activeFilters.type === "rent"
              ? "Standard rental"
              : POSTING_LABELS[activeFilters.posting],
            { posting: null },
          )}
        {activeFilters.propertyType &&
          filterBadge("property-type", activeFilters.propertyType, { propertyType: "" })}
        {activeFilters.q && filterBadge("search", `Search: ${activeFilters.q}`, { q: "" })}
        {activeFilters.loc !== "All Localities" &&
          filterBadge("location", activeFilters.loc, { loc: "All Localities" })}
        {activeFilters.min !== null || activeFilters.max !== null
          ? filterBadge(
              "budget",
              budgetSummary
                ? `${activeFilters.type === "rent" ? "Rent" : activeFilters.type === "buy" ? "Buy" : "Budget"} · ${budgetSummary}`
                : "Budget",
              { min: null, max: null, budget: null },
            )
          : null}
        {activeFilters.bhk.length > 0 &&
          filterBadge("bedrooms", `${activeFilters.bhk.join(", ")} BHK`, { bhk: [] })}
        {activeFilters.furn.length > 0 &&
          filterBadge("furnishing", activeFilters.furn.join(", "), { furn: [] })}
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
    <div className={isAuthenticated ? "pb-12" : "pb-20 pt-4"}>
      <Sheet open={filtersOpen} onOpenChange={changeFiltersOpen}>
        <div className="container mx-auto">
          {/* Mobile & tablet: filters button + list/map */}
            <div className="mb-4 flex flex-col gap-3 lg:hidden">
            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                variant={isFiltered ? "default" : "outline"}
                size="sm"
                className="shrink-0 gap-2"
                onClick={() => changeFiltersOpen(true)}
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
            {renderListingSearch("browse-listing-search-mobile")}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <aside className="hidden min-w-0 lg:block">
              <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-muted/30">
                {filterCardHeader}
                <section className="grid grid-cols-1 gap-4 p-4">
                  {renderFilterFields("desktop")}
                </section>
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
                <div className="flex min-w-0 items-center gap-3">
                  {renderListingSearch("browse-listing-search-desktop")}
                  {viewModeGroup}
                </div>
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
            <div className="grid grid-cols-1 gap-4">{renderFilterFields("mobile")}</div>
          </div>
          <div className="flex shrink-0 flex-col gap-2 border-t border-border bg-background/95 px-4 py-4">
            <Button
              variant={isFiltered ? "default" : "outline"}
              className="w-full rounded-xl"
              onClick={clearFilters}
              disabled={!isFiltered}
            >
              <X className="mr-2 h-4 w-4" /> {isFiltered ? "Clear all filters" : "No filters to clear"}
            </Button>
            <Button className="w-full" onClick={applyDraftFilters}>
              Apply filters · show {sortedFiltered.length} {sortedFiltered.length === 1 ? "result" : "results"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Properties;
