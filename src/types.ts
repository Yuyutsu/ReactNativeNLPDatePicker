/**
 * Core domain types for the NLPCalendar package.
 * Keeping types small and focused allows future NLP engine replacement
 * without touching UI or business logic.
 */

/** A single structured calendar event derived from natural language input. */
export interface CalendarEvent {
  /** Human-readable title for the event (derived from the original text). */
  readonly title: string;
  /** ISO-8601 date string, e.g. "2024-03-15". */
  readonly date: string;
  /** Optional time in 24-hour format "HH:MM", e.g. "10:00". */
  readonly time?: string;
}

/** Result returned by the NLP parser layer. */
export interface ParseResult {
  /** Parsed events. Empty when input is invalid or unrecognised. */
  readonly events: ReadonlyArray<CalendarEvent>;
  /** Human-readable message when parsing encountered a non-fatal issue. */
  readonly warning?: string;
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
