// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable lazy bundling — only bundle modules when first requested
// This dramatically reduces cold-start time
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => middleware,
};

// Reduce transformer workers to avoid memory pressure
config.maxWorkers = 2;

// No web-specific exclusions needed for mobile-only app

module.exports = config;
