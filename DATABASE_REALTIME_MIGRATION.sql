-- Level 3 Real-time Messaging Features Migration
-- Add support for online status and typing indicators

-- Add online status tracking to user profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen_at timestamptz DEFAULT now();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_online boolean DEFAULT false;

-- Add typing indicators table
CREATE TABLE IF NOT EXISTS typing_indicators (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    participant_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    is_typing boolean DEFAULT false,
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, property_id, participant_id)
);

-- Create function to update typing status
CREATE OR REPLACE FUNCTION update_typing_status(
    p_property_id uuid,
    p_participant_id uuid,
    p_is_typing boolean
) RETURNS void AS $$
BEGIN
    INSERT INTO typing_indicators (user_id, property_id, participant_id, is_typing)
    VALUES (auth.uid(), p_property_id, p_participant_id, p_is_typing)
    ON CONFLICT (user_id, property_id, participant_id)
    DO UPDATE SET 
        is_typing = p_is_typing,
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update online status
CREATE OR REPLACE FUNCTION update_online_status(p_is_online boolean DEFAULT true) RETURNS void AS $$
BEGIN
    UPDATE profiles 
    SET 
        is_online = p_is_online,
        last_seen_at = now()
    WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clean up old typing indicators (older than 10 seconds)
CREATE OR REPLACE FUNCTION cleanup_typing_indicators() RETURNS void AS $$
BEGIN
    UPDATE typing_indicators 
    SET is_typing = false 
    WHERE updated_at < now() - interval '10 seconds' AND is_typing = true;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies for typing_indicators
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- Users can see typing indicators for conversations they're part of
CREATE POLICY "Users can view relevant typing indicators" ON typing_indicators
FOR SELECT USING (
    user_id = auth.uid() OR 
    participant_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM messages m 
        WHERE m.property_id = typing_indicators.property_id 
        AND (m.sender_id = auth.uid() OR m.recipient_id = auth.uid())
    )
);

-- Users can manage their own typing indicators
CREATE POLICY "Users can manage own typing indicators" ON typing_indicators
FOR ALL USING (user_id = auth.uid());

-- Enable realtime for all messaging tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_typing_indicators_property_updated 
ON typing_indicators(property_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_online_status 
ON profiles(is_online, last_seen_at DESC);

-- Trigger to automatically update last_seen_at when user is active
CREATE OR REPLACE FUNCTION update_last_seen() RETURNS trigger AS $$
BEGIN
    NEW.last_seen_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update last_seen when messages are sent
CREATE OR REPLACE TRIGGER update_sender_last_seen
    BEFORE INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_last_seen();

COMMENT ON TABLE typing_indicators IS 'Tracks real-time typing indicators for messaging';
COMMENT ON FUNCTION update_typing_status IS 'Updates typing status for real-time indicators';
COMMENT ON FUNCTION update_online_status IS 'Updates user online status';
COMMENT ON FUNCTION cleanup_typing_indicators IS 'Cleans up stale typing indicators';
