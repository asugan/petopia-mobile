const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable package exports resolution for modern ESM packages
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
