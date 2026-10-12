/**
 * Posting categories from the YDBC, plot, and commercial form PDFs in `doc/`.
 * `listingType` stays Rent | Sale | Lease so older browse filters keep working.
 */

export const PROPERTY_SECTORS = ["residential", "commercial", "plot"] as const;
export const POSTING_TYPES = ["rent", "resale", "sale", "pg", "flatmates"] as const;

export type PropertySector = (typeof PROPERTY_SECTORS)[number];
export type PostingType = (typeof POSTING_TYPES)[number];

const PAIRS: Record<PropertySector, readonly PostingType[]> = {
  residential: ["rent", "resale", "pg", "flatmates"],
  commercial: ["rent", "sale"],
  plot: ["resale"],
};

export const SECTOR_LABELS: Record<PropertySector, string> = {
  residential: "Residential",
  commercial: "Commercial",
  plot: "Land/Plot",
};

export const POSTING_LABELS: Record<PostingType, string> = {
  rent: "Rent",
  resale: "Resale",
  sale: "Sale",
  pg: "PG/Hostel",
  flatmates: "Flatmates",
};

export type RoomPanel = {
  rent?: string;
  deposit?: string;
  amenities?: string[];
};

export type ListingDetails = {
  plotArea?: string;
  length?: string;
  width?: string;
  boundaryWall?: string;
  floorsAllowed?: string;
  cornerPlot?: string;
  insideGatedProject?: string;
  facing?: string;
  availableFrom?: string;
  priceNegotiable?: string;
  currentlyUnderLoan?: string;
  waterSupply?: string;
  electricityConnection?: string;
  facingRoadWidth?: string;
  gatedSecurity?: string;
  directionsTip?: string;
  ownership?: string;
  conversionCertificate?: string;
  commercialPropertyType?: string;
  buildingType?: string;
  ageOfProperty?: string;
  floor?: string;
  totalFloors?: string;
  onMainRoad?: string;
  cornerProperty?: string;
  rentNegotiable?: string;
  securityDeposit?: string;
  depositNegotiable?: string;
  maintenanceAmount?: string;
  maintenanceFrequency?: string;
  leaseDuration?: string;
  lockInPeriod?: string;
  occupancyStatus?: string;
  ownershipType?: string;
  possessionDate?: string;
  parkingCount?: string;
  powerBackup?: string;
  lift?: string;
  washroom?: string;
  waterStorage?: string;
  security?: string;
  wifi?: string;
  parkingAvailable?: string;
  airConditioning?: string;
  otherFeatures?: string;
  preferredVisitStart?: string;
  preferredVisitEnd?: string;
  contactPreference?: string;
  contactAvailability?: string;
  whatsappUpdates?: string;
  preferredVisitDays?: string[];
  otherAmenities?: string[];
  apartmentType?: string;
  apartmentName?: string;
  numberOfFloors?: string;
  propertyAge?: string;
  bhkType?: string;
  availability?: string;
  deposit?: string;
  maintenanceMode?: string;
  leaseAmount?: string;
  preferredTenants?: string;
  parking?: string;
  bathroomCount?: string;
  balconyCount?: string;
  petAllowed?: string;
  gym?: string;
  nonVegAllowed?: string;
  whoWillShow?: string;
  propertyCondition?: string;
  secondaryNumber?: string;
  similarUnits?: string;
  furnishing?: string;
  furnishingItems?: string[];
  amenityList?: string[];
  builtUpArea?: string;
  superBuiltUpArea?: string;
  carpetArea?: string;
  ownershipResale?: string;
  leaseYears?: string;
  floorType?: string;
  kitchenType?: string;
  maintenanceCost?: string;
  allotmentLetter?: string;
  saleDeed?: string;
  saleAgreement?: string;
  propertyTax?: string;
  occupancyCertificate?: string;
  roomTypes?: string[];
  rooms?: Record<string, RoomPanel>;
  availableFor?: string;
  preferredGuests?: string;
  foodIncluded?: string;
  mealTypes?: string[];
  foodNotes?: string;
  rules?: string[];
  gateClosingTime?: string;
  laundry?: string;
  laundryTiming?: string;
  roomCleaning?: string;
  roomCleaningTiming?: string;
  warden?: string;
  roomType?: string;
  tenantType?: string;
  attachedBathroom?: string;
  acRoom?: string;
  balcony?: string;
  smokingAllowed?: string;
  drinkingAllowed?: string;
};

