/**
 * Binary encoding utilities for cryptographic operations
 * 
 * Provides base64 and UTF-8 conversion functions without external dependencies.
 * Used for encoding/decoding cryptographic data like salts, IVs, and ciphertext.
 * 
 * Made with ❤️ by Pink Pixel ✨
 */

/**
 * Convert ArrayBuffer to base64 string
 * @param buf - ArrayBuffer to convert
 * @returns Base64 encoded string
 */
export function bufToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binaryString = "";
  
  // Convert bytes to binary string
  for (let i = 0; i < bytes.length; i++) {
    binaryString += String.fromCharCode(bytes[i]);
  }
  
  return btoa(binaryString);
}

/**
 * Convert base64 string to ArrayBuffer
 * @param b64 - Base64 encoded string
 * @returns ArrayBuffer containing decoded data
 */
export function base64ToBuf(b64: string): ArrayBuffer {
  const binaryString = atob(b64);
  const bytes = new Uint8Array(binaryString.length);
  
  // Convert binary string to bytes
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes.buffer;
}

/**
 * Encode string to UTF-8 bytes
 * @param str - String to encode
 * @returns Uint8Array containing UTF-8 encoded bytes
 */
export function utf8Encode(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Decode UTF-8 bytes to string
 * @param buffer - ArrayBuffer containing UTF-8 encoded bytes
 * @returns Decoded string
 */
export function utf8Decode(buffer: ArrayBuffer): string {
  return new TextDecoder().decode(buffer);
}

/**
 * Generate cryptographically secure random bytes
 * @param length - Number of bytes to generate
 * @returns Uint8Array containing random bytes
 */
export function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * Securely compare two arrays in constant time
 * Helps prevent timing attacks when comparing sensitive data
 * @param a - First array to compare
 * @param b - Second array to compare
 * @returns True if arrays are equal, false otherwise
 */
export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  
  return result === 0;
}

/**
 * Convert hex string to bytes
 * @param hex - Hex string (with or without 0x prefix)
 * @returns Uint8Array containing decoded bytes
 */
export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
  }
  
  return bytes;
}

/**
 * Convert bytes to hex string
 * @param bytes - Bytes to convert
 * @returns Hex string representation
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}
