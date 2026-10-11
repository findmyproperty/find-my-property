---
name: Property form gap analysis
overview: Revised gap analysis. Implementation waits until the combined NoBroker/YDBC document is attached. Existing rows keep a null listingCategory. Later phases add an additive category contract, a stepped create shell with a dirty-aware edit bar, then per-category workflows, list layouts, and detail layouts. Dark UI stays.
todos:
  - id: phase-2-contract
    content: Additive nullable listingCategory and details only, after a schema-diff gate. No backfill. Preserve current payloads, area storage, approval, and status.
    status: pending
  - id: phase-3-form-shell
    content: Shared dark form shell with create Previous/Next, final submit, section validation, edit hydration, and a sticky Update bar tied to confirmed saves.
    status: pending
  - id: phase-4-other-forms
    content: Remaining category workflows with separate schemas and conditional sections, using only fields confirmed in the requirements document.
    status: pending
  - id: phase-5-list
    content: Category-specific fact lines on cards, My Listings, and browse filters, with render tests.
    status: pending
  - id: phase-6-detail
    content: Category-specific detail sections and SEO that do not assume BHK, with section tests.
    status: pending
  - id: phase-7-docs
    content: Update PROPERTY_CREATION.md to match the shipped wizard and category forms.
    status: pending
isProject: false
---

# Property form gap analysis (revised)

No code, schema, or package changes until this plan is accepted. Keep the dark UI and reuse the current form controls, accordion, location, gallery, and video components.

## Phase 1 verification

Code findings below were re-checked against [docs/PROPERTY_CREATION.md](c:\dev\theydbc\find-my-property\docs\PROPERTY_CREATION.md), [modules/tenant/AddProperty.tsx](c:\dev\theydbc\find-my-property\modules\tenant\AddProperty.tsx), [add-property-modules/schema.ts](c:\dev\theydbc\find-my-property\modules\tenant\add-property-modules\schema.ts), [backend/src/properties/entities/property.entity.ts](c:\dev\theydbc\backend\src\properties\entities\property.entity.ts), and [properties.service.ts](c:\dev\theydbc\backend\src\properties\properties.service.ts).

The combined NoBroker/YDBC requirements document is not in the repo, the docs folder, or this chat. The earlier per-category field lists (deposit, preferred tenants, PG food, plot dimensions, commercial subtypes, and their options) are **not verified**. They are removed from the requirements. Do not implement those fields until the document is attached and each option is copied from it.

### Verified existing behavior

One form is used for create and edit by tenants, agents, and admins.

- Create: [app/(roles-routes)/add-property/page.tsx](c:\dev\theydbc\find-my-property\app\(roles-routes)\add-property\page.tsx)
- Edit: [app/(roles-routes)/edit-property/[id]/page.tsx](c:\dev\theydbc\find-my-property\app\(roles-routes)\edit-property\[id]\page.tsx) fetches the property, then mounts the same form
- One Zod schema. Listing type is `Rent | Sale | Lease`. Property type is a free string from admin categories, with fallback Apartment, House, Villa, Townhome
- Required for every listing today: title, property type, listing type, bedrooms 1–5, bathrooms 1–5, area, year built, furnishing, price, address, locality, city, country
- Optional: state, description, 11 fixed amenities, images, thumbnail, video, floor plans, map pin
- Create submits the whole form at once. There is no Previous/Next, no section validation, and no dirty tracking
- Edit hydrates once via `getDefaultValues`. Save redirects to My Listings. There is no sticky update bar
- Non-admin update forces `status` back to `Pending` and clears `approvedAt`. Admin create defaults to `Approved`. Reject stores a required reason
- Area is typed as sq ft, stored as m² (`/ 10.7639`), and rounded back to sq ft on edit
- `listingCategory` does not exist. List ([PropertyCard.tsx](c:\dev\theydbc\find-my-property\modules\properties\PropertyCard.tsx)) and detail ([PropertyDetail.tsx](c:\dev\theydbc\find-my-property\modules\properties\PropertyDetail.tsx)) always show BHK, baths, area, and furnishing
- [app.module.ts](c:\dev\theydbc\backend\src\app.module.ts) sets `synchronize: true`. There are no migrations and no property tests

