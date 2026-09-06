# Vendor lifecycle — manual QA checklist

Use a **verified** vendor account and an **admin** account. Backend should be running with migrations applied.

**Database:** This app uses **MySQL**. Apply `docs/VENDOR_MIGRATION.mysql.sql` (not the PostgreSQL `.sql` file), or from the backend repo run:

```bash
node scripts/run-vendor-migration.js
```
## 1. Registration & KYC

- [ ] Open `/register-vendor`, complete phone signup as vendor
- [ ] Log in → Profile → fill business name, category, KYC uploads, service locations, slug
- [ ] Save profile; status shows **pending**

## 2. Admin verification

- [ ] Admin → **Vendor Partners** (`/admin/vendors`)
- [ ] All admins with emails receive **Vendor KYC pending** mail when partner submits/resubmits profile (business name + category)
- [ ] Approve vendor; vendor receives alert (if logged in, check `/alerts`)
- [ ] Reject flow (optional): rejection reason visible on vendor profile

## 3. Lead assignment, admin approval & partner inbox

- [ ] Admin → **Service Requests** → assign verified vendor to a request
- [ ] All admins with emails receive **Lead awaiting approval** mail (`vendor_lead.pending_approval`)
- [ ] Vendor → **Leads** → lead appears with status **pending admin review**
- [ ] Vendor → **Alerts** → assignment notification (not actionable yet)
- [ ] Vendor cannot see customer phone on list or lead detail
- [ ] Admin → **Vendor Leads** (`/admin/vendor-leads`) → filter **Awaiting approval**
- [ ] Or from **Service Requests** drawer → **Approve lead** / **Reject lead** when a vendor is assigned
- [ ] Admin **Approve lead** → status **open**; vendor notified
- [ ] Vendor → Accept lead; status **accepted**
- [ ] After accept, vendor sees **Call customer** when Exotel is configured (`TELEPHONY_PROVIDER=exotel` + ExoPhone env vars). No real customer phone or direct `tel:` link to customer.
- [ ] Click **Call customer** → backend calls vendor phone via Exotel Connect → vendor answers → connected to customer; both see ExoPhone as caller ID
- [ ] Secure line number shown on lead detail when provisioned
- [ ] Optional: Admin **Reject lead** before vendor action → status **admin rejected**

## 4. Work updates

- [ ] Vendor opens lead detail `/leads/[id]`
- [ ] Add milestone update with note/photos
- [ ] Mark lead **in progress** from detail or list

## 5. Complete job & wallet

- [ ] Admin → **Vendor Leads** (`/admin/vendor-leads`)
- [ ] Set **job amount**, status **completed**, save (or “Mark completed & settle”)
- [ ] If vendor marked **completed** first without a job amount: open the lead → **Manage** → enter job amount → **Create payment link**
- [ ] Vendor → **Wallet** → earning + commission ledger rows appear
- [ ] Vendor → **Alerts** → payout/status notifications as applicable

## 6. Admin payout

- [ ] Admin → **Vendor Payments** → record payout for vendor
- [ ] Vendor wallet balance/ledger reflects payout

## 7. Support & complaints

- [ ] Vendor → **Support** → submit ticket (payment query / complaint)
- [ ] All admins with emails receive **Support ticket** mail (`support_ticket.admin_new`)
- [ ] All admins receive in-app alert on `/alerts`
- [ ] Admin → **Complaints** → ticket listed; add admin notes, set resolved
- [ ] Vendor sees admin notes / alert on update

## 8. Public profile

- [ ] After verification, open `/vendors/{userId}` or `/vendors/{slug}`
- [ ] Page shows business info, locations, hours, completed jobs count
- [ ] Unverified or invalid id returns not found

## 9. Blocked vendor (optional)

- [ ] Admin blocks vendor (`isActive` false)
- [ ] Vendor cannot accept new leads; public profile hidden

---

**Sign-off:** Date ______  Tester ______  Build/version ______

## Exotel setup (masked calling)

Backend `.env`:

```env
TELEPHONY_PROVIDER=exotel
EXOTEL_API_KEY=your_api_key
EXOTEL_API_TOKEN=your_api_token
EXOTEL_SID=your_account_sid
EXOTEL_CALLER_ID=your_exophone_number
EXOTEL_API_BASE_URL=https://api.in.exotel.com
```

Run once on MySQL: `backend/scripts/migrate-vendor-lead-masked-contact.sql`

**Trial notes:** Outbound calling must be enabled on your Exotel account. Vendor profile must have a valid mobile number. Calls connect vendor first, then customer.
