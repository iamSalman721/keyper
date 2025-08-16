/**
 * Comprehensive unit tests for cryptographic functions
 * 
 * Tests all encryption, decryption, and key derivation functions
 * with various edge cases and security scenarios.
 * 
 * Made with ❤️ by Pink Pixel ✨
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encryptString, decryptString, validateSecretBlob, benchmarkKeyDerivation } from '../crypto';
import { bufToBase64, base64ToBuf, utf8Encode, utf8Decode, randomBytes, constantTimeEqual } from '../encoding';
import type { SecretBlobV1 } from '../types';
import { CryptoError, CryptoErrorType } from '../types';

describe('Encoding Utilities', () => {
  describe('bufToBase64 and base64ToBuf', () => {
    it('should correctly encode and decode ArrayBuffer to/from base64', () => {
      const originalData = new Uint8Array([1, 2, 3, 4, 5, 255, 0, 128]);
      const base64 = bufToBase64(originalData.buffer);
      const decoded = new Uint8Array(base64ToBuf(base64));
      
      expect(decoded).toEqual(originalData);
    });

    it('should handle empty buffers', () => {
      const empty = new ArrayBuffer(0);
      const base64 = bufToBase64(empty);
      const decoded = base64ToBuf(base64);
      
      expect(decoded.byteLength).toBe(0);
    });

    it('should handle large buffers', () => {
      const large = new Uint8Array(10000).fill(42);
      const base64 = bufToBase64(large.buffer);
      const decoded = new Uint8Array(base64ToBuf(base64));
      
      expect(decoded).toEqual(large);
    });
  });

  describe('utf8Encode and utf8Decode', () => {
    it('should correctly encode and decode UTF-8 strings', () => {
      const testStrings = [
        'Hello, World!',
        'Testing 123',
        '🔐 Encryption Test 🚀',
        'Special chars: !@#$%^&*()',
        'Unicode: αβγδε',
        'Emoji: 😀🎉🔒🛡️',
        ''
      ];

      testStrings.forEach(str => {
        const encoded = utf8Encode(str);
        const decoded = utf8Decode(encoded.buffer);
        expect(decoded).toBe(str);
      });
    });

    it('should handle very long strings', () => {
      const longString = 'A'.repeat(10000);
      const encoded = utf8Encode(longString);
      const decoded = utf8Decode(encoded.buffer);
      
      expect(decoded).toBe(longString);
    });
  });

  describe('randomBytes', () => {
    it('should generate random bytes of correct length', () => {
      const lengths = [1, 16, 32, 64, 128, 256];
      
      lengths.forEach(length => {
        const bytes = randomBytes(length);
        expect(bytes.length).toBe(length);
      });
    });

    it('should generate different random values', () => {
      const bytes1 = randomBytes(32);
      const bytes2 = randomBytes(32);
      
      expect(bytes1).not.toEqual(bytes2);
    });

    it('should handle zero length', () => {
      const bytes = randomBytes(0);
      expect(bytes.length).toBe(0);
    });
  });

  describe('constantTimeEqual', () => {
    it('should return true for equal arrays', () => {
      const arr1 = new Uint8Array([1, 2, 3, 4, 5]);
      const arr2 = new Uint8Array([1, 2, 3, 4, 5]);
      
      expect(constantTimeEqual(arr1, arr2)).toBe(true);
    });

    it('should return false for different arrays', () => {
      const arr1 = new Uint8Array([1, 2, 3, 4, 5]);
      const arr2 = new Uint8Array([1, 2, 3, 4, 6]);
      
      expect(constantTimeEqual(arr1, arr2)).toBe(false);
    });

    it('should return false for arrays of different lengths', () => {
      const arr1 = new Uint8Array([1, 2, 3]);
      const arr2 = new Uint8Array([1, 2, 3, 4]);
      
      expect(constantTimeEqual(arr1, arr2)).toBe(false);
    });

    it('should handle empty arrays', () => {
      const arr1 = new Uint8Array([]);
      const arr2 = new Uint8Array([]);
      
      expect(constantTimeEqual(arr1, arr2)).toBe(true);
    });
  });
});

describe('Cryptographic Functions', () => {
  const testPassphrase = 'TestPassphrase123!@#';
  const testPlaintext = 'This is a secret message that needs to be encrypted securely.';

  describe('encryptString and decryptString', () => {
    it('should encrypt and decrypt strings correctly', async () => {
      const encrypted = await encryptString(testPassphrase, testPlaintext);
      const decrypted = await decryptString(testPassphrase, encrypted);
      
      expect(decrypted).toBe(testPlaintext);
    });

    it('should produce different ciphertexts for the same plaintext', async () => {
      const encrypted1 = await encryptString(testPassphrase, testPlaintext);
      const encrypted2 = await encryptString(testPassphrase, testPlaintext);
      
      expect(encrypted1.ct).not.toBe(encrypted2.ct);
      expect(encrypted1.salt).not.toBe(encrypted2.salt);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });

    it('should handle empty strings', async () => {
      const encrypted = await encryptString(testPassphrase, '');
      const decrypted = await decryptString(testPassphrase, encrypted);
      
      expect(decrypted).toBe('');
    });

    it('should handle very long strings', async () => {
      const longText = 'A'.repeat(10000);
      const encrypted = await encryptString(testPassphrase, longText);
      const decrypted = await decryptString(testPassphrase, encrypted);
      
      expect(decrypted).toBe(longText);
    });

    it('should handle special characters and Unicode', async () => {
      const specialText = '🔐 Special chars: !@#$%^&*() Unicode: αβγδε 🚀';
      const encrypted = await encryptString(testPassphrase, specialText);
      const decrypted = await decryptString(testPassphrase, encrypted);
      
      expect(decrypted).toBe(specialText);
    });

    it('should fail with wrong passphrase', async () => {
      const encrypted = await encryptString(testPassphrase, testPlaintext);
      
      await expect(decryptString('WrongPassphrase', encrypted))
        .rejects.toThrow(CryptoError);
    });

    it('should fail with corrupted ciphertext', async () => {
      const encrypted = await encryptString(testPassphrase, testPlaintext);
      
      // Corrupt the ciphertext
      const corrupted = { ...encrypted, ct: encrypted.ct.slice(0, -4) + 'XXXX' };
      
      await expect(decryptString(testPassphrase, corrupted))
        .rejects.toThrow(CryptoError);
    });

    it('should fail with corrupted salt', async () => {
      const encrypted = await encryptString(testPassphrase, testPlaintext);
      
      // Corrupt the salt
      const corrupted = { ...encrypted, salt: encrypted.salt.slice(0, -4) + 'XXXX' };
      
      await expect(decryptString(testPassphrase, corrupted))
        .rejects.toThrow(CryptoError);
    });

    it('should fail with corrupted IV', async () => {
      const encrypted = await encryptString(testPassphrase, testPlaintext);
      
      // Corrupt the IV
      const corrupted = { ...encrypted, iv: encrypted.iv.slice(0, -4) + 'XXXX' };
      
      await expect(decryptString(testPassphrase, corrupted))
        .rejects.toThrow(CryptoError);
    });

    it('should use either argon2id or pbkdf2 KDF', async () => {
      const encrypted = await encryptString(testPassphrase, testPlaintext);
      
      expect(['argon2id', 'pbkdf2']).toContain(encrypted.kdf);
    });

    it('should have correct blob version', async () => {
      const encrypted = await encryptString(testPassphrase, testPlaintext);
      
      expect(encrypted.v).toBe(1);
    });

    it('should have proper salt and IV lengths', async () => {
      const encrypted = await encryptString(testPassphrase, testPlaintext);
      
      const salt = base64ToBuf(encrypted.salt);
      const iv = base64ToBuf(encrypted.iv);
      
      expect(salt.byteLength).toBe(16); // 128-bit salt
      expect(iv.byteLength).toBe(12);   // 96-bit IV for AES-GCM
    });
  });

  describe('validateSecretBlob', () => {
    it('should validate correct secret blobs', async () => {
      const encrypted = await encryptString(testPassphrase, testPlaintext);
      
      expect(validateSecretBlob(encrypted)).toBe(true);
    });

    it('should reject invalid blob structures', () => {
      const invalidBlobs = [
        null,
        undefined,
        {},
        { v: 2 }, // Wrong version
        { v: 1 }, // Missing fields
        { v: 1, kdf: 'invalid', salt: 'test', iv: 'test', ct: 'test' }, // Invalid KDF
        { v: 1, kdf: 'pbkdf2', salt: 123, iv: 'test', ct: 'test' }, // Wrong type
      ];

      invalidBlobs.forEach(blob => {
        expect(validateSecretBlob(blob)).toBe(false);
      });
    });
  });

  describe('benchmarkKeyDerivation', () => {
    it('should return timing information', async () => {
      const benchmark = await benchmarkKeyDerivation();
      
      expect(typeof benchmark.argon2Time).toBe('number');
      expect(typeof benchmark.pbkdf2Time).toBe('number');
      expect(benchmark.argon2Time).toBeGreaterThan(0);
      expect(benchmark.pbkdf2Time).toBeGreaterThan(0);
    });

    it('should accept custom passphrase', async () => {
      const benchmark = await benchmarkKeyDerivation('custom-test-passphrase');
      
      expect(typeof benchmark.argon2Time).toBe('number');
      expect(typeof benchmark.pbkdf2Time).toBe('number');
    });
  });

  describe('Error Handling', () => {
    it('should throw CryptoError for unsupported blob version', async () => {
      const invalidBlob: any = {
        v: 999,
        kdf: 'pbkdf2',
        salt: bufToBase64(randomBytes(16).buffer),
        iv: bufToBase64(randomBytes(12).buffer),
        ct: bufToBase64(randomBytes(32).buffer)
      };

      await expect(decryptString(testPassphrase, invalidBlob))
        .rejects.toThrow(CryptoError);
    });

    it('should handle empty passphrase gracefully', async () => {
      await expect(encryptString('', testPlaintext))
        .rejects.toThrow();
    });

    it('should handle very short passphrase', async () => {
      await expect(encryptString('123', testPlaintext))
        .rejects.toThrow();
    });
  });

  describe('Performance and Security', () => {
    it('should complete encryption/decryption within reasonable time', async () => {
      const start = performance.now();
      const encrypted = await encryptString(testPassphrase, testPlaintext);
      const decrypted = await decryptString(testPassphrase, encrypted);
      const end = performance.now();
      
      expect(decrypted).toBe(testPlaintext);
      expect(end - start).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should produce cryptographically secure random values', async () => {
      const encryptions = await Promise.all([
        encryptString(testPassphrase, testPlaintext),
        encryptString(testPassphrase, testPlaintext),
        encryptString(testPassphrase, testPlaintext)
      ]);

      // All salts should be different
      const salts = encryptions.map(e => e.salt);
      expect(new Set(salts).size).toBe(3);

      // All IVs should be different
      const ivs = encryptions.map(e => e.iv);
      expect(new Set(ivs).size).toBe(3);

      // All ciphertexts should be different
      const cts = encryptions.map(e => e.ct);
      expect(new Set(cts).size).toBe(3);
    });
  });
});
