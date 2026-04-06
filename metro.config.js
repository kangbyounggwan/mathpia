// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Force CJS resolution to avoid import.meta issues on web
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
