# NLPCalendar — React Native CLI Example

A runnable [React Native CLI](https://reactnative.dev/docs/environment-setup) application that demonstrates the `react-native-nlp-calendar` package. Uses only the standard RN runtime — **no Expo dependency**.

---

## What it shows

- A live **TextInput** where you type natural language event descriptions
- The **NLPCalendar** component renders parsed events in real time below the input
- Seven preset **example phrases** (tap to fill the input instantly)
- A **raw JSON view** showing the structured `CalendarEvent` objects returned to `onParsed`

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| Watchman | latest (macOS) |
| Xcode | ≥ 14 (iOS) |
| Android Studio | latest (Android) |
| JDK | ≥ 11 |

Follow the [React Native environment setup guide](https://reactnative.dev/docs/environment-setup) (select "React Native CLI Quickstart") if this is your first time.

---

## Setup & Run

### 1. Build the library

The example depends on the compiled library output (`lib/`). Run this once from the **repository root**:

```sh
# from the repo root
npm install
npm run build
```

### 2. Generate native code

This project only ships JS/TS source files. You need to generate the `android/` and `ios/` native project directories once using the React Native CLI:

```sh
# from the repo root — creates a temporary scaffold
npx react-native init NLPCalendarRNCLI --template react-native-template-typescript --version 0.72.7 --skip-install

# copy the native directories into this example folder
cp -r NLPCalendarRNCLI/android example/rn-cli/
cp -r NLPCalendarRNCLI/ios    example/rn-cli/

# clean up the temporary scaffold
rm -rf NLPCalendarRNCLI
```

### 3. Install example dependencies

```sh
cd example/rn-cli
npm install
```

### 4a. Run on iOS

```sh
cd ios && pod install && cd ..
npm run ios
```

### 4b. Run on Android

```sh
npm run android
```

### 4c. Start the Metro bundler only

```sh
npm start
```

---

## Live reload on library changes

The Metro bundler is configured (`metro.config.js`) to watch the repository root. If you edit any source file in `../../src/`, Metro will pick up the change **after you rebuild the library**:

```sh
# from repo root — rebuilds lib/ and Metro will hot-reload
npm run build
```

---

## Key differences from the Expo example

| | Expo (`example/expo/`) | React Native CLI (`example/rn-cli/`) |
|---|---|---|
| Entry point | `node_modules/expo/AppEntry.js` | `index.js` (AppRegistry) |
| Status bar | `expo-status-bar` | `StatusBar` from `react-native` |
| Babel preset | `babel-preset-expo` | `metro-react-native-babel-preset` |
| Metro config | `expo/metro-config` | `@react-native/metro-config` |
| Requires native build | ❌ (Expo Go handles it) | ✅ (Xcode / Android Studio) |
| Web support | ✅ | ❌ |

---

## Project structure

```
example/rn-cli/
  index.js         AppRegistry entry point
  App.tsx          Main demo screen
  app.json         name / displayName for the app
  babel.config.js  metro-react-native-babel-preset
  metro.config.js  Metro config — watches repo root for lib changes
  package.json     Dependencies; library linked via "file:../.."
  tsconfig.json    TypeScript config (extends @tsconfig/react-native)
  android/         Generated native Android project (not in git)
  ios/             Generated native iOS project (not in git)
```
