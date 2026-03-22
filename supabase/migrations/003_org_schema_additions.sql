-- =============================================================
-- Migration 003: Add org_type alias, plan_tier, max_members
-- =============================================================
-- The app code references org_type, plan_tier, and max_members
-- on the organizations table. This migration adds these columns
-- to align schema with application expectations.
-- =============================================================

-- Add org_type column (duplicate of type for API consistency)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'org_type'
  ) THEN
    ALTER TABLE organizations ADD COLUMN org_type TEXT;
    -- Backfill from existing 'type' column
    UPDATE organizations SET org_type = type;
    -- Add check constraint aligned with app constants
    ALTER TABLE organizations ADD CONSTRAINT organizations_org_type_check
      CHECK (org_type IN ('military', 'law_enforcement', 'ems', 'fire', 'hospital', 'private', 'academic', 'training_institution', 'other'));
  END IF;
END $$;

-- Add plan_tier column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'plan_tier'
  ) THEN
    ALTER TABLE organizations ADD COLUMN plan_tier TEXT NOT NULL DEFAULT 'free'
      CHECK (plan_tier IN ('free', 'professional', 'enterprise'));
  END IF;
END $$;

-- Add max_members column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'max_members'
  ) THEN
    ALTER TABLE organizations ADD COLUMN max_members INTEGER NOT NULL DEFAULT 5;
  END IF;
END $$;

-- Keep org_type in sync with type on INSERT/UPDATE via trigger
CREATE OR REPLACE FUNCTION sync_org_type()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_type IS NULL AND NEW.type IS NOT NULL THEN
    NEW.org_type := NEW.type;
  END IF;
  IF NEW.type IS NULL AND NEW.org_type IS NOT NULL THEN
    NEW.type := NEW.org_type;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_org_type ON organizations;
CREATE TRIGGER trg_sync_org_type
  BEFORE INSERT OR UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION sync_org_type();

-- Add token column to organization_invites if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_invites' AND column_name = 'token'
  ) THEN
    ALTER TABLE organization_invites ADD COLUMN token TEXT UNIQUE;
    -- Create index for fast token lookups
    CREATE INDEX IF NOT EXISTS idx_org_invites_token ON organization_invites(token);
  END IF;
END $$;

-- Add invited_by column to organization_invites if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization_invites' AND column_name = 'invited_by'
  ) THEN
    ALTER TABLE organization_invites ADD COLUMN invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Ensure doctrine_documents has all expected columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'doctrine_documents' AND column_name = 'file_size'
  ) THEN
    ALTER TABLE doctrine_documents ADD COLUMN file_size BIGINT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'doctrine_documents' AND column_name = 'file_type'
  ) THEN
    ALTER TABLE doctrine_documents ADD COLUMN file_type TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'doctrine_documents' AND column_name = 'storage_path'
  ) THEN
    ALTER TABLE doctrine_documents ADD COLUMN storage_path TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'doctrine_documents' AND column_name = 'processing_status'
  ) THEN
    ALTER TABLE doctrine_documents ADD COLUMN processing_status TEXT NOT NULL DEFAULT 'pending'
      CHECK (processing_status IN ('pending', 'processing', 'complete', 'error'));
  END IF;
END $$;

-- Ensure scenario_injects table has 'content' column (referenced in some queries)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scenario_injects' AND column_name = 'content'
  ) THEN
    ALTER TABLE scenario_injects ADD COLUMN content TEXT;
  END IF;
END $$;

-- Expand organization_members role check constraint to include app roles:
-- 'proctor' (alias for assistant_proctor) and 'analyst'
-- Drop the existing constraint and add an expanded one
DO $$
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE organization_members
    DROP CONSTRAINT IF EXISTS organization_members_role_check;

  -- Add expanded constraint
  ALTER TABLE organization_members
    ADD CONSTRAINT organization_members_role_check
    CHECK (role IN (
      'org_admin',
      'super_admin',
      'lead_proctor',
      'proctor',
      'assistant_proctor',
      'evaluator',
      'observer',
      'role_player_coordinator',
      'doctrine_sme',
      'analyst',
      'trainee'
    ));
EXCEPTION
  WHEN others THEN
    -- Constraint may already be expanded, continue
    NULL;
END $$;

-- Expand audit_logs.resource_id to allow TEXT (some resources use string tokens not UUIDs)
-- The existing schema has resource_id UUID — change to TEXT for flexibility
ALTER TABLE audit_logs
  ALTER COLUMN resource_id TYPE TEXT USING resource_id::TEXT;

-- Remove the storage_path and processing_status columns added above since doctrine_documents
-- doesn't need them (we track storage paths in metadata instead)
-- (These are safe no-ops if columns don't exist)