export const EMPTY_LISTING_DETAILS: ListingDetails = {
  roomTypes: [],
  rooms: {},
  amenityList: [],
  mealTypes: [],
  rules: [],
  furnishingItems: [],
  preferredVisitDays: [],
  otherAmenities: [],
  whatsappUpdates: "yes",
};

export type ListingFormShape = {
  propertySector?: string;
  postingType?: string;
  propertyType?: string;
  listingType?: string;
  title?: string;
  bedrooms?: string;
  bathrooms?: string;
  area?: string;
  yearBuilt?: number;
  price?: number;
  furnishing?: string;
  address?: string;
  locality?: string;
  city?: string;
  state?: string;
  country?: string;
  description?: string;
  amenities?: string[];
  videoUrl?: string;
  propertyImages?: string[];
  thumbnailUrl?: string;
  floorPlans?: Array<{
    id: string;
    floorName: string;
    customName?: string;
    rooms: string;
    bathrooms: string;
    imageUrl: string;
  }>;
  latitude?: number;
  longitude?: number;
  details?: ListingDetails;
};

export type FormIssue = { path: string; message: string };

const DESCRIPTION_PLACEHOLDER =
  "Write a few lines about your property, something which is special and makes your property stand out. Please do not mention your contact details in any format.";

export { DESCRIPTION_PLACEHOLDER };

export function isPropertySector(value: string): value is PropertySector {
  return (PROPERTY_SECTORS as readonly string[]).includes(value);
}

export function isPostingType(value: string): value is PostingType {
  return (POSTING_TYPES as readonly string[]).includes(value);
}

export function isAllowedPair(sector: string, posting: string) {
  return isPropertySector(sector) && isPostingType(posting) && PAIRS[sector].includes(posting);
}

export function postingOptionsFor(sector: string): PostingType[] {
  if (!isPropertySector(sector)) return [];
  return [...PAIRS[sector]];
}

export function pairLabel(sector?: string | null, posting?: string | null) {
  if (!sector || !posting || !isPropertySector(sector) || !isPostingType(posting) || !isAllowedPair(sector, posting)) {
    return null;
  }
  return `${SECTOR_LABELS[sector]} · ${POSTING_LABELS[posting]}`;
}

export function listingTypeForPosting(posting: string): "Rent" | "Sale" {
  return posting === "sale" || posting === "resale" ? "Sale" : "Rent";
}

export function showsFloorPlans(sector?: string | null, posting?: string | null) {
  if (!sector) return true;
  return sector === "residential" && posting === "rent";
}

export function sqftToSquareMeters(raw: unknown) {
  const n = typeof raw === "number" ? raw : parseFloat(String(raw ?? "").replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Number((n / 10.7639).toFixed(2));
}

const YES_NO_KEYS = new Set([
  "boundaryWall",
  "cornerPlot",
  "insideGatedProject",
  "priceNegotiable",
  "currentlyUnderLoan",
  "gatedSecurity",
  "onMainRoad",
  "cornerProperty",
  "rentNegotiable",
  "depositNegotiable",
  "parkingAvailable",
  "petAllowed",
  "gym",
  "nonVegAllowed",
  "similarUnits",
  "foodIncluded",
  "laundry",
  "roomCleaning",
  "warden",
  "attachedBathroom",
  "acRoom",
  "balcony",
  "smokingAllowed",
  "drinkingAllowed",
]);

const NUMERIC_KEYS = new Set([
  "plotArea",
  "length",
  "width",
  "floorsAllowed",
  "facingRoadWidth",
  "securityDeposit",
  "maintenanceAmount",
  "leaseDuration",
  "lockInPeriod",
  "parkingCount",
  "deposit",
  "leaseAmount",
  "bathroomCount",
  "balconyCount",
  "builtUpArea",
  "superBuiltUpArea",
  "carpetArea",
  "leaseYears",
  "maintenanceCost",
]);

function text(value: unknown) {
  return value == null ? "" : String(value).trim();
}

function numberOf(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value.replace(/,/g, ""));
    return Number.isFinite(n) ? n : NaN;
  }
  return NaN;
}

function positive(value: unknown) {
  return numberOf(value) > 0;
}

function nonNegative(value: unknown) {
  const n = numberOf(value);
  return Number.isFinite(n) && n >= 0;
}

function yesNo(value: unknown) {
  return value === true || value === false || value === "yes" || value === "no";
}

function isYes(value: unknown) {
  return value === true || value === "yes";
}

