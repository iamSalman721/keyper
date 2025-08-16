/**
 * SecureVault - Bitwarden-style two-key encryption system
 * 
 * Implements a proper zero-knowledge architecture:
 * - KEK (Key Encryption Key): Derived from master passphrase via Argon2id/PBKDF2
 * - DEK (Data Encryption Key): Random 256-bit key that encrypts all secrets
 * - Server only sees: ciphertexts + wrapped DEK
 * - Unlock: master → derive KEK → unwrap DEK → decrypt secrets
 * - Lock: immediately zeroize DEK from memory
 * 
 * Made with ❤️ by Pink Pixel ✨
 */

import { encryptString, decryptString, deriveKey } from '@/crypto/crypto';
import type { SecretBlobV1, VaultStatus, CryptoMetrics } from '@/crypto/types';
import { CryptoError, CryptoErrorType } from '@/crypto/types';
import { securityLogger, logVaultUnlock, logEncryptionOperation } from '@/security/SecurityAuditLogger';

/**
 * Wrapped DEK structure stored on server
 */
export interface WrappedDEK {
  v: 1;
  kdf: 'argon2id' | 'pbkdf2';
  salt: string; // base64
  iv: string;   // base64
  ct: string;   // base64 - encrypted DEK
}

/**
 * Event types for vault state changes
 */
export type VaultEvent = 'locked' | 'unlocked' | 'auto-locked';

/**
 * Vault event listener function
 */
export type VaultEventListener = (event: VaultEvent) => void;

class SecureVault {
  private dek: CryptoKey | null = null; // Data Encryption Key (in memory only)
  private wrappedDEK: WrappedDEK | null = null; // Stored wrapped DEK
  private autoLockTimeoutMs: number = 15 * 60 * 1000; // 15 minutes
  private autoLockTimer: NodeJS.Timeout | null = null;
  private lastActivity: Date | null = null;
  private listeners: VaultEventListener[] = [];
  private metrics: CryptoMetrics[] = [];

  /**
   * Initialize with existing wrapped DEK (for returning users)
   */
  async initializeWithWrappedDEK(wrappedDEK: WrappedDEK): Promise<void> {
    console.log('🔧 Initializing SecureVault with wrapped DEK:', {
      version: wrappedDEK.v,
      kdf: wrappedDEK.kdf,
      hasSalt: !!wrappedDEK.salt,
      hasIv: !!wrappedDEK.iv,
      hasCt: !!wrappedDEK.ct
    });
    this.wrappedDEK = wrappedDEK;
  }

  /**
   * Create new vault with fresh DEK (for first-time users)
   */
  async createNewVault(masterPassphrase: string): Promise<WrappedDEK> {
    const startTime = performance.now();

    try {
      if (!masterPassphrase || masterPassphrase.length < 8) {
        throw new CryptoError(
          CryptoErrorType.INVALID_PASSPHRASE,
          "Master passphrase must be at least 8 characters long"
        );
      }

      // Generate fresh 256-bit DEK
      const dek = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true, // extractable for wrapping
        ["encrypt", "decrypt"]
      );

      // Export DEK as raw bytes
      const dekBytes = await crypto.subtle.exportKey("raw", dek);

      // Generate salt and derive KEK from master passphrase
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const { key: kek, kdf } = await deriveKey(masterPassphrase, salt);

      // Wrap DEK with KEK
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const wrappedDekBytes = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        kek,
        dekBytes
      );

      // Create wrapped DEK structure
      this.wrappedDEK = {
        v: 1,
        kdf,
        salt: this.bufToBase64(salt.buffer),
        iv: this.bufToBase64(iv.buffer),
        ct: this.bufToBase64(wrappedDekBytes)
      };

      // Store DEK in memory
      this.dek = dek;
      this.lastActivity = new Date();
      this.resetAutoLockTimer();

      const duration = performance.now() - startTime;
      logVaultUnlock(true, duration);
      this.notifyListeners('unlocked');

