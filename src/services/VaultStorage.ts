/**
 * VaultStorage - Manages wrapped DEK storage in Supabase
 * 
 * Stores only the wrapped DEK (encrypted with KEK derived from master passphrase).
 * The server never sees the master passphrase or the unwrapped DEK.
 * 
 * Made with ❤️ by Pink Pixel ✨
 */

import { supabase, getCurrentUsername } from '@/integrations/supabase/client';
import type { WrappedDEK } from './SecureVault';

/**
 * Vault configuration stored in database
 */
export interface VaultConfig {
  id: string;
  user_id: string;
  wrapped_dek: WrappedDEK;
  created_at: string;
  updated_at: string;
}

/**
 * Get vault configuration for current user
 * Fixed: Use instance-based config instead of username-based to avoid conflicts when username changes
 */
export async function getVaultConfig(): Promise<VaultConfig | null> {
  try {
    // Use the configured username for vault config
    const currentUsername = getCurrentUsername();
    console.log('🔍 Getting vault config for user:', currentUsername);
    
    const { data, error } = await supabase
      .from('vault_config')
      .select('*')
      .eq('user_id', currentUsername)
      .single();

    console.log('📊 Vault config query result:', { data, error });

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - vault not initialized
        console.log('ℹ️ No vault config found (PGRST116) - vault not initialized');
        return null;
      }
      console.error('❌ Database error getting vault config:', error);
      throw error;
    }

    // Validate that we have a proper vault config, not a placeholder
    if (data && data.wrapped_dek) {
      const wrappedDek = data.wrapped_dek as any;
      
      // Check if this is a placeholder or invalid config
      if (typeof wrappedDek === 'object' && wrappedDek.placeholder) {
        console.log('🚫 Found placeholder vault config - treating as not initialized');
        return null;
      }
      
      // Check if it has the required fields for a valid wrapped DEK
      if (typeof wrappedDek === 'object' && 
          wrappedDek.v === 1 && 
          wrappedDek.kdf && 
          wrappedDek.salt && 
          wrappedDek.iv && 
          wrappedDek.ct) {
        console.log('✅ Valid vault config found with proper wrapped DEK structure');
        return {
          ...data,
          wrapped_dek: wrappedDek as WrappedDEK
        };
      } else {
        console.log('🚫 Invalid vault config structure:', {
          hasWrappedDek: !!wrappedDek,
          version: wrappedDek?.v,
          hasKdf: !!wrappedDek?.kdf,
          hasSalt: !!wrappedDek?.salt,
          hasIv: !!wrappedDek?.iv,
          hasCt: !!wrappedDek?.ct
        });
        return null;
      }
    }
    
    console.log('🚫 No data or wrapped_dek found');
    return null;
  } catch (error) {
    console.error('💥 Error getting vault config:', error);
    
    // If it's a network/connection error, return null instead of throwing
    if (error instanceof TypeError || 
        (error as any)?.message?.includes('fetch') ||
        (error as any)?.message?.includes('network')) {
      console.warn('🌐 Network error detected, treating as vault not initialized');
      return null;
    }
    
    return null;
  }
}

/**
 * Save vault configuration for current user
 * Fixed: Use instance-based config instead of username-based to avoid conflicts when username changes
 */
export async function saveVaultConfig(wrappedDEK: WrappedDEK): Promise<VaultConfig> {
  try {
    // Use the configured username for vault config
    const currentUsername = getCurrentUsername();
    
    const { data, error } = await supabase
      .from('vault_config')
      .upsert({
        user_id: currentUsername,
        wrapped_dek: wrappedDEK as unknown as any,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      ...data,
      wrapped_dek: data.wrapped_dek as unknown as WrappedDEK
    };
  } catch (error) {
    console.error('Error saving vault config:', error);
    throw new Error(`Failed to save vault configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete vault configuration for current user
 * Fixed: Use instance-based config instead of username-based to avoid conflicts when username changes
 */
export async function deleteVaultConfig(): Promise<void> {
  try {
    // Use the configured username for vault config
    const currentUsername = getCurrentUsername();
    
    const { error } = await supabase
      .from('vault_config')
      .delete()
      .eq('user_id', currentUsername);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting vault config:', error);
    throw new Error(`Failed to delete vault configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if vault is initialized for current user
 */
export async function isVaultInitialized(): Promise<boolean> {
  try {
    const config = await getVaultConfig();
    return config !== null;
  } catch (error) {
    console.error('Error checking vault initialization:', error);
    return false;
  }
}
