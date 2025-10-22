-- ========================================
-- Add source_image column to style_transfer table
-- ========================================
-- This fixes the "Could not find 'source_image' column" error
-- Safe to run even if column already exists
-- ========================================

-- Add source_image column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'style_transfer'
    AND column_name = 'source_image'
  ) THEN
    ALTER TABLE style_transfer ADD COLUMN source_image TEXT;
    RAISE NOTICE 'Added source_image column to style_transfer table';
  ELSE
    RAISE NOTICE 'source_image column already exists in style_transfer table';
  END IF;
END $$;

-- Verify the column exists
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'style_transfer'
    AND column_name = 'source_image'
  ) INTO column_exists;

  IF column_exists THEN
    RAISE NOTICE '✅ Verified: source_image column exists in style_transfer';
  ELSE
    RAISE EXCEPTION '❌ ERROR: source_image column still missing after migration!';
  END IF;
END $$;
