// Polyfills for Solana Mobile
import { Buffer } from 'buffer';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

// Add process polyfill for Anchor
if (typeof global.process === 'undefined') {
  global.process = {
    env: {},
    version: 'v16.0.0',
    versions: { node: '16.0.0' },
    browser: false,
    // @ts-ignore
    nextTick: (callback: Function, ...args: any[]) => {
      setTimeout(() => callback(...args), 0);
    }
  };
  // @ts-ignore
  window.process = global.process;
}

// Make Buffer available globally in all possible ways
// @ts-ignore
global.Buffer = Buffer;
// @ts-ignore
window.Buffer = Buffer;
// @ts-ignore
globalThis.Buffer = Buffer;

// Ensure Buffer is available as a constructor
if (typeof global.Buffer === 'undefined') {
  Object.defineProperty(global, 'Buffer', {
    value: Buffer,
    writable: false,
    configurable: false,
    enumerable: true
  });
}

// Fix for Buffer.subarray returning Uint8Array instead of Buffer in React Native
// This is critical for Anchor SDK compatibility
const originalSubarray = Buffer.prototype.subarray;
Buffer.prototype.subarray = function subarray(begin?: number, end?: number) {
  const result = originalSubarray.call(this, begin, end);
  // Ensure the result is a Buffer instance with all Buffer methods
  if (!(result instanceof Buffer)) {
    Object.setPrototypeOf(result, Buffer.prototype);
  }
  return result;
};

// Also patch slice method which might have similar issues
const originalSlice = Buffer.prototype.slice;
Buffer.prototype.slice = function slice(begin?: number, end?: number) {
  const result = originalSlice.call(this, begin, end);
  if (!(result instanceof Buffer)) {
    Object.setPrototypeOf(result, Buffer.prototype);
  }
  return result;
};

// Additional check for readUIntLE specifically
if (!Buffer.prototype.readUIntLE) {
  console.error('[Polyfills] CRITICAL: Buffer is missing readUIntLE method!');
} else {
  console.log('[Polyfills] Buffer.prototype.readUIntLE is available');
  // Test that subarray preserves Buffer methods
  const testBuf = Buffer.from([1, 2, 3, 4]);
  const subBuf = testBuf.subarray(0, 2);
  if (typeof subBuf.readUIntLE === 'function') {
    console.log('[Polyfills] Buffer.subarray patch successful - methods preserved');
  } else {
    console.error('[Polyfills] Buffer.subarray patch failed - methods not preserved');
  }
}

// These are needed for @solana/web3.js in React Native
// @ts-ignore
window.addEventListener = () => {};
// @ts-ignore
window.removeEventListener = () => {};

// Add TextDecoder/TextEncoder polyfill for Anchor
if (typeof global.TextDecoder === 'undefined') {
  const { TextDecoder, TextEncoder } = require('text-encoding');
  global.TextDecoder = TextDecoder;
  global.TextEncoder = TextEncoder;
  // @ts-ignore
  window.TextDecoder = TextDecoder;
  // @ts-ignore
  window.TextEncoder = TextEncoder;
}

// Add structuredClone polyfill
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = function structuredClone(obj: any): any {
    // Simple deep clone implementation
    // This handles most common cases but not all edge cases of the real structuredClone
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => structuredClone(item));
    if (obj instanceof Map) return new Map(Array.from(obj.entries()).map(([k, v]) => [k, structuredClone(v)]));
    if (obj instanceof Set) return new Set(Array.from(obj.values()).map(v => structuredClone(v)));
    
    // Handle regular objects
    const clonedObj: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = structuredClone(obj[key]);
      }
    }
    return clonedObj;
  };
  
  // Also add to window and globalThis for compatibility
  // @ts-ignore
  window.structuredClone = global.structuredClone;
  // @ts-ignore
  globalThis.structuredClone = global.structuredClone;
}

// Polyfills loaded