Defects to fold into the new structure, not patch in isolation:

- Area unit is implicit
- [AdminAgentAssignment.tsx](c:\dev\theydbc\find-my-property\modules\tenant\add-property-modules\AdminAgentAssignment.tsx) is unused and `assignedAgentId` is not submitted
- [edit-property/[id]/add-property/page.tsx](c:\dev\theydbc\find-my-property\app\(roles-routes)\edit-property\[id]\add-property\page.tsx) ignores the id
- Hero search sends `type=Rent` and `category=Commercial`; browse reads `type=rent|buy` and has no category param
- Amenities persist labels, not option ids
- Some selects use `defaultValue` instead of `value`

### Verified structural gap

The seven posting categories you named are not a data model. Today’s `listingType` plus admin `propertyType` cannot represent PG, flatmates, commercial, or plot as their own workflows. List and detail need their own section configs later. Shared chrome (gallery, map, contact, dark card frame) stays.

Category-specific fields and option lists stay **unspecified** until the requirements document is the source.

## Reuse

- Dark accordion, inputs, selects, checkboxes, submit and cancel
- [LocationSection.tsx](c:\dev\theydbc\find-my-property\modules\tenant\add-property-modules\LocationSection.tsx), [PropertyImagesSection.tsx](c:\dev\theydbc\find-my-property\modules\tenant\add-property-modules\PropertyImagesSection.tsx), [VideoSection.tsx](c:\dev\theydbc\find-my-property\modules\tenant\add-property-modules\VideoSection.tsx)
- Approval, leads, comments, and the property id
- [lib/property-mapper.ts](c:\dev\theydbc\find-my-property\lib\property-mapper.ts) as the only mapper
- One card chrome and one detail chrome. Category configs change the fact line and body sections only

Admin `categories.name` stays a subtype label. It is not the posting category. Whether subtypes stay admin-managed is unresolved.

## Target shape

- `listingCategory` enum: `residential_rent | residential_resale | pg | flatmates | commercial_rent | commercial_sale | plot`
- Shared columns stay: title, description, price, currency, address fields, lat/lng, images, thumbnail, video, status, reason, approvedAt, createdBy, assignedAgentId
- Category-only facts go in nullable `details` JSON, validated by a discriminated DTO once the document names those facts
- `listingType` stays `Rent | Sale | Lease` on the wire so current browse and admin filters keep working. New writes may derive it from `listingCategory`. Do not remove `Lease` in Phase 2
- Do not add a column per checkbox

## Phase 2 — Additive contract, no behavior change

Do this only after the schema gate below. The current create/edit screens keep sending today’s payload.

### Synchronize risk

`synchronize: true` applies entity diffs on API boot. That is the migration. TypeORM can add columns, alter types, and drop columns that leave the entity. Risks for this table:

- A new `NOT NULL` column without a default fails or writes a placeholder into every existing row
- Editing the `simple-enum` definitions for `listingType`, `furnishing`, or `status` can rewrite those columns
- `amenities` and `propertyImages` are `simple-array`. A length change can truncate stored URLs
- Changing `area` precision, or stopping the m² conversion, makes old and new rows mean different units. Edit would show the wrong size
- Making `bedrooms`, `bathrooms`, or `yearBuilt` nullable is usually non-destructive, but it is a behavior change and waits until a category form actually omits them
- Booting a wrong entity against the live database is not reversible from git

Gate before any entity edit:

- Backup the database
- Dump `SHOW CREATE TABLE property` and row counts grouped by `status` and `listingType`
- Apply the SQL on a copy first and confirm `id`, `status`, `approvedAt`, `price`, `area`, `propertyImages`, `reason`, and `listingType` are unchanged
- Prefer an explicit `ALTER TABLE` that only adds nullable columns. Do not rely on synchronize to invent the diff. Leave `synchronize: true` as-is for other entities, but review the TypeORM log on staging boot and abort if it alters anything other than the new nullable columns

