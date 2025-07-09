const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add font extensions
config.resolver.assetExts.push('otf', 'ttf');

module.exports = config;