import { DESCRIPTION_PLACEHOLDER, type ListingDetails } from "@/lib/property-posting";
import {
  BHK,
  BUILDING_TYPES,
  COMMERCIAL_AGE,
  COMMERCIAL_FLOORS,
  COMMERCIAL_TYPES,
  FACING,
  FACING_WITH_UNKNOWN,
  FLATMATE_AMENITIES,
  FLOORS,
  FURNISHING,
  HOUSE_FLOORS,
  PARKING,
  PG_AMENITIES,
  RENT_AGE,
  RENT_AMENITIES,
  RESALE_AGE,
  RESALE_AMENITIES,
  WHO_SHOWS,
  YES_NO_DOC,
  opt,
} from "./listing-options";

export type FieldKind =
  | "text"
  | "number"
  | "textarea"
  | "select"
  | "radio"
  | "yesno"
  | "checks"
  | "date"
  | "time"
  | "stepper"
  | "pgRooms";

export type ListingField = {
  name: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  show?: (details: ListingDetails) => boolean;
};

export type ListingSection = {
  id: string;
  title: string;
  fields: ListingField[];
  extras?: Array<"location" | "images" | "video" | "floorplans">;
};

const titleField: ListingField = {
  name: "title",
  label: "Property title",
  kind: "text",
  required: true,
  placeholder: "e.g. Spacious 2BHK in Saidapet",
};

const hideFloor = (details: ListingDetails) =>
  details.apartmentType === "independent_house" || details.apartmentType === "gated_villa";

const showName = (details: ListingDetails) =>
  details.apartmentType === "apartment" || details.apartmentType === "gated_villa";

function homeTypeFields(resale: boolean): ListingField[] {
  const types = [
    opt("apartment", "Apartment"),
    opt("independent_house", "Independent House/Villa"),
    opt("gated_villa", "Gated Community Villa"),
    ...(resale ? [opt("standalone_building", "Standalone Building")] : []),
  ];
  return [
    { name: "details.apartmentType", label: "Apartment type", kind: "select", required: true, options: types },
    {
      name: "details.apartmentName",
      label: "Apartment name",
      kind: "text",
      required: true,
      show: showName,
      placeholder: "Society or apartment name",
    },
    { name: "details.bhkType", label: "BHK type", kind: "select", required: true, options: BHK },
    {
      name: "details.floor",
      label: "Floor",
      kind: "select",
      required: true,
      options: FLOORS,
      show: (details) => !!details.apartmentType && !hideFloor(details),
    },
    {
      name: "details.totalFloors",
      label: "Total floors",
      kind: "select",
      required: true,
      options: FLOORS,
      show: (details) => !!details.apartmentType && !hideFloor(details),
    },
    {
      name: "details.numberOfFloors",
      label: "No. of floors",
      kind: "select",
      required: true,
      options: HOUSE_FLOORS,
      show: hideFloor,
    },
  ];
}

function locationSection(id: string): ListingSection {
  return { id, title: "Locality details", fields: [], extras: ["location"] };
}

function gallerySection(id: string, floorplans = false): ListingSection {
  return {
    id,
    title: "Gallery",
    fields: [],
    extras: floorplans ? ["images", "video", "floorplans"] : ["images", "video"],
  };
}

function checks(name: string, label: string, items: string[]): ListingField {
  return { name, label, kind: "checks", options: items.map((item) => opt(item, item)) };
}

