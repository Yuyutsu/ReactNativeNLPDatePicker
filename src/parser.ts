/**
 * NLP parsing layer — pure functions only, no React, no side-effects.
 *
 * Design decision: regex-based heuristics are used intentionally to keep
 * the package dependency-free. The public surface (`parseNaturalLanguage`)
 * is isolated behind the `ParseResult` type so the implementation can be
 * swapped for a proper NLP engine (e.g. chrono-node, compromise) later
 * without touching any UI code.
 */

import type { CalendarEvent, Occurrence, ParseOptions, ParseResult, RecurrenceInfo } from './types';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Returns a Date offset from today by the given number of days. */
const offsetDate = (days: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

/** Formats a Date as an ISO-8601 date string "YYYY-MM-DD". */
const toISODate = (d: Date): string => d.toISOString().slice(0, 10);

/**
 * Resolves relative day words ("today", "tomorrow", "yesterday"),
 * "in/after N days", "before N days", "next <weekday>",
 * "next month", and "next year" to an ISO date string.
 * Returns `null` when no relative date is found.
 */
const resolveRelativeDate = (text: string): string | null => {
  const lower = text.toLowerCase();

  if (/\btoday\b/.test(lower)) return toISODate(new Date());
  if (/\btomorrow\b/.test(lower)) return toISODate(offsetDate(1));
  if (/\byesterday\b/.test(lower)) return toISODate(offsetDate(-1));

  const inDaysMatch = lower.match(/\bin\s+(\d+)\s+days?\b/);
  if (inDaysMatch) return toISODate(offsetDate(Number(inDaysMatch[1])));

  const afterDaysMatch = lower.match(/\bafter\s+(\d+)\s+days?\b/);
  if (afterDaysMatch) return toISODate(offsetDate(Number(afterDaysMatch[1])));

  const beforeDaysMatch = lower.match(/\bbefore\s+(\d+)\s+days?\b/);
  if (beforeDaysMatch) return toISODate(offsetDate(-Number(beforeDaysMatch[1])));

  if (/\bnext\s+month\b/.test(lower)) {
    const now = new Date();
    const year = now.getUTCFullYear();
    const nextMonthIndex = now.getUTCMonth() + 1;
    return toISODate(new Date(Date.UTC(
      nextMonthIndex === 12 ? year + 1 : year,
      nextMonthIndex === 12 ? 0 : nextMonthIndex,
      1,
    )));
  }

  if (/\bnext\s+year\b/.test(lower)) {
    const now = new Date();
    return toISODate(new Date(Date.UTC(now.getUTCFullYear() + 1, 0, 1)));
  }

  const nextWeekdayMatch = lower.match(
    /\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/,
  );
  if (nextWeekdayMatch) {
    const target = WEEKDAY_INDEX[nextWeekdayMatch[1]];
    const today = new Date().getDay();
    const daysUntil = ((target - today + 7) % 7 || 7);
    return toISODate(offsetDate(daysUntil));
  }

  return null;
};

const WEEKDAY_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const MONTH_INDEX: Record<string, number> = {
  january: 0, jan: 0,
  february: 1, feb: 1,
  march: 2, mar: 2,
  april: 3, apr: 3,
  may: 4,
  june: 5, jun: 5,
  july: 6, jul: 6,
  august: 7, aug: 7,
  september: 8, sep: 8, sept: 8,
  october: 9, oct: 9,
  november: 10, nov: 10,
  december: 11, dec: 11,
};

/**
 * Attempts to match an absolute date such as "March 15", "15 March",
 * "March 15 2025", or numeric "2025-03-15" / "03/15/2025".
 * Returns an ISO date string or `null`.
 */
const resolveAbsoluteDate = (text: string): string | null => {
  const lower = text.toLowerCase();

  // ISO format: 2025-03-15
  const isoMatch = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (isoMatch) {
    const d = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    return toISODate(d);
  }

  // US numeric: 03/15/2025 or 03/15
  const usMatch = text.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?\b/);
  if (usMatch) {
    const year = usMatch[3] ? Number(usMatch[3]) : new Date().getFullYear();
    const d = new Date(year, Number(usMatch[1]) - 1, Number(usMatch[2]));
    return toISODate(d);
  }

  // "Month Day [Year]" e.g. "March 15" or "March 15 2025"
  const monthDayMatch = lower.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})(?:\s+(\d{4}))?\b/,
  );
  if (monthDayMatch) {
    const month = MONTH_INDEX[monthDayMatch[1]];
    const day = Number(monthDayMatch[2]);
    const year = monthDayMatch[3] ? Number(monthDayMatch[3]) : new Date().getFullYear();
    const d = new Date(year, month, day);
    return toISODate(d);
  }

  // "Day Month [Year]" e.g. "15 March" or "15 March 2025"
  const dayMonthMatch = lower.match(
    /\b(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)(?:\s+(\d{4}))?\b/,
  );
  if (dayMonthMatch) {
    const day = Number(dayMonthMatch[1]);
    const month = MONTH_INDEX[dayMonthMatch[2]];
    const year = dayMonthMatch[3] ? Number(dayMonthMatch[3]) : new Date().getFullYear();
    const d = new Date(year, month, day);
    return toISODate(d);
  }

  return null;
};