### Allowed schema change

Additive and nullable only:

- `listingCategory` varchar/enum, nullable, no default
- `details` JSON, nullable

No change to area storage, bedroom nullability, furnishing enum, status enum, or listing type enum.

### No backfill

Confirmed decision: do not stamp `listingCategory` on existing rows. After the additive columns exist, every current property stays `listingCategory = NULL` and `details = NULL`. No update script runs against `status`, `approvedAt`, `price`, `area`, images, or `listingType`.

Current clients omit `listingCategory`. Create and update must still succeed and must store `NULL` when the field is omitted. Do not derive a category from `listingType` or `propertyType`. When the field is sent, validate it against the enum. `forbidNonWhitelisted` stays; new fields are optional so old payloads are not rejected.

Non-admin update must still force `Pending` and clear `approvedAt`. Admin approve/reject behavior stays.

### Phase 2 tests

- Current create payload without `listingCategory` still creates, stores `listingCategory` and `details` as null, and does not change area. Tenant/agent result is `Pending`. Admin result is `Approved` when status is omitted
- PATCH of title on an approved non-admin listing still becomes `Pending` and does not change `price`, `area`, or `listingCategory`
- Loading rows saved before Phase 2 returns `listingCategory: null` and the same `status` and `area` as before
- Sending `listingCategory: "plot"` is accepted and stored, and does not alter `status`
- Unknown `listingCategory` is rejected

Acceptance: existing rows keep a null category, their approval state, and their area numbers; the current form still creates and edits; staging schema diff shows only the two new nullable columns.

## Phase 3 — Shared form shell

Reuse the dark accordion and existing section components. This phase moves the **current** fields into a shell. It does not add unverified NoBroker fields.

Create and edit are different interactions.

**Create**

- One `useForm` instance for the whole flow. Step changes hide sections; they do not remount the form, so values survive Previous/Next
- Previous and Next in the footer. Next calls `trigger` on that section’s field names only. Invalid sections stay put and show the existing field errors
- Create Property is rendered only on the last section. Earlier sections cannot submit
- Final submit runs the full current schema, then the existing POST. Success still returns to My Listings
- No sticky update bar on create

**Edit**

- Do not render the form until `getRawProperty` resolves, then `reset` from the saved property once
- Take a deep snapshot of those saved values after reset. Dirty means the current values differ from that snapshot after normalizing empty strings and numeric strings. Do not use RHF `isDirty` as the source of truth
- All current sections stay available (accordion). This is not the create wizard
- A sticky **Update Property** bar is shown only while the snapshot comparison is dirty. Hide it when the form matches the snapshot
- Update validates the full schema, then PATCH. On HTTP success, replace the snapshot from the API response and hide the bar. Stay on the edit page
- On failure, leave the form and the snapshot unchanged so the bar remains and the user’s edits remain
- Server-forced status (`Pending` for non-admins) is not treated as an unsaved edit

Category picker can select Residential Rent only. Other categories are visible and disabled until Phase 4.

### Phase 3 tests

- Next does not advance when the active section is invalid, and does not show Create Property
- Values entered on step 1 are still present after Next and Previous
- Create Property submits only from the last step
- Edit initializes title, price, listing type, and images from the saved payload
- Sticky bar is absent on a freshly loaded edit form
- Changing one field shows the bar; restoring the original value hides it
- A resolved PATCH clears the bar; a rejected PATCH keeps the edited value and the bar

Acceptance: create is a wizard over today’s fields; edit shows Update Property only for real unsaved changes; a failed save does not wipe the form; the visual style matches the current dark form.

## Phase 4 — Category workflows

Confirmed decision: no implementation of any phase starts until the combined NoBroker/YDBC requirements document is attached. Phase 4 in particular cannot name fields before that. Each category gets its own Zod schema and section list, mounted by the Phase 3 shell. Conditional fields come from that document only. If an option list is missing or unclear, leave the field out and record it under unresolved decisions.