function isNo(value: unknown) {
  return value === false || value === "no";
}

function validDate(value: unknown) {
  const raw = text(value);
  if (!raw) return false;
  return !Number.isNaN(Date.parse(raw));
}

function detailsOf(values: ListingFormShape): ListingDetails {
  return values.details ?? {};
}

export function validateListingForm(values: ListingFormShape): FormIssue[] {
  const sector = text(values.propertySector);
  const posting = text(values.postingType);
  if (!sector && !posting) return validateLegacy(values);

  const errors: FormIssue[] = [];
  const miss = (path: string, message: string) => errors.push({ path, message });

  if (!isAllowedPair(sector, posting)) {
    miss("postingType", "Choose a sector and a listing type from the list.");
    return errors;
  }

  if (text(values.title).length < 5) miss("title", "Title must be at least 5 characters.");
  if (text(values.address).length < 5) miss("address", "Address must be at least 5 characters.");
  if (text(values.locality).length < 2) miss("locality", "Locality is required.");
  if (text(values.city).length < 2) miss("city", "City is required.");
  if (text(values.country).length < 2) miss("country", "Country is required.");
  if (text(values.description).length > 3000) miss("description", "Description is too long.");

  const details = detailsOf(values);
  if (sector === "plot") {
    if (!positive(details.plotArea)) miss("details.plotArea", "Plot area is required.");
    if (!yesNo(details.boundaryWall)) miss("details.boundaryWall", "Boundary wall is required.");
    if (!validDate(details.availableFrom)) miss("details.availableFrom", "Available from is required.");
    if (!positive(values.price)) miss("price", "Expected price is required.");
    return errors;
  }

  if (sector === "commercial") {
    validateCommercialForm(posting as PostingType, details, values, miss);
    return errors;
  }

  if (posting === "pg") {
    validatePgForm(details, miss);
    return errors;
  }

  if (posting === "flatmates") {
    validateFlatmatesForm(details, values, miss);
    return errors;
  }

  if (posting === "resale") {
    validateResaleForm(details, values, miss);
    return errors;
  }

  validateRentForm(details, values, miss);
  return errors;
}

function validateLegacy(values: ListingFormShape): FormIssue[] {
  const errors: FormIssue[] = [];
  const miss = (path: string, message: string) => errors.push({ path, message });
  if (!text(values.propertyType)) miss("propertyType", "Please select a property type.");
  if (!text(values.listingType)) miss("listingType", "Please select a listing type.");
  if (text(values.title).length < 5) miss("title", "Title must be at least 5 characters.");
  if (!text(values.bedrooms)) miss("bedrooms", "Please select number of bedrooms.");
  if (!text(values.bathrooms)) miss("bathrooms", "Please select number of bathrooms.");
  if (!positive(String(values.area ?? "").replace(/[^0-9.]/g, ""))) miss("area", "Please enter a valid positive area.");
  const year = Number(values.yearBuilt);
  const maxYear = new Date().getFullYear() + 5;
  if (!Number.isFinite(year) || year < 1900 || year > maxYear) {
    miss("yearBuilt", "Year must be 1900 or later.");
  }
  if (!positive(values.price)) miss("price", "Price must be greater than 0.");
  if (!text(values.furnishing)) miss("furnishing", "Please select furnishing status.");
  if (text(values.address).length < 5) miss("address", "Address must be at least 5 characters.");
  if (text(values.locality).length < 2) miss("locality", "Locality is required.");
  if (text(values.city).length < 2) miss("city", "City is required.");
  if (text(values.country).length < 2) miss("country", "Country is required.");
  return errors;
}

function apartmentShape(
  details: ListingDetails,
  miss: (path: string, message: string) => void,
  resale: boolean,
) {
  const kind = text(details.apartmentType);
  const allowed = resale
    ? ["apartment", "independent_house", "gated_villa", "standalone_building"]
    : ["apartment", "independent_house", "gated_villa"];
  if (!allowed.includes(kind)) miss("details.apartmentType", "Apartment type is required.");
  const hideFloor = kind === "independent_house" || kind === "gated_villa";
  const showName = kind === "apartment" || kind === "gated_villa";
  const showNumberOfFloors = kind === "independent_house" || kind === "gated_villa";
  if (!hideFloor && kind) {
    if (!text(details.floor)) miss("details.floor", "Floor is required.");
    if (!text(details.totalFloors)) miss("details.totalFloors", "Total floors is required.");
  }
  if (showName && !text(details.apartmentName)) miss("details.apartmentName", "Apartment name is required.");
  if (showNumberOfFloors && !text(details.numberOfFloors)) {
    miss("details.numberOfFloors", "Number of floors is required.");
  }
  if (!text(details.bhkType)) miss("details.bhkType", "BHK type is required.");
  if (!positive(details.builtUpArea)) miss("details.builtUpArea", "Built-up area is required.");
}

