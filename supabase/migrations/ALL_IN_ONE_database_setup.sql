-- ========================================
-- ALL-IN-ONE DATABASE SETUP
-- ========================================
-- This script sets up BOTH tables with RLS policies in ONE step
-- Safe to run multiple times (idempotent)
-- ========================================

-- ========================================
-- PART 1: STYLE TRANSFER TABLE
-- ========================================

-- Create table (safe, won't fail if exists)
CREATE TABLE IF NOT EXISTS style_transfer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,

  -- Media
  url TEXT NOT NULL,
  thumbnail_url TEXT,

  -- Type and source
  type TEXT NOT NULL CHECK (type IN ('render', 'video', 'upscale')),
  source_type TEXT CHECK (source_type IN ('original', 'from_render', 'from_video')),
  parent_id UUID REFERENCES style_transfer(id) ON DELETE SET NULL,

  -- Generation details
  prompt TEXT,
  model TEXT NOT NULL,

  -- Settings used
  settings JSONB DEFAULT '{}',

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Auto-generated name
  name TEXT NOT NULL,

  -- Source image URL for lightbox display
  source_image TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_style_transfer_user_id ON style_transfer(user_id);
CREATE INDEX IF NOT EXISTS idx_style_transfer_type ON style_transfer(type);
CREATE INDEX IF NOT EXISTS idx_style_transfer_created_at ON style_transfer(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_style_transfer_parent_id ON style_transfer(parent_id);

-- Enable RLS
ALTER TABLE style_transfer ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Users can view their own style-transfer renders" ON style_transfer;
DROP POLICY IF EXISTS "Users can insert their own style-transfer renders" ON style_transfer;
DROP POLICY IF EXISTS "Users can update their own style-transfer renders" ON style_transfer;
DROP POLICY IF EXISTS "Users can delete their own style-transfer renders" ON style_transfer;
DROP POLICY IF EXISTS "Development: Allow all reads on style_transfer" ON style_transfer;
DROP POLICY IF EXISTS "Development: Allow all inserts on style_transfer" ON style_transfer;
DROP POLICY IF EXISTS "Development: Allow all updates on style_transfer" ON style_transfer;
DROP POLICY IF EXISTS "Development: Allow all deletes on style_transfer" ON style_transfer;

-- Create development policies
CREATE POLICY "Development: Allow all reads on style_transfer"
  ON style_transfer FOR SELECT
  USING (true);

CREATE POLICY "Development: Allow all inserts on style_transfer"
  ON style_transfer FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Development: Allow all updates on style_transfer"
  ON style_transfer FOR UPDATE
  USING (true);

CREATE POLICY "Development: Allow all deletes on style_transfer"
  ON style_transfer FOR DELETE
  USING (true);

-- Function and trigger for updated_at
CREATE OR REPLACE FUNCTION update_style_transfer_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_style_transfer_updated_at_trigger ON style_transfer;

CREATE TRIGGER update_style_transfer_updated_at_trigger
  BEFORE UPDATE ON style_transfer
  FOR EACH ROW
  EXECUTE FUNCTION update_style_transfer_updated_at();

-- ========================================
-- PART 2: RENDER TO CAD TABLE
-- ========================================

-- Create table (safe, won't fail if exists)
CREATE TABLE IF NOT EXISTS render_to_cad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,

  -- Media
  url TEXT NOT NULL,
  thumbnail_url TEXT,

  -- Type and source
  type TEXT NOT NULL CHECK (type IN ('render', 'video', 'upscale')),
  source_type TEXT CHECK (source_type IN ('original', 'from_render', 'from_video')),
  parent_id UUID REFERENCES render_to_cad(id) ON DELETE SET NULL,

  -- Generation details
  prompt TEXT,
  model TEXT NOT NULL,

  -- Settings used
  settings JSONB DEFAULT '{}',

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Auto-generated name
  name TEXT NOT NULL,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_render_to_cad_user_id ON render_to_cad(user_id);
CREATE INDEX IF NOT EXISTS idx_render_to_cad_type ON render_to_cad(type);
CREATE INDEX IF NOT EXISTS idx_render_to_cad_created_at ON render_to_cad(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_render_to_cad_parent_id ON render_to_cad(parent_id);

-- Enable RLS
ALTER TABLE render_to_cad ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Users can view their own render-to-cad renders" ON render_to_cad;
DROP POLICY IF EXISTS "Users can insert their own render-to-cad renders" ON render_to_cad;
DROP POLICY IF EXISTS "Users can update their own render-to-cad renders" ON render_to_cad;
DROP POLICY IF EXISTS "Users can delete their own render-to-cad renders" ON render_to_cad;
DROP POLICY IF EXISTS "Development: Allow all reads on render_to_cad" ON render_to_cad;
DROP POLICY IF EXISTS "Development: Allow all inserts on render_to_cad" ON render_to_cad;
DROP POLICY IF EXISTS "Development: Allow all updates on render_to_cad" ON render_to_cad;
DROP POLICY IF EXISTS "Development: Allow all deletes on render_to_cad" ON render_to_cad;

-- Create development policies
CREATE POLICY "Development: Allow all reads on render_to_cad"
  ON render_to_cad FOR SELECT
  USING (true);

CREATE POLICY "Development: Allow all inserts on render_to_cad"
  ON render_to_cad FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Development: Allow all updates on render_to_cad"
  ON render_to_cad FOR UPDATE
  USING (true);

CREATE POLICY "Development: Allow all deletes on render_to_cad"
  ON render_to_cad FOR DELETE
  USING (true);

-- Function and trigger for updated_at
CREATE OR REPLACE FUNCTION update_render_to_cad_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_render_to_cad_updated_at_trigger ON render_to_cad;

CREATE TRIGGER update_render_to_cad_updated_at_trigger
  BEFORE UPDATE ON render_to_cad
  FOR EACH ROW
  EXECUTE FUNCTION update_render_to_cad_updated_at();

-- ========================================
-- VERIFICATION
-- ========================================

DO $$
DECLARE
  style_transfer_policy_count INTEGER;
  render_to_cad_policy_count INTEGER;
BEGIN
  -- Count policies
  SELECT COUNT(*) INTO style_transfer_policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'style_transfer';

  SELECT COUNT(*) INTO render_to_cad_policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'render_to_cad';

  -- Report results
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ DATABASE SETUP COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables Created:';
  RAISE NOTICE '  ✅ style_transfer (with % policies)', style_transfer_policy_count;
  RAISE NOTICE '  ✅ render_to_cad (with % policies)', render_to_cad_policy_count;
  RAISE NOTICE '';
  RAISE NOTICE 'RLS Status:';
  RAISE NOTICE '  ✅ style_transfer: RLS enabled';
  RAISE NOTICE '  ✅ render_to_cad: RLS enabled';
  RAISE NOTICE '';
  RAISE NOTICE 'Policies (Development Mode):';
  RAISE NOTICE '  ⚠️ PERMISSIVE - Allow all reads/writes';
  RAISE NOTICE '  ⚠️ Before production: Replace with auth-based policies';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Test API routes (see SUPABASE_MIGRATION_STEPS.md)';
  RAISE NOTICE '  2. Verify Save/Get/Delete operations work';
  RAISE NOTICE '  3. Before go-live: Update to production policies';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
