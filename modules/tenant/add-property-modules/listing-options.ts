export const opt = (value: string, label: string) => ({ value, label });

export const FACING = [
  opt("north", "North"),
  opt("south", "South"),
  opt("east", "East"),
  opt("west", "West"),
  opt("north-east", "North-East"),
  opt("south-east", "South-East"),
  opt("north-west", "North-West"),
  opt("south-west", "South-West"),
];

export const FACING_WITH_UNKNOWN = [...FACING, opt("dont_know", "Don't know")];

export const RENT_AGE = [
  opt("less_than_a_year", "Less than a year"),
  opt("1_to_3", "1–3 years"),
  opt("3_to_5", "3–5 years"),
  opt("5_to_10", "5–10 years"),
  opt("more_than_10", "More than 10 years"),
];

export const RESALE_AGE = [opt("under_construction", "Under construction"), ...RENT_AGE];

export const BHK = [
  opt("1", "1 BHK"),
  opt("2", "2 BHK"),
  opt("3", "3 BHK"),
  opt("4", "4 BHK"),
  opt("4+", "4+ BHK"),
];

export const FLOORS = [
  opt("ground", "Ground"),
  ...Array.from({ length: 99 }, (_, index) => opt(String(index + 1), String(index + 1))),
];

export const HOUSE_FLOORS = [
  opt("ground", "Ground only"),
  opt("1", "1"),
  opt("2", "2"),
  opt("3", "3"),
  opt("4", "4"),
  opt("5", "5"),
];

export const FURNISHING = [
  opt("unfurnished", "Unfurnished"),
  opt("semi-furnished", "Semi-furnished"),
  opt("furnished", "Fully furnished"),
];

export const PARKING = [
  opt("bike", "Bike"),
  opt("car", "Car"),
  opt("both", "Both"),
  opt("none", "None"),
];

export const YES_NO_DOC = [opt("yes", "Yes"), opt("no", "No"), opt("dont_know", "Don't know")];

export const WHO_SHOWS = [
  opt("need_help", "Need Help"),
  opt("i_will_show", "I will show"),
  opt("neighbours", "Neighbours"),
  opt("friends", "Friends/Relatives"),
  opt("security", "Security"),
  opt("tenants", "Tenants"),
  opt("others", "Others"),
];

export const RENT_AMENITIES = [
  "Lift",
  "Air Conditioner",
  "Intercom",
  "Children Play Area",
  "Servant Room",
  "Gas Pipeline",
  "Rain Water Harvesting",
  "House Keeping",
  "Visitor Parking",
  "Internet Services",
  "Club House",
  "Swimming Pool",
  "Fire Safety",
  "Shopping Center",
  "Park",
  "Sewage Treatment Plant",
  "Power Backup",
];

export const RESALE_AMENITIES = [
  "Club House",
  "Lift",
  "Intercom",
  "Shopping Center",
  "Sewage Treatment Plant",
  "Gas Pipeline",
  "Swimming Pool",
  "Fire Safety",
  "Children Play Area",
  "Park",
  "Visitor Parking",
  "Internet Provider",
];

export const FLATMATE_AMENITIES = [
  "Lift",
  "Club House",
  "Park",
  "House Keeping",
  "Gas Pipeline",
  "Visitor Parking",
  "Swimming Pool",
  "Power Backup",
  "Shopping Center",
  "Intercom",
  "Sewage Treatment Plant",
  "Fire Safety",
];

export const PG_AMENITIES = [
  "Common TV",
  "Mess",
  "Lift",
  "Refrigerator",
  "WiFi",
  "Cooking Allowed",
  "Power Backup",
];

export const PG_ROOM_AMENITIES = ["Cupboard", "TV", "Bedding", "Geyser", "AC", "Attached Bathroom"];

export const PG_ROOM_TYPES = [
  opt("single", "Single"),
  opt("double", "Double"),
  opt("three", "Three"),
  opt("four", "Four"),
];

export const COMMERCIAL_TYPES = [
  opt("office_space", "Office Space"),
  opt("co_working", "Co-Working"),
  opt("shop", "Shop"),
  opt("showroom", "Showroom"),
  opt("godown_warehouse", "Godown/Warehouse"),
  opt("industrial_shed", "Industrial Shed"),
  opt("industrial_building", "Industrial Building"),
  opt("other_business", "Other business"),
  opt("restaurant_cafe", "Restaurant/Cafe"),
];

export const BUILDING_TYPES = [
  opt("independent_house", "Independent House"),
  opt("business_park", "Business Park"),
  opt("mall", "Mall"),
  opt("standalone_building", "Standalone building"),
  opt("independent_shop", "Independent shop"),
];

export const COMMERCIAL_AGE = [
  opt("less_than_1_year", "Less Than a Year"),
  opt("one_to_five_years", "1 To 5 Year"),
  opt("five_to_ten_years", "5 To 10 Year"),
  opt("more_than_10_years", "More Than 10 Year"),
  opt("under_construction", "Under Construction"),
];

export const COMMERCIAL_FLOORS = [
  opt("0", "Ground"),
  ...Array.from({ length: 40 }, (_, index) => opt(String(index + 1), String(index + 1))),
];

export function pgRuleOptions(availableFor?: string) {
  const common = [
    opt("no_smoking", "No Smoking"),
    opt("no_guardians", "No Guardians Stay"),
    opt("no_drinking", "No Drinking"),
    opt("no_non_veg", "No Non-Veg"),
  ];
  if (availableFor === "male") {
    return [common[0], common[1], opt("no_girls", "No Girl's Entry"), common[2], common[3]];
  }
  if (availableFor === "female") {
    return [common[0], common[1], opt("no_boys", "No Boy's Entry"), common[2], common[3]];
  }
  return common;
}
