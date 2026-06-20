-- Vendor role + Phase 2 product tables (MySQL 8+)
-- Run once on production when synchronize is disabled.
-- TypeORM entities use camelCase column names unless `name:` is set.

-- 1. User: vendor role is enum on `user` table — add value if missing (MySQL 8)
-- Run manually if ALTER fails: SHOW COLUMNS FROM user LIKE 'role';
-- ALTER TABLE user MODIFY COLUMN role ENUM('admin','agent','tenant','vendor') NOT NULL DEFAULT 'tenant';

-- isActive on user (skip if column exists)
SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user' AND COLUMN_NAME = 'isActive'
);
SET @sql := IF(@col = 0,
  'ALTER TABLE `user` ADD COLUMN `isActive` tinyint(1) NOT NULL DEFAULT 1',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. Settings: vendor commission (snake_case column name in entity)
SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'settings' AND COLUMN_NAME = 'vendor_commission_percent'
);
SET @sql := IF(@col = 0,
  'ALTER TABLE settings ADD COLUMN vendor_commission_percent decimal(5,2) NOT NULL DEFAULT 10',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3. Service requests: assign partner
SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'service_requests' AND COLUMN_NAME = 'assignedVendorUserId'
);
SET @sql := IF(@col = 0,
  'ALTER TABLE service_requests ADD COLUMN assignedVendorUserId int NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

CREATE INDEX idx_service_requests_assigned_vendor ON service_requests (assignedVendorUserId);

-- 4. Vendor profiles
CREATE TABLE IF NOT EXISTS vendor_profiles (
  id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  userId int NOT NULL,
  businessName varchar(160) NULL,
  category varchar(32) NOT NULL DEFAULT 'other',
  verificationStatus varchar(32) NOT NULL DEFAULT 'pending',
  rejectionReason text NULL,
  documents json NULL,
  experience text NULL,
  serviceLocations text NULL,
  about text NULL,
  workingHours varchar(255) NULL,
  publicPhotoUrls json NULL,
  certificateUrls json NULL,
  slug varchar(80) NULL,
  createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY UQ_vendor_profiles_userId (userId),
  UNIQUE KEY UQ_vendor_profiles_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Vendor leads
CREATE TABLE IF NOT EXISTS vendor_leads (
  id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  vendorUserId int NOT NULL,
  serviceRequestId int NULL,
  customerName varchar(120) NOT NULL,
  phone varchar(32) NOT NULL,
  area varchar(120) NULL,
  budget varchar(64) NULL,
  requirement text NULL,
  preferredDate date NULL,
  status varchar(32) NOT NULL DEFAULT 'new',
  commissionPercent decimal(5,2) NOT NULL DEFAULT 10,
  jobAmount decimal(12,2) NULL,
  createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  KEY idx_vendor_leads_vendor (vendorUserId),
  KEY idx_vendor_leads_sr (serviceRequestId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Vendor lead updates
CREATE TABLE IF NOT EXISTS vendor_lead_updates (
  id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  vendorLeadId int NOT NULL,
  milestone varchar(120) NOT NULL,
  note text NULL,
  photoUrls json NULL,
  createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  KEY idx_vendor_lead_updates_lead (vendorLeadId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Vendor ledger
CREATE TABLE IF NOT EXISTS vendor_ledger_entries (
  id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  vendorUserId int NOT NULL,
  vendorLeadId int NULL,
  type varchar(32) NOT NULL,
  amount decimal(12,2) NOT NULL,
  status varchar(32) NOT NULL DEFAULT 'pending',
  description varchar(500) NULL,
  createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  KEY idx_vendor_ledger_vendor (vendorUserId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  userId int NOT NULL,
  type varchar(48) NOT NULL,
  title varchar(200) NOT NULL,
  body text NOT NULL,
  `read` tinyint(1) NOT NULL DEFAULT 0,
  metadata json NULL,
  createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  KEY idx_notifications_user (userId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Support tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  userId int NOT NULL,
  userRole varchar(32) NOT NULL,
  category varchar(32) NOT NULL,
  subject varchar(200) NOT NULL,
  body text NOT NULL,
  status varchar(32) NOT NULL DEFAULT 'open',
  adminNotes text NULL,
  createdAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updatedAt datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  KEY idx_support_tickets_user (userId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