Implement in this order: Residential Resale, Commercial Rent, Commercial Sale, Land/Plot, PG/Hostel, Flatmates. Residential Rent gains only the extra fields the document confirms; the shell from Phase 3 already covers the current rent fields.

Switching category clears answers that do not belong to the new schema. Edit reopens the saved `listingCategory` and hydrates `details`. Floor plans stay on the categories the document includes; do not assume they belong on plot or PG.

Making `bedrooms`, `bathrooms`, and `yearBuilt` optional in the DTO and nullable in the database happens in this phase, only for categories whose schema omits them, and only through the same schema gate as Phase 2.

### Phase 4 tests

- One schema test per confirmed category: valid payload passes; a field required by that category fails when empty
- A plot or PG payload is not required to send bedrooms when that category’s schema says so
- Hidden fields from the previous category are not submitted
- Edit of a saved category rehydrates `details` and marks the form clean

Acceptance: each enabled category has its own sections; create still uses Previous/Next; edit still uses the sticky bar; no field is added that the document does not name.

## Phase 5 — List layouts

One card frame. A per-category fact config chooses the line under the price. Empty `details` or null `listingCategory` falls back to today’s BHK / baths / area line so favorites, featured, dashboards, and similar listings still render.

Browse can filter by `listingCategory` without dropping the current rent/buy filter. Fix the hero params so they match the browse parser.

### Phase 5 tests

- A residential card still shows BHK
- A category with no bedroom fact does not render “BHK”
- A null `listingCategory` uses the current card facts
- My Listings rows show the category label when it is set

Acceptance: list and My Listings stay on the dark card/row design; old listings do not lose their facts.

## Phase 6 — Detail layouts

Same page chrome: gallery, map, contact. A section registry per category mounts body sections. Null category keeps today’s sections. SEO and JSON-LD use category templates and omit BHK when the listing has no bedrooms.

### Phase 6 tests

- Residential detail still shows key facts, amenities, and floor plans
- A category whose registry omits floor plans does not render that section
- Metadata for a listing without bedrooms does not contain “BHK”

Acceptance: detail layout differs by category; gallery, map, and contact look the same as today.

## Phase 7 — Docs

Update [docs/PROPERTY_CREATION.md](c:\dev\theydbc\find-my-property\docs\PROPERTY_CREATION.md) so create steps, the final Create Property action, and the edit sticky bar match the shipped UI. Tests already landed in Phases 2–6.

Acceptance: a reader can create and edit a listing from the manual without meeting a control the page does not have.

## Dependencies

- Phase 3 depends on Phase 2 types, and can use null `listingCategory` as “current residential form”
- Phase 4 depends on Phase 3’s shell and on the requirements document
- Phases 5 and 6 depend on Phase 2 and should follow Phase 4 so `details` is real
- List work and detail work stay separate configs. Do not fold them into the form phases

## Decisions locked

- Implementation does not start until the combined NoBroker/YDBC requirements document is attached. Field names and options will be copied from that document only
- No backfill. Existing rows keep `listingCategory` null. The server does not infer a category from `listingType` or `propertyType`

## Still unresolved — answer from the document before Phase 4

These are not implied by the code or by [PROPERTY_CREATION.md](c:\dev\theydbc\find-my-property\docs\PROPERTY_CREATION.md). If the attached document does not answer one, leave that behavior unchanged.

- Whether `Lease` remains a listing type, maps to Commercial Rent, or stays a legacy value with null category
- Whether subtypes stay admin-managed categories or become fixed lists
- Flatmates: one posting flow or two, only if the document shows both
- Whether photos are required
- Whether visit scheduling is in scope
- Whether browse becomes category-first
- City-specific legal fields, only if the document lists them

## Already decided in this revision

- Area stays m² on disk through Phase 2 and Phase 3. A unit column and a conversion migration are a later, separate change
- Create stays a wizard. Edit stays a full form with the sticky bar, and stays on the page after a successful update
- List and detail keep today’s facts when `listingCategory` is null
