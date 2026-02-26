const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const rootDir = path.resolve(__dirname, '../..');

/**
 * Metro configuration for the React Native CLI example.
 *
 * watchFolders includes the repository root so Metro detects changes to the
 * compiled library (lib/) without restarting the bundler.
 *
 * extraNodeModules pins react and react-native to this project's copies,
 * preventing duplicate-instance errors caused by the "file:.." symlink.
 */
const config = {
  watchFolders: [rootDir],
  resolver: {
    extraNodeModules: {
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-native': path.resolve(__dirname, 'node_modules/react-native'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
