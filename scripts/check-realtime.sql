-- Supabase Realtime Configuration Check
-- Run this in your Supabase SQL Editor

-- 1. Check if todos table exists
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'todos';

-- 2. Check current replica identity setting
SELECT schemaname, tablename, replicaidentity 
FROM pg_tables 
JOIN pg_class ON pg_tables.tablename = pg_class.relname 
WHERE tablename = 'todos';

-- 3. Check if table is in realtime publication
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' AND tablename = 'todos';

-- 4. Enable realtime for todos table (run if not already enabled)
-- ALTER TABLE todos REPLICA IDENTITY FULL;
-- ALTER PUBLICATION supabase_realtime ADD TABLE todos;

-- 5. Check todos table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'todos' 
ORDER BY ordinal_position;

-- 6. Test query (similar to what the app uses)
SELECT id, user_id, text, done, deleted, created_at, updated_at
FROM todos 
WHERE deleted = false 
ORDER BY updated_at DESC 
LIMIT 5; 