function validateRentForm(
  details: ListingDetails,
  values: ListingFormShape,
  miss: (path: string, message: string) => void,
) {
  apartmentShape(details, miss, false);
  if (!text(details.propertyAge)) miss("details.propertyAge", "Property age is required.");
  const availability = text(details.availability);
  if (availability !== "rent" && availability !== "lease") miss("details.availability", "Choose rent or lease.");
  if (availability === "lease") {
    if (!positive(details.leaseAmount)) miss("details.leaseAmount", "Expected lease amount is required.");
  } else if (availability === "rent") {
    if (!positive(values.price)) miss("price", "Expected rent is required.");
    if (!nonNegative(details.deposit)) miss("details.deposit", "Expected deposit is required.");
  }
  if (text(details.maintenanceMode) === "extra" && !positive(details.maintenanceAmount)) {
    miss("details.maintenanceAmount", "Maintenance amount is required.");
  }
  if (!validDate(details.availableFrom)) miss("details.availableFrom", "Available from is required.");
  if (!text(details.furnishing)) miss("details.furnishing", "Furnishing is required.");
  if (!text(details.parking)) miss("details.parking", "Parking is required.");
  if (!text(details.preferredTenants)) miss("details.preferredTenants", "Preferred tenants is required.");
  if (!positive(details.bathroomCount)) miss("details.bathroomCount", "Bathrooms are required.");
  if (!yesNo(details.petAllowed)) miss("details.petAllowed", "Pet allowed is required.");
  if (!yesNo(details.gym)) miss("details.gym", "Gym is required.");
  if (!yesNo(details.nonVegAllowed)) miss("details.nonVegAllowed", "Non-veg allowed is required.");
  if (!yesNo(details.gatedSecurity)) miss("details.gatedSecurity", "Gated security is required.");
}

function validateResaleForm(
  details: ListingDetails,
  values: ListingFormShape,
  miss: (path: string, message: string) => void,
) {
  apartmentShape(details, miss, true);
  if (!text(details.propertyAge)) miss("details.propertyAge", "Property age is required.");
  if (!text(details.facing)) miss("details.facing", "Facing is required.");
  if (!positive(values.price)) miss("price", "Expected price is required.");
  if (!nonNegative(details.maintenanceCost)) miss("details.maintenanceCost", "Maintenance cost is required.");
  if (!validDate(details.availableFrom)) miss("details.availableFrom", "Available from is required.");
  if (!text(details.furnishing)) miss("details.furnishing", "Furnishing is required.");
  if (!text(details.parking)) miss("details.parking", "Parking is required.");
  if (!positive(details.bathroomCount)) miss("details.bathroomCount", "Bathrooms are required.");
  if (!yesNo(details.gym)) miss("details.gym", "Gym is required.");
  if (!yesNo(details.gatedSecurity)) miss("details.gatedSecurity", "Gated security is required.");
  if (!text(details.whoWillShow)) miss("details.whoWillShow", "Who will show the property is required.");
  if (!text(details.allotmentLetter)) miss("details.allotmentLetter", "Allotment letter is required.");
  if (!text(details.saleDeed)) miss("details.saleDeed", "Sale deed certificate is required.");
  if (isNo(details.saleDeed) && !text(details.saleAgreement)) {
    miss("details.saleAgreement", "Sale agreement is required.");
  }
  if (!text(details.propertyTax)) miss("details.propertyTax", "Property tax is required.");
  if (!text(details.occupancyCertificate)) miss("details.occupancyCertificate", "Occupancy certificate is required.");
}

function validatePgForm(details: ListingDetails, miss: (path: string, message: string) => void) {
  const roomTypes = details.roomTypes ?? [];
  if (roomTypes.length === 0) miss("details.roomTypes", "Select at least one room type.");
  for (const roomType of roomTypes) {
    const room = details.rooms?.[roomType] ?? {};
    if (!positive(room.rent)) miss(`details.rooms.${roomType}.rent`, "Expected rent per person is required.");
    if (!nonNegative(room.deposit)) miss(`details.rooms.${roomType}.deposit`, "Expected deposit per person is required.");
  }
  if (!text(details.availableFor)) miss("details.availableFor", "Place availability is required.");
  if (!text(details.preferredGuests)) miss("details.preferredGuests", "Preferred guests is required.");
  if (!validDate(details.availableFrom)) miss("details.availableFrom", "Available from is required.");
  if (!yesNo(details.foodIncluded)) miss("details.foodIncluded", "Food included is required.");
}