function rentMoney(includeLease: boolean): ListingField[] {
  return [
    ...(includeLease
      ? [
          {
            name: "details.availability",
            label: "Property available for",
            kind: "radio" as const,
            required: true,
            options: [opt("rent", "Only rent"), opt("lease", "Only lease")],
          },
        ]
      : []),
    {
      name: "price",
      label: "Expected rent (monthly)",
      kind: "number",
      required: true,
      show: (details) => !includeLease || details.availability !== "lease",
    },
    {
      name: "details.deposit",
      label: "Expected deposit",
      kind: "number",
      required: true,
      show: (details) => !includeLease || details.availability !== "lease",
    },
    {
      name: "details.leaseAmount",
      label: "Expected lease amount",
      kind: "number",
      required: true,
      show: (details) => includeLease && details.availability === "lease",
    },
    {
      name: "details.rentNegotiable",
      label: "Rent negotiable",
      kind: "yesno",
      show: (details) => details.availability !== "lease",
    },
    {
      name: "details.maintenanceMode",
      label: "Monthly maintenance",
      kind: "select",
      options: [opt("included", "Maintenance included"), opt("extra", "Maintenance extra")],
    },
    {
      name: "details.maintenanceAmount",
      label: "Maintenance amount",
      kind: "number",
      required: true,
      show: (details) => details.maintenanceMode === "extra",
    },
    { name: "details.availableFrom", label: "Available from", kind: "date", required: true },
    { name: "details.furnishing", label: "Furnishing", kind: "select", required: true, options: FURNISHING },
    {
      name: "details.furnishingItems",
      label: "Furnishing items",
      kind: "checks",
      options: [opt("TV", "TV"), opt("Sofa", "Sofa")],
      show: (details) => details.furnishing === "furnished" || details.furnishing === "semi-furnished",
    },
    { name: "details.parking", label: "Parking", kind: "select", required: true, options: PARKING },
    { name: "description", label: "Description", kind: "textarea", placeholder: DESCRIPTION_PLACEHOLDER },
  ];
}

export function listingSections(sector: string, posting: string): ListingSection[] {
  if (sector === "plot") return plotSections();
  if (sector === "commercial") return commercialSections(posting);
  if (posting === "pg") return pgSections();
  if (posting === "flatmates") return flatmateSections();
  if (posting === "resale") return resaleSections();
  return rentSections();
}

function plotSections(): ListingSection[] {
  return [
    {
      id: "plot-details",
      title: "Property details",
      fields: [
        titleField,
        { name: "details.plotArea", label: "Plot area (sq.ft)", kind: "number", required: true },
        { name: "details.length", label: "Length (ft)", kind: "number" },
        { name: "details.width", label: "Width (ft)", kind: "number" },
        { name: "details.boundaryWall", label: "Boundary wall", kind: "yesno", required: true },
        { name: "details.floorsAllowed", label: "Floors allowed for construction", kind: "number" },
        { name: "details.cornerPlot", label: "Corner plot", kind: "yesno" },
        { name: "details.insideGatedProject", label: "Inside a gated project", kind: "yesno" },
        { name: "details.facing", label: "Facing", kind: "select", options: FACING },
      ],
    },
    locationSection("plot-location"),
    {
      id: "plot-resale",
      title: "Resale details",
      fields: [
        { name: "price", label: "Expected price (₹)", kind: "number", required: true },
        { name: "details.priceNegotiable", label: "Price negotiable", kind: "yesno" },
        { name: "details.availableFrom", label: "Available from", kind: "date", required: true },
        { name: "details.currentlyUnderLoan", label: "Currently under loan", kind: "yesno" },
        { name: "description", label: "Description", kind: "textarea", placeholder: DESCRIPTION_PLACEHOLDER },
      ],
    },
    {
      id: "plot-amenities",
      title: "Amenities",
      fields: [
        {
          name: "details.waterSupply",
          label: "Water supply",
          kind: "select",
          options: [opt("corporation", "Corporation"), opt("borewell", "Borewell"), opt("both", "Both"), opt("none", "None")],
        },
        {
          name: "details.electricityConnection",
          label: "Electricity connection",
          kind: "select",
          options: [
            opt("electricity_board", "Electricity Board"),
            opt("solar", "Solar"),
            opt("both", "Both"),
            opt("none", "None"),
          ],
        },
        { name: "details.facingRoadWidth", label: "Width of facing road (ft)", kind: "number" },
        { name: "details.gatedSecurity", label: "Gated security", kind: "yesno" },
        { name: "details.directionsTip", label: "Directions tip for buyers", kind: "textarea" },
      ],
    },
    gallerySection("plot-gallery"),
    {
      id: "plot-additional",
      title: "Additional information",
      fields: [
        {
          name: "details.ownership",
          label: "Ownership",
          kind: "radio",
          options: [
            opt("freehold", "Freehold"),
            opt("leasehold", "Leasehold"),
            opt("cooperative", "Co-operative Society"),
            opt("poa", "Power of Attorney"),
          ],
        },
        {
          name: "details.conversionCertificate",
          label: "Conversion certificate",
          kind: "select",
          options: [opt("yes", "Yes"), opt("no", "No"), opt("not_needed", "Not Needed"), opt("dont_know", "Don't Know")],
        },
      ],
    },
  ];
}