      return this.wrappedDEK;

    } catch (error) {
      logVaultUnlock(false, performance.now() - startTime);
      throw error;
    }
  }

  /**
   * Unlock vault with master passphrase (for returning users)
   */
  async unlock(masterPassphrase: string): Promise<void> {
    const startTime = performance.now();
    
    console.log('🔓 Starting vault unlock process...');
    console.log('🔍 Wrapped DEK details:', {
      version: this.wrappedDEK?.v,
      kdf: this.wrappedDEK?.kdf,
      saltLength: this.wrappedDEK?.salt.length,
      ivLength: this.wrappedDEK?.iv.length,
      ctLength: this.wrappedDEK?.ct.length
    });
    console.log('🔑 Passphrase details:', {
      length: masterPassphrase.length,
      firstChar: masterPassphrase.charAt(0),
      lastChar: masterPassphrase.charAt(masterPassphrase.length - 1),
      hasSpaces: masterPassphrase.includes(' '),
      hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(masterPassphrase)
    });

    try {
      if (!this.wrappedDEK) {
        console.log('❌ No wrapped DEK found');
        throw new CryptoError(
          CryptoErrorType.VAULT_NOT_INITIALIZED,
          "Vault not initialized - no wrapped DEK found"
        );
      }

      if (!masterPassphrase || masterPassphrase.length < 8) {
        console.log('❌ Passphrase too short:', masterPassphrase.length);
        throw new CryptoError(
          CryptoErrorType.INVALID_PASSPHRASE,
          "Master passphrase must be at least 8 characters long"
        );
      }

      console.log('🔄 Decoding base64 data...');
      // Derive KEK from master passphrase using stored salt
      const salt = new Uint8Array(this.base64ToBuf(this.wrappedDEK.salt));
      console.log('✅ Salt decoded, length:', salt.length);
      
      console.log('🔄 Deriving key from passphrase...');
      const { key: kek } = await deriveKey(masterPassphrase, salt);
      console.log('✅ Key derivation successful');

      // Attempt to unwrap DEK
      const iv = new Uint8Array(this.base64ToBuf(this.wrappedDEK.iv));
      const wrappedDekBytes = this.base64ToBuf(this.wrappedDEK.ct);
      console.log('✅ IV and wrapped DEK decoded, IV length:', iv.length, 'CT length:', wrappedDekBytes.byteLength);

      try {
        console.log('🔄 Attempting AES decryption...');
        const dekBytes = await crypto.subtle.decrypt(
          { name: "AES-GCM", iv },
          kek,
          wrappedDekBytes
        );
        console.log('✅ AES decryption successful, DEK length:', dekBytes.byteLength);

        // Import DEK
        console.log('🔄 Importing DEK...');
        this.dek = await crypto.subtle.importKey(
          "raw",
          dekBytes,
          { name: "AES-GCM" },
          false, // not extractable once imported
          ["encrypt", "decrypt"]
        );
        console.log('✅ DEK imported successfully');

        this.lastActivity = new Date();
        this.resetAutoLockTimer();

        const duration = performance.now() - startTime;
        logVaultUnlock(true, duration);
        this.notifyListeners('unlocked');
        console.log('🎉 Vault unlocked successfully!');

      } catch (decryptError) {
        console.log('❌ AES decryption failed:', decryptError.message);
        console.log('🔍 Decryption error details:', {
          name: decryptError.name,
          message: decryptError.message,
        });
        // Decryption failed = wrong passphrase
        throw new CryptoError(
          CryptoErrorType.INVALID_PASSPHRASE,
          "Invalid master passphrase"
        );
      }

    } catch (error) {
      console.log('❌ Unlock process failed:', error.message);
      logVaultUnlock(false, performance.now() - startTime);
      throw error;
    }
  }

  /**
   * Check if vault is unlocked (DEK is in memory)
   */
  isUnlocked(): boolean {
    return this.dek !== null;
  }

  /**
   * Lock vault (zeroize DEK from memory)
   */
  lock(): void {
    if (this.dek) {
      // Clear DEK from memory (limited in JS, but we try)
      this.dek = null;
      this.clearAutoLockTimer();
      this.lastActivity = null;

      securityLogger.logEvent('vault_lock', 'info', 'Vault locked manually');
      this.notifyListeners('locked');
    }
  }

  /**
   * Encrypt data using DEK
   */
  async encrypt(plaintext: string): Promise<SecretBlobV1> {
    if (!this.dek) {
      throw new CryptoError(CryptoErrorType.VAULT_LOCKED, "Vault is locked");
    }

    this.updateActivity();
    
    const startTime = performance.now();
    try {
      // Use DEK directly for encryption
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const plaintextBytes = new TextEncoder().encode(plaintext);
      
      const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        this.dek,
        plaintextBytes
      );

      const duration = performance.now() - startTime;
      logEncryptionOperation('encrypt', true, duration);

      // Return in SecretBlobV1 format for compatibility
      return {
        v: 1,
        kdf: this.wrappedDEK?.kdf || 'pbkdf2',
        salt: this.wrappedDEK?.salt || '',
        iv: this.bufToBase64(iv.buffer),
        ct: this.bufToBase64(ciphertext)
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      logEncryptionOperation('encrypt', false, duration);
      throw error;
    }
  }

  /**
   * Decrypt data using DEK
   */
  async decrypt(blob: SecretBlobV1): Promise<string> {
    if (!this.dek) {
      throw new CryptoError(CryptoErrorType.VAULT_LOCKED, "Vault is locked");
    }

    this.updateActivity();
    
    const startTime = performance.now();
    try {
      const iv = new Uint8Array(this.base64ToBuf(blob.iv));
      const ciphertext = this.base64ToBuf(blob.ct);
      
      const plaintextBytes = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        this.dek,
        ciphertext
      );

      const duration = performance.now() - startTime;
      logEncryptionOperation('decrypt', true, duration);

      return new TextDecoder().decode(plaintextBytes);

    } catch (error) {
      const duration = performance.now() - startTime;
      logEncryptionOperation('decrypt', false, duration);
      throw error;
    }
  }

  /**
   * Get wrapped DEK for storage
   */
  getWrappedDEK(): WrappedDEK | null {
    return this.wrappedDEK;
  }

  /**
   * Test if a passphrase can unlock the vault (without actually unlocking)
   */
  async testPassphrase(passphrase: string): Promise<boolean> {
    if (!this.wrappedDEK) {
      return false;
    }

    try {
      const salt = new Uint8Array(this.base64ToBuf(this.wrappedDEK.salt));
      const { key: kek } = await deriveKey(passphrase, salt);
      
      const iv = new Uint8Array(this.base64ToBuf(this.wrappedDEK.iv));
      const wrappedDekBytes = this.base64ToBuf(this.wrappedDEK.ct);

      await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        kek,
        wrappedDekBytes
      );

      return true; // Decryption succeeded
    } catch {
      return false; // Decryption failed = wrong passphrase
    }
  }

  // Helper methods
  private bufToBase64(buffer: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  }

  private base64ToBuf(base64: string): ArrayBuffer {
    return Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;
  }

  private updateActivity(): void {
    this.lastActivity = new Date();
    this.resetAutoLockTimer();
  }

  private resetAutoLockTimer(): void {
    this.clearAutoLockTimer();
    
    if (this.autoLockTimeoutMs > 0) {
      this.autoLockTimer = setTimeout(() => {
        this.lock();
        this.notifyListeners('auto-locked');
      }, this.autoLockTimeoutMs);
    }
  }

  private clearAutoLockTimer(): void {
    if (this.autoLockTimer) {
      clearTimeout(this.autoLockTimer);
      this.autoLockTimer = null;
    }
  }

  private notifyListeners(event: VaultEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in vault event listener:', error);
      }
    });
  }

  // Event management
  addEventListener(listener: VaultEventListener): void {
    this.listeners.push(listener);
  }

  removeEventListener(listener: VaultEventListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // Auto-lock configuration
  setAutoLockTimeout(timeoutMs: number): void {
    this.autoLockTimeoutMs = timeoutMs;
    if (this.isUnlocked()) {
      this.resetAutoLockTimer();
    }
  }

  getTimeUntilAutoLock(): number {
    if (!this.lastActivity || this.autoLockTimeoutMs <= 0) {
      return 0;
    }
    
    const elapsed = Date.now() - this.lastActivity.getTime();
    return Math.max(0, this.autoLockTimeoutMs - elapsed);
  }
}

// Export singleton instance
export const secureVault = new SecureVault();
export default secureVault;