/** Converts matched hour/minute/meridiem strings into a "HH:MM" string. */
const formatTime = (h: string, m: string | undefined, suffix: string | undefined): string => {
  let hours = Number(h);
  const minutes = m ? Number(m) : 0;
  const meridiem = suffix?.toLowerCase();
  if (meridiem === 'pm' && hours < 12) hours += 12;
  if (meridiem === 'am' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

/** Maps natural time-of-day keywords to default 24-hour times. */
const NATURAL_TIME_MAP: Record<string, string> = {
  morning: '09:00',
  afternoon: '14:00',
  evening: '18:00',
  night: '20:00',
};

/**
 * Extracts a time from natural time-of-day keywords like "morning" or "evening".
 * Returns `undefined` when no keyword is found.
 */
const extractNaturalTimeKeyword = (text: string): string | undefined => {
  const match = text.toLowerCase().match(/\b(morning|afternoon|evening|night)\b/);
  return match ? NATURAL_TIME_MAP[match[1]] : undefined;
};

/**
 * Extracts a start time string ("HH:MM") from natural language.
 * Handles:
 *   - "at 3pm" / "from 10:30am" / "at 14:00" (explicit prefix)
 *   - bare "5pm" / "3pm" (am/pm suffix without prefix)
 *   - natural keywords: morning, afternoon, evening, night
 * Returns `undefined` when no time is found.
 */
const extractTime = (text: string): string | undefined => {
  // Explicit "at" / "from" prefix takes highest priority
  const prefixMatch = text.match(/\b(?:at|from)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (prefixMatch) return formatTime(prefixMatch[1], prefixMatch[2], prefixMatch[3]);

  // Bare time with am/pm suffix e.g. "5pm", "10:30am"
  const bareMatch = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (bareMatch) return formatTime(bareMatch[1], bareMatch[2], bareMatch[3]);

  // Natural time-of-day keywords as last resort
  return extractNaturalTimeKeyword(text);
};

/**
 * Extracts an end time string ("HH:MM") from natural language.
 * Handles patterns like "to 5pm", "to 17:30".
 * Returns `undefined` when no end time is found.
 */
const extractEndTime = (text: string): string | undefined => {
  const match = text.match(/\bto\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (!match) return undefined;
  return formatTime(match[1], match[2], match[3]);
};

/**
 * Extracts an event duration from phrases like "for 2 hours" or "for 30 minutes".
 * Returns the duration in minutes, or `undefined` when not found.
 */
const extractDuration = (text: string): number | undefined => {
  const lower = text.toLowerCase();

  const hoursMatch = lower.match(/\bfor\s+(\d+(?:\.\d+)?)\s+hours?\b/);
  if (hoursMatch) return Math.round(Number(hoursMatch[1]) * 60);

  const minutesMatch = lower.match(/\bfor\s+(\d+)\s+minutes?\b/);
  if (minutesMatch) return Number(minutesMatch[1]);

  return undefined;
};

/**
 * Extracts a reminder offset from phrases like "remind me 30 minutes before"
 * or "remind me 1 hour before".
 * Returns the offset in minutes, or `undefined` when not found.
 */
const extractReminder = (text: string): number | undefined => {
  const lower = text.toLowerCase();

  const minutesMatch = lower.match(/\bremind(?:\s+me)?\s+(\d+)\s+minutes?\s+before\b/);
  if (minutesMatch) return Number(minutesMatch[1]);

  const hoursMatch = lower.match(/\bremind(?:\s+me)?\s+(\d+)\s+hours?\s+before\b/);
  if (hoursMatch) return Number(hoursMatch[1]) * 60;

  return undefined;
};

/**
 * Extracts recurrence information from phrases like "every monday",
 * "every weekday", or "every day".
 * Returns `null` when no recurrence pattern is found.
 */
const extractRecurrence = (text: string): RecurrenceInfo | null => {
  const lower = text.toLowerCase();

  if (/\bevery\s+day\b/.test(lower)) return { type: 'daily' };
  if (/\bevery\s+weekday\b/.test(lower)) return { type: 'weekday' };

  const weekdayMatch = lower.match(
    /\bevery\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/,
  );
  if (weekdayMatch) return { type: 'weekly', day: weekdayMatch[1] };

  return null;
};

/**
 * Generates future occurrences for a recurrence rule.
 * @param recurrence - The recurrence rule (type, optional day, optional time).
 * @param count      - Number of occurrences to generate.
 */
const generateOccurrences = (
  recurrence: RecurrenceInfo,
  count: number,
): ReadonlyArray<Occurrence> => {
  const occurrences: Occurrence[] = [];
  const cursor = new Date();

  if (recurrence.type === 'daily') {
    cursor.setDate(cursor.getDate() + 1); // start from tomorrow
    for (let i = 0; i < count; i++) {
      occurrences.push({
        date: toISODate(cursor),
        ...(recurrence.time !== undefined && { time: recurrence.time }),
      });
      cursor.setDate(cursor.getDate() + 1);
    }
  } else if (recurrence.type === 'weekday') {
    cursor.setDate(cursor.getDate() + 1); // start from tomorrow
    while (occurrences.length < count) {
      const day = cursor.getDay();
      if (day !== 0 && day !== 6) {
        occurrences.push({
          date: toISODate(cursor),
          ...(recurrence.time !== undefined && { time: recurrence.time }),
        });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  } else if (recurrence.type === 'weekly' && recurrence.day !== undefined) {
    const targetDay = WEEKDAY_INDEX[recurrence.day];
    const today = cursor.getDay();
    let daysUntil = (targetDay - today + 7) % 7;
    if (daysUntil === 0) daysUntil = 7; // always move to the next occurrence
    cursor.setDate(cursor.getDate() + daysUntil);
    for (let i = 0; i < count; i++) {
      occurrences.push({
        date: toISODate(cursor),
        ...(recurrence.time !== undefined && { time: recurrence.time }),
      });
      cursor.setDate(cursor.getDate() + 7);
    }
  }

  return occurrences;
};

/**
 * Derives a short event title by stripping date/time tokens from the text.
 * Falls back to the original (trimmed) text if nothing remains.
 */
const extractTitle = (text: string): string => {
  const stripped = text
    // Strip "every <day|weekday|day>" before generic weekday stripping
    .replace(/\bevery\s+(?:day|weekday|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, '')
    // Strip explicit time prefixes
    .replace(/\b(?:at|from)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/gi, '')
    .replace(/\bto\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/gi, '')
    // Strip weekday and next-month/year tokens
    .replace(/\b(?:next\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, '')
    .replace(/\bnext\s+(?:month|year)\b/gi, '')
    // Strip relative day keywords
    .replace(/\b(?:today|tomorrow|yesterday)\b/gi, '')
    .replace(/\bin\s+\d+\s+days?\b/gi, '')
    .replace(/\bafter\s+\d+\s+days?\b/gi, '')
    .replace(/\bbefore\s+\d+\s+days?\b/gi, '')
    // Strip absolute date formats
    .replace(/\b(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+\d{1,2}(?:\s+\d{4})?\b/gi, '')
    .replace(/\b\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)(?:\s+\d{4})?\b/gi, '')
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, '')
    .replace(/\b\d{1,2}\/\d{1,2}(?:\/\d{4})?\b/g, '')
    // Strip new feature tokens
    .replace(/\bfor\s+\d+(?:\.\d+)?\s+hours?\b/gi, '')
    .replace(/\bfor\s+\d+\s+minutes?\b/gi, '')
    .replace(/\bremind(?:\s+me)?\s+\d+\s+(?:minutes?|hours?)\s+before\b/gi, '')
    // Strip bare time expressions with am/pm (e.g. "5pm", "10:30am")
    .replace(/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/gi, '')
    // Strip natural time keywords
    .replace(/\b(?:morning|afternoon|evening|night)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return stripped.length > 0 ? stripped : text.trim();
};

// ---------------------------------------------------------------------------
// Internal single-event parser
// ---------------------------------------------------------------------------

/**
 * Attempts to parse a single event phrase.
 * Returns `null` when no date or recurrence is found.
 */
const parseSingleEvent = (text: string, options?: ParseOptions): CalendarEvent | null => {
  const occurrenceCount = options?.occurrences ?? 3;

  // Feature 1: Recurring events
  const recurrenceBase = extractRecurrence(text);
  if (recurrenceBase !== null) {
    const time = extractTime(text);
    const recurrence: RecurrenceInfo = {
      ...recurrenceBase,
      ...(time !== undefined && { time }),
    };
    const occurrences = generateOccurrences(recurrence, occurrenceCount);
    const title = extractTitle(text);
    return { title, recurrence, occurrences };
  }

  // Regular one-off event — must have a date
  const relativeDate = resolveRelativeDate(text);
  const absoluteDate = resolveAbsoluteDate(text);
  const date = relativeDate ?? absoluteDate;
  if (date === null) return null;

  const time = extractTime(text);
  const endTime = extractEndTime(text);
  const durationMinutes = extractDuration(text);
  const reminderMinutes = extractReminder(text);
  const title = extractTitle(text);

  return {
    title,
    date,
    ...(time !== undefined && { time }),
    ...(endTime !== undefined && { endTime }),
    ...(durationMinutes !== undefined && { durationMinutes }),
    ...(reminderMinutes !== undefined && { reminderMinutes }),
  };
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parses a natural language string into zero or more `CalendarEvent` objects.
 *
 * This is a pure function: same input always yields the same output.
 * It never throws — invalid or unrecognisable input returns an empty event
 * array with an optional warning message.
 *
 * Supported features:
 *  - Recurring events: "every monday at 5pm", "every weekday at 9am", "every day at 8am"
 *  - Event duration: "meeting tomorrow for 2 hours"
 *  - Natural time keywords: morning (09:00), afternoon (14:00), evening (18:00), night (20:00)
 *  - Reminder: "meeting tomorrow 5pm remind me 30 minutes before"
 *  - Multiple events: "call today 3pm and meeting tomorrow 5pm"
 *
 * @param text    - The raw natural language input from the user.
 * @param options - Optional settings (e.g. number of occurrences to generate).
 * @returns A `ParseResult` containing events and an optional warning.
 */
export const parseNaturalLanguage = (text: string, options?: ParseOptions): ParseResult => {
  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return { events: [] };
  }

  // Feature 5: Multiple events — split on " and " and parse each segment
  const segments = trimmed.split(/\s+and\s+/i).map(s => s.trim()).filter(Boolean);
  if (segments.length > 1) {
    const parsed = segments
      .map(seg => parseSingleEvent(seg, options))
      .filter((e): e is CalendarEvent => e !== null);
    if (parsed.length >= 2) {
      return { events: parsed };
    }
  }

  // Single event
  const event = parseSingleEvent(trimmed, options);
  if (event === null) {
    return {
      events: [],
      warning: 'Could not recognise a date in the provided text.',
    };
  }

  return { events: [event] };
};
