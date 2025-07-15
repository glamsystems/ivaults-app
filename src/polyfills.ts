// Polyfills for Solana Mobile
console.log('[Polyfills] Loading polyfills...');

import { Buffer } from 'buffer';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

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

// Add a check to ensure Buffer has required methods
console.log('[Polyfills] Buffer.prototype.readUIntLE:', typeof Buffer.prototype.readUIntLE);
console.log('[Polyfills] Buffer.prototype.readUInt8:', typeof Buffer.prototype.readUInt8);
console.log('[Polyfills] Buffer.prototype.readUInt16LE:', typeof Buffer.prototype.readUInt16LE);
console.log('[Polyfills] Buffer.prototype.readUInt32LE:', typeof Buffer.prototype.readUInt32LE);

// Additional check for readUIntLE specifically
if (!Buffer.prototype.readUIntLE) {
  console.error('[Polyfills] CRITICAL: Buffer is missing readUIntLE method!');
  console.error('[Polyfills] Available Buffer methods:', Object.getOwnPropertyNames(Buffer.prototype).filter(m => m.includes('read')));
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

console.log('[Polyfills] Polyfills loaded successfully');
console.log('[Polyfills] Buffer available:', typeof Buffer !== 'undefined');
console.log('[Polyfills] window.Buffer available:', typeof window.Buffer !== 'undefined');
console.log('[Polyfills] global.Buffer available:', typeof global.Buffer !== 'undefined');
console.log('[Polyfills] TextDecoder available:', typeof TextDecoder !== 'undefined');
console.log('[Polyfills] structuredClone available:', typeof structuredClone !== 'undefined');