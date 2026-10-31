export const MIN_APARTMENT_PLACE_QUERY_LENGTH = 2;

export type ApartmentPlaceSuggestion = {
  placeId: string;
  name: string;
  secondaryText?: string;
};

export type ApartmentPlaceDetail = {
  placeId: string;
  name: string;
  formattedAddress?: string;
  lat: number;
  lng: number;
  locality?: string;
};
