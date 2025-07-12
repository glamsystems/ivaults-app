// Polyfills for Solana Mobile
console.log('[Polyfills] Loading polyfills...');

import { Buffer } from 'buffer';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

// @ts-ignore
window.Buffer = Buffer;

// These are needed for @solana/web3.js in React Native
// @ts-ignore
window.addEventListener = () => {};
// @ts-ignore
window.removeEventListener = () => {};

// Make Buffer available globally
global.Buffer = Buffer;

console.log('[Polyfills] Polyfills loaded successfully');
console.log('[Polyfills] Buffer available:', typeof Buffer !== 'undefined');
console.log('[Polyfills] window.Buffer available:', typeof window.Buffer !== 'undefined');
console.log('[Polyfills] global.Buffer available:', typeof global.Buffer !== 'undefined');