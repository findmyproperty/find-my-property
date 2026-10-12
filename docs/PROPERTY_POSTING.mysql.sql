-- Additive posting columns. Existing rows stay null.
-- Run SHOW CREATE TABLE property first. Apply this on a copy, then confirm
-- id, status, approvedAt, price, area, propertyImages, reason, and listingType are unchanged.
-- Leave bathrooms precision as it already is. Only nullability should change.

ALTER TABLE property
  ADD COLUMN propertySector varchar(32) NULL,
  ADD COLUMN postingType varchar(32) NULL,
  ADD COLUMN details json NULL,
  MODIFY COLUMN bedrooms int NULL,
  MODIFY COLUMN yearBuilt int NULL;

-- Example, only if bathrooms is currently decimal(10,2):
-- ALTER TABLE property MODIFY COLUMN bathrooms decimal(10,2) NULL;
