/**
 * NLP parsing layer — pure functions only, no React, no side-effects.
 *
 * Design decision: regex-based heuristics are used intentionally to keep
 * the package dependency-free. The public surface (`parseNaturalLanguage`)
 * is isolated behind the `ParseResult` type so the implementation can be
 * swapped for a proper NLP engine (e.g. chrono-node, compromise) later
 * without touching any UI code.
 */

import type { CalendarEvent, ParseResult } from './types';

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
 * Resolves relative day words ("today", "tomorrow", "yesterday") and
 * "next <weekday>" patterns to an ISO date string.
 * Returns `null` when no relative date is found.
 */
const resolveRelativeDate = (text: string): string | null => {
  const lower = text.toLowerCase();

  if (/\btoday\b/.test(lower)) return toISODate(new Date());
  if (/\btomorrow\b/.test(lower)) return toISODate(offsetDate(1));
  if (/\byesterday\b/.test(lower)) return toISODate(offsetDate(-1));

  const inDaysMatch = lower.match(/\bin\s+(\d+)\s+days?\b/);
  if (inDaysMatch) return toISODate(offsetDate(Number(inDaysMatch[1])));

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

/**
 * Extracts a time string ("HH:MM") from natural language.
 * Handles patterns like "at 3pm", "at 10:30am", "at 14:00".
 * Returns `undefined` when no time is found.
 */
const extractTime = (text: string): string | undefined => {
  const match = text.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (!match) return undefined;

  let hours = Number(match[1]);
  const minutes = match[2] ? Number(match[2]) : 0;
  const meridiem = match[3]?.toLowerCase();

  if (meridiem === 'pm' && hours < 12) hours += 12;
  if (meridiem === 'am' && hours === 12) hours = 0;

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  return `${hh}:${mm}`;
};

/**
 * Derives a short event title by stripping date/time tokens from the text.
 * Falls back to the original (trimmed) text if nothing remains.
 */
const extractTitle = (text: string): string => {
  const stripped = text
    .replace(/\bat\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/gi, '')
    .replace(/\b(?:next\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, '')
    .replace(/\b(?:today|tomorrow|yesterday)\b/gi, '')
    .replace(/\bin\s+\d+\s+days?\b/gi, '')
    .replace(/\b(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+\d{1,2}(?:\s+\d{4})?\b/gi, '')
    .replace(/\b\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)(?:\s+\d{4})?\b/gi, '')
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, '')
    .replace(/\b\d{1,2}\/\d{1,2}(?:\/\d{4})?\b/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return stripped.length > 0 ? stripped : text.trim();
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
 * @param text - The raw natural language input from the user.
 * @returns A `ParseResult` containing events and an optional warning.
 */
export const parseNaturalLanguage = (text: string): ParseResult => {
  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return { events: [] };
  }

  const relativeDate = resolveRelativeDate(trimmed);
  const absoluteDate = resolveAbsoluteDate(trimmed);
  const date = relativeDate ?? absoluteDate;

  if (!date) {
    return {
      events: [],
      warning: 'Could not recognise a date in the provided text.',
    };
  }

  const time = extractTime(trimmed);
  const title = extractTitle(trimmed);

  const event: CalendarEvent = { title, date, ...(time !== undefined && { time }) };

  return { events: [event] };
};
