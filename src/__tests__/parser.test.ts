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

// ---------------------------------------------------------------------------
// Feature 1: Recurring events
// ---------------------------------------------------------------------------

describe('parseNaturalLanguage — recurring events', () => {
  it('parses "every monday at 5pm" as a weekly recurring event', () => {
    const result = parseNaturalLanguage('every monday at 5pm');
    expect(result.events).toHaveLength(1);
    const event = result.events[0];
    expect(event.recurrence).toEqual({ type: 'weekly', day: 'monday', time: '17:00' });
    expect(event.date).toBeUndefined();
  });

  it('parses "meeting every monday at 5pm" and extracts the title', () => {
    const result = parseNaturalLanguage('meeting every monday at 5pm');
    expect(result.events[0].title).toBe('meeting');
    expect(result.events[0].recurrence?.type).toBe('weekly');
    expect(result.events[0].recurrence?.day).toBe('monday');
    expect(result.events[0].recurrence?.time).toBe('17:00');
  });

  it('parses "every weekday at 9am" as a weekday recurrence', () => {
    const result = parseNaturalLanguage('every weekday at 9am');
    expect(result.events[0].recurrence).toEqual({ type: 'weekday', time: '09:00' });
  });

  it('parses "every day at 8am" as a daily recurrence', () => {
    const result = parseNaturalLanguage('every day at 8am');
    expect(result.events[0].recurrence).toEqual({ type: 'daily', time: '08:00' });
  });

  it('generates 3 occurrences by default', () => {
    const result = parseNaturalLanguage('every monday at 5pm');
    expect(result.events[0].occurrences).toHaveLength(3);
  });

  it('respects the occurrences option', () => {
    const result = parseNaturalLanguage('every monday at 5pm', { occurrences: 5 });
    expect(result.events[0].occurrences).toHaveLength(5);
  });

  it('generates occurrences on the correct weekday for weekly recurrence', () => {
    const result = parseNaturalLanguage('every friday at 3pm');
    const occurrences = result.events[0].occurrences ?? [];
    expect(occurrences.length).toBeGreaterThan(0);
    for (const occ of occurrences) {
      const d = new Date(occ.date + 'T12:00:00Z');
      expect(d.getUTCDay()).toBe(5); // 5 = Friday
    }
  });

  it('generates occurrences with the correct time', () => {
    const result = parseNaturalLanguage('every tuesday at 10am');
    const occurrences = result.events[0].occurrences ?? [];
    for (const occ of occurrences) {
      expect(occ.time).toBe('10:00');
    }
  });

  it('generates weekday occurrences only on Mon–Fri', () => {
    const result = parseNaturalLanguage('standup every weekday at 9am', { occurrences: 5 });
    const occurrences = result.events[0].occurrences ?? [];
    expect(occurrences).toHaveLength(5);
    for (const occ of occurrences) {
      const day = new Date(occ.date + 'T12:00:00Z').getUTCDay();
      expect(day).toBeGreaterThanOrEqual(1);
      expect(day).toBeLessThanOrEqual(5);
    }
  });

  it('generates consecutive daily occurrences', () => {
    const result = parseNaturalLanguage('every day at 8am', { occurrences: 3 });
    const occurrences = result.events[0].occurrences ?? [];
    expect(occurrences).toHaveLength(3);
    for (let i = 1; i < occurrences.length; i++) {
      const prev = new Date(occurrences[i - 1].date);
      const curr = new Date(occurrences[i].date);
      const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBe(1);
    }
  });

  it('handles "every saturday evening" with a natural time keyword', () => {
    const result = parseNaturalLanguage('every saturday evening');
    expect(result.events[0].recurrence).toEqual({
      type: 'weekly',
      day: 'saturday',
      time: '18:00',
    });
  });

  it('includes time on every occurrence for bare "every monday 5pm"', () => {
    const result = parseNaturalLanguage('every monday 5pm');
    const occurrences = result.events[0].occurrences ?? [];
    expect(occurrences.length).toBeGreaterThan(0);
    for (const occ of occurrences) {
      expect(occ.time).toBe('17:00');
    }
  });
});

// ---------------------------------------------------------------------------
// Feature 2: Event duration
// ---------------------------------------------------------------------------

describe('parseNaturalLanguage — event duration', () => {
  it('parses "meeting tomorrow for 2 hours" — durationMinutes = 120', () => {
    const result = parseNaturalLanguage('meeting tomorrow for 2 hours');
    expect(result.events[0].durationMinutes).toBe(120);
  });

  it('parses "call today for 30 minutes" — durationMinutes = 30', () => {
    const result = parseNaturalLanguage('call today for 30 minutes');
    expect(result.events[0].durationMinutes).toBe(30);
  });

  it('parses "call today for 1 hour" — durationMinutes = 60', () => {
    const result = parseNaturalLanguage('call today for 1 hour');
    expect(result.events[0].durationMinutes).toBe(60);
  });

  it('leaves durationMinutes undefined when no duration is specified', () => {
    const result = parseNaturalLanguage('meeting tomorrow at 3pm');
    expect(result.events[0].durationMinutes).toBeUndefined();
  });

  it('includes date and time alongside durationMinutes', () => {
    const result = parseNaturalLanguage('meeting tomorrow at 3pm for 2 hours');
    expect(result.events[0].date).toBe(offsetISO(1));
    expect(result.events[0].time).toBe('15:00');
    expect(result.events[0].durationMinutes).toBe(120);
  });

  it('strips duration phrase from the title', () => {
    const result = parseNaturalLanguage('meeting tomorrow for 2 hours');
    expect(result.events[0].title).toBe('meeting');
  });
});

