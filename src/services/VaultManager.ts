/**
 * VaultManager - High-level vault management service
 * 
 * Integrates SecureVault with VaultStorage to provide a complete
 * Bitwarden-style encryption system with proper passphrase validation.
 * 
 * Made with ❤️ by Pink Pixel ✨
 */

import { secureVault } from './SecureVault';
import { getVaultConfig, saveVaultConfig, deleteVaultConfig, isVaultInitialized } from './VaultStorage';
import { supabase } from '@/integrations/supabase/client';
import type { WrappedDEK, VaultEvent } from './SecureVault';
import { CryptoError, CryptoErrorType } from '@/crypto/types';

export class VaultManager {
  private initialized = false;

  /**
   * Initialize vault manager - loads existing vault config if available
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Check if vault is initialized in database
      const vaultInitialized = await isVaultInitialized();
      
      if (vaultInitialized) {
        // Load wrapped DEK from database
        const config = await getVaultConfig();
        if (config?.wrapped_dek) {
          await secureVault.initializeWithWrappedDEK(config.wrapped_dek);
        }
      }

      this.initialized = true;
    } catch (error) {
      console.error('Error initializing vault manager:', error);
      throw error;
    }
  }

  /**
   * Check if this is a first-time user (no vault configured)
   */
  async isFirstTimeUser(): Promise<boolean> {
    try {
      await this.initialize();
      
      // Check only database for first-time user status
      const hasVaultConfig = await isVaultInitialized();
      
      // Treat lack of vault config as first-time user
      return !hasVaultConfig;
    } catch (error) {
      console.error('Error checking first-time user status:', error);
      // If we can't check database, assume first-time user for safety
      return true;
    }
  }

  /**
   * Create new vault with master passphrase (first-time setup)
   */
  async createVault(masterPassphrase: string): Promise<void> {
    await this.initialize();

    try {
      // Create new vault with fresh DEK
      const wrappedDEK = await secureVault.createNewVault(masterPassphrase);
      
      // Save wrapped DEK to database
      await saveVaultConfig(wrappedDEK);
      
    } catch (error) {
      console.error('Error creating vault:', error);
      throw error;
    }
  }

  /**
   * Unlock existing vault with master passphrase
   */
  async unlockVault(masterPassphrase: string): Promise<void> {
    await this.initialize();

    try {
      // Attempt to unlock vault
      await secureVault.unlock(masterPassphrase);
      
    } catch (error) {
      console.error('Error unlocking vault:', error);
      
      // Provide user-friendly error messages
      if (error instanceof CryptoError) {
        if (error.type === CryptoErrorType.INVALID_PASSPHRASE) {
          throw new Error('Invalid master passphrase. Please try again.');
        } else if (error.type === CryptoErrorType.VAULT_NOT_INITIALIZED) {
          throw new Error('Vault not initialized. Please set up encryption first.');
        }
      }
      
      throw error;
    }
  }

  /**
   * Test if a passphrase is correct without unlocking
   */
  async testPassphrase(passphrase: string): Promise<boolean> {
    await this.initialize();
    return await secureVault.testPassphrase(passphrase);
  }

  /**
   * Lock the vault
   */
  lockVault(): void {
    secureVault.lock();
  }

  /**
   * Check if vault is unlocked
   */
  isUnlocked(): boolean {
    return secureVault.isUnlocked();
  }

  /**
   * Encrypt data
   */
  async encrypt(plaintext: string): Promise<any> {
    return await secureVault.encrypt(plaintext);
  }

  /**
   * Decrypt data
   */
  async decrypt(blob: any): Promise<string> {
    return await secureVault.decrypt(blob);
  }

  /**
   * Reset vault (delete all vault data)
   */
  async resetVault(): Promise<void> {
    try {
      // Lock vault first
      this.lockVault();
      
      // Delete vault config from database
      await deleteVaultConfig();
      
      // Reset initialization flag
      this.initialized = false;
      
    } catch (error) {
      console.error('Error resetting vault:', error);
      throw error;
    }
  }

  /**
   * Add event listener
   */
  addEventListener(listener: (event: VaultEvent) => void): void {
    secureVault.addEventListener(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(listener: (event: VaultEvent) => void): void {
    secureVault.removeEventListener(listener);
  }

  /**
   * Set auto-lock timeout
   */
  setAutoLockTimeout(timeoutMs: number): void {
    secureVault.setAutoLockTimeout(timeoutMs);
  }

  /**
   * Get time until auto-lock
   */
  getTimeUntilAutoLock(): number {
    return secureVault.getTimeUntilAutoLock();
  }

  /**
   * Diagnostic method to check database connectivity and table existence
   */
  async debugDatabase(): Promise<void> {
    try {
      console.log('🔧 Running database diagnostics...');
      
      // Test basic connectivity
      console.log('📡 Testing Supabase connectivity...');
      const { data: testData, error: testError } = await supabase
        .from('credentials')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('❌ Credentials table test failed:', testError);
      } else {
        console.log('✅ Credentials table accessible');
      }
      
      // Test vault_config table specifically
      console.log('🗄️ Testing vault_config table...');
      const { data: vaultData, error: vaultError } = await supabase
        .from('vault_config')
        .select('*')
        .limit(1);
        
      if (vaultError) {
        console.error('❌ Vault config table test failed:', vaultError);
        console.log('💡 This suggests the vault_config table may not exist in your database');
        console.log('📝 Please run the updated SQL setup script to create the vault_config table');
      } else {
        console.log('✅ Vault config table accessible');
      }
      
    } catch (error) {
      console.error('💥 Database diagnostic failed:', error);
    }
  }
}

// Export singleton instance
export const vaultManager = new VaultManager();
export default vaultManager;