function commercialSections(posting: string): ListingSection[] {
  const money: ListingField[] =
    posting === "sale"
      ? [
          { name: "price", label: "Expected sale price", kind: "number", required: true },
          { name: "details.priceNegotiable", label: "Price negotiable", kind: "yesno" },
          {
            name: "details.ownershipType",
            label: "Ownership type",
            kind: "select",
            required: true,
            options: [opt("freehold", "Freehold"), opt("leasehold", "Leasehold"), opt("other", "Other")],
          },
          { name: "details.possessionDate", label: "Possession / available from", kind: "date", required: true },
        ]
      : [
          { name: "price", label: "Expected rent", kind: "number", required: true },
          { name: "details.rentNegotiable", label: "Rent negotiable", kind: "yesno" },
          { name: "details.securityDeposit", label: "Security deposit", kind: "number", required: true },
          { name: "details.depositNegotiable", label: "Deposit negotiable", kind: "yesno" },
          { name: "details.leaseDuration", label: "Lease duration (months)", kind: "number" },
          { name: "details.lockInPeriod", label: "Lock-in period (months)", kind: "number" },
          { name: "details.availableFrom", label: "Available from", kind: "date", required: true },
        ];

  return [
    {
      id: "commercial-details",
      title: "Property details",
      fields: [
        titleField,
        { name: "details.commercialPropertyType", label: "Property type", kind: "select", required: true, options: COMMERCIAL_TYPES },
        { name: "details.buildingType", label: "Building type", kind: "select", required: true, options: BUILDING_TYPES },
        { name: "details.ageOfProperty", label: "Age of property", kind: "select", required: true, options: COMMERCIAL_AGE },
        { name: "details.floor", label: "Floor", kind: "select", required: true, options: COMMERCIAL_FLOORS },
        {
          name: "details.totalFloors",
          label: "Total floors",
          kind: "select",
          required: true,
          options: COMMERCIAL_FLOORS.filter((item) => item.value !== "0"),
        },
        { name: "details.superBuiltUpArea", label: "Super built-up area (sq.ft)", kind: "number", required: true },
        { name: "details.furnishing", label: "Furnishing", kind: "select", required: true, options: FURNISHING },
        { name: "details.onMainRoad", label: "On main road", kind: "yesno" },
        { name: "details.cornerProperty", label: "Corner property", kind: "yesno" },
        { name: "details.whatsappUpdates", label: "WhatsApp updates", kind: "yesno" },
      ],
    },
    locationSection("commercial-location"),
    {
      id: "commercial-money",
      title: posting === "sale" ? "Sale details" : "Rent details",
      fields: [
        ...money,
        { name: "details.maintenanceAmount", label: "Maintenance", kind: "number" },
        {
          name: "details.maintenanceFrequency",
          label: "Maintenance frequency",
          kind: "select",
          options: [opt("monthly", "Monthly"), opt("quarterly", "Quarterly"), opt("yearly", "Yearly"), opt("included", "Included")],
        },
        {
          name: "details.occupancyStatus",
          label: "Current status",
          kind: "select",
          options: [opt("vacant", "Vacant"), opt("occupied", "Occupied"), opt("available_soon", "Available soon")],
        },
      ],
    },
    {
      id: "commercial-amenities",
      title: "Amenities",
      fields: [
        {
          name: "details.powerBackup",
          label: "Power backup",
          kind: "select",
          options: [opt("full", "Full"), opt("partial", "Partial"), opt("need_to_arrange", "Need to arrange"), opt("none", "None")],
        },
        { name: "details.lift", label: "Lift", kind: "select", options: [opt("common", "Common"), opt("private", "Private"), opt("none", "None")] },
        { name: "details.washroom", label: "Washroom", kind: "select", options: [opt("private", "Private"), opt("shared", "Shared"), opt("none", "No washroom")] },
        { name: "details.waterStorage", label: "Water storage", kind: "select", options: [opt("yes", "Yes"), opt("no", "No"), opt("na", "NA")] },
        { name: "details.security", label: "Security", kind: "select", options: [opt("yes", "Yes"), opt("no", "No")] },
        { name: "details.wifi", label: "Wi-Fi", kind: "select", options: [opt("yes", "Yes"), opt("no", "No")] },
        { name: "details.parkingAvailable", label: "Parking available", kind: "yesno" },
        { name: "details.parkingCount", label: "Parking slots", kind: "number", required: true, show: (d) => d.parkingAvailable === "yes" },
        { name: "details.airConditioning", label: "Air conditioning", kind: "select", options: [opt("central", "Central"), opt("split", "Split"), opt("none", "None")] },
      ],
    },
    gallerySection("commercial-gallery"),
    {
      id: "commercial-additional",
      title: "Additional information",
      fields: [
        { name: "description", label: "Property description", kind: "textarea", required: true, placeholder: DESCRIPTION_PLACEHOLDER },
        { name: "details.otherFeatures", label: "Other features", kind: "textarea" },
        {
          name: "details.contactPreference",
          label: "Contact preference",
          kind: "radio",
          required: true,
          options: [opt("phone", "Phone"), opt("whatsapp", "WhatsApp"), opt("both", "Both")],
        },
        {
          name: "details.contactAvailability",
          label: "Contact availability",
          kind: "select",
          options: [opt("anytime", "Anytime"), opt("business_hours", "Business hours"), opt("custom", "Custom")],
        },
      ],
    },
    {
      id: "commercial-schedule",
      title: "Schedule",
      fields: [
        {
          name: "details.preferredVisitDays",
          label: "Preferred visit days",
          kind: "checks",
          options: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => opt(day, day)),
        },
        { name: "details.preferredVisitStart", label: "Visit start time", kind: "time" },
        { name: "details.preferredVisitEnd", label: "Visit end time", kind: "time" },
      ],
    },
  ];
}

