# ReactNativeNLPDatePicker

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

## Supported Natural Language Patterns

| Pattern | Example |
|---|---|
| `today` | "Stand-up today" |
| `tomorrow` | "Meeting tomorrow at 10am" |
| `yesterday` | "Missed call yesterday" |
| `in N days` | "Doctor appointment in 5 days" |
| `next <weekday>` | "Gym next Monday" |
| `Month Day` | "Dentist March 15" |
| `Month Day Year` | "Conference June 20 2025" |
| `Day Month` | "15 April" |
| `YYYY-MM-DD` | "Flight 2025-06-20" |
| `MM/DD/YYYY` | "Event 06/20/2025" |
| `at Xam/pm` | "Meeting at 3pm" |
| `at HH:MM` | "Lunch at 14:00" |
| `at X:XXam/pm` | "Call at 10:30am" |

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
  title: string;   // Event title derived from input
  date: string;    // ISO-8601 date "YYYY-MM-DD"
  time?: string;   // Optional 24-h time "HH:MM"
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
