import { parseNaturalLanguage } from '../parser';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns today's ISO date string "YYYY-MM-DD". */
const todayISO = (): string => new Date().toISOString().slice(0, 10);

/** Returns an ISO date string offset from today by `days`. */
const offsetISO = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

// ---------------------------------------------------------------------------
// Empty / invalid input
// ---------------------------------------------------------------------------

describe('parseNaturalLanguage — empty / invalid input', () => {
  it('returns empty events for an empty string', () => {
    const result = parseNaturalLanguage('');
    expect(result.events).toHaveLength(0);
    expect(result.warning).toBeUndefined();
  });

  it('returns empty events for whitespace-only string', () => {
    const result = parseNaturalLanguage('   ');
    expect(result.events).toHaveLength(0);
  });

  it('returns empty events with a warning for unrecognisable text', () => {
    const result = parseNaturalLanguage('gibberish text without a date');
    expect(result.events).toHaveLength(0);
    expect(result.warning).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Relative dates
// ---------------------------------------------------------------------------

describe('parseNaturalLanguage — relative dates', () => {
  it('parses "today"', () => {
    const result = parseNaturalLanguage('Stand-up today');
    expect(result.events).toHaveLength(1);
    expect(result.events[0].date).toBe(todayISO());
  });

  it('parses "tomorrow"', () => {
    const result = parseNaturalLanguage('Meeting tomorrow');
    expect(result.events).toHaveLength(1);
    expect(result.events[0].date).toBe(offsetISO(1));
  });

  it('parses "yesterday"', () => {
    const result = parseNaturalLanguage('Missed call yesterday');
    expect(result.events).toHaveLength(1);
    expect(result.events[0].date).toBe(offsetISO(-1));
  });

  it('parses "in N days"', () => {
    const result = parseNaturalLanguage('Doctor appointment in 5 days');
    expect(result.events).toHaveLength(1);
    expect(result.events[0].date).toBe(offsetISO(5));
  });

  it('parses "after N days"', () => {
    const result = parseNaturalLanguage('Call after 3 days');
    expect(result.events).toHaveLength(1);
    expect(result.events[0].date).toBe(offsetISO(3));
  });

  it('parses "before N days"', () => {
    const result = parseNaturalLanguage('Event before 2 days');
    expect(result.events).toHaveLength(1);
    expect(result.events[0].date).toBe(offsetISO(-2));
  });

  it('parses "next month"', () => {
    const expected = new Date();
    expected.setMonth(expected.getMonth() + 1);
    expected.setDate(1);
    const result = parseNaturalLanguage('Review next month');
    expect(result.events).toHaveLength(1);
    expect(result.events[0].date).toBe(expected.toISOString().slice(0, 10));
  });

  it('parses "next year"', () => {
    const expected = new Date();
    expected.setFullYear(expected.getFullYear() + 1, 0, 1);
    const result = parseNaturalLanguage('Conference next year');
    expect(result.events).toHaveLength(1);
    expect(result.events[0].date).toBe(expected.toISOString().slice(0, 10));
  });

  it('parses "next Monday"', () => {
    const result = parseNaturalLanguage('Gym next Monday');
    const date = new Date(result.events[0].date);
    expect(date.getDay()).toBe(1); // 1 = Monday
  });

  it('parses "next Friday"', () => {
    const result = parseNaturalLanguage('Review next Friday');
    const date = new Date(result.events[0].date);
    expect(date.getDay()).toBe(5); // 5 = Friday
  });
});

// ---------------------------------------------------------------------------
// Absolute dates
// ---------------------------------------------------------------------------

describe('parseNaturalLanguage — absolute dates', () => {
  it('parses ISO format "2025-06-20"', () => {
    const result = parseNaturalLanguage('Flight 2025-06-20');
    expect(result.events[0].date).toBe('2025-06-20');
  });

  it('parses US numeric format "06/20/2025"', () => {
    const result = parseNaturalLanguage('Conference 06/20/2025');
    expect(result.events[0].date).toBe('2025-06-20');
  });

  it('parses "Month Day" format "March 15"', () => {
    const result = parseNaturalLanguage('Dentist March 15');
    expect(result.events[0].date).toMatch(/^\d{4}-03-15$/);
  });

  it('parses "Month Day Year" format "March 15 2025"', () => {
    const result = parseNaturalLanguage('Dentist March 15 2025');
    expect(result.events[0].date).toBe('2025-03-15');
  });

  it('parses "Day Month" format "15 March"', () => {
    const result = parseNaturalLanguage('Dentist 15 March');
    expect(result.events[0].date).toMatch(/^\d{4}-03-15$/);
  });
});

// ---------------------------------------------------------------------------
// Time extraction
// ---------------------------------------------------------------------------

describe('parseNaturalLanguage — time extraction', () => {
  it('extracts 12-hour AM time "at 10am"', () => {
    const result = parseNaturalLanguage('Call today at 10am');
    expect(result.events[0].time).toBe('10:00');
  });

  it('extracts 12-hour PM time "at 3pm"', () => {
    const result = parseNaturalLanguage('Meeting tomorrow at 3pm');
    expect(result.events[0].time).toBe('15:00');
  });

  it('extracts 24-hour time "at 14:00"', () => {
    const result = parseNaturalLanguage('Lunch tomorrow at 14:00');
    expect(result.events[0].time).toBe('14:00');
  });

  it('extracts time with minutes "at 10:30am"', () => {
    const result = parseNaturalLanguage('Call today at 10:30am');
    expect(result.events[0].time).toBe('10:30');
  });

  it('converts 12pm correctly to 12:00', () => {
    const result = parseNaturalLanguage('Lunch today at 12pm');
    expect(result.events[0].time).toBe('12:00');
  });

  it('converts 12am correctly to 00:00', () => {
    const result = parseNaturalLanguage('Alarm today at 12am');
    expect(result.events[0].time).toBe('00:00');
  });

  it('extracts start time with "from Xpm"', () => {
    const result = parseNaturalLanguage('Workshop today from 9am');
    expect(result.events[0].time).toBe('09:00');
  });

  it('extracts end time with "to Xpm"', () => {
    const result = parseNaturalLanguage('Workshop today from 9am to 5pm');
    expect(result.events[0].endTime).toBe('17:00');
  });

  it('extracts time range "at 4pm to 5pm"', () => {
    const result = parseNaturalLanguage('Call after 3 days at 4pm to 5pm');
    expect(result.events[0].time).toBe('16:00');
    expect(result.events[0].endTime).toBe('17:00');
  });

  it('leaves time undefined when no time is specified', () => {
    const result = parseNaturalLanguage('Gym tomorrow');
    expect(result.events[0].time).toBeUndefined();
  });

  it('leaves endTime undefined when no end time is specified', () => {
    const result = parseNaturalLanguage('Gym tomorrow at 8am');
    expect(result.events[0].endTime).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Title extraction
// ---------------------------------------------------------------------------

describe('parseNaturalLanguage — title extraction', () => {
  it('strips date keywords from the title', () => {
    const result = parseNaturalLanguage('Book meeting tomorrow at 10am');
    expect(result.events[0].title).toBe('Book meeting');
  });

  it('strips "after N days" from the title', () => {
    const result = parseNaturalLanguage('Call after 3 days at 4pm to 5pm');
    expect(result.events[0].title).toBe('Call');
  });

  it('strips "next month" from the title', () => {
    const result = parseNaturalLanguage('Review next month');
    expect(result.events[0].title).toBe('Review');
  });

  it('strips "next year" from the title', () => {
    const result = parseNaturalLanguage('Conference next year');
    expect(result.events[0].title).toBe('Conference');
  });

  it('uses full text as title when only date/time remains after stripping', () => {
    // text is just a date — fallback to original text
    const result = parseNaturalLanguage('tomorrow');
    expect(result.events[0].title.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Full integration
// ---------------------------------------------------------------------------

describe('parseNaturalLanguage — full integration', () => {
  it('parses "Book meeting tomorrow at 10am" completely', () => {
    const result = parseNaturalLanguage('Book meeting tomorrow at 10am');
    expect(result.events).toHaveLength(1);
    expect(result.events[0].date).toBe(offsetISO(1));
    expect(result.events[0].time).toBe('10:00');
    expect(result.events[0].title).toBe('Book meeting');
    expect(result.warning).toBeUndefined();
  });
});
