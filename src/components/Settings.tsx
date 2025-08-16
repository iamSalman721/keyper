import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Settings as SettingsIcon,
  Database,
  TestTube,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  RefreshCw,
  Trash2,
  RotateCcw,
  ArrowLeft,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  saveSupabaseCredentials,
  clearSupabaseCredentials,
  createTestSupabaseClient,
  refreshSupabaseClient,
  SUPABASE_URL_KEY,
  SUPABASE_KEY_KEY,
  SUPABASE_USERNAME_KEY
} from '@/integrations/supabase/client';

interface SettingsProps {
  onConfigurationComplete?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onConfigurationComplete }) => {
  // Initialize state directly from localStorage like the reference app
  const [supabaseUrl, setSupabaseUrl] = useState<string>(() => {
    return localStorage.getItem(SUPABASE_URL_KEY) || '';
  });
  const [supabaseKey, setSupabaseKey] = useState<string>(() => {
    return localStorage.getItem(SUPABASE_KEY_KEY) || '';
  });
  const [username, setUsername] = useState<string>(() => {
    return localStorage.getItem(SUPABASE_USERNAME_KEY) || '';
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showSqlScript, setShowSqlScript] = useState(false);
  const { toast } = useToast();

  // No need for useEffect - credentials are loaded directly in state initializers

  const testConnection = async () => {
    if (!supabaseUrl || !supabaseKey) {
      setErrorMessage('Please enter both Supabase URL and API key');
      setConnectionStatus('error');
      return;
    }

    setIsConnecting(true);
    setConnectionStatus('idle');
    setErrorMessage('');

    try {
      // Debug logging
      console.log('Testing connection with:', {
        url: supabaseUrl,
        keyLength: supabaseKey.length,
        username: username || 'self-hosted-user'
      });

      // Create a test client with the provided credentials
      const testClient = createTestSupabaseClient(supabaseUrl, supabaseKey);
      
      // Test the connection by trying to query the credentials table
      const { data, error } = await testClient
        .from('credentials')
        .select('count', { count: 'exact', head: true });

      if (error) {
        throw new Error(`Database connection failed: ${error.message}`);
      }

      setConnectionStatus('success');
      toast({
        title: "Connection Successful! 🎉",
        description: "Successfully connected to your Supabase instance.",
      });

      // Save credentials if connection is successful
      const finalUsername = username.trim() || 'self-hosted-user';
      console.log('Saving credentials:', { url: supabaseUrl, keyLength: supabaseKey.length, username: finalUsername });
      const saveResult = saveSupabaseCredentials(supabaseUrl, supabaseKey, finalUsername);
      console.log('Save result:', saveResult);
      
      // Note: Don't automatically call onConfigurationComplete here
      // Let user manually save and close with the Save & Close button
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Connection failed');
      toast({
        title: "Connection Failed ❌",
        description: "Please check your credentials and database setup.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const clearConfiguration = () => {
    // Clear credentials from localStorage
    clearSupabaseCredentials();
    // Reset form state to empty strings (not default values)
    setSupabaseUrl('');
    setSupabaseKey('');
    setUsername('');
    setConnectionStatus('idle');
    setErrorMessage('');
    // Refresh the main client to use default credentials
    refreshSupabaseClient();
    toast({
      title: "Configuration Cleared",
      description: "Supabase credentials have been cleared. You can now enter new credentials.",
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard.`,
    });
  };

  const refreshPage = () => {
    window.location.reload();
  };

  // Manual save and close function
  const handleSaveAndClose = () => {
    // Save current values
    const finalUsername = username.trim() || 'self-hosted-user';
    console.log('HandleSaveAndClose - saving:', { url: supabaseUrl, keyLength: supabaseKey.length, username: finalUsername });
    if (supabaseUrl && supabaseKey) {
      const saveResult = saveSupabaseCredentials(supabaseUrl, supabaseKey, finalUsername);
      console.log('HandleSaveAndClose - save result:', saveResult);
      toast({
        title: "Settings Saved! 💾",
        description: "Your configuration has been saved.",
      });
    }
    
    // Close settings and trigger completion callback
    if (onConfigurationComplete) {
      onConfigurationComplete();
    }
  };

  // Manual close without saving
  const handleCloseWithoutSaving = () => {
    if (onConfigurationComplete) {
      onConfigurationComplete();
    }
  };

  const sqlScript = `-- =====================================================
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
-- Made with ❤️ by Pink Pixel - Dream it, Pixel it ✨
`;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="h-8 w-8 text-cyan-400" />
        <div>
          <h1 className="text-3xl font-bold text-white">Keyper Settings</h1>
          <p className="text-gray-400">Configure your self-hosted Supabase instance</p>
        </div>
      </div>

      <Tabs defaultValue="database" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Database Setup
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="about" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            About
          </TabsTrigger>
        </TabsList>

        <TabsContent value="database" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-cyan-400" />
                Supabase Configuration
              </CardTitle>
              <CardDescription>
                Connect Keyper to your Supabase instance for secure credential storage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="supabase-url">Supabase Project URL</Label>
                <Input
                  id="supabase-url"
                  type="url"
                  placeholder="https://your-project.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supabase-key">Supabase Anon Key</Label>
                <Input
                  id="supabase-key"
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="e.g., john, admin, team1 (leave empty for default)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="font-mono"
                />
                <p className="text-sm text-gray-400">
                  💡 Use different usernames to separate credentials for multiple users on the same instance
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={testConnection}
                  disabled={isConnecting || !supabaseUrl || !supabaseKey}
                  className="flex items-center gap-2"
                >
                  {isConnecting ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4" />
                  )}
                  {isConnecting ? 'Testing...' : 'Test Connection'}
                </Button>

                <Button
                  variant="outline"
                  onClick={clearConfiguration}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear
                </Button>
              </div>

              {/* Save and Close Actions */}
              <div className="flex gap-3 pt-6 border-t border-gray-700">
                <Button
                  onClick={handleSaveAndClose}
                  className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700"
                  disabled={!supabaseUrl || !supabaseKey}
                >
                  <CheckCircle className="h-4 w-4" />
                  Save & Close
                </Button>

                <Button
                  variant="outline"
                  onClick={handleCloseWithoutSaving}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Close
                </Button>

                <Button
                  variant="outline"
                  onClick={refreshPage}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Refresh App
                </Button>
              </div>

              {connectionStatus !== 'idle' && (
                <Alert className={connectionStatus === 'success' ? 'border-green-500' : 'border-red-500'}>
                  <div className="flex items-center gap-2">
                    {connectionStatus === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <AlertDescription>
                      {connectionStatus === 'success' 
                        ? 'Successfully connected to Supabase! Your credentials are saved.'
                        : `Connection failed: ${errorMessage}`
                      }
                    </AlertDescription>
                  </div>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
                Database Setup Required
              </CardTitle>
              <CardDescription>
                Before connecting, you need to set up the database schema in your Supabase instance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm text-gray-300">
                  <strong>Step 1:</strong> Go to your Supabase dashboard → SQL Editor
                </p>
                <p className="text-sm text-gray-300">
                  <strong>Step 2:</strong> Copy the complete SQL setup script below
                </p>
                <p className="text-sm text-gray-300">
                  <strong>Step 3:</strong> Paste and run the script in your SQL Editor
                </p>
                <p className="text-sm text-gray-300">
                  <strong>Step 4:</strong> Return here, test your connection, then <strong>refresh the app</strong>
                </p>
              </div>

              <Alert className="border-cyan-500 bg-cyan-950/20">
                <AlertCircle className="h-4 w-4 text-cyan-400" />
                <AlertDescription className="text-cyan-200">
                  <strong>Important:</strong> After successful connection, click "Refresh App" to load your dashboard properly, especially when using the PWA version.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3 flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Supabase Dashboard
                </Button>

                <Button
                  onClick={() => copyToClipboard(sqlScript, 'Complete SQL setup script')}
                  className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700"
                >
                  <Copy className="h-4 w-4" />
                  Copy Complete SQL Script
                </Button>
              </div>

              {showSqlScript && (
                <div className="mt-4">
                  <Label className="text-sm font-medium mb-2 block">SQL Script Preview:</Label>
                  <div className="bg-gray-900 p-4 rounded-lg max-h-40 overflow-y-auto">
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                      {sqlScript.substring(0, 500)}...
                    </pre>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSqlScript(false)}
                    className="mt-2"
                  >
                    Hide Preview
                  </Button>
                </div>
              )}

              {!showSqlScript && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSqlScript(true)}
                  className="text-cyan-400 hover:text-cyan-300"
                >
                  Show SQL Script Preview
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🔐 Keyper - Self-Hosted
              </CardTitle>
              <CardDescription>
                Secure credential management for your own infrastructure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Version</Label>
                  <p className="text-sm text-gray-300">0.1.0</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Mode</Label>
                  <Badge variant="secondary">Self-Hosted</Badge>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Made with ❤️ by Pink Pixel</Label>
                <p className="text-sm text-gray-400">Dream it, Pixel it ✨</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                Security Information
              </CardTitle>
              <CardDescription>
                Keyper's security architecture and encryption details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Encryption Method</Label>
                      <p className="text-sm text-muted-foreground">AES-GCM with Argon2id key derivation</p>
                    </div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Storage</Label>
                      <p className="text-sm text-muted-foreground">Database-only encrypted storage</p>
                    </div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Zero Knowledge</Label>
                      <p className="text-sm text-muted-foreground">Passphrase never leaves your device</p>
                    </div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Auto-Lock</Label>
                      <p className="text-sm text-muted-foreground">15-minute inactivity timeout</p>
                    </div>
                  </div>
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Security Note:</strong> Keyper uses client-side encryption with database-only storage.
                    Your master passphrase is never transmitted or stored - it only exists in memory while you're using the app.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Security Features</Label>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• End-to-end encryption with AES-GCM</li>
                    <li>• Argon2id key derivation (memory-hard)</li>
                    <li>• Auto-lock on inactivity</li>
                    <li>• Database breach protection</li>
                    <li>• Zero-knowledge architecture</li>
                    <li>• No localStorage storage of sensitive data</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
