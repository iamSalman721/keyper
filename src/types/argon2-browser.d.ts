/**
 * TypeScript declarations for argon2-browser bundled build
 *
 * Provides type safety for the bundled Argon2 implementation
 * that embeds WASM in JavaScript for Vite compatibility.
 *
 * Made with ❤️ by Pink Pixel ✨
 */

declare module "argon2-browser/dist/argon2-bundled.min.js" {
  const argon2: {
    ArgonType: {
      Argon2d: number;
      Argon2i: number;
      Argon2id: number;
    };
    hash(options: {
      pass: string;
      salt: Uint8Array;
      type: number;
      time: number;
      mem: number;
      parallelism: number;
      hashLen: number;
    }): Promise<{
      hash: Uint8Array;
      hashHex: string;
      encoded: string;
    }>;
  };
  export default argon2;
}
