-- Video Storage Migration for Casa8
-- Run this in your Supabase SQL editor

-- 1. Create property_videos table
CREATE TABLE IF NOT EXISTS property_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  file_size BIGINT,
  duration INTEGER, -- duration in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Add RLS policies for property_videos
ALTER TABLE property_videos ENABLE ROW LEVEL SECURITY;

-- Policy: Landlords can view their own property videos
CREATE POLICY "landlords_can_view_own_property_videos" ON property_videos
  FOR SELECT USING (
    property_id IN (
      SELECT id FROM properties WHERE landlord_id = auth.uid()
    )
  );

-- Policy: Anyone can view videos for available properties (for property detail pages)
CREATE POLICY "anyone_can_view_available_property_videos" ON property_videos
  FOR SELECT USING (
    property_id IN (
      SELECT id FROM properties WHERE available = true
    )
  );

-- Policy: Landlords can insert videos for their own properties
CREATE POLICY "landlords_can_insert_own_property_videos" ON property_videos
  FOR INSERT WITH CHECK (
    property_id IN (
      SELECT id FROM properties WHERE landlord_id = auth.uid()
    )
  );

-- Policy: Landlords can update videos for their own properties
CREATE POLICY "landlords_can_update_own_property_videos" ON property_videos
  FOR UPDATE USING (
    property_id IN (
      SELECT id FROM properties WHERE landlord_id = auth.uid()
    )
  );

-- Policy: Landlords can delete videos for their own properties
CREATE POLICY "landlords_can_delete_own_property_videos" ON property_videos
  FOR DELETE USING (
    property_id IN (
      SELECT id FROM properties WHERE landlord_id = auth.uid()
    )
  );

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_property_videos_property_id ON property_videos(property_id);
CREATE INDEX IF NOT EXISTS idx_property_videos_order_index ON property_videos(property_id, order_index);

-- 4. Create storage bucket for property videos (if it doesn't exist)
-- Note: This needs to be run separately in the Supabase dashboard or via SQL if you have permissions
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('property-videos', 'property-videos', true)
-- ON CONFLICT DO NOTHING;

-- 5. Create storage policies for property-videos bucket
-- Note: These might need to be created in the Supabase dashboard under Storage > Policies

-- Policy: Anyone can view videos (since they're public)
-- CREATE POLICY "Anyone can view property videos" ON storage.objects
-- FOR SELECT USING (bucket_id = 'property-videos');

-- Policy: Authenticated users can upload videos
-- CREATE POLICY "Authenticated users can upload property videos" ON storage.objects
-- FOR INSERT WITH CHECK (
--   bucket_id = 'property-videos' AND 
--   auth.role() = 'authenticated'
-- );

-- Policy: Users can update their own uploaded videos
-- CREATE POLICY "Users can update own property videos" ON storage.objects
-- FOR UPDATE USING (
--   bucket_id = 'property-videos' AND 
--   auth.uid()::text = (storage.foldername(name))[1]
-- );

-- Policy: Users can delete their own uploaded videos
-- CREATE POLICY "Users can delete own property videos" ON storage.objects
-- FOR DELETE USING (
--   bucket_id = 'property-videos' AND 
--   auth.uid()::text = (storage.foldername(name))[1]
-- );

-- 6. Update properties table to include video count (optional, for performance)
-- ALTER TABLE properties ADD COLUMN IF NOT EXISTS video_count INTEGER DEFAULT 0;

-- 7. Create function to update video count (optional)
-- CREATE OR REPLACE FUNCTION update_property_video_count()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   IF TG_OP = 'INSERT' THEN
--     UPDATE properties SET video_count = video_count + 1 WHERE id = NEW.property_id;
--     RETURN NEW;
--   ELSIF TG_OP = 'DELETE' THEN
--     UPDATE properties SET video_count = video_count - 1 WHERE id = OLD.property_id;
--     RETURN OLD;
--   END IF;
--   RETURN NULL;
-- END;
-- $$ LANGUAGE plpgsql;

-- 8. Create trigger to automatically update video count (optional)
-- CREATE TRIGGER property_video_count_trigger
--   AFTER INSERT OR DELETE ON property_videos
--   FOR EACH ROW EXECUTE FUNCTION update_property_video_count();

COMMENT ON TABLE property_videos IS 'Stores video files associated with rental properties';
COMMENT ON COLUMN property_videos.property_id IS 'Reference to the property this video belongs to';
COMMENT ON COLUMN property_videos.video_url IS 'Public URL of the video file in Supabase storage';
COMMENT ON COLUMN property_videos.order_index IS 'Display order of videos (0 = first/main video)';
COMMENT ON COLUMN property_videos.file_size IS 'Size of video file in bytes';
COMMENT ON COLUMN property_videos.duration IS 'Length of video in seconds';
