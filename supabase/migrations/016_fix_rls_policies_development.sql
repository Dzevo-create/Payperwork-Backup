-- ========================================
-- FIX RLS POLICIES FOR STYLE TRANSFER & RENDER TO CAD
-- ========================================
--
-- DEVELOPMENT MODE VERSION
-- Uses permissive policies for development without auth
--
-- ⚠️ WARNING: These policies are WIDE OPEN for development!
-- Before production, replace with proper auth-based policies!
-- ========================================

-- ========================================
-- STYLE TRANSFER: Fix existing policies
-- ========================================

-- Drop old policies (they were already permissive but let's recreate them cleanly)
DROP POLICY IF EXISTS "Users can view their own style-transfer renders" ON style_transfer;
DROP POLICY IF EXISTS "Users can insert their own style-transfer renders" ON style_transfer;
DROP POLICY IF EXISTS "Users can update their own style-transfer renders" ON style_transfer;
DROP POLICY IF EXISTS "Users can delete their own style-transfer renders" ON style_transfer;

-- Recreate policies (DEVELOPMENT MODE - permissive)
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

-- ========================================
-- RENDER TO CAD: Add missing policies
-- ========================================

-- Enable RLS (should already be enabled, but make sure)
ALTER TABLE render_to_cad ENABLE ROW LEVEL SECURITY;

-- Create policies (DEVELOPMENT MODE - permissive)
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

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Verify RLS is enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'style_transfer'
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS not enabled on style_transfer';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'render_to_cad'
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS not enabled on render_to_cad';
  END IF;

  RAISE NOTICE '✅ RLS is enabled on both tables';
END $$;

-- Verify policies exist
DO $$
DECLARE
  style_transfer_policy_count INTEGER;
  render_to_cad_policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO style_transfer_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'style_transfer';

  SELECT COUNT(*) INTO render_to_cad_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'render_to_cad';

  IF style_transfer_policy_count < 4 THEN
    RAISE EXCEPTION 'Expected 4 policies on style_transfer, found %', style_transfer_policy_count;
  END IF;

  IF render_to_cad_policy_count < 4 THEN
    RAISE EXCEPTION 'Expected 4 policies on render_to_cad, found %', render_to_cad_policy_count;
  END IF;

  RAISE NOTICE '✅ All policies created successfully';
  RAISE NOTICE '   - style_transfer: % policies', style_transfer_policy_count;
  RAISE NOTICE '   - render_to_cad: % policies', render_to_cad_policy_count;
END $$;

-- ========================================
-- PRODUCTION POLICIES (COMMENTED OUT)
-- ========================================
--
-- Before going to production, uncomment and run these policies:
--
-- -- Style Transfer Production Policies
-- DROP POLICY IF EXISTS "Development: Allow all reads on style_transfer" ON style_transfer;
-- DROP POLICY IF EXISTS "Development: Allow all inserts on style_transfer" ON style_transfer;
-- DROP POLICY IF EXISTS "Development: Allow all updates on style_transfer" ON style_transfer;
-- DROP POLICY IF EXISTS "Development: Allow all deletes on style_transfer" ON style_transfer;
--
-- CREATE POLICY "Users can view their own style-transfer renders"
--   ON style_transfer FOR SELECT
--   USING (user_id = auth.uid()::TEXT);
--
-- CREATE POLICY "Users can insert their own style-transfer renders"
--   ON style_transfer FOR INSERT
--   WITH CHECK (user_id = auth.uid()::TEXT);
--
-- CREATE POLICY "Users can update their own style-transfer renders"
--   ON style_transfer FOR UPDATE
--   USING (user_id = auth.uid()::TEXT);
--
-- CREATE POLICY "Users can delete their own style-transfer renders"
--   ON style_transfer FOR DELETE
--   USING (user_id = auth.uid()::TEXT);
--
-- -- Render to CAD Production Policies
-- DROP POLICY IF EXISTS "Development: Allow all reads on render_to_cad" ON render_to_cad;
-- DROP POLICY IF EXISTS "Development: Allow all inserts on render_to_cad" ON render_to_cad;
-- DROP POLICY IF EXISTS "Development: Allow all updates on render_to_cad" ON render_to_cad;
-- DROP POLICY IF EXISTS "Development: Allow all deletes on render_to_cad" ON render_to_cad;
--
-- CREATE POLICY "Users can view their own render-to-cad renders"
--   ON render_to_cad FOR SELECT
--   USING (user_id = auth.uid()::TEXT);
--
-- CREATE POLICY "Users can insert their own render-to-cad renders"
--   ON render_to_cad FOR INSERT
--   WITH CHECK (user_id = auth.uid()::TEXT);
--
-- CREATE POLICY "Users can update their own render-to-cad renders"
--   ON render_to_cad FOR UPDATE
--   USING (user_id = auth.uid()::TEXT);
--
-- CREATE POLICY "Users can delete their own render-to-cad renders"
--   ON render_to_cad FOR DELETE
--   USING (user_id = auth.uid()::TEXT);