function pgSections(): ListingSection[] {
  return [
    { id: "pg-rooms", title: "Room details", fields: [titleField, { name: "details.roomTypes", label: "Room types", kind: "pgRooms", required: true }] },
    locationSection("pg-location"),
    {
      id: "pg-detail",
      title: "PG details",
      fields: [
        { name: "details.availableFor", label: "Place is available for", kind: "radio", required: true, options: [opt("male", "Male"), opt("female", "Female"), opt("anyone", "Anyone")] },
        { name: "details.preferredGuests", label: "Preferred guests", kind: "select", required: true, options: [opt("working", "Working Professional"), opt("student", "Student"), opt("both", "Both")] },
        { name: "details.availableFrom", label: "Available from", kind: "date", required: true },
        { name: "details.foodIncluded", label: "Food included", kind: "yesno", required: true },
        { name: "details.mealTypes", label: "Meals", kind: "checks", options: [opt("breakfast", "Breakfast"), opt("lunch", "Lunch"), opt("dinner", "Dinner")], show: (d) => d.foodIncluded === "yes" },
        { name: "details.foodNotes", label: "Food schedule / notes", kind: "textarea", show: (d) => d.foodIncluded === "yes" },
      ],
    },
    {
      id: "pg-rules",
      title: "PG rules",
      fields: [
        { name: "details.rules", label: "Rules", kind: "checks" },
        { name: "details.gateClosingTime", label: "Gate closing time", kind: "time" },
        { name: "description", label: "Description", kind: "textarea", placeholder: DESCRIPTION_PLACEHOLDER },
      ],
    },
    {
      id: "pg-amenities",
      title: "Amenities",
      fields: [
        { name: "details.laundry", label: "Laundry", kind: "yesno" },
        { name: "details.laundryTiming", label: "Laundry timing", kind: "text", show: (d) => d.laundry === "yes" },
        { name: "details.roomCleaning", label: "Room cleaning", kind: "yesno" },
        { name: "details.roomCleaningTiming", label: "Room cleaning timing", kind: "text", show: (d) => d.roomCleaning === "yes" },
        { name: "details.warden", label: "Warden facility", kind: "yesno" },
        { name: "details.directionsTip", label: "Directions tip for tenants", kind: "textarea" },
        checks("details.amenityList", "Available amenities", PG_AMENITIES),
        { name: "details.parking", label: "Parking", kind: "select", options: PARKING },
      ],
    },
    gallerySection("pg-gallery"),
  ];
}