function validateFlatmatesForm(
  details: ListingDetails,
  values: ListingFormShape,
  miss: (path: string, message: string) => void,
) {
  apartmentShape(details, miss, false);
  if (!text(details.roomType)) miss("details.roomType", "Room type is required.");
  if (!text(details.tenantType)) miss("details.tenantType", "Tenant type is required.");
  if (!text(details.propertyAge)) miss("details.propertyAge", "Property age is required.");
  if (!positive(values.price)) miss("price", "Expected rent is required.");
  if (!nonNegative(details.deposit)) miss("details.deposit", "Expected deposit is required.");
  if (text(details.maintenanceMode) === "extra" && !positive(details.maintenanceAmount)) {
    miss("details.maintenanceAmount", "Maintenance amount is required.");
  }
  if (!validDate(details.availableFrom)) miss("details.availableFrom", "Available from is required.");
  if (!text(details.furnishing)) miss("details.furnishing", "Furnishing is required.");
  if (!text(details.parking)) miss("details.parking", "Parking is required.");
  if (!yesNo(details.attachedBathroom)) miss("details.attachedBathroom", "Attached bathroom is required.");
  if (!yesNo(details.acRoom)) miss("details.acRoom", "AC room is required.");
  if (!yesNo(details.nonVegAllowed)) miss("details.nonVegAllowed", "Non-veg allowed is required.");
  if (!yesNo(details.gym)) miss("details.gym", "Gym is required.");
  if (!yesNo(details.gatedSecurity)) miss("details.gatedSecurity", "Gated security is required.");
  if (!text(details.whoWillShow)) miss("details.whoWillShow", "Who will show the property is required.");
}

function validateCommercialForm(
  posting: PostingType,
  details: ListingDetails,
  values: ListingFormShape,
  miss: (path: string, message: string) => void,
) {
  const propertyType = text(details.commercialPropertyType);
  const allowed = [
    "office_space",
    "co_working",
    "shop",
    "showroom",
    "godown_warehouse",
    "industrial_shed",
    "industrial_building",
    "other_business",
    "restaurant_cafe",
  ];
  if (!allowed.includes(propertyType)) miss("details.commercialPropertyType", "Property type is required.");
  if (!text(details.buildingType)) miss("details.buildingType", "Building type is required.");
  if (!text(details.ageOfProperty)) miss("details.ageOfProperty", "Property age is required.");
  if (!nonNegative(details.floor)) miss("details.floor", "Floor is required.");
  if (!nonNegative(details.totalFloors)) miss("details.totalFloors", "Total floors is required.");
  if (nonNegative(details.floor) && nonNegative(details.totalFloors) && numberOf(details.totalFloors) < numberOf(details.floor)) {
    miss("details.totalFloors", "Total floors must be at least the selected floor.");
  }
  if (!positive(details.superBuiltUpArea)) miss("details.superBuiltUpArea", "Built up area is required.");
  if (!text(details.furnishing)) miss("details.furnishing", "Furnishing is required.");
  if (!text(details.contactPreference)) miss("details.contactPreference", "Contact preference is required.");
  const description = text(values.description);
  if (description.length < 50 || description.length > 3000) {
    miss("description", "Description must be between 50 and 3000 characters.");
  }
  if (values.latitude == null || values.longitude == null) miss("latitude", "Confirm the property on the map.");
  if (posting === "rent") {
    if (!positive(values.price)) miss("price", "Expected rent is required.");
    if (!nonNegative(details.securityDeposit)) miss("details.securityDeposit", "Security deposit is required.");
    if (!validDate(details.availableFrom)) miss("details.availableFrom", "Available from is required.");
    if (
      text(details.lockInPeriod) &&
      text(details.leaseDuration) &&
      numberOf(details.lockInPeriod) > numberOf(details.leaseDuration)
    ) {
      miss("details.lockInPeriod", "Lock-in period cannot exceed lease duration.");
    }
  } else {
    if (!positive(values.price)) miss("price", "Expected sale price is required.");
    if (!text(details.ownershipType)) miss("details.ownershipType", "Ownership type is required.");
    if (!validDate(details.possessionDate)) miss("details.possessionDate", "Possession date is required.");
  }
  const frequency = text(details.maintenanceFrequency);
  if (frequency && frequency !== "included" && !nonNegative(details.maintenanceAmount)) {
    miss("details.maintenanceAmount", "Maintenance amount is required.");
  }
  if (isYes(details.parkingAvailable) && !nonNegative(details.parkingCount)) {
    miss("details.parkingCount", "Parking slots are required.");
  }
}

