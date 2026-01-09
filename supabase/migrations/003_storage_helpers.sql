-- =====================================================
-- CV-Optima Storage Helper Functions
-- Migration: 003_storage_helpers
-- Description: Helper functions for storage operations
-- Note: Bucket and policies must be created via Dashboard
-- =====================================================

-- =====================================================
-- HELPER FUNCTION: Generate safe file path
-- =====================================================
-- Generates a storage path scoped to user: {user_id}/{filename}

CREATE OR REPLACE FUNCTION public.generate_resume_path(filename TEXT)
RETURNS TEXT AS $$
DECLARE
    user_id TEXT;
    safe_filename TEXT;
    timestamp_suffix TEXT;
BEGIN
    -- Get current user ID
    user_id := auth.uid()::text;
    
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;
    
    -- Generate timestamp suffix to prevent collisions
    timestamp_suffix := to_char(NOW(), 'YYYYMMDD_HH24MISS');
    
    -- Sanitize filename (remove path separators and dangerous chars)
    safe_filename := regexp_replace(filename, '[^a-zA-Z0-9._-]', '_', 'g');
    
    -- Return path: {user_id}/{timestamp}_{filename}
    RETURN user_id || '/' || timestamp_suffix || '_' || safe_filename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- HELPER FUNCTION: Get storage usage for user
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_storage_usage()
RETURNS BIGINT AS $$
DECLARE
    total_size BIGINT;
BEGIN
    SELECT COALESCE(SUM((metadata->>'size')::BIGINT), 0)
    INTO total_size
    FROM storage.objects
    WHERE bucket_id = 'resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text;
    
    RETURN total_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- HELPER FUNCTION: Clean up orphaned storage files
-- =====================================================
-- Deletes storage files that don't have corresponding database records

CREATE OR REPLACE FUNCTION public.cleanup_orphaned_resume_files()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    storage_file RECORD;
BEGIN
    -- Find storage files without corresponding resume records
    FOR storage_file IN
        SELECT so.name, so.bucket_id
        FROM storage.objects so
        WHERE so.bucket_id = 'resumes'
        AND (storage.foldername(so.name))[1] = auth.uid()::text
        AND NOT EXISTS (
            SELECT 1 FROM resumes r
            WHERE r.file_url LIKE '%' || so.name
            AND r.user_id = auth.uid()
        )
    LOOP
        -- Delete the orphaned file
        DELETE FROM storage.objects
        WHERE bucket_id = storage_file.bucket_id
        AND name = storage_file.name;
        
        deleted_count := deleted_count + 1;
    END LOOP;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION public.generate_resume_path(TEXT) IS
'Generates a safe storage path with user ID and timestamp: {user_id}/{timestamp}_{filename}';

COMMENT ON FUNCTION public.get_user_storage_usage() IS
'Returns total storage usage in bytes for the current user';

COMMENT ON FUNCTION public.cleanup_orphaned_resume_files() IS
'Deletes storage files that no longer have corresponding database records';