function flatmateSections(): ListingSection[] {
  return [
    {
      id: "flatmates-details",
      title: "Property details",
      fields: [
        titleField,
        ...homeTypeFields(false),
        { name: "details.roomType", label: "Room type", kind: "radio", required: true, options: [opt("single", "Single Room"), opt("shared", "Shared Room")] },
        { name: "details.tenantType", label: "Tenant type", kind: "radio", required: true, options: [opt("male", "Male"), opt("female", "Female")] },
        { name: "details.propertyAge", label: "Property age", kind: "select", required: true, options: RENT_AGE },
        { name: "details.facing", label: "Facing", kind: "select", options: FACING_WITH_UNKNOWN },
        { name: "details.builtUpArea", label: "Built-up area (sq.ft)", kind: "number", required: true },
      ],
    },
    locationSection("flatmates-location"),
    { id: "flatmates-rent", title: "Rental details", fields: rentMoney(false) },
    {
      id: "flatmates-amenities",
      title: "Amenities",
      fields: [
        { name: "details.attachedBathroom", label: "Attached bathroom", kind: "yesno", required: true },
        { name: "details.acRoom", label: "AC room", kind: "yesno", required: true },
        { name: "details.balcony", label: "Balcony", kind: "yesno" },
        { name: "details.nonVegAllowed", label: "Non-veg allowed", kind: "yesno", required: true },
        { name: "details.smokingAllowed", label: "Smoking allowed", kind: "yesno" },
        { name: "details.drinkingAllowed", label: "Drinking allowed", kind: "yesno" },
        { name: "details.gym", label: "Gym", kind: "yesno", required: true },
        { name: "details.gatedSecurity", label: "Gated security", kind: "yesno", required: true },
        { name: "details.whoWillShow", label: "Who will show the property", kind: "select", required: true, options: WHO_SHOWS },
        { name: "details.secondaryNumber", label: "Secondary number", kind: "text" },
        { name: "details.waterSupply", label: "Water supply", kind: "select", options: [opt("corporation", "Corporation")] },
        { name: "details.directionsTip", label: "Directions tip for tenants", kind: "textarea" },
        checks("details.amenityList", "Amenities", FLATMATE_AMENITIES),
      ],
    },
    gallerySection("flatmates-gallery"),
  ];
}

function resaleSections(): ListingSection[] {
  return [
    {
      id: "resale-details",
      title: "Property details",
      fields: [
        titleField,
        ...homeTypeFields(true),
        { name: "details.ownershipResale", label: "Ownership type", kind: "select", options: [opt("self_owned", "Self owned"), opt("on_lease", "On lease")] },
        { name: "details.leaseYears", label: "Lease years", kind: "number", show: (d) => d.ownershipResale === "on_lease" },
        { name: "details.builtUpArea", label: "Built-up area (sq.ft)", kind: "number", required: true },
        { name: "details.carpetArea", label: "Carpet area (sq.ft)", kind: "number" },
        { name: "details.propertyAge", label: "Property age", kind: "select", required: true, options: RESALE_AGE },
        { name: "details.facing", label: "Facing", kind: "select", required: true, options: FACING_WITH_UNKNOWN },
        {
          name: "details.floorType",
          label: "Floor type",
          kind: "select",
          options: [opt("vitrified", "Vitrified Tiles"), opt("mosaic", "Mosaic"), opt("marble", "Marble/Granite"), opt("wooden", "Wooden"), opt("cement", "Cement")],
        },
      ],
    },
    locationSection("resale-location"),
    {
      id: "resale-price",
      title: "Resale details",
      fields: [
        { name: "price", label: "Expected price (₹)", kind: "number", required: true },
        { name: "details.maintenanceCost", label: "Maintenance cost (₹ / month)", kind: "number", required: true },
        { name: "details.priceNegotiable", label: "Price negotiable", kind: "yesno" },
        { name: "details.currentlyUnderLoan", label: "Currently under loan", kind: "yesno" },
        { name: "details.availableFrom", label: "Available from", kind: "date", required: true },
        { name: "details.kitchenType", label: "Kitchen type", kind: "select", options: [opt("modular", "Modular"), opt("covered", "Covered Shelves"), opt("open", "Open Shelves")] },
        { name: "details.furnishing", label: "Furnishing", kind: "select", required: true, options: FURNISHING },
        { name: "details.parking", label: "Parking", kind: "select", required: true, options: PARKING },
        { name: "description", label: "Description", kind: "textarea", placeholder: DESCRIPTION_PLACEHOLDER },
      ],
    },
    {
      id: "resale-amenities",
      title: "Amenities",
      fields: [
        { name: "details.bathroomCount", label: "Bathrooms", kind: "stepper", required: true },
        { name: "details.balconyCount", label: "Balcony", kind: "stepper" },
        { name: "details.gym", label: "Gym", kind: "yesno", required: true },
        { name: "details.gatedSecurity", label: "Gated security", kind: "yesno", required: true },
        { name: "details.whoWillShow", label: "Who will show the property", kind: "select", required: true, options: WHO_SHOWS },
        { name: "details.secondaryNumber", label: "Secondary number", kind: "text" },
        { name: "details.similarUnits", label: "Similar units available", kind: "yesno" },
        { name: "details.directionsTip", label: "Directions tip for buyers", kind: "textarea" },
        checks("details.amenityList", "Amenities", RESALE_AMENITIES),
      ],
    },
    gallerySection("resale-gallery"),
    {
      id: "resale-docs",
      title: "Additional information",
      fields: [
        { name: "details.allotmentLetter", label: "Allotment letter", kind: "select", required: true, options: YES_NO_DOC },
        { name: "details.saleDeed", label: "Sale deed certificate", kind: "select", required: true, options: YES_NO_DOC },
        { name: "details.saleAgreement", label: "Sale agreement", kind: "select", required: true, options: YES_NO_DOC, show: (d) => d.saleDeed === "no" },
        { name: "details.propertyTax", label: "Property tax paid", kind: "select", required: true, options: YES_NO_DOC },
        { name: "details.occupancyCertificate", label: "Occupancy certificate", kind: "select", required: true, options: YES_NO_DOC },
      ],
    },
  ];
}

