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
