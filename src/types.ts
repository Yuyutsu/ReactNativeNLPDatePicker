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

/** Props accepted by the NLPCalendar component. */
export interface NLPCalendarProps {
  /**
   * Natural language text describing one or more events.
   * Example: "Team sync tomorrow at 3pm"
   */
  readonly text: string;
  /**
   * Called after every successful parse (including empty-event results).
   * Never called when text is empty/whitespace.
   */
  readonly onParsed?: (events: ReadonlyArray<CalendarEvent>) => void;
}
