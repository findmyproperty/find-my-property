-- Vendor role + Phase 2 product tables (PostgreSQL)
-- Run once on production when synchronize is disabled.
-- Review against your live schema before applying.
--
-- NOTE: This project uses MySQL in dev/prod. Use instead:
--   find-my-property/docs/VENDOR_MIGRATION.mysql.sql
--   backend: node scripts/run-vendor-migration.js

-- 1. User role enum (adjust if your DB uses varchar for role)
-- ALTER TYPE users_role_enum ADD VALUE IF NOT EXISTS 'vendor';

-- If role is varchar, no enum change needed — ensure app accepts 'vendor'.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;

-- 2. Settings: platform commission for vendor jobs
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS "vendorCommissionPercent" numeric(5,2) NOT NULL DEFAULT 10;

-- 3. Service requests: assign partner
ALTER TABLE service_requests
  ADD COLUMN IF NOT EXISTS "assignedVendorUserId" integer NULL;

CREATE INDEX IF NOT EXISTS idx_service_requests_assigned_vendor
  ON service_requests ("assignedVendorUserId");

-- 4. Vendor profiles
CREATE TABLE IF NOT EXISTS vendor_profiles (
  id SERIAL PRIMARY KEY,
  "userId" integer NOT NULL UNIQUE,
  "businessName" varchar(160),
  category varchar(32) NOT NULL DEFAULT 'other',
  "verificationStatus" varchar(32) NOT NULL DEFAULT 'pending',
  "rejectionReason" text,
  documents jsonb,
  experience text,
  "serviceLocations" text,
  about text,
  "workingHours" varchar(255),
  "publicPhotoUrls" jsonb,
  "certificateUrls" jsonb,
  slug varchar(80) UNIQUE,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_profiles_user ON vendor_profiles ("userId");
CREATE UNIQUE INDEX IF NOT EXISTS idx_vendor_profiles_slug ON vendor_profiles (slug) WHERE slug IS NOT NULL;

-- 5. Vendor leads
CREATE TABLE IF NOT EXISTS vendor_leads (
  id SERIAL PRIMARY KEY,
  "vendorUserId" integer NOT NULL,
  "serviceRequestId" integer,
  "customerName" varchar(120) NOT NULL,
  phone varchar(32) NOT NULL,
  area varchar(120),
  budget varchar(64),
  requirement text,
  "preferredDate" date,
  status varchar(32) NOT NULL DEFAULT 'new',
  "commissionPercent" numeric(5,2) NOT NULL DEFAULT 10,
  "jobAmount" numeric(12,2),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_leads_vendor ON vendor_leads ("vendorUserId");
CREATE INDEX IF NOT EXISTS idx_vendor_leads_sr ON vendor_leads ("serviceRequestId");

-- 6. Vendor lead updates (work log)
CREATE TABLE IF NOT EXISTS vendor_lead_updates (
  id SERIAL PRIMARY KEY,
  "vendorLeadId" integer NOT NULL,
  milestone varchar(120) NOT NULL,
  note text,
  "photoUrls" jsonb,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_lead_updates_lead ON vendor_lead_updates ("vendorLeadId");

-- 7. Vendor ledger (internal wallet)
CREATE TABLE IF NOT EXISTS vendor_ledger_entries (
  id SERIAL PRIMARY KEY,
  "vendorUserId" integer NOT NULL,
  "vendorLeadId" integer,
  type varchar(32) NOT NULL,
  amount numeric(12,2) NOT NULL,
  status varchar(32) NOT NULL DEFAULT 'pending',
  description varchar(500),
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_ledger_vendor ON vendor_ledger_entries ("vendorUserId");

-- 8. Notifications (Phase 2)
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  "userId" integer NOT NULL,
  type varchar(48) NOT NULL,
  title varchar(200) NOT NULL,
  body text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  metadata jsonb,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications ("userId");

-- 9. Support tickets (Phase 2)
CREATE TABLE IF NOT EXISTS support_tickets (
  id SERIAL PRIMARY KEY,
  "userId" integer NOT NULL,
  "userRole" varchar(32) NOT NULL,
  category varchar(32) NOT NULL,
  subject varchar(200) NOT NULL,
  body text NOT NULL,
  status varchar(32) NOT NULL DEFAULT 'open',
  "adminNotes" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets ("userId");
