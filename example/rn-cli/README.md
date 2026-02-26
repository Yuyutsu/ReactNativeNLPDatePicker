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

### 2. Install example dependencies

```sh
cd example/rn-cli
npm install
```

### 3a. Run on iOS

Install CocoaPods dependencies, then run:

```sh
cd ios && pod install && cd ..
npm run ios
```

### 3b. Run on Android

Make sure an Android emulator is running (or a device is connected), then:

```sh
npm run android
```

### 3c. Start the Metro bundler only

```sh
npm start
```

---

## Native project details

The `android/` and `ios/` native project directories are **fully committed** to this repository. They are based on the standard React Native 0.76.5 template with:

| Setting | Value |
|---|---|
| App name | `NLPCalendarRNCLI` |
| Android package | `com.nlpcalendarrncli` |
| iOS bundle ID | `com.nlpcalendarrncli` |
| Min Android SDK | 24 (Android 7.0) |
| Target / compile Android SDK | 35 (Android 15) |
| NDK | 27.1.12297006 |
| AGP | 8.3.2 |
| Kotlin | 1.9.24 |
| Gradle | 8.8 |
| iOS deployment target | 15.1 |
| JS engine | Hermes |

### Gradle wrapper

The `android/gradlew` script references `gradle/wrapper/gradle-wrapper.jar`. If this binary is absent after a fresh clone, regenerate it:

```sh
cd android
gradle wrapper --gradle-version=8.8
```

Or install Gradle 8.8 system-wide and the wrapper will download automatically on first `./gradlew` run.

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
| Babel preset | `babel-preset-expo` | `@react-native/babel-preset` |
| Metro config | `expo/metro-config` | `@react-native/metro-config` |
| Requires native build | ❌ (Expo Go handles it) | ✅ (Xcode / Android Studio) |
| Web support | ✅ | ❌ |

---

## Project structure

```
example/rn-cli/
  index.js                          AppRegistry entry point
  App.tsx                           Main demo screen
  app.json                          App name / displayName
  babel.config.js                   @react-native/babel-preset
  metro.config.js                   Metro config — watches repo root for lib changes
  package.json                      Dependencies; library linked via "file:../.."
  tsconfig.json                     TypeScript config (extends @tsconfig/react-native)
  android/
    build.gradle                    Root Gradle build file
    settings.gradle                 Module settings
    gradle.properties               Gradle & RN configuration flags
    gradlew / gradlew.bat           Gradle wrapper scripts
    gradle/wrapper/
      gradle-wrapper.properties     Gradle distribution URL (8.0.1)
    app/
      build.gradle                  App-level Gradle build
      proguard-rules.pro            ProGuard configuration
      src/main/
        AndroidManifest.xml         App manifest
        java/com/nlpcalendarrncli/
          MainActivity.kt           Main activity (Kotlin)
          MainApplication.kt        Application class (Kotlin)
        res/
          values/strings.xml        App name string
          values/styles.xml         AppTheme style
          drawable/                 RN drawable resources
      src/debug/...ReactNativeFlipper.java   Flipper (debug only)
      src/release/...ReactNativeFlipper.java  No-op Flipper stub
  ios/
    Podfile                         CocoaPods configuration
    .xcode.env                      Node binary path for Xcode build
    NLPCalendarRNCLI/
      AppDelegate.h / .mm           iOS app delegate
      main.m                        C entry point
      Info.plist                    App metadata
      LaunchScreen.storyboard       Splash screen
    NLPCalendarRNCLI.xcodeproj/
      project.pbxproj               Xcode project file
```

