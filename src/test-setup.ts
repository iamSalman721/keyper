/**
 * Test setup configuration for Vitest
 *
 * Sets up testing environment with jsdom and testing library utilities.
 *
 * Made with ❤️ by Pink Pixel ✨
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Web Crypto API for testing
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr: any) => {
      // Use pseudo-random values that are different each call but deterministic per test
      const callCount = (global as any).__cryptoCallCount || 0;
      (global as any).__cryptoCallCount = callCount + 1;
      
      for (let i = 0; i < arr.length; i++) {
        arr[i] = (i * 123 + 45 + callCount * 17) % 256;
      }
      return arr;
    },
    subtle: {
      importKey: vi.fn().mockImplementation(async (format, keyData, algorithm, extractable, keyUsages) => {
        return { 
          type: 'secret', 
          algorithm, 
          extractable, 
          usages: keyUsages,
          _keyData: keyData
        };
      }),
      encrypt: vi.fn().mockImplementation(async (algorithm, key, data) => {
        // Simple deterministic "encryption" for testing
        const result = new Uint8Array(data.byteLength + 16); // Add auth tag length
        const dataView = new Uint8Array(data);
        for (let i = 0; i < dataView.length; i++) {
          result[i] = dataView[i] ^ 0xAA; // Simple XOR
        }
        // Add fake auth tag
        for (let i = dataView.length; i < result.length; i++) {
          result[i] = 0xBB;
        }
        return result.buffer;
      }),
      decrypt: vi.fn().mockImplementation(async (algorithm, key, data) => {
        // Reverse the "encryption" for testing
        const encrypted = new Uint8Array(data);
        const result = new Uint8Array(encrypted.length - 16); // Remove auth tag
        for (let i = 0; i < result.length; i++) {
          result[i] = encrypted[i] ^ 0xAA; // Reverse XOR
        }
        return result.buffer;
      }),
      deriveKey: vi.fn().mockImplementation(async (algorithm, baseKey, derivedKeyType, extractable, keyUsages) => {
        return {
          type: 'secret',
          algorithm: derivedKeyType,
          extractable,
          usages: keyUsages,
          _derived: true
        };
      }),
      deriveBits: vi.fn(),
      generateKey: vi.fn(),
      exportKey: vi.fn(),
    },
  },
});

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: () => Date.now(),
  },
});

// Mock localStorage
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: vi.fn((key) => {
      if (key === 'keyper-supabase-url') return 'https://your-project.supabase.co';
      if (key === 'keyper-supabase-key') return 'your-anon-key';
      return null;
    }),
    setItem: vi.fn((key, value) => {
      console.log(`${key} set to ${value}`);
    }),
    removeItem: vi.fn((key) => {
      console.log(`${key} removed`);
    }),
    clear: vi.fn(() => {
      console.log('localStorage cleared');
    }),
  },
});

// Mock sessionStorage
Object.defineProperty(global, 'sessionStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
});

// Mock window.location
Object.defineProperty(global, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
  },
});

// Mock navigator
Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Test Environment)',
  },
});

// Mock document visibility API
Object.defineProperty(document, 'hidden', {
  value: false,
  writable: true,
});

Object.defineProperty(document, 'visibilityState', {
  value: 'visible',
  writable: true,
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock Argon2 for testing
vi.mock('argon2-browser/dist/argon2-bundled.min.js', () => ({
  default: {
    ArgonType: {
      Argon2d: 0,
      Argon2i: 1,
      Argon2id: 2,
    },
    hash: vi.fn().mockImplementation(async (options) => {
      // Create a deterministic hash based on passphrase and salt for testing
      const combined = options.pass + Array.from(options.salt).join(',');
      const hash = new Uint8Array(options.hashLen || 32);
      for (let i = 0; i < hash.length; i++) {
        hash[i] = (combined.charCodeAt(i % combined.length) + i) % 256;
      }
      return {
        hash,
        hashHex: Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join(''),
        encoded: '$argon2id$v=19$m=65536,t=3,p=1$' + btoa(String.fromCharCode(...options.salt)) + '$' + btoa(String.fromCharCode(...hash))
      };
    })
  }
}));

// Suppress console warnings in tests
const originalWarn = console.warn;
console.warn = (...args) => {
  // Suppress specific warnings that are expected in test environment
  if (
    args[0]?.includes?.('React Router') ||
    args[0]?.includes?.('useNavigate') ||
    args[0]?.includes?.('Warning: ReactDOM.render') ||
    args[0]?.includes?.('Failed to parse URL from //argon2.wasm')
  ) {
    return;
  }
  originalWarn(...args);
};
