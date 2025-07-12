// Polyfill for Node.js util module in React Native
module.exports = {
  TextDecoder: global.TextDecoder || require('text-encoding').TextDecoder,
  TextEncoder: global.TextEncoder || require('text-encoding').TextEncoder,
};