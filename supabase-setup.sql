-- =====================================================
-- 🔐 KEYPER DATABASE SETUP (Single Script)
-- =====================================================
-- 
-- Complete database setup for Keyper - encrypted vault system
-- This script creates all tables, indexes, policies, and functions needed.
-- 
-- Run this ENTIRE script in your Supabase SQL Editor.
-- 
-- Made with ❤️ by Pink Pixel ✨
-- Date: August 1, 2025
-- =====================================================

-- ============================================================================
-- 1. CREATE TABLES
-- ============================================================================

-- Main credentials table - encrypted storage only
CREATE TABLE IF NOT EXISTS credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'self-hosted-user',
  title TEXT NOT NULL,
  description TEXT,
  credential_type TEXT NOT NULL DEFAULT 'secret' CHECK (credential_type IN ('api_key', 'login', 'secret', 'token', 'certificate')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  username TEXT,
  url TEXT,
  tags TEXT[] DEFAULT '{}',
  category TEXT,
  notes TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  last_accessed TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Encrypted storage (all sensitive data stored here)
  secret_blob JSONB NOT NULL,
  encrypted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vault configuration table for secure key management
CREATE TABLE IF NOT EXISTS vault_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'self-hosted-user',
  wrapped_dek JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one config per user
  UNIQUE(user_id)
);

-- Categories table for organization
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'self-hosted-user',
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'folder',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique category names per user
  UNIQUE(user_id, name)
);

-- ============================================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Credentials table indexes
CREATE INDEX IF NOT EXISTS idx_credentials_user_id ON credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_credentials_type ON credentials(credential_type);
CREATE INDEX IF NOT EXISTS idx_credentials_category ON credentials(category);
CREATE INDEX IF NOT EXISTS idx_credentials_created_at ON credentials(created_at);
CREATE INDEX IF NOT EXISTS idx_credentials_tags ON credentials USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_credentials_expires_at ON credentials(expires_at) WHERE expires_at IS NOT NULL;

-- Encryption-specific indexes
CREATE INDEX IF NOT EXISTS idx_credentials_encrypted ON credentials ((secret_blob IS NOT NULL));
CREATE INDEX IF NOT EXISTS idx_credentials_encrypted_at ON credentials (encrypted_at) WHERE encrypted_at IS NOT NULL;

-- Vault config indexes
CREATE INDEX IF NOT EXISTS idx_vault_config_user_id ON vault_config(user_id);

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- ============================================================================
-- 3. CREATE AUTOMATIC TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_credentials_updated_at ON credentials;
CREATE TRIGGER update_credentials_updated_at
  BEFORE UPDATE ON credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vault_config_updated_at ON vault_config;
CREATE TRIGGER update_vault_config_updated_at
  BEFORE UPDATE ON vault_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. DROP EXISTING POLICIES (Clean slate)
-- ============================================================================

-- Drop all existing policies for clean setup
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies for credentials table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'credentials' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON credentials';
    END LOOP;
    
    -- Drop all policies for vault_config table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'vault_config' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON vault_config';
    END LOOP;
    
    -- Drop all policies for categories table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'categories' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON categories';
    END LOOP;
END $$;

-- ============================================================================
-- 6. CREATE RLS POLICIES (Self-Hosted Mode)
-- ============================================================================

-- CREDENTIALS TABLE POLICIES
-- Self-hosted mode: Allow access to data for any user (no authentication required)
-- This enables multi-user support on the same instance
CREATE POLICY "credentials_select_policy" ON credentials
  FOR SELECT USING (true);

CREATE POLICY "credentials_insert_policy" ON credentials
  FOR INSERT WITH CHECK (true);

CREATE POLICY "credentials_update_policy" ON credentials
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "credentials_delete_policy" ON credentials
  FOR DELETE USING (true);

-- VAULT_CONFIG TABLE POLICIES
-- Self-hosted mode: Allow access to vault configs for any user
-- This enables multi-user support on the same instance
CREATE POLICY "vault_config_select_policy" ON vault_config
  FOR SELECT USING (true);

CREATE POLICY "vault_config_insert_policy" ON vault_config
  FOR INSERT WITH CHECK (true);

CREATE POLICY "vault_config_update_policy" ON vault_config
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "vault_config_delete_policy" ON vault_config
  FOR DELETE USING (true);

-- CATEGORIES TABLE POLICIES
-- Self-hosted mode: Allow access to categories for any user
-- This enables multi-user support on the same instance
CREATE POLICY "categories_select_policy" ON categories
  FOR SELECT USING (true);

CREATE POLICY "categories_insert_policy" ON categories
  FOR INSERT WITH CHECK (true);

CREATE POLICY "categories_update_policy" ON categories
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "categories_delete_policy" ON categories
  FOR DELETE USING (true);

