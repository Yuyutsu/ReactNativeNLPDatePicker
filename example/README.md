# NLPCalendar — Example App

A runnable [Expo](https://expo.dev) application that demonstrates the `react-native-nlp-calendar` package.

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
| Expo CLI | ≥ 6 (`npm i -g expo-cli`) |
| Expo Go app | latest — [iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent) |

Or use an iOS Simulator / Android Emulator if you have Xcode / Android Studio installed.

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
cd example
npm install
```

### 3. Start the Expo dev server

```sh
npm start
```

Then:
- **Scan the QR code** with the Expo Go app on your phone, **or**
- Press `i` to open in the iOS Simulator, **or**
- Press `a` to open on an Android device/emulator, **or**
- Press `w` to open in a web browser

---

## Live reload on library changes

The Metro bundler is configured (`metro.config.js`) to watch the repository root. If you edit any source file in `../src/`, Metro will pick up the change **after you rebuild the library**:

```sh
# from repo root — rebuilds lib/ and Metro will hot-reload
npm run build
```

---

## Project structure

```
example/
  App.tsx          Main demo screen
  app.json         Expo app configuration
  babel.config.js  Babel preset (babel-preset-expo)
  metro.config.js  Metro config — watches root for lib changes
  package.json     Dependencies; library linked via "file:.."
  tsconfig.json    TypeScript config (extends expo/tsconfig.base)
```
