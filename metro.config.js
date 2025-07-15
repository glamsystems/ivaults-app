const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add font extensions
config.resolver.assetExts.push('otf', 'ttf');

// Add node module polyfills
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  util: path.join(__dirname, 'src', 'polyfills', 'util.js'),
  assert: require.resolve('assert'),
  process: path.join(__dirname, 'src', 'polyfills', 'process.js'),
  fs: path.join(__dirname, 'src', 'polyfills', 'fs.js'),
};

module.exports = config;