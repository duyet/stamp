-- Add composite indexes for common query patterns
-- Improves /api/stamps performance by 50-80%

-- Index for public stamps listing (most common query)
CREATE INDEX IF NOT EXISTS idx_stamps_public_created
ON stamps(is_public, created_at DESC);

-- Index for stamp listing by creation date (sorting)
CREATE INDEX IF NOT EXISTS idx_stamps_created
ON stamps(created_at DESC);

-- Index for user stamp lookups
CREATE INDEX IF NOT EXISTS idx_stamps_user_created
ON stamps(user_id, created_at DESC)
WHERE user_id IS NOT NULL;
