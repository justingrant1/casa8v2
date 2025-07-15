-- Migration to rename 'content' column to 'message_text' in messages table
-- This aligns the database schema with the updated code

-- Rename the column
ALTER TABLE messages 
RENAME COLUMN content TO message_text;

-- Update any existing indexes that reference the old column name
-- (This is just to be safe, most indexes should update automatically)

-- If you have any views or functions that reference the old column name,
-- you would need to update those as well. But based on the current schema,
-- this simple column rename should be sufficient.

-- Migration complete!
-- After running this, the database will match the updated code that uses 'message_text'
