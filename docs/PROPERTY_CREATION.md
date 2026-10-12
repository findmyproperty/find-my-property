# Property creation — user manual

A listing is created from **My Listings**. Tenants, agents, and admins use the same form. After you submit, tenants and agents wait for an admin to approve it. An admin’s own listing goes live immediately.

## Who can create a listing

Sign in as a **tenant**, **agent**, or **admin**. In the sidebar, open **Properties → My Listings**, then click **Add Property**.

If you have no listings yet, the page says to add a property to get started.

## The form

Create is a wizard. Edit opens every section at once, and **Update Property** stays pinned to the bottom only after you change something. A failed save leaves your edits in place.

The first step asks for two choices and nothing else:

1. **Sector:** Residential, Commercial, or Land/Plot.
2. **Listing type**, which depends on the sector.

| Sector | Listing types |
|---|---|
| Residential | Rent, Resale, PG/Hostel, Flatmates |
| Commercial | Rent, Sale |
| Land/Plot | Resale |

**Next** stays off until both are chosen. It then opens the fields for that pair. **Previous** goes back without clearing what you already typed. **Create Property** is only on the last step.

Older listings that have no sector still open the original form: property type, Rent / For Sale / Lease, rooms, bathrooms, area, year built, and furnishing.

### What each new listing asks for

The fields come from the PDFs in `doc/` (YDBC property creation, the plot specification, and the commercial specification). Fields whose option list was not in those PDFs are not shown. That includes plot sale-deed, encumbrance, and RERA statuses, and commercial “ideal for”.

Shared on every new listing: title, city, locality, street address, and a price (rent, sale price, lease amount, or the lowest PG room rent). Photos and video stay optional. Floor plans stay on residential rent only.

Residential rent adds apartment type, BHK, built-up area, rent or lease, deposit, furnishing, parking, preferred tenants, and the amenity yes/no questions from the YDBC rent screens.

Residential resale adds ownership, carpet area, maintenance, documents (allotment letter, sale deed, property tax, occupancy certificate), and a sale agreement question when the sale deed answer is No.

PG/Hostel asks for room types (single, double, three, four), rent and deposit per person, who the place is for, food, rules, and services.

Flatmates asks for room type, tenant type, and the shared residential rent fields.

Commercial rent and sale ask for property type, building type, age, floor, super built-up area, furnishing, a map pin, a description of at least 50 characters, and contact preference. Sale asks for ownership and possession. The commercial schedule step is included because that PDF names visit days and contact hours. The plot PDF excludes schedule, so plot does not ask for it.

Area is still stored in square metres. You type square feet.

## Save the listing

On create, click **Create Property** on the last step.

- If a required field is missing, the wizard returns to that step and names the field.
- While it saves, the button shows **Saving…**.
- On success you see **Property submitted** and return to **My Listings**.
- **Cancel** leaves the form and does not save anything.

On edit, **Update Property** appears only when the form is dirty. A successful save stays on the page. A failed save does not clear what you typed.

## What happens after you submit

| Who created it | Status on My Listings | What visitors see |
|---|---|---|
| Tenant or agent | **Pending** | Hidden until an admin approves it |
| Admin | **Approved** | Live on the site right away |

On **My Listings** you can open a listing to edit it, or delete it. Deleting asks you to confirm first.

## Admin approval

This step applies only to listings created by tenants and agents.

1. Sign in as an admin.
2. Open **Operations → Property Approval**.
3. Use the **Pending** tab to see new listings.
4. **Approve** publishes the listing. The creator gets an email that it is live.
5. **Reject** asks for a reason. That reason is required. The creator gets an email that it was not approved, including the reason.

The listing badge on **My Listings** then shows **Approved** or **Rejected**.