function furnishingColumn(value?: string): "furnished" | "semi-furnished" | "unfurnished" | null {
  if (value === "furnished" || value === "fully_furnished" || value === "fully-furnished") return "furnished";
  if (value === "semi-furnished" || value === "semi_furnished") return "semi-furnished";
  if (value === "unfurnished") return "unfurnished";
  return null;
}

function propertyTypeLabel(sector: string, posting: string, details: ListingDetails, fallback: string) {
  if (sector === "plot") return "Land/Plot";
  if (posting === "pg") return "PG/Hostel";
  if (sector === "commercial") {
    const labels: Record<string, string> = {
      office_space: "Office Space",
      co_working: "Co-Working",
      shop: "Shop",
      showroom: "Showroom",
      godown_warehouse: "Godown/Warehouse",
      industrial_shed: "Industrial Shed",
      industrial_building: "Industrial Building",
      other_business: "Other business",
      restaurant_cafe: "Restaurant/Cafe",
    };
    return labels[text(details.commercialPropertyType)] || "Commercial";
  }
  const homes: Record<string, string> = {
    apartment: "Apartment",
    independent_house: "Independent House/Villa",
    gated_villa: "Gated Community Villa",
    standalone_building: "Standalone Building",
  };
  return homes[text(details.apartmentType)] || fallback || "Residential";
}

function serializeDetails(details: ListingDetails): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(details)) {
    if (value == null || value === "") continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      out[key] = value;
      continue;
    }
    if (key === "rooms" && value && typeof value === "object") {
      const rooms: Record<string, { rent?: number; deposit?: number; amenities?: string[] }> = {};
      for (const [roomType, panel] of Object.entries(value as Record<string, RoomPanel>)) {
        rooms[roomType] = {
          rent: numberOf(panel.rent),
          deposit: numberOf(panel.deposit),
          amenities: panel.amenities ?? [],
        };
      }
      out.rooms = rooms;
      continue;
    }
    if (typeof value === "string" && YES_NO_KEYS.has(key)) {
      if (value === "yes" || value === "no") out[key] = value === "yes";
      continue;
    }
    if (typeof value === "string" && NUMERIC_KEYS.has(key)) {
      const n = numberOf(value);
      if (Number.isFinite(n)) out[key] = n;
      continue;
    }
    out[key] = value;
  }
  return out;
}

function bhkCount(bhkType?: string) {
  if (!bhkType) return null;
  if (bhkType === "4+") return 4;
  const n = Number(bhkType);
  return Number.isFinite(n) ? n : null;
}

function lowestPgRent(details: ListingDetails) {
  const rents = (details.roomTypes ?? [])
    .map((roomType) => numberOf(details.rooms?.[roomType]?.rent))
    .filter((n) => Number.isFinite(n) && n > 0);
  return rents.length ? Math.min(...rents) : 0;
}

