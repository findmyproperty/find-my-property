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
- [ ] Approve vendor; vendor receives alert (if logged in, check `/alerts`)
- [ ] Reject flow (optional): rejection reason visible on vendor profile

## 3. Lead assignment & partner inbox

- [ ] Admin → **Service Requests** → assign verified vendor to a request
- [ ] Vendor → **Leads** → new lead appears with status **new**
- [ ] Vendor → **Alerts** → “New lead assigned” notification
- [ ] Vendor accepts lead; status **accepted**; alert for status change

## 4. Work updates

- [ ] Vendor opens lead detail `/leads/[id]`
- [ ] Add milestone update with note/photos
- [ ] Mark lead **in progress** from detail or list

## 5. Complete job & wallet

- [ ] Admin → **Vendor Leads** (`/admin/vendor-leads`)
- [ ] Set **job amount**, status **completed**, save (or “Mark completed & settle”)
- [ ] Vendor → **Wallet** → earning + commission ledger rows appear
- [ ] Vendor → **Alerts** → payout/status notifications as applicable

## 6. Admin payout

- [ ] Admin → **Vendor Payments** → record payout for vendor
- [ ] Vendor wallet balance/ledger reflects payout

## 7. Support & complaints

- [ ] Vendor → **Support** → submit ticket (payment query / complaint)
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
