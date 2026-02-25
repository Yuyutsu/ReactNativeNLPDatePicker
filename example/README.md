# NLPCalendar — Example Apps

This directory contains two runnable example applications for the `react-native-nlp-calendar` package, one for each major React Native project type.

| | [`expo/`](./expo/) | [`rn-cli/`](./rn-cli/) |
|---|---|---|
| **Runtime** | Expo SDK 49 | React Native CLI 0.72 |
| **Entry point** | `node_modules/expo/AppEntry.js` | `index.js` (AppRegistry) |
| **Requires native toolchain** | ❌ (Expo Go handles it) | ✅ (Xcode / Android Studio) |
| **Web support** | ✅ | ❌ |
| **Best for** | Quick start / no native setup | Full RN CLI workflow |

---

## Quick start — Expo (recommended for first-time users)

```sh
# 1. Build the library (from repo root)
npm install && npm run build

# 2. Install and run
cd example/expo
npm install
npm start        # scan QR with Expo Go, or press i / a / w
```

See [`expo/README.md`](./expo/README.md) for full details.

---

## Quick start — React Native CLI

```sh
# 1. Build the library (from repo root)
npm install && npm run build

# 2. Generate native code (one-time)
npx react-native init NLPCalendarRNCLI --template react-native-template-typescript --version 0.72.7 --skip-install
cp -r NLPCalendarRNCLI/android example/rn-cli/
cp -r NLPCalendarRNCLI/ios    example/rn-cli/
rm -rf NLPCalendarRNCLI

# 3. Install and run
cd example/rn-cli
npm install
cd ios && pod install && cd ..   # iOS only
npm run ios      # or: npm run android
```

See [`rn-cli/README.md`](./rn-cli/README.md) for full details.
