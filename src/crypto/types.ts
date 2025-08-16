/**
 * TypeScript type definitions for cryptographic operations
 * 
 * Defines the structure of encrypted data blobs and key derivation parameters.
 * 
 * Made with ❤️ by Pink Pixel ✨
 */

/**
 * Supported key derivation function algorithms
 */
export type KdfName = "argon2id" | "pbkdf2";

/**
 * Encrypted secret blob format (version 1)
 * 
 * This structure contains all the information needed to decrypt a secret:
 * - v: Version number for future compatibility
 * - kdf: Key derivation function used
 * - salt: Random salt for key derivation (base64)
 * - iv: Initialization vector for AES-GCM (base64)
 * - ct: Ciphertext containing the encrypted secret (base64)
 */
export type SecretBlobV1 = {
  v: 1;
  kdf: KdfName;
  salt: string;
  iv: string;
  ct: string;
};

/**
 * Union type for all supported secret blob versions
 * Currently only v1, but allows for future versions
 */
export type SecretBlob = SecretBlobV1;

/**
 * Key derivation parameters for Argon2id
 */
export type Argon2Params = {
  time: number;        // Number of iterations
  mem: number;         // Memory usage in KiB
  parallelism: number; // Degree of parallelism
  hashLen: number;     // Output hash length in bytes
};

/**
 * Key derivation parameters for PBKDF2
 */
export type PBKDF2Params = {
  iterations: number;  // Number of iterations
  hashLen: number;     // Output hash length in bytes
};

/**
 * Result of key derivation operation
 */
export type KeyDerivationResult = {
  key: CryptoKey;
  kdf: KdfName;
};

/**
 * Encryption operation result
 */
export type EncryptionResult = {
  blob: SecretBlob;
  success: boolean;
  error?: string;
};

/**
 * Decryption operation result
 */
export type DecryptionResult = {
  plaintext: string;
  success: boolean;
  error?: string;
};

/**
 * Vault status information
 */
export type VaultStatus = {
  isUnlocked: boolean;
  autoLockEnabled: boolean;
  autoLockTimeoutMs?: number;
  lastActivity?: Date;
};

/**
 * Passphrase strength assessment
 */
export type PassphraseStrength = {
  score: number;        // 0-4 (weak to very strong)
  feedback: string[];   // Array of feedback messages
  crackTime: string;    // Estimated crack time
  entropy: number;      // Bits of entropy
};

/**
 * Crypto operation performance metrics
 */
export type CryptoMetrics = {
  operation: 'encrypt' | 'decrypt' | 'derive_key';
  duration: number;     // Operation duration in milliseconds
  kdf: KdfName;
  timestamp: Date;
};

/**
 * Error types for crypto operations
 */
export enum CryptoErrorType {
  VAULT_LOCKED = 'VAULT_LOCKED',
  VAULT_NOT_INITIALIZED = 'VAULT_NOT_INITIALIZED',
  INVALID_PASSPHRASE = 'INVALID_PASSPHRASE',
  UNSUPPORTED_VERSION = 'UNSUPPORTED_VERSION',
  DECRYPTION_FAILED = 'DECRYPTION_FAILED',
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',
  KEY_DERIVATION_FAILED = 'KEY_DERIVATION_FAILED',
  INVALID_BLOB_FORMAT = 'INVALID_BLOB_FORMAT'
}

/**
 * Custom error class for crypto operations
 */
export class CryptoError extends Error {
  constructor(
    public type: CryptoErrorType,
    message: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'CryptoError';
  }
}
