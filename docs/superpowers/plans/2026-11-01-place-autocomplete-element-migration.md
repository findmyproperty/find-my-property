# PlaceAutocompleteElement Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace legacy `google.maps.places.Autocomplete` (via `@react-google-maps/api`) with `PlaceAutocompleteElement` so the console deprecation warning goes away and new API keys keep working.

**Architecture:** One shared React wrapper mounts `PlaceAutocompleteElement` programmatically (DOM listeners for `gmp-select` / `input`), then hero, browse, carousel, and service location fields consume that wrapper. Apartment name search keeps its server + `AutocompleteService` fallback for now (separate API surface).

**Tech Stack:** Next.js App Router, `@react-google-maps/api` `useJsApiLoader` (unchanged loader singleton), Maps JS `importLibrary("places")`, Places API (New).

## Global Constraints

- Keep `getGoogleMapsLoaderOptions` as the only loader option set (`libraries: ["places"]`).
- Restrict suggestions to India via `includedRegionCodes: ["in"]`.
- Do not add `@vis.gl/react-google-maps` unless necessary — programmatic mount is enough.
- Preserve free-text submit on hero/browse (`onTextChange` + element `.value`).
- Places API (New) must stay enabled on `NEXT_PUBLIC_GOOGLE_MAP_KEY`.

---

### Task 1: Shared PlaceAutocompleteField

**Files:**
- Create: `components/maps/PlaceAutocompleteField.tsx`
- Create: `components/maps/place-autocomplete-field.css` (host + `::part` styling hooks)

**Interfaces:**
- Produces: `PlaceAutocompleteField` with props `{ placeholder, value, onTextChange, onPlaceSelect, disabled, className, id, name, countryCodes?, noClearButton?, noInputIcon? }`
- Produces: `PlaceAutocompleteSelection { label, lat?, lng?, placeId? }`

- [x] **Step 1:** Implement programmatic `PlaceAutocompleteElement` mount + cleanup
- [x] **Step 2:** Wire `gmp-select` → `placePrediction.toPlace()` → `fetchFields` → `onPlaceSelect`
- [x] **Step 3:** Sync controlled `value` / fire `onTextChange` from `input`
- [x] **Step 4:** Style host to fill width and match nearby inputs

### Task 2: Replace call sites

**Files:**
- Modify: `components/layout/HeroSearchBanner.tsx`
- Modify: `components/layout/ModonHeroCarousel.tsx`
- Modify: `modules/properties/Properties.tsx`
- Modify: `modules/services/LocationSearchField.tsx`

- [x] **Step 1:** Swap `<Autocomplete>` for `<PlaceAutocompleteField>`
- [x] **Step 2:** Remove legacy `autocompleteRef` / `getPlace()` usage
- [x] **Step 3:** Keep geolocation + map preview in `LocationSearchField`

### Task 3: Verify

- [ ] **Step 1:** Confirm browser console no longer logs Autocomplete deprecation on homepage/browse/service forms
- [ ] **Step 2:** Smoke: type + pick place; type free text and submit hero search
- [x] **Step 3:** `pnpm build` passes

### Out of scope (follow-up)

- Migrate `ApartmentNameSearchField` client fallback from `AutocompleteService` → `AutocompleteSuggestion`
- Drop `@react-google-maps/api` Autocomplete imports entirely from the repo (maps/markers still use the package)