// ---------------------------------------------------------------------------
// Feature 3: Natural time keywords
// ---------------------------------------------------------------------------

describe('parseNaturalLanguage — natural time keywords', () => {
  it('maps "morning" to 09:00', () => {
    const result = parseNaturalLanguage('meeting tomorrow morning');
    expect(result.events[0].time).toBe('09:00');
  });

  it('maps "afternoon" to 14:00', () => {
    const result = parseNaturalLanguage('meeting tomorrow afternoon');
    expect(result.events[0].time).toBe('14:00');
  });

  it('maps "evening" to 18:00', () => {
    const result = parseNaturalLanguage('call today evening');
    expect(result.events[0].time).toBe('18:00');
  });

  it('maps "night" to 20:00', () => {
    const result = parseNaturalLanguage('dinner today night');
    expect(result.events[0].time).toBe('20:00');
  });

  it('strips the time keyword from the title', () => {
    const result = parseNaturalLanguage('meeting tomorrow morning');
    expect(result.events[0].title).toBe('meeting');
  });

  it('explicit "at Xpm" takes priority over a time keyword', () => {
    const result = parseNaturalLanguage('meeting tomorrow morning at 11am');
    expect(result.events[0].time).toBe('11:00');
  });
});

// ---------------------------------------------------------------------------
// Feature 4: Reminder parsing
// ---------------------------------------------------------------------------

describe('parseNaturalLanguage — reminder parsing', () => {
  it('parses "remind me 30 minutes before"', () => {
    const result = parseNaturalLanguage('meeting tomorrow 5pm remind me 30 minutes before');
    expect(result.events[0].reminderMinutes).toBe(30);
  });

  it('parses "remind me 1 hour before" as 60 minutes', () => {
    const result = parseNaturalLanguage('call today remind me 1 hour before');
    expect(result.events[0].reminderMinutes).toBe(60);
  });

  it('parses "remind me 2 hours before" as 120 minutes', () => {
    const result = parseNaturalLanguage('meeting tomorrow remind me 2 hours before');
    expect(result.events[0].reminderMinutes).toBe(120);
  });

  it('leaves reminderMinutes undefined when no reminder is specified', () => {
    const result = parseNaturalLanguage('meeting tomorrow at 3pm');
    expect(result.events[0].reminderMinutes).toBeUndefined();
  });

  it('strips the reminder phrase from the title', () => {
    const result = parseNaturalLanguage('meeting tomorrow 5pm remind me 30 minutes before');
    expect(result.events[0].title).toBe('meeting');
  });

  it('includes time alongside reminderMinutes', () => {
    const result = parseNaturalLanguage('meeting tomorrow 5pm remind me 30 minutes before');
    expect(result.events[0].time).toBe('17:00');
    expect(result.events[0].reminderMinutes).toBe(30);
  });
});

// ---------------------------------------------------------------------------
// Feature 5: Multiple events
// ---------------------------------------------------------------------------

describe('parseNaturalLanguage — multiple events', () => {
  it('parses two events joined by "and"', () => {
    const result = parseNaturalLanguage('call today 3pm and meeting tomorrow 5pm');
    expect(result.events).toHaveLength(2);
  });

  it('first event has correct date and time', () => {
    const result = parseNaturalLanguage('call today 3pm and meeting tomorrow 5pm');
    expect(result.events[0].date).toBe(todayISO());
    expect(result.events[0].time).toBe('15:00');
  });

  it('second event has correct date and time', () => {
    const result = parseNaturalLanguage('call today 3pm and meeting tomorrow 5pm');
    expect(result.events[1].date).toBe(offsetISO(1));
    expect(result.events[1].time).toBe('17:00');
  });

  it('extracts correct titles for both events', () => {
    const result = parseNaturalLanguage('call today 3pm and meeting tomorrow 5pm');
    expect(result.events[0].title).toBe('call');
    expect(result.events[1].title).toBe('meeting');
  });

  it('falls back to single event when only one segment has a valid date', () => {
    // "standup" alone has no date, so the whole string is treated as one event
    const result = parseNaturalLanguage('standup and meeting tomorrow');
    expect(result.events).toHaveLength(1);
    expect(result.events[0].date).toBe(offsetISO(1));
  });

  it('returns no warning for successfully parsed multiple events', () => {
    const result = parseNaturalLanguage('call today 3pm and meeting tomorrow 5pm');
    expect(result.warning).toBeUndefined();
  });
});
