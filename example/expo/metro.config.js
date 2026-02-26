const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const rootDir = path.resolve(__dirname, '../..');

const config = getDefaultConfig(__dirname);

// Watch the library root so Metro hot-reloads when library source changes.
config.watchFolders = [rootDir];

// Ensure react and react-native resolve from the example's own node_modules
// to avoid duplicate React instances when using a local file: dependency.
config.resolver.extraNodeModules = {
  react: path.resolve(__dirname, 'node_modules/react'),
  'react-native': path.resolve(__dirname, 'node_modules/react-native'),
};

module.exports = config;
