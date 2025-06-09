-- Cleanup Migration: Remove old todos table (run only after confirming migration success)
-- This migration is OPTIONAL and should only be run after you've confirmed
-- that all your todos have been successfully migrated to the new tasks table

-- =====================================================
-- VERIFICATION QUERIES (run these manually first)
-- =====================================================

-- Before running this migration, verify data was migrated correctly:
-- 1. Check todos count: SELECT COUNT(*) FROM todos WHERE deleted = false;
-- 2. Check tasks count: SELECT COUNT(*) FROM tasks;
-- 3. Verify data matches: Compare the counts and sample some records

-- =====================================================
-- STEP 1: Remove todos from realtime (optional)
-- =====================================================

-- Remove todos table from realtime publication
-- ALTER PUBLICATION supabase_realtime DROP TABLE todos;

-- =====================================================
-- STEP 2: Archive todos table (recommended approach)
-- =====================================================

-- Option A: Rename todos table for archival (RECOMMENDED)
-- This keeps your data safe while freeing up the name
-- ALTER TABLE todos RENAME TO todos_archived;

-- Option B: Drop todos table completely (ONLY if you're 100% sure)
-- WARNING: This permanently deletes all todo data!
-- DROP TABLE todos;

-- =====================================================
-- FOR NOW: Just add a comment indicating migration is complete
-- =====================================================

-- Mark that todos migration is complete
COMMENT ON TABLE todos IS 'DEPRECATED: Data migrated to tasks table. Safe to archive after verification.';

-- Add a column to track migration status (optional)
-- ALTER TABLE todos ADD COLUMN migrated_to_tasks BOOLEAN DEFAULT true;

-- Note: Uncomment the lines above when you're ready to clean up
-- For safety, we're not dropping anything automatically
