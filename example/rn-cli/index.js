/**
 * React Native CLI entry point.
 * This file registers the App component with the AppRegistry.
 */
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
