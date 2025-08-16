// Keyper Supabase Client Configuration - Self-Hosting Support
// Made with ❤️ by Pink Pixel
// This file provides the Supabase client with both default and custom configurations.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Default Supabase configuration - placeholder values for self-hosted version
// Users will configure their own Supabase instance through the Settings UI
const DEFAULT_SUPABASE_URL = "https://your-project.supabase.co";
const DEFAULT_SUPABASE_KEY = "your-anon-key";

// Storage keys for Supabase credentials
export const SUPABASE_URL_KEY = 'keyper-supabase-url';
export const SUPABASE_KEY_KEY = 'keyper-supabase-key';
export const SUPABASE_USERNAME_KEY = 'keyper-username';
export const KEYPER_ADMIN_USER_KEY = 'keyper-admin-user';


// Helper function to get the current Supabase URL and key
export const getSupabaseCredentials = () => {
  try {
    // Try to get custom credentials from localStorage
    const customUrl = localStorage.getItem(SUPABASE_URL_KEY);
    const customKey = localStorage.getItem(SUPABASE_KEY_KEY);
    const username = localStorage.getItem(SUPABASE_USERNAME_KEY);

    // Use custom values if they exist, otherwise fall back to defaults
    return {
      supabaseUrl: customUrl || DEFAULT_SUPABASE_URL,
      supabaseKey: customKey || DEFAULT_SUPABASE_KEY,
      username: username || 'self-hosted-user'
    };
  } catch (error) {
    console.error("Error retrieving Supabase credentials from localStorage:", error);
    // Fall back to defaults if localStorage is not available or throws an error
    return {
      supabaseUrl: DEFAULT_SUPABASE_URL,
      supabaseKey: DEFAULT_SUPABASE_KEY,
      username: 'self-hosted-user'
    };
  }
};

// Function to clear custom Supabase credentials and revert to defaults
export const clearSupabaseCredentials = () => {
  try {
    localStorage.removeItem(SUPABASE_URL_KEY);
    localStorage.removeItem(SUPABASE_KEY_KEY);
    localStorage.removeItem(SUPABASE_USERNAME_KEY);
    console.log("Supabase credentials cleared, reverting to defaults");
    return true;
  } catch (error) {
    console.error("Error clearing Supabase credentials:", error);
    return false;
  }
};


// Helper function to get the current username for filtering
export const getCurrentUsername = () => {
  try {
    return localStorage.getItem(SUPABASE_USERNAME_KEY) || 'self-hosted-user';
  } catch (error) {
    console.error("Error retrieving username from localStorage:", error);
    return 'self-hosted-user';
  }
};

// Function to save Supabase credentials to localStorage
export const saveSupabaseCredentials = (url: string, key: string, username?: string) => {
  try {
    localStorage.setItem(SUPABASE_URL_KEY, url);
    localStorage.setItem(SUPABASE_KEY_KEY, key);
    if (username) {
      localStorage.setItem(SUPABASE_USERNAME_KEY, username);
      // Set the first user as admin if no admin exists yet
      setInitialAdminUser(username);
    }
    console.log("Supabase credentials saved to localStorage");
    return true;
  } catch (error) {
    console.error("Error saving Supabase credentials:", error);
    return false;
  }
};

// Admin user management functions
export const getAdminUser = (): string | null => {
  try {
    return localStorage.getItem(KEYPER_ADMIN_USER_KEY);
  } catch (error) {
    console.error("Error retrieving admin user from localStorage:", error);
    return null;
  }
};

export const setInitialAdminUser = (username: string): boolean => {
  try {
    // Only set admin if no admin exists yet
    const existingAdmin = getAdminUser();
    if (!existingAdmin) {
      localStorage.setItem(KEYPER_ADMIN_USER_KEY, username);
      console.log(`🔐 Initial admin user set: ${username}`);
      return true;
    }
    return false; // Admin already exists
  } catch (error) {
    console.error("Error setting initial admin user:", error);
    return false;
  }
};

export const isCurrentUserAdmin = (): boolean => {
  try {
    const currentUser = getCurrentUsername();
    const adminUser = getAdminUser();
    
    // If no admin is set, treat the current user as admin (backward compatibility)
    if (!adminUser) {
      // Also set them as admin for future use
      setInitialAdminUser(currentUser);
      return true;
    }
    
    // Check if current user is the admin
    return currentUser === adminUser;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};

// Create Supabase client with current credentials
let supabaseClient: ReturnType<typeof createClient<Database>>;

// Initialize the client lazily to ensure we have the latest credentials
const initializeClient = () => {
  const { supabaseUrl, supabaseKey } = getSupabaseCredentials();

  // Create client with options for better error handling
  supabaseClient = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });

  return supabaseClient;
};

// Export the supabase client, initializing it if needed
export const supabase = initializeClient();

// Function to create a new client with the latest credentials
// Use this when credentials have been updated and a new client is needed
export const createSupabaseClient = () => {
  const { supabaseUrl, supabaseKey } = getSupabaseCredentials();

  // Create client with options for better error handling
  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
};

// Function to create a test client with custom credentials
// This is used in Settings to test a connection before saving
export const createTestSupabaseClient = (url: string, key: string) => {
  // Basic validation
  if (!url || !key) {
    throw new Error('URL and API key are required');
  }

  // Validate URL format
  try {
    const urlObj = new URL(url);
    if (!urlObj.hostname.includes('supabase')) {
      console.warn('URL does not appear to be a Supabase URL');
    }
  } catch (error) {
    throw new Error('Invalid URL format');
  }

  // Create test client
  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });
};

// Function to refresh the main supabase client after credentials change
export const refreshSupabaseClient = () => {
  // Reinitialize the client with new credentials
  const newClient = initializeClient();
  // Update the exported reference
  Object.assign(supabase, newClient);
  return supabase;
};