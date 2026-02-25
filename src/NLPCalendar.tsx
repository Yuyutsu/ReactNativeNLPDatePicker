/**
 * NLPCalendar — React Native component.
 *
 * Responsibilities (ONLY):
 *  1. Accept `text` and `onParsed` props.
 *  2. Delegate all parsing to the parser layer.
 *  3. Render the resulting events using React Native primitives.
 *  4. Surface warnings/errors in a minimal, non-crashing way.
 *
 * This component intentionally has zero knowledge of HOW dates are parsed.
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { parseNaturalLanguage } from './parser';
import type { CalendarEvent, NLPCalendarProps } from './types';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface EventItemProps {
  readonly event: CalendarEvent;
}

const EventItem: React.FC<EventItemProps> = ({ event }) => (
  <View style={styles.eventItem}>
    <Text style={styles.eventTitle}>{event.title}</Text>
    <Text style={styles.eventMeta}>
      {event.date}
      {event.time !== undefined ? ` · ${event.time}` : ''}
    </Text>
  </View>
);

interface EmptyStateProps {
  readonly warning?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ warning }) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyText}>
      {warning ?? 'No events found.'}
    </Text>
  </View>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Renders calendar events parsed from a natural language string.
 *
 * @example
 * ```tsx
 * <NLPCalendar
 *   text="Team sync tomorrow at 3pm"
 *   onParsed={(events) => console.log(events)}
 * />
 * ```
 */
const NLPCalendar: React.FC<NLPCalendarProps> = ({ text, onParsed }) => {
  const result = parseNaturalLanguage(text);

  useEffect(() => {
    if (text.trim().length === 0) return;
    onParsed?.(result.events);
  }, [text, result.events, onParsed]);

  return (
    <View style={styles.container}>
      {result.events.length === 0 ? (
        <EmptyState warning={result.warning} />
      ) : (
        result.events.map((event) => (
          <EventItem key={`${event.date}-${event.title}`} event={event} />
        ))
      )}
    </View>
  );
};

// ---------------------------------------------------------------------------
// Styles — minimal, no over-engineering
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  eventItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 6,
    borderRadius: 6,
    backgroundColor: '#f0f4ff',
    borderLeftWidth: 3,
    borderLeftColor: '#4a6cf7',
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  eventMeta: {
    fontSize: 13,
    color: '#555',
    marginTop: 2,
  },
  emptyState: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
});

export default NLPCalendar;