export function buildPropertyPayload(values: ListingFormShape): Record<string, unknown> {
  const sector = text(values.propertySector);
  const posting = text(values.postingType);
  const images = values.propertyImages ?? [];
  const floorPlans = (values.floorPlans ?? [])
    .filter((fp) => {
      const url = fp.imageUrl.trim();
      if (!url) return false;
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    })
    .map((fp) => ({
      ...fp,
      rooms: Number(fp.rooms),
      bathrooms: Number(fp.bathrooms),
      imageUrl: fp.imageUrl.trim(),
    }));

  const shared = {
    title: text(values.title),
    description: text(values.description) || "Property listed via tenant dashboard",
    currency: "INR",
    address: text(values.address),
    locality: text(values.locality) || text(values.city),
    city: text(values.city),
    state: text(values.state) || undefined,
    country: text(values.country) || "India",
    propertyImages: images,
    thumbnailUrl: values.thumbnailUrl || images[0] || "",
    videoUrl: values.videoUrl || undefined,
    latitude: values.latitude,
    longitude: values.longitude,
  };

  if (!sector || !posting) {
    return {
      ...shared,
      price: Number(values.price) || 0,
      listingType: values.listingType,
      propertyType: values.propertyType,
      bedrooms: Number(values.bedrooms),
      bathrooms: Number(values.bathrooms),
      area: sqftToSquareMeters(values.area),
      yearBuilt: Number(values.yearBuilt),
      furnishing: values.furnishing,
      amenities: values.amenities ?? [],
      floorPlans,
    };
  }

  const details = detailsOf(values);
  const serialized = serializeDetails(details);
  const availability = text(details.availability);
  const price =
    posting === "pg"
      ? lowestPgRent(details)
      : sector === "residential" && posting === "rent" && availability === "lease"
        ? numberOf(details.leaseAmount)
        : Number(values.price) || 0;
  const areaSource =
    sector === "plot"
      ? details.plotArea
      : sector === "commercial"
        ? details.superBuiltUpArea
        : posting === "pg"
          ? 0
          : details.builtUpArea;
  const bedrooms = bhkCount(details.bhkType);
  const bathrooms = text(details.bathroomCount) ? numberOf(details.bathroomCount) : null;
  const furnishing = furnishingColumn(details.furnishing);

  return {
    ...shared,
    price,
    listingType: listingTypeForPosting(posting),
    propertyType: propertyTypeLabel(sector, posting, details, text(values.propertyType)),
    propertySector: sector,
    postingType: posting,
    details: serialized,
    bedrooms,
    bathrooms: Number.isFinite(bathrooms as number) ? bathrooms : null,
    area: sqftToSquareMeters(areaSource),
    yearBuilt: null,
    furnishing,
    amenities: details.amenityList ?? [],
    floorPlans: showsFloorPlans(sector, posting) ? floorPlans : [],
  };
}

export type ListingFact = { icon: "bed" | "bath" | "area" | "tag"; text: string };

export function listingFacts(input: {
  propertySector?: string | null;
  postingType?: string | null;
  bedrooms: number;
  bathrooms: number;
  area: string;
  propertyType?: string;
  details?: Record<string, unknown> | null;
}): ListingFact[] {
  const sector = input.propertySector;
  const posting = input.postingType;
  if (!sector || !posting) {
    return [
      { icon: "bed", text: `${input.bedrooms} BHK` },
      { icon: "bath", text: `${input.bathrooms} Bath` },
      { icon: "area", text: input.area },
    ];
  }
  const details = input.details ?? {};
  const read = (key: string) => {
    const value = details[key];
    if (value == null || value === "") return "";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return String(value);
  };
  if (sector === "plot") {
    return [
      { icon: "area", text: read("plotArea") ? `${read("plotArea")} sq.ft` : input.area },
      { icon: "tag", text: read("facing") ? `Facing ${read("facing")}` : "Plot" },
    ];
  }
  if (sector === "commercial") {
    return [
      { icon: "tag", text: input.propertyType || "Commercial" },
      { icon: "area", text: input.area },
      { icon: "tag", text: read("floor") !== "" ? `Floor ${read("floor")}` : "Floor —" },
    ];
  }
  if (posting === "pg") {
    const rooms = Array.isArray(details.roomTypes) ? details.roomTypes.join(", ") : "";
    return [
      { icon: "tag", text: rooms || "PG/Hostel" },
      { icon: "tag", text: read("availableFor") || "PG" },
    ];
  }
  if (posting === "flatmates") {
    return [
      { icon: "bed", text: read("bhkType") ? `${read("bhkType")} BHK` : `${input.bedrooms} BHK` },
      { icon: "tag", text: read("roomType") || "Room" },
    ];
  }
  const bhk = read("bhkType") || (input.bedrooms ? String(input.bedrooms) : "");
  const facts: ListingFact[] = [];
  if (bhk) facts.push({ icon: "bed", text: `${bhk} BHK` });
  if (input.bathrooms > 0 || read("bathroomCount")) {
    facts.push({ icon: "bath", text: `${read("bathroomCount") || input.bathrooms} Bath` });
  }
  facts.push({ icon: "area", text: input.area });
  return facts;
}

