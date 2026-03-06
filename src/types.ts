/**
 * Core domain types for the NLPCalendar package.
 * Keeping types small and focused allows future NLP engine replacement
 * without touching UI or business logic.
 */

/** Describes how an event repeats over time. */
export interface RecurrenceInfo {
  /** Recurrence frequency: daily, on a specific weekday, or on any weekday (Mon–Fri). */
  readonly type: 'daily' | 'weekly' | 'weekday';
  /** Day of the week for weekly recurrence, e.g. "monday". */
  readonly day?: string;
  /** Start time in 24-hour format "HH:MM" shared by all occurrences. */
  readonly time?: string;
}

/** A single future occurrence of a recurring event. */
export interface Occurrence {
  /** ISO-8601 date string, e.g. "2024-03-15". */
  readonly date: string;
  /** Start time in 24-hour format "HH:MM". */
  readonly time?: string;
}

/** A single structured calendar event derived from natural language input. */
export interface CalendarEvent {
  /** Human-readable title for the event (derived from the original text). */
  readonly title: string;
  /**
   * ISO-8601 date string, e.g. "2024-03-15".
   * Not set for purely recurring events (those use `recurrence` + `occurrences`).
   */
  readonly date?: string;
  /** Optional start time in 24-hour format "HH:MM", e.g. "10:00". */
  readonly time?: string;
  /** Optional end time in 24-hour format "HH:MM", e.g. "17:00". */
  readonly endTime?: string;
  /** Duration of the event in minutes, e.g. 120 for "for 2 hours". */
  readonly durationMinutes?: number;
  /** How many minutes before the event a reminder should fire. */
  readonly reminderMinutes?: number;
  /** Recurrence rule for events that repeat (e.g. "every monday"). */
  readonly recurrence?: RecurrenceInfo;
  /** Pre-generated future occurrences for recurring events. */
  readonly occurrences?: ReadonlyArray<Occurrence>;
}

/** Result returned by the NLP parser layer. */
export interface ParseResult {
  /** Parsed events. Empty when input is invalid or unrecognised. */
  readonly events: ReadonlyArray<CalendarEvent>;
  /** Human-readable message when parsing encountered a non-fatal issue. */
  readonly warning?: string;
}

/** Options accepted by {@link parseNaturalLanguage}. */
export interface ParseOptions {
  /**
   * Number of future occurrences to generate for recurring events.
   * Defaults to 3.
   */
  readonly occurrences?: number;
}

/** A date range with ISO-8601 start and end dates. */
export interface DateRange {
  /** ISO-8601 start date string, e.g. "2024-03-15". */
  readonly start: string;
  /** ISO-8601 end date string, e.g. "2024-03-20". */
  readonly end: string;
}

/** Props accepted by the NLPCalendar component. */
export interface NLPCalendarProps {
  /**
   * Initial natural language text for the input field.
   * Example: "Team sync tomorrow at 3pm"
   */
  readonly text?: string;
  /** Placeholder shown in the text input when empty. */
  readonly placeholder?: string;
  /**
   * Called after every successful parse (including empty-event results).
   * Never called when text is empty/whitespace.
   */
  readonly onParsed?: (events: ReadonlyArray<CalendarEvent>) => void;
  /** Called when the user confirms a single date in the date picker. */
  readonly onDateChange?: (date: string) => void;
  /** Called when the user confirms a date range in the date picker. */
  readonly onDateRangeChange?: (range: DateRange) => void;
}
