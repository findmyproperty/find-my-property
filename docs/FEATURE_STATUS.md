# The YBDC — feature status for clients

**Companion document:** [USER_GUIDE.md](./USER_GUIDE.md) explains *how to use* the site. This document explains *what is built*, *what differs from your PDF specifications*, and *what is not in this release*.

**Test site:** use your UAT or staging URL when following the user guide.

*Last updated for the current property listing wizard, browse, services, and partner flows.*

---

## Table of contents

1. [Summary at a glance](#1-summary-at-a-glance)
2. [Changes from your specification (PDF)](#2-changes-from-your-specification-pdf)
3. [Platform features](#3-platform-features)
4. [Property listings by type](#4-property-listings-by-type)
5. [Service partners](#5-service-partners)
6. [Property agents](#6-property-agents)
7. [Not in this release](#7-not-in-this-release)
8. [Suggested next priorities](#8-suggested-next-priorities)
9. [Documents to send](#9-documents-to-send)

---



## 1. Summary at a glance


| Area                  | Delivered                                                       | Partial                                                                         | Not yet / not planned                   |
| --------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------- |
| **Account & sign-in** | Phone OTP, register, first-time profile                         | —                                                                               | —                                       |
| **Search & listings** | Browse (list + map), filters, property detail, enquiry          | Some home-page links do not pre-set browse filters; saved favorites not offered | Full “My Favorites” experience          |
| **Post a property**   | All sectors and types in the matrix below; approval workflow    | Some PDF field details (see Section 2); older listings use a simpler edit form  | Items marked *Not planned* in Section 2 |
| **Services & loans**  | Service pages, forms, **My Requests** tracking                  | —                                                                               | —                                       |
| **Service partners**  | Register, KYC, approval, leads, wallet, support, public profile | Masked **Call customer** only when platform calling is enabled                  | —                                       |
| **Property agents**   | Same listing form as owners; **Leads**; **Reports**             | —                                                                               | —                                       |
| **Staff review**      | Listings reviewed before go-live; rejection reason to owner     | —                                                                               | —                                       |




### What the labels mean

- **Delivered** — Available on the test site today; main flow works.
- **Partial** — The flow works end-to-end, but not every detail from the PDF is matched (often covered in Section 2).
- **Changed from PDF** — We built something *different on purpose* from the PDF. See Section 2; this is not a defect.
- **Not yet** — Expected capability or PDF item not implemented; may be scheduled if you want it in scope.
- **Not planned** — Out of scope for this release (agreed or documented omission).

If something is **Changed from PDF**, treat it as an intentional difference—not a bug. Items under **Not yet** are candidates for a future release if you approve them.

---



## 2. Changes from your specification (PDF)

Your team shared three property form references: **Residential property PDF** (rent, resale, PG/hostel, flatmates), **Plot PDF**, and **Commercial PDF**. The table below lists where the live site **differs** from those documents.


| Your PDF says                                                                          | What we built                                                                                                                          | Why / note                                                                                                           |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Residential PDF:** choose **city** first, then property category                     | **Sector** (Residential / Commercial / Land·Plot) and **listing type** first; **city** is entered in **Locality details** with the map | Same information is collected; order is simplified for a single national site                                        |
| **Residential PDF:** separate top-level **Lease** listing type                         | **Only rent** or **Only lease** inside **Residential → Rent**                                                                          | Lease is supported without a seventh top-level category                                                              |
| **Residential PDF:** full editable **furnishing items** list when semi/fully furnished | Small preset checklist (e.g. TV, Sofa)                                                                                                 | Faster to post; a full catalog can be added if you require it                                                        |
| **Residential PDF:** **Apartment name** as a dropdown (flatmates)                      | **Text** field for society or apartment name                                                                                           | Works for any society without maintaining a master list                                                              |
| **Residential PDF:** gallery “upload through phone”, WhatsApp/email upload wording     | Standard **photo and video upload** in the browser                                                                                     | Same outcome; different upload experience                                                                            |
| **Residential PDF:** water supply with multiple options on some screens                | **Corporation** (and similar limited lists) on some residential steps                                                                  | Subset of PDF options; can be expanded to match screenshots                                                          |
| **Plot PDF §6:** sale deed, **encumbrance**, **RERA** status fields                    | **Not shown** on the form                                                                                                              | **Not planned** for this release; only **ownership** and **conversion certificate** appear in Additional information |
| **Plot PDF:** visit **schedule** section                                               | **Not included**                                                                                                                       | Matches the plot specification (schedule excluded there)                                                             |
| **Commercial PDF:** **Ideal for** / business-use matrix                                | **Not shown**                                                                                                                          | **Not planned** for this release                                                                                     |
| **Commercial PDF:** **Schedule** step (visit days and hours)                           | **Contact preference** (phone / WhatsApp / both) and **contact availability**; no day-by-day schedule screen                           | Visit scheduling simplified; full schedule step can be added if required                                             |
| **Commercial PDF:** **building type** options depend on **property type**              | One **building type** list for all commercial property types                                                                           | Simpler form; dynamic lists can match the PDF if required                                                            |
| **Platform:** save listings to **favorites**                                           | **Not exposed** in the main menu (favorites not a full feature)                                                                        | **Not yet** — deferred                                                                                               |
| **Marketing / home:** browse links using “category”                                    | **Browse** uses **sector**, **rent/buy**, and related filters                                                                          | Some home-page links may not pre-filter; filters work on the **Browse** page itself                                  |


---



## 3. Platform features



### Delivered

- **Sign-in and registration** with mobile OTP (customers and service partners).
- **Complete your profile** on first login: email, name, and full address (with optional “use current location”).
- **Public website:** home, about, contact, terms, list-your-property information, and service landing pages (home services, packers & movers, painting & cleaning, IT, events, job consultancy, general services, loans).
- **Browse properties:** list and map views; search and filters including sector and listing type where applicable; only **approved** listings are public.
- **Property detail:** photos, video, floor plans (when provided), map, description, amenities; signed-in users can **send an enquiry**.
- **My Listings:** step-by-step wizard to create a listing; edit and delete; status **Pending**, **Approved**, or **Rejected** with a reason; email when approved or rejected.
- **My Requests:** track service bookings, loan applications, and consultancy requests in one place.
- **Service partners:** registration, business profile, document upload, verification, job leads, wallet, support tickets, alerts, and public partner page after approval.
- **Property agents:** post listings like owners; **Leads** for enquiries; **Reports** for activity summary.
- **Platform review:** tenant and agent listings are reviewed before they appear on the public site.



### Partial

- **Saved favorites** — not offered as a dedicated “My Favorites” area in the menu.
- **Home-page browse links** — may not apply the same filters as the **Browse** page (see Section 2).
- **Listing cards** — new listings show category-appropriate highlights; **older listings** without a sector still show the classic layout (BHK, baths, area).



### Not yet

- Full **favorites / saved properties** for tenants (if you want this in scope).
- Align all **marketing links** to open **Browse** with the correct filters pre-selected.

---



## 4. Property listings by type

New listings use: **Residential** (Rent, Resale, PG/Hostel, Flatmates), **Commercial** (Rent, Sale), **Land/Plot** (Resale). Cross-cutting fields: title, locality, map pin, price, photos, video, description (sq.ft for area), and **pending approval** for owners and agents.

### Cross-cutting


| Status               | Items                                                                           |
| -------------------- | ------------------------------------------------------------------------------- |
| **Delivered**        | Wizard with Previous/Next; validation; gallery; map locality; approval workflow |
| **Changed from PDF** | Wizard order (city vs sector first); gallery upload UX — Section 2              |
| **Partial**          | Older listings: simpler edit form without sector/type                           |




### Residential — Rent


| Status               | Items                                                                                                                                                                                                                                                                |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Delivered**        | Apartment / house / gated villa; BHK; floors or house floor count; property age; facing; built-up area; rent **or** lease; deposit; maintenance; preferred tenants; furnishing; parking; amenities; floor plans; rules for hiding floor fields on independent houses |
| **Changed from PDF** | Lease inside Rent; furnishing items checklist — Section 2                                                                                                                                                                                                            |
| **Partial**          | Water supply option list narrower than some PDF screens                                                                                                                                                                                                              |




### Residential — Resale


| Status               | Items                                                                                                                                                                                                                                                    |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Delivered**        | Standalone building type; ownership and lease years; built-up and carpet area; resale price and maintenance; kitchen; furnishing; parking; amenities; document questions (allotment, sale deed, property tax, occupancy); sale agreement when deed is No |
| **Changed from PDF** | Gallery upload — Section 2                                                                                                                                                                                                                               |




### Residential — PG / Hostel


| Status        | Items                                                                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Delivered** | Room types (single–four) with rent/deposit per person and room amenities; PG details (male/female/anyone, guests, food); rules by audience; services and shared amenities; parking; gallery |




### Residential — Flatmates


| Status               | Items                                                                                          |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| **Delivered**        | Room type; tenant type; property details; rent block; flatmate preferences; amenities; gallery |
| **Changed from PDF** | Apartment name as text, not dropdown — Section 2                                               |




### Land / Plot — Resale


| Status               | Items                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Delivered**        | Plot area; length/width; boundary wall; floors allowed; corner plot; gated project; facing; resale price; utilities; directions; ownership; conversion certificate; gallery |
| **Not planned**      | Sale deed, encumbrance, RERA status — Section 2                                                                                                                             |
| **Changed from PDF** | No visit schedule — Section 2                                                                                                                                               |




### Commercial — Rent and Sale


| Status               | Items                                                                                                                                                                                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Delivered**        | Commercial property types (office, shop, warehouse, etc.); building type; age; floor and total floors; super built-up area; furnishing; on main road; corner; rent or sale pricing; deposit/ownership/possession as applicable; commercial amenities; description; contact preference |
| **Changed from PDF** | No ideal-for; simplified visit scheduling; static building types — Section 2                                                                                                                                                                                                          |
| **Partial**          | Full **schedule** step (preferred visit days/hours) not on the form                                                                                                                                                                                                                   |


---



## 5. Service partners



### Delivered

- Partner registration with business name and service categories.
- **Profile:** business details, service areas, working hours, portfolio photos and certificates.
- **Verification documents:** Aadhaar, PAN, and optional GST, business proof, address proof.
- **Verification status:** pending until approved; rejection reason when applicable.
- **Leads:** assignment, platform review, accept/decline, job updates and photos, complete job.
- **Wallet:** earnings and payout history when jobs are completed and amounts recorded.
- **Support** tickets and **Alerts**.
- **Public partner page** after verification (business info, locations, hours, showcase).



### Partial

- **Call customer** — connects you to the customer through the platform without showing their private number on screen; available only when calling is enabled for the environment.



### Changed from PDF

- Partner flows are not in the property PDFs; they follow the platform’s partner lifecycle above.

---



## 6. Property agents



### Delivered

- Same **My Listings** and property wizard as property owners.
- **Leads** — enquiries tied to listings you manage.
- **Reports** — summary of your listing and enquiry activity.
- **My Requests** — if you book services for yourself or clients.

---



## 7. Not in this release

Do not treat these as defects unless you ask us to add them to scope:

- Plot **sale deed**, **encumbrance**, and **RERA** status fields (plot PDF).
- Commercial **ideal for** / business-use matrix.
- Commercial **day-by-day visit schedule** UI (contact preference/availability is used instead).
- **Full PDF gallery** flow (phone/WhatsApp upload prompts).
- **Full furnishing items** catalog (residential rent).
- **Saved favorites** in the main product menu.
- **Staff admin** screens (listing approval and partner operations are handled on the platform side, not in this document).

---



## 8. Suggested next priorities

If you want the site to match the PDFs more closely, these are the highest-impact items to confirm with us:

1. **Commercial visit schedule** — add preferred visit days/hours as in the commercial PDF.
2. **Plot certificate fields** — sale deed, encumbrance, RERA (with exact option lists you want).
3. **Furnishing items** — full editable list for semi/fully furnished rent.
4. **Saved favorites** — tenant bookmarking of listings.
5. **Browse links** — align home-page and marketing URLs with browse filters.
6. **Commercial building types** — options that change based on property type.
7. **Dynamic apartment name** — dropdown or search for flatmates if you supply a society list.

---



## 9. Documents to send

When sharing materials with your testers or stakeholders, we recommend:


| Document           | Format      | Purpose                                                          |
| ------------------ | ----------- | ---------------------------------------------------------------- |
| **USER_GUIDE**     | PDF or Word | Step-by-step how to use the site                                 |
| **FEATURE_STATUS** | PDF or Word | This file: done, partial, missing, and **Section 2 PDF changes** |


**Suggested email line:** *“Section 2 of the feature status document lists differences from the property PDFs you shared; the rest shows what is live versus still to do.”*

---

*Residential property PDF · Plot PDF · Commercial PDF — reference specifications provided for The YBDC property posting flows.*