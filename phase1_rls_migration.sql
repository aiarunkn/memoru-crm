-- =============================================================================
-- Phase 1: Row Level Security — contacts table
-- Paste this entire file into: Supabase Dashboard > SQL Editor > New query
-- Run it ONCE. It is safe to re-run (all steps are idempotent).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- STEP 0: Inspect before you apply (optional but recommended)
-- Run these two SELECT statements first to understand current state.
-- Comment them out or ignore their output before running the rest.
-- -----------------------------------------------------------------------------

-- How many rows exist, and how many already have a user_id?
SELECT
  COUNT(*)                              AS total_rows,
  COUNT(user_id)                        AS rows_with_user_id,
  COUNT(*) - COUNT(user_id)            AS rows_missing_user_id
FROM public.contacts;

-- Preview any rows that would need manual assignment:
-- SELECT id, name, company FROM public.contacts WHERE user_id IS NULL;


-- -----------------------------------------------------------------------------
-- STEP 1: Ensure user_id column exists
-- (Safe if it already exists — the DO block skips the ALTER if present.)
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'contacts'
      AND column_name  = 'user_id'
  ) THEN
    ALTER TABLE public.contacts ADD COLUMN user_id uuid;
  END IF;
END $$;


-- -----------------------------------------------------------------------------
-- STEP 2: Set default so every new insert auto-fills user_id from the session
-- -----------------------------------------------------------------------------

ALTER TABLE public.contacts
  ALTER COLUMN user_id SET DEFAULT auth.uid();


-- -----------------------------------------------------------------------------
-- STEP 3: Backfill / handle NULL user_id rows
--
-- If you have existing contacts that were inserted before user_id existed,
-- they will have NULL here and the NOT NULL constraint below will fail.
--
-- Option A — you have NO real data yet (safe to delete orphans):
--   DELETE FROM public.contacts WHERE user_id IS NULL;
--
-- Option B — all existing rows belong to your own account:
--   UPDATE public.contacts
--     SET user_id = auth.uid()   -- only works if you're logged in via dashboard
--   WHERE user_id IS NULL;
--
-- Option C — you know the UUID of the owner:
--   UPDATE public.contacts
--     SET user_id = '<paste-your-uuid-here>'
--   WHERE user_id IS NULL;
--
-- Check auth.users to find your UUID:
--   SELECT id, email FROM auth.users;
--
-- UNCOMMENT ONE of the options below that fits your situation, then proceed.
-- -----------------------------------------------------------------------------

-- DELETE FROM public.contacts WHERE user_id IS NULL;

-- UPDATE public.contacts SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;


-- -----------------------------------------------------------------------------
-- STEP 4: Enforce NOT NULL (run after Step 3 — will fail if any NULLs remain)
-- -----------------------------------------------------------------------------

ALTER TABLE public.contacts
  ALTER COLUMN user_id SET NOT NULL;


-- -----------------------------------------------------------------------------
-- STEP 5: Add foreign key → auth.users with cascade delete
-- (Skipped if constraint already exists.)
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'contacts_user_id_fkey'
      AND table_name      = 'contacts'
      AND table_schema    = 'public'
  ) THEN
    ALTER TABLE public.contacts
      ADD CONSTRAINT contacts_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES auth.users (id)
      ON DELETE CASCADE;
  END IF;
END $$;


-- -----------------------------------------------------------------------------
-- STEP 6: Enable Row Level Security
-- -----------------------------------------------------------------------------

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Also force RLS for the table owner (postgres role), so even superuser
-- queries through the anon/service key respect the policies:
ALTER TABLE public.contacts FORCE ROW LEVEL SECURITY;


-- -----------------------------------------------------------------------------
-- STEP 7: Drop any stale policies, then create clean ones
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "contacts_select_own"  ON public.contacts;
DROP POLICY IF EXISTS "contacts_insert_own"  ON public.contacts;
DROP POLICY IF EXISTS "contacts_update_own"  ON public.contacts;
DROP POLICY IF EXISTS "contacts_delete_own"  ON public.contacts;

-- SELECT: users see only their own rows
CREATE POLICY "contacts_select_own"
  ON public.contacts
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: user_id on the new row must match the session uid
CREATE POLICY "contacts_insert_own"
  ON public.contacts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: can only touch own rows, and cannot reassign user_id to someone else
CREATE POLICY "contacts_update_own"
  ON public.contacts
  FOR UPDATE
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: can only delete own rows
CREATE POLICY "contacts_delete_own"
  ON public.contacts
  FOR DELETE
  USING (auth.uid() = user_id);


-- -----------------------------------------------------------------------------
-- STEP 8: Verify — run these after applying to confirm everything is in place
-- -----------------------------------------------------------------------------

-- Should show rls_enabled = true for contacts:
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'contacts';

-- Should show 4 policies:
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'contacts';