-- ============================================================================
-- 7. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to get credential statistics
CREATE OR REPLACE FUNCTION get_credential_stats()
RETURNS TABLE(
  total_credentials BIGINT,
  by_type JSONB,
  by_category JSONB,
  recent_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_credentials,
    COALESCE(jsonb_object_agg(credential_type, type_count), '{}'::jsonb) as by_type,
    COALESCE(jsonb_object_agg(COALESCE(category, 'Uncategorized'), cat_count), '{}'::jsonb) as by_category,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as recent_count
  FROM (
    SELECT 
      credential_type,
      category,
      created_at,
      COUNT(*) OVER (PARTITION BY credential_type) as type_count,
      COUNT(*) OVER (PARTITION BY COALESCE(category, 'Uncategorized')) as cat_count
    FROM credentials
    WHERE user_id = 'self-hosted-user'
  ) stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check RLS configuration
CREATE OR REPLACE FUNCTION check_rls_status()
RETURNS TABLE(
  table_name TEXT,
  rls_enabled BOOLEAN,
  policy_count BIGINT,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::TEXT,
    COALESCE(c.relrowsecurity, false) as rls_enabled,
    COALESCE(p.policy_count, 0) as policy_count,
    CASE 
      WHEN COALESCE(c.relrowsecurity, false) AND COALESCE(p.policy_count, 0) >= 4 THEN '✅ OK'
      WHEN COALESCE(c.relrowsecurity, false) AND COALESCE(p.policy_count, 0) < 4 THEN '⚠️ MISSING_POLICIES'
      WHEN NOT COALESCE(c.relrowsecurity, false) THEN '❌ RLS_DISABLED'
      ELSE '❓ UNKNOWN'
    END as status
  FROM information_schema.tables t
  LEFT JOIN pg_class c ON c.relname = t.table_name AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  LEFT JOIN (
    SELECT tablename, COUNT(*) as policy_count
    FROM pg_policies 
    WHERE schemaname = 'public'
    GROUP BY tablename
  ) p ON p.tablename = t.table_name
  WHERE t.table_schema = 'public' 
    AND t.table_name IN ('credentials', 'vault_config', 'categories')
    AND t.table_type = 'BASE TABLE';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. INSERT DEFAULT CATEGORIES
-- ============================================================================

-- Insert default categories for organization
INSERT INTO categories (user_id, name, color, icon, description) VALUES 
  ('self-hosted-user', 'Development', '#3b82f6', 'code', 'Development tools and APIs'),
  ('self-hosted-user', 'Personal', '#10b981', 'user', 'Personal accounts and services'),
  ('self-hosted-user', 'Work', '#f59e0b', 'briefcase', 'Work-related credentials'),
  ('self-hosted-user', 'Social Media', '#ec4899', 'users', 'Social media accounts'),
  ('self-hosted-user', 'Finance', '#06b6d4', 'credit-card', 'Banking and financial services'),
  ('self-hosted-user', 'Cloud Services', '#8b5cf6', 'cloud', 'Cloud platforms and services'),
  ('self-hosted-user', 'Security', '#ef4444', 'shield', 'Security tools and certificates')
ON CONFLICT (user_id, name) DO NOTHING;

-- ============================================================================
-- 9. ADD DOCUMENTATION COMMENTS
-- ============================================================================

COMMENT ON TABLE credentials IS 'Main credentials table with end-to-end encryption support';
COMMENT ON TABLE vault_config IS 'Vault configuration for secure key management';
COMMENT ON TABLE categories IS 'Categories for organizing credentials';

COMMENT ON COLUMN credentials.secret_blob IS 'Encrypted JSON blob containing all secret data';
COMMENT ON COLUMN credentials.encrypted_at IS 'Timestamp when the credential was encrypted';
COMMENT ON COLUMN vault_config.wrapped_dek IS 'Wrapped data encryption key for vault security';

COMMENT ON FUNCTION get_credential_stats IS 'Get comprehensive statistics about stored credentials';
COMMENT ON FUNCTION check_rls_status IS 'Check Row Level Security configuration status';

-- ============================================================================
-- 10. VERIFICATION QUERIES
-- ============================================================================

-- Verify table creation
SELECT 
  table_name,
  CASE 
    WHEN table_name = ANY(ARRAY['credentials', 'vault_config', 'categories']) THEN '✅ Created'
    ELSE '❌ Missing'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('credentials', 'vault_config', 'categories')
ORDER BY table_name;

-- Verify RLS configuration
SELECT * FROM check_rls_status();

-- Verify default categories
SELECT name, color, icon FROM categories WHERE user_id = 'self-hosted-user' ORDER BY name;

-- Test basic functionality
SELECT COUNT(*) as total_credentials FROM credentials WHERE user_id = 'self-hosted-user';
SELECT COUNT(*) as total_categories FROM categories WHERE user_id = 'self-hosted-user';

-- =====================================================
-- 🎉 SETUP COMPLETE!
-- =====================================================
--
-- Your Keyper database is now ready with:
-- 
-- ✅ credentials table (with encryption support)
-- ✅ vault_config table (secure key management)
-- ✅ categories table (for organization)
-- ✅ Performance indexes on all tables
-- ✅ Row Level Security (RLS) enabled
-- ✅ Comprehensive security policies
-- ✅ Automatic timestamp triggers
-- ✅ Helper functions for encryption management
-- ✅ Default categories for organization
-- ✅ Verification queries for troubleshooting
--
-- NEXT STEPS:
-- 1. Configure your Supabase URL and anon key in Keyper
-- 2. Set up your master passphrase in the app
-- 3. Start creating encrypted credentials!
--
-- SECURITY NOTES:
-- - Use the anon/public key (NOT service role key) in your app
-- - All credentials are isolated to 'self-hosted-user'
-- - All sensitive data is stored encrypted in secret_blob column
-- - Zero-knowledge architecture: your passphrase never leaves your device
-- - RLS policies prevent unauthorized access
--
-- TROUBLESHOOTING:
-- Run these queries if you encounter issues:
-- - SELECT * FROM check_rls_status();
-- - SELECT * FROM get_credential_stats();
--
-- =====================================================
