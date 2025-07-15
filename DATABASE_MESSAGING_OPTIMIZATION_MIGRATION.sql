-- =============================================
-- MESSAGING PERFORMANCE OPTIMIZATION
-- =============================================

-- This migration creates a database function to fetch message threads
-- more efficiently, aiming to resolve timeout issues on the messages page.

-- Drop the old function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS get_user_message_threads(uuid);

-- Create a new function to get all messages for a user efficiently
-- This function is more performant than client-side queries with RLS.
CREATE OR REPLACE FUNCTION get_all_user_messages(p_user_id uuid)
RETURNS SETOF messages AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.messages
    WHERE sender_id = p_user_id OR recipient_id = p_user_id
    ORDER BY created_at DESC
    LIMIT 100;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permission to the 'authenticated' role so that logged-in users can call it.
GRANT EXECUTE ON FUNCTION get_all_user_messages(uuid) TO authenticated;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
-- Apply this migration to your Supabase project via the SQL editor.