function rentSections(): ListingSection[] {
  return [
    {
      id: "rent-details",
      title: "Property details",
      fields: [
        titleField,
        ...homeTypeFields(false),
        { name: "details.propertyAge", label: "Property age", kind: "select", required: true, options: RENT_AGE },
        { name: "details.facing", label: "Facing", kind: "select", options: FACING_WITH_UNKNOWN },
        { name: "details.builtUpArea", label: "Built-up area (sq.ft)", kind: "number", required: true },
      ],
    },
    locationSection("rent-location"),
    {
      id: "rent-money",
      title: "Rent details",
      fields: [
        {
          name: "details.preferredTenants",
          label: "Preferred tenants",
          kind: "radio",
          required: true,
          options: [
            opt("anyone", "Anyone"),
            opt("family", "Family"),
            opt("bachelor_female", "Bachelor Female"),
            opt("bachelor_male", "Bachelor Male"),
            opt("company", "Company"),
          ],
        },
        ...rentMoney(true),
      ],
    },
    {
      id: "rent-amenities",
      title: "Amenities",
      fields: [
        { name: "details.bathroomCount", label: "Bathrooms", kind: "stepper", required: true },
        { name: "details.balconyCount", label: "Balcony", kind: "stepper" },
        { name: "details.waterSupply", label: "Water supply", kind: "select", options: [opt("corporation", "Corporation")] },
        { name: "details.petAllowed", label: "Pet allowed", kind: "yesno", required: true },
        { name: "details.gym", label: "Gym", kind: "yesno", required: true },
        { name: "details.nonVegAllowed", label: "Non-veg allowed", kind: "yesno", required: true },
        { name: "details.gatedSecurity", label: "Gated security", kind: "yesno", required: true },
        { name: "details.whoWillShow", label: "Who will show the property", kind: "select", options: WHO_SHOWS },
        {
          name: "details.propertyCondition",
          label: "Current property condition",
          kind: "select",
          options: [
            opt("vacant", "Vacant"),
            opt("notice", "Tenant on Notice Period"),
            opt("new", "New Property"),
            opt("need_help", "Need Help to Manage"),
          ],
        },
        { name: "details.secondaryNumber", label: "Secondary number", kind: "text" },
        { name: "details.similarUnits", label: "Similar units available", kind: "yesno" },
        { name: "details.directionsTip", label: "Directions tip for tenants", kind: "textarea" },
        checks("details.amenityList", "Amenities", RENT_AMENITIES),
      ],
    },
    gallerySection("rent-gallery", true),
  ];
}
