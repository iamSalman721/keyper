/**
 * useVault - React hook for vault state management
 * 
 * Provides a React-friendly interface for managing the modern VaultManager state
 * with automatic re-renders and event handling.
 * 
 * Made with ❤️ by Pink Pixel ✨
 */

import { useState, useEffect, useCallback } from 'react';
import { vaultManager } from '@/services/VaultManager';
import type { SecretBlobV1, VaultStatus, CryptoMetrics } from '@/crypto/types';
import type { VaultEvent } from '@/services/SecureVault';
import { CryptoError, CryptoErrorType } from '@/crypto/types';

export interface UseVaultReturn {
  // State
  isUnlocked: boolean;
  status: VaultStatus;
  metrics: CryptoMetrics[];
  
  // Actions
  unlock: (passphrase: string) => Promise<void>;
  lock: () => void;
  encrypt: (plaintext: string) => Promise<SecretBlobV1>;
  decrypt: (blob: SecretBlobV1) => Promise<string>;
  testPassphrase: (passphrase: string, testBlob: SecretBlobV1) => Promise<boolean>;
  
  // Configuration
  setAutoLockTimeout: (timeoutMs: number) => void;
  extendAutoLock: () => void;
  getTimeUntilAutoLock: () => number;
  
  // Utilities
  clearMetrics: () => void;
  addEventListener: (listener: (event: VaultEvent) => void) => void;
  removeEventListener: (listener: (event: VaultEvent) => void) => void;
}

/**
 * Custom hook for managing vault state and operations
 */
export function useVault(): UseVaultReturn {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [status, setStatus] = useState<VaultStatus>({ 
    isUnlocked: false, 
    autoLockEnabled: true,
    autoLockTimeoutMs: 15 * 60 * 1000,
    lastActivity: undefined
  });
  const [metrics, setMetrics] = useState<CryptoMetrics[]>([]);

  // Update state when vault events occur
  const handleVaultEvent = useCallback((event: VaultEvent) => {
    const unlocked = vaultManager.isUnlocked();
    setIsUnlocked(unlocked);
    setStatus(prev => ({ 
      ...prev, 
      isUnlocked: unlocked,
      lastActivity: unlocked ? new Date() : undefined
    }));
  }, []);

  // Set up event listener
  useEffect(() => {
    const initializeAndSetup = async () => {
      try {
        await vaultManager.initialize();
        vaultManager.addEventListener(handleVaultEvent);
        
        // Initial state sync
        const unlocked = vaultManager.isUnlocked();
        setIsUnlocked(unlocked);
        setStatus(prev => ({ 
          ...prev, 
          isUnlocked: unlocked,
          lastActivity: unlocked ? new Date() : undefined
        }));
      } catch (error) {
        console.error('Error initializing vault manager:', error);
      }
    };

    initializeAndSetup();
    
    return () => {
      vaultManager.removeEventListener(handleVaultEvent);
    };
  }, [handleVaultEvent]);

  // Periodically update status
  useEffect(() => {
    const interval = setInterval(() => {
      const unlocked = vaultManager.isUnlocked();
      setIsUnlocked(unlocked);
      setStatus(prev => ({ 
        ...prev, 
        isUnlocked: unlocked,
        lastActivity: unlocked ? new Date() : undefined
      }));
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const unlock = useCallback(async (passphrase: string): Promise<void> => {
    try {
      await vaultManager.unlockVault(passphrase);
    } catch (error) {
      throw error instanceof CryptoError ? error : new Error('Failed to unlock vault');
    }
  }, []);

  const lock = useCallback(() => {
    vaultManager.lockVault();
  }, []);

  const encrypt = useCallback(async (plaintext: string): Promise<SecretBlobV1> => {
    try {
      return await vaultManager.encrypt(plaintext);
    } catch (error) {
      throw error instanceof CryptoError ? error : new Error('Failed to encrypt data');
    }
  }, []);

  const decrypt = useCallback(async (blob: SecretBlobV1): Promise<string> => {
    try {
      return await vaultManager.decrypt(blob);
    } catch (error) {
      throw error instanceof CryptoError ? error : new Error('Failed to decrypt data');
    }
  }, []);

  const testPassphrase = useCallback(async (passphrase: string, testBlob: SecretBlobV1): Promise<boolean> => {
    return await vaultManager.testPassphrase(passphrase);
  }, []);

  const setAutoLockTimeout = useCallback((timeoutMs: number) => {
    vaultManager.setAutoLockTimeout(timeoutMs);
    setStatus(prev => ({ ...prev, autoLockTimeoutMs: timeoutMs }));
  }, []);

  const extendAutoLock = useCallback(() => {
    // VaultManager doesn't have this method, so we'll just update last activity
    setStatus(prev => ({ ...prev, lastActivity: new Date() }));
  }, []);

  const getTimeUntilAutoLock = useCallback(() => {
    return vaultManager.getTimeUntilAutoLock();
  }, []);

  const clearMetrics = useCallback(() => {
    setMetrics([]);
  }, []);

  const addEventListener = useCallback((listener: (event: VaultEvent) => void) => {
    vaultManager.addEventListener(listener);
  }, []);

  const removeEventListener = useCallback((listener: (event: VaultEvent) => void) => {
    vaultManager.removeEventListener(listener);
  }, []);

  return {
    // State
    isUnlocked,
    status,
    metrics,
    
    // Actions
    unlock,
    lock,
    encrypt,
    decrypt,
    testPassphrase,
    
    // Configuration
    setAutoLockTimeout,
    extendAutoLock,
    getTimeUntilAutoLock,
    
    // Utilities
    clearMetrics,
    addEventListener,
    removeEventListener,
  };
}

/**
 * Hook for encryption operations with automatic vault interaction
 */
export function useEncryption() {
  const vault = useVault();

  const encryptCredential = useCallback(async (credential: {
    password?: string;
    api_key?: string;
    secret_value?: string;
    token_value?: string;
    certificate_data?: string;
  }): Promise<{
    secret_blob: SecretBlobV1 | null;
    encrypted_at: string | null;
  }> => {
    if (!vault.isUnlocked) {
      throw new CryptoError(CryptoErrorType.VAULT_LOCKED, 'Vault must be unlocked to encrypt credentials');
    }

    // Combine all secret fields into a single JSON object
    const secretData = {
      password: credential.password || null,
      api_key: credential.api_key || null,
      secret_value: credential.secret_value || null,
      token_value: credential.token_value || null,
      certificate_data: credential.certificate_data || null,
    };

    // Only encrypt if there's actual secret data
    const hasSecrets = Object.values(secretData).some(value => value !== null && value !== '');
    
    if (!hasSecrets) {
      return {
        secret_blob: null,
        encrypted_at: null,
      };
    }

    const secret_blob = await vault.encrypt(JSON.stringify(secretData));
    
    return {
      secret_blob,
      encrypted_at: new Date().toISOString(),
    };
  }, [vault]);

  const decryptCredential = useCallback(async (secret_blob: SecretBlobV1): Promise<{
    password?: string;
    api_key?: string;
    secret_value?: string;
    token_value?: string;
    certificate_data?: string;
  }> => {
    if (!vault.isUnlocked) {
      throw new CryptoError(CryptoErrorType.VAULT_LOCKED, 'Vault must be unlocked to decrypt credentials');
    }

    const decryptedJson = await vault.decrypt(secret_blob);
    
    try {
      return JSON.parse(decryptedJson);
    } catch (error) {
      throw new Error('Failed to parse decrypted credential data');
    }
  }, [vault]);

  return {
    ...vault,
    encryptCredential,
    decryptCredential,
  };
}

export default useVault;
