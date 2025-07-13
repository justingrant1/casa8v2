-- Add coordinate columns to properties table for Google Maps integration
ALTER TABLE properties 
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8),
ADD COLUMN formatted_address TEXT;

-- Add indexes for efficient location-based queries
CREATE INDEX idx_properties_coordinates ON properties (latitude, longitude);
CREATE INDEX idx_properties_location ON properties (city, state);

-- Optional: Update existing properties with formatted addresses
-- This would be filled in as properties are edited/re-listed
COMMENT ON COLUMN properties.latitude IS 'Latitude coordinate for map display and location searches';
COMMENT ON COLUMN properties.longitude IS 'Longitude coordinate for map display and location searches';
COMMENT ON COLUMN properties.formatted_address IS 'Google-formatted address string for display';

-- Add tenant preference fields to profiles table
ALTER TABLE profiles 
ADD COLUMN has_section8 BOOLEAN,
ADD COLUMN voucher_bedrooms TEXT,
ADD COLUMN preferred_city TEXT,
ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;

-- Add indexes for tenant preferences
CREATE INDEX idx_profiles_section8 ON profiles (has_section8);
CREATE INDEX idx_profiles_preferred_city ON profiles (preferred_city);
CREATE INDEX idx_profiles_onboarding ON profiles (onboarding_completed);

COMMENT ON COLUMN profiles.has_section8 IS 'Whether tenant has Section 8 housing assistance';
COMMENT ON COLUMN profiles.voucher_bedrooms IS 'Number of bedrooms covered by voucher (Studio, 1 BR, 2 BR, etc.)';
COMMENT ON COLUMN profiles.preferred_city IS 'Tenant preferred city for housing search';
COMMENT ON COLUMN profiles.onboarding_completed IS 'Whether tenant has completed initial onboarding';
