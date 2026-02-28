# react-native-nlp-calendar

[![npm version](https://img.shields.io/npm/v/react-native-nlp-calendar.svg?style=flat)](https://www.npmjs.com/package/react-native-nlp-calendar)
[![npm downloads](https://img.shields.io/npm/dm/react-native-nlp-calendar.svg?style=flat)](https://www.npmjs.com/package/react-native-nlp-calendar)
[![CI](https://github.com/Yuyutsu/ReactNativeNLPDatePicker/actions/workflows/ci.yml/badge.svg)](https://github.com/Yuyutsu/ReactNativeNLPDatePicker/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A reusable React Native npm package — **NLPCalendar** — that accepts natural language text, parses dates using a lightweight NLP layer, and renders the resulting structured calendar events in a simple declarative UI.

---

## Features

- ✅ Functional React components only
- ✅ Strict TypeScript (no `any`)
- ✅ Pure functions for all business logic — UI and parsing never mix
- ✅ No external UI libraries — only `View` and `Text` from React Native
- ✅ Graceful error handling — never crashes on invalid input
- ✅ Fully testable and extensible NLP layer

---

## Installation

```sh
npm install react-native-nlp-calendar
# or
yarn add react-native-nlp-calendar
```

**Peer dependencies** (install if not already present):

```sh
npm install react react-native
```

---

## Usage

```tsx
import { NLPCalendar } from 'react-native-nlp-calendar';

// Minimal usage
<NLPCalendar text="Book meeting tomorrow at 10am" />

// With callback
<NLPCalendar
  text="Team sync next Friday at 3pm"
  onParsed={(events) => console.log(events)}
/>
```

`onParsed` receives a `ReadonlyArray<CalendarEvent>` every time parsing runs.

---

## Example Apps

Two runnable demo applications live in the [`example/`](./example) directory:

| | Expo | React Native CLI |
|---|---|---|
| **Directory** | [`example/expo/`](./example/expo/) | [`example/rn-cli/`](./example/rn-cli/) |
| **Requires native toolchain** | ❌ (Expo Go) | ✅ (Xcode / Android Studio) |

### Expo (quick start — no native setup)

```sh
npm install && npm run build     # repo root
cd example/expo && npm install
npm start   # scan QR with Expo Go, or press i / a / w
```

### React Native CLI

```sh
npm install && npm run build     # repo root
cd example/rn-cli && npm install
cd ios && pod install && cd ..   # iOS only
npm run ios    # or: npm run android
```

See [`example/README.md`](./example/README.md) for full details on both.

---

## Supported Natural Language Patterns

| Pattern | Example |
|---|---|
| `today` | "Stand-up today" |
| `tomorrow` | "Meeting tomorrow at 10am" |
| `yesterday` | "Missed call yesterday" |
| `in N days` | "Doctor appointment in 5 days" |
| `after N days` | "Call after 3 days at 4pm to 5pm" |
| `before N days` | "Event before 2 days" |
| `next month` | "Review next month" |
| `next year` | "Conference next year" |
| `next <weekday>` | "Gym next Monday" |
| `Month Day` | "Dentist March 15" |
| `Month Day Year` | "Conference June 20 2025" |
| `Day Month` | "15 April" |
| `YYYY-MM-DD` | "Flight 2025-06-20" |
| `MM/DD/YYYY` | "Event 06/20/2025" |
| `at Xam/pm` | "Meeting at 3pm" |
| `from Xam/pm` | "Workshop from 9am" |
| `at HH:MM` | "Lunch at 14:00" |
| `at X:XXam/pm` | "Call at 10:30am" |
| `at Xpm to Ypm` | "Call after 3 days at 4pm to 5pm" |
| `from Xam to Ypm` | "Workshop today from 9am to 5pm" |

---

## API

### `<NLPCalendar text onParsed? />`

| Prop | Type | Required | Description |
|---|---|---|---|
| `text` | `string` | ✅ | Natural language input |
| `onParsed` | `(events: ReadonlyArray<CalendarEvent>) => void` | ❌ | Callback after parsing |

### `parseNaturalLanguage(text: string): ParseResult`

Pure function — can be used independently of the component.

### Types

```ts
interface CalendarEvent {
  title: string;    // Event title derived from input
  date: string;     // ISO-8601 date "YYYY-MM-DD"
  time?: string;    // Optional start time in 24-h format "HH:MM"
  endTime?: string; // Optional end time in 24-h format "HH:MM"
}

interface ParseResult {
  events: ReadonlyArray<CalendarEvent>;
  warning?: string;  // Set when input is not parseable
}
```

---

## Project Structure

```
src/
  types.ts          — Core domain types (CalendarEvent, ParseResult, NLPCalendarProps)
  parser.ts         — Pure NLP parsing functions (no React, no side-effects)
  NLPCalendar.tsx   — Functional React Native component
  index.ts          — Clean public exports
  __tests__/
    parser.test.ts         — Unit tests for parser logic
    NLPCalendar.test.tsx   — Component tests
```

---

## Design Decisions

1. **Separation of concerns** — `parser.ts` is a pure module with zero React imports. The component (`NLPCalendar.tsx`) only calls `parseNaturalLanguage` and renders the result. Swapping the NLP engine in the future requires changing only `parser.ts`.

2. **No external NLP dependencies** — A regex-based heuristic parser keeps the bundle small and avoids supply-chain risk. The public API (`parseNaturalLanguage`) is designed for easy replacement with e.g. `chrono-node`.

3. **Strict TypeScript** — `noImplicitAny`, `strictNullChecks`, `noUnusedLocals`, and `noUnusedParameters` are all enabled. `any` is never used.

4. **Graceful degradation** — Invalid input returns `{ events: [] }` with an optional `warning`. The component always renders without throwing.

5. **No UI library** — Only React Native primitives (`View`, `Text`, `StyleSheet`) are used, keeping the package compatible with any React Native project.

---

## Development

```sh
npm install    # install dev dependencies
npm test       # run Jest tests
npm run build  # compile TypeScript to lib/
npm run lint   # type-check only (tsc --noEmit)
```

---