const DETAIL_LABELS: Record<string, string> = {
  plotArea: "Plot area (sq.ft)",
  length: "Length (ft)",
  width: "Width (ft)",
  boundaryWall: "Boundary wall",
  floorsAllowed: "Floors allowed",
  cornerPlot: "Corner plot",
  insideGatedProject: "Inside a gated project",
  facing: "Facing",
  availableFrom: "Available from",
  priceNegotiable: "Price negotiable",
  currentlyUnderLoan: "Currently under loan",
  waterSupply: "Water supply",
  electricityConnection: "Electricity connection",
  facingRoadWidth: "Width of facing road (ft)",
  gatedSecurity: "Gated security",
  directionsTip: "Directions",
  ownership: "Ownership",
  conversionCertificate: "Conversion certificate",
  commercialPropertyType: "Property type",
  buildingType: "Building type",
  ageOfProperty: "Age of property",
  floor: "Floor",
  totalFloors: "Total floors",
  onMainRoad: "On main road",
  cornerProperty: "Corner property",
  securityDeposit: "Security deposit",
  maintenanceAmount: "Maintenance",
  maintenanceFrequency: "Maintenance frequency",
  leaseDuration: "Lease duration (months)",
  lockInPeriod: "Lock-in (months)",
  occupancyStatus: "Current status",
  ownershipType: "Ownership type",
  possessionDate: "Possession",
  parkingCount: "Parking slots",
  powerBackup: "Power backup",
  lift: "Lift",
  washroom: "Washroom",
  waterStorage: "Water storage",
  security: "Security",
  wifi: "Wi-Fi",
  parkingAvailable: "Parking",
  airConditioning: "Air conditioning",
  otherFeatures: "Other features",
  contactPreference: "Contact preference",
  contactAvailability: "Contact availability",
  apartmentType: "Apartment type",
  apartmentName: "Apartment name",
  numberOfFloors: "Number of floors",
  propertyAge: "Property age",
  bhkType: "BHK",
  availability: "Available for",
  deposit: "Deposit",
  maintenanceMode: "Maintenance",
  leaseAmount: "Lease amount",
  preferredTenants: "Preferred tenants",
  parking: "Parking",
  bathroomCount: "Bathrooms",
  balconyCount: "Balcony",
  petAllowed: "Pets allowed",
  gym: "Gym",
  nonVegAllowed: "Non-veg allowed",
  whoWillShow: "Who will show",
  propertyCondition: "Property condition",
  secondaryNumber: "Secondary number",
  similarUnits: "Similar units available",
  furnishing: "Furnishing",
  builtUpArea: "Built-up area (sq.ft)",
  superBuiltUpArea: "Super built-up area (sq.ft)",
  carpetArea: "Carpet area (sq.ft)",
  ownershipResale: "Ownership",
  leaseYears: "Lease years",
  floorType: "Floor type",
  kitchenType: "Kitchen type",
  maintenanceCost: "Maintenance cost",
  allotmentLetter: "Allotment letter",
  saleDeed: "Sale deed certificate",
  saleAgreement: "Sale agreement",
  propertyTax: "Property tax paid",
  occupancyCertificate: "Occupancy certificate",
  availableFor: "Available for",
  preferredGuests: "Preferred guests",
  foodIncluded: "Food included",
  foodNotes: "Food notes",
  gateClosingTime: "Gate closing time",
  laundry: "Laundry",
  laundryTiming: "Laundry timing",
  roomCleaning: "Room cleaning",
  roomCleaningTiming: "Room cleaning timing",
  warden: "Warden",
  roomType: "Room type",
  tenantType: "Tenant type",
  attachedBathroom: "Attached bathroom",
  acRoom: "AC room",
  balcony: "Balcony",
  smokingAllowed: "Smoking allowed",
  drinkingAllowed: "Drinking allowed",
};

export function detailRows(details?: Record<string, unknown> | null) {
  if (!details) return [];
  const rows: { label: string; value: string }[] = [];
  for (const [key, label] of Object.entries(DETAIL_LABELS)) {
    const value = details[key];
    if (value == null || value === "" || Array.isArray(value)) continue;
    rows.push({
      label,
      value: typeof value === "boolean" ? (value ? "Yes" : "No") : String(value).replaceAll("_", " "),
    });
  }
  if (Array.isArray(details.roomTypes) && details.rooms && typeof details.rooms === "object") {
    const rooms = details.rooms as Record<string, { rent?: number; deposit?: number }>;
    for (const roomType of details.roomTypes) {
      const room = rooms[String(roomType)];
      if (!room) continue;
      rows.push({
        label: `${String(roomType)} room`,
        value: `Rent ₹${room.rent ?? "—"} · Deposit ₹${room.deposit ?? "—"}`,
      });
    }
  }
  return rows;
}
