import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  UserPlus, 
  Trash2, 
  Settings, 
  RefreshCw, 
  AlertTriangle, 
  Info, 
  Database,
  Key,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUsername, clearSupabaseCredentials, isCurrentUserAdmin, getAdminUser, supabase, saveSupabaseCredentials, getSupabaseCredentials } from '@/integrations/supabase/client';
import { secureVault } from '@/services/SecureVault';

interface DashboardSettingsProps {
  onUserCreated?: () => void;
}

export const DashboardSettings: React.FC<DashboardSettingsProps> = ({ onUserCreated }) => {
  const [newUsername, setNewUsername] = useState('');
  const [newPassphrase, setNewPassphrase] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const currentUser = getCurrentUsername();
  const adminUser = getAdminUser();
  const isSuperAdmin = isCurrentUserAdmin();

  const handleCreateUser = async () => {
    if (!newUsername || !newPassphrase) {
      toast({
        title: "Error",
        description: "Username and passphrase are required",
        variant: "destructive",
      });
      return;
    }

    if (!isSuperAdmin) {
      toast({
        title: "Access Denied",
        description: "Only superadmin users can create new users",
        variant: "destructive",
      });
      return;
    }

    if (newPassphrase.length < 8) {
      toast({
        title: "Error",
        description: "Passphrase must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreating(true);
      
      // Check if user already exists in vault_config
      const { data: existingUsers, error: checkError } = await supabase
        .from('vault_config')
        .select('user_id')
        .eq('user_id', newUsername.trim());
      
      if (checkError && checkError.code !== 'PGRST116') {
        throw new Error(`Failed to check existing users: ${checkError.message}`);
      }
      
      if (existingUsers && existingUsers.length > 0) {
        toast({
          title: "Error",
          description: `User '${newUsername}' already exists`,
          variant: "destructive",
        });
        return;
      }
      
      // Create a new vault for the user
      // IMPORTANT: We need to temporarily switch context to create vault for new user
      console.log('🔧 Creating vault for new user:', newUsername.trim());
      console.log('🔧 Admin context before:', getCurrentUsername());
      
      // Lock the current vault to clear any existing state
      secureVault.lock();
      console.log('🔧 Locked vault to clear state');
      
      // Temporarily save the new user as current user for vault creation
      const adminCredentials = getSupabaseCredentials();
      saveSupabaseCredentials(adminCredentials.supabaseUrl, adminCredentials.supabaseKey, newUsername.trim());
      
      console.log('🔧 Switched context to:', getCurrentUsername());
      const wrappedDEK = await secureVault.createNewVault(newPassphrase);
      
      // Lock the vault again to clear the new user's state
      secureVault.lock();
      console.log('🔧 Locked vault after user creation');
      
      // Switch back to admin user
      saveSupabaseCredentials(adminCredentials.supabaseUrl, adminCredentials.supabaseKey, currentUser);
      console.log('🔧 Switched back to admin:', getCurrentUsername());
      
      // Save the wrapped DEK to the database for the new user
      const { error: insertError } = await supabase
        .from('vault_config')
        .insert({
          user_id: newUsername.trim(),
          wrapped_dek: wrappedDEK,
        });
      
      if (insertError) {
        throw new Error(`Failed to create user vault: ${insertError.message}`);
      }
      
      // Create default categories for the new user
      const defaultCategories = [
        { user_id: newUsername.trim(), name: 'Development', color: '#3b82f6', icon: 'code', description: 'Development tools and APIs' },
        { user_id: newUsername.trim(), name: 'Personal', color: '#10b981', icon: 'user', description: 'Personal accounts and services' },
        { user_id: newUsername.trim(), name: 'Work', color: '#f59e0b', icon: 'briefcase', description: 'Work-related credentials' },
        { user_id: newUsername.trim(), name: 'Social Media', color: '#ec4899', icon: 'users', description: 'Social media accounts' },
        { user_id: newUsername.trim(), name: 'Finance', color: '#06b6d4', icon: 'credit-card', description: 'Banking and financial services' },
        { user_id: newUsername.trim(), name: 'Cloud Services', color: '#8b5cf6', icon: 'cloud', description: 'Cloud platforms and services' },
        { user_id: newUsername.trim(), name: 'Security', color: '#ef4444', icon: 'shield', description: 'Security tools and certificates' }
      ];
      
      const { error: categoriesError } = await supabase
        .from('categories')
        .insert(defaultCategories);
      
      if (categoriesError) {
        console.warn('Failed to create default categories for new user:', categoriesError);
        // Don't fail the user creation for this
      }
      
      toast({
        title: "Success! 🎉",
        description: `User '${newUsername}' created successfully. They can now login with their credentials.`,
      });
      
      setNewUsername('');
      setNewPassphrase('');
      onUserCreated?.();
      
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleResetLocalData = () => {
    if (confirm('This will clear all local configuration and require database setup again. Continue?')) {
      clearSupabaseCredentials();
      localStorage.clear();
      toast({
        title: "Local Data Cleared",
        description: "All local configuration has been reset. Please refresh the page.",
      });
      setTimeout(() => window.location.reload(), 2000);
    }
  };

  const handleClearBrowserCache = () => {
    const instructions = `To completely reset Keyper:

1. Open browser settings
2. Go to Privacy/Security section
3. Clear browsing data/storage
4. Select "Cookies and site data" and "Cached files"
5. Choose "All time" as time range
6. Click Clear data
7. Refresh this page`;
    
    navigator.clipboard.writeText(instructions);
    toast({
      title: "Instructions Copied",
      description: "Browser cache clearing instructions copied to clipboard",
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-8 w-8 text-cyan-400" />
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard Settings</h1>
          <p className="text-gray-400">User management and system controls</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="reset" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Reset Options
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            System Info
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {isSuperAdmin ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-green-400" />
                  Create New User
                </CardTitle>
                <CardDescription>
                  Add new users to this Keyper instance. Each user will have their own encrypted vault.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-username">Username *</Label>
                    <Input
                      id="new-username"
                      type="text"
                      placeholder="e.g., alice, bob, team1"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-passphrase">Initial Passphrase *</Label>
                    <Input
                      id="new-passphrase"
                      type="password"
                      placeholder="Strong passphrase for the user"
                      value={newPassphrase}
                      onChange={(e) => setNewPassphrase(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                </div>
                
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    The new user will be able to login with these credentials and change their passphrase later.
                  </AlertDescription>
                </Alert>
                
                <Button
                  onClick={handleCreateUser}
                  disabled={isCreating || !newUsername || !newPassphrase}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  {isCreating ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  {isCreating ? 'Creating...' : 'Create User'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-400">
                  <AlertTriangle className="h-5 w-5" />
                  Access Restricted
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Only the admin user can create new users. 
                    Current user: <strong>{currentUser}</strong> | 
                    Admin user: <strong>{adminUser || 'Not set'}</strong>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reset" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-orange-400" />
                Reset Local Configuration
              </CardTitle>
              <CardDescription>
                Clear local settings and force database reconfiguration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm text-gray-300">
                  This will clear your Supabase connection settings and require you to set them up again.
                </p>
                <Button
                  onClick={handleResetLocalData}
                  variant="outline"
                  className="flex items-center gap-2 border-orange-500 text-orange-400 hover:bg-orange-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                  Reset Local Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-red-400" />
                Reset Master Passphrase
              </CardTitle>
              <CardDescription>
                Securely reset your master passphrase (WARNING: This will delete all encrypted data)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>WARNING:</strong> Resetting your master passphrase will make all existing encrypted credentials inaccessible. 
                  This action cannot be undone.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3">
                <p className="text-sm text-gray-300">
                  To reset your master passphrase:
                </p>
                <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
                  <li>Export any important credentials manually</li>
                  <li>Clear local configuration (button above)</li>
                  <li>Clear browser cache completely</li>
                  <li>Refresh the app and set up a new passphrase</li>
                </ol>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-400" />
                Complete Browser Reset
              </CardTitle>
              <CardDescription>
                Instructions to completely reset Keyper in your browser
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm text-gray-300">
                  For a complete reset, follow these browser-specific steps:
                </p>
                <Button
                  onClick={handleClearBrowserCache}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Copy Reset Instructions
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-cyan-400" />
                System Information
              </CardTitle>
              <CardDescription>
                Current system status and configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Current User</Label>
                    <p className="text-sm text-muted-foreground font-mono">{currentUser}</p>
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">User Type</Label>
                    <p className="text-sm text-muted-foreground">
                      {isSuperAdmin ? 'Superadmin' : 'Regular User'}
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Admin User</Label>
                    <p className="text-sm text-muted-foreground font-mono">{adminUser || 'Not set'}</p>
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">App Version</Label>
                    <p className="text-sm text-muted-foreground">0.1.0</p>
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Mode</Label>
                    <p className="text-sm text-muted-foreground">Self-Hosted</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Database Configuration</Label>
                <p className="text-sm text-gray-400">
                  Only superadmin users can modify database connection settings.
                  Regular users operate within their isolated encrypted vaults.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

