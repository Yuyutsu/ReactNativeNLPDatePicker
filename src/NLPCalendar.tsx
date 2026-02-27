/**
 * NLPCalendar — React Native component.
 *
 * Responsibilities (ONLY):
 *  1. Accept `text`, `onParsed`, `onDateChange`, `onDateRangeChange`, and `placeholder` props.
 *  2. Render a TextInput for natural language input with a calendar icon button.
 *  3. Delegate all parsing to the parser layer.
 *  4. Render the resulting events using React Native primitives.
 *  5. Provide a date-picker modal (opened via the calendar icon) that supports
 *     single-date and date-range selection.
 *  6. Surface warnings/errors in a minimal, non-crashing way.
 *
 * This component intentionally has zero knowledge of HOW dates are parsed.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { parseNaturalLanguage } from './parser';
import type { CalendarEvent, DateRange, NLPCalendarProps } from './types';

// ---------------------------------------------------------------------------
// Calendar helpers
// ---------------------------------------------------------------------------

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;

const getDaysInMonth = (year: number, month: number): number =>
  new Date(year, month + 1, 0).getDate();

const getFirstDayOfMonth = (year: number, month: number): number =>
  new Date(year, month, 1).getDay();

const padTwo = (n: number): string => String(n).padStart(2, '0');

const formatDateStr = (year: number, month: number, day: number): string =>
  `${year}-${padTwo(month + 1)}-${padTwo(day)}`;

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
 * Renders a natural-language date input with a calendar icon.
 * Tapping the icon opens an inline date-picker modal that supports
 * single-date and date-range selection.
 *
 * @example
 * ```tsx
 * <NLPCalendar
 *   text="Team sync tomorrow at 3pm"
 *   onParsed={(events) => console.log(events)}
 *   onDateChange={(date) => console.log(date)}
 *   onDateRangeChange={(range) => console.log(range)}
 * />
 * ```
 */
const NLPCalendar: React.FC<NLPCalendarProps> = ({
  text = '',
  placeholder = 'Type a date or event…',
  onParsed,
  onDateChange,
  onDateRangeChange,
}) => {
  const [inputText, setInputText] = useState<string>(text);
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const [pickerYear, setPickerYear] = useState<number>(new Date().getFullYear());
  const [pickerMonth, setPickerMonth] = useState<number>(new Date().getMonth());
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);

  const result = parseNaturalLanguage(inputText);

  useEffect(() => {
    if (inputText.trim().length === 0) return;
    onParsed?.(result.events);
  }, [inputText, result.events, onParsed]);

  // Open the picker and pre-navigate to the NLP-parsed date (if any).
  const openPicker = useCallback(() => {
    const parsedDate = result.events[0]?.date ?? null;
    const match = parsedDate?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      setPickerYear(Number(match[1]));
      setPickerMonth(Number(match[2]) - 1);
      setRangeStart(parsedDate);
    } else {
      const now = new Date();
      setPickerYear(now.getFullYear());
      setPickerMonth(now.getMonth());
      setRangeStart(null);
    }
    setRangeEnd(null);
    setShowPicker(true);
  }, [result.events]);

  /**
   * Tap logic:
   *  - If no selection or range already complete → start a new selection.
   *  - If only rangeStart is set → complete the range (swap dates if needed),
   *    or deselect if the same date is tapped again.
   */
  const handleDayPress = (dateStr: string): void => {
    if (rangeStart === null || rangeEnd !== null) {
      setRangeStart(dateStr);
      setRangeEnd(null);
    } else if (dateStr === rangeStart) {
      setRangeStart(null);
    } else if (dateStr < rangeStart) {
      setRangeEnd(rangeStart);
      setRangeStart(dateStr);
    } else {
      setRangeEnd(dateStr);
    }
  };

  const handleConfirm = useCallback(() => {
    if (rangeStart !== null && rangeEnd !== null) {
      const range: DateRange = { start: rangeStart, end: rangeEnd };
      onDateRangeChange?.(range);
    } else if (rangeStart !== null) {
      onDateChange?.(rangeStart);
    }
    setShowPicker(false);
  }, [rangeStart, rangeEnd, onDateChange, onDateRangeChange]);

  const prevMonth = useCallback(() => {
    setPickerMonth((m) => {
      if (m === 0) {
        setPickerYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setPickerMonth((m) => {
      if (m === 11) {
        setPickerYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, []);

  const renderCalendarDays = (): React.ReactElement[] => {
    const daysInMonth = getDaysInMonth(pickerYear, pickerMonth);
    const firstDay = getFirstDayOfMonth(pickerYear, pickerMonth);

    // Build rows as arrays of day numbers (0 = empty padding cell).
    const totalCells = firstDay + daysInMonth;
    const grid: number[][] = [];
    let row: number[] = [];

    for (let i = 0; i < totalCells; i++) {
      row.push(i < firstDay ? 0 : i - firstDay + 1);
      if (row.length === 7) {
        grid.push(row);
        row = [];
      }
    }
    if (row.length > 0) {
      while (row.length < 7) row.push(0);
      grid.push(row);
    }

    return grid.map((weekRow, ri) => (
      <View key={ri} style={styles.calendarRow}>
        {weekRow.map((day, ci) => {
          if (day === 0) {
            return <View key={ci} style={styles.dayCell} />;
          }
          const dateStr = formatDateStr(pickerYear, pickerMonth, day);
          const isStart = dateStr === rangeStart;
          const isEnd = dateStr === rangeEnd;
          const isInRange: boolean =
            rangeStart !== null &&
            rangeEnd !== null &&
            dateStr > rangeStart &&
            dateStr < rangeEnd;
          const isSelected = isStart || isEnd;

          return (
            <TouchableOpacity
              key={ci}
              style={[
                styles.dayCell,
                isInRange ? styles.dayInRange : undefined,
                isSelected ? styles.daySelected : undefined,
              ]}
              onPress={() => handleDayPress(dateStr)}
              accessibilityLabel={`Select ${dateStr}`}
            >
              <Text style={[styles.dayText, isSelected ? styles.dayTextSelected : undefined]}>
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      {/* NLP text input row with calendar icon */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder={placeholder}
          placeholderTextColor="#aaa"
        />
        <TouchableOpacity
          onPress={openPicker}
          style={styles.calendarIconButton}
          accessibilityLabel="Open date picker"
        >
          <Text style={styles.calendarIcon}>📅</Text>
        </TouchableOpacity>
      </View>

      {/* Parsed events list */}
      {result.events.length === 0 ? (
        <EmptyState warning={result.warning} />
      ) : (
        result.events.map((event) => (
          <EventItem key={`${event.date}-${event.title}`} event={event} />
        ))
      )}

      {/* Date picker modal */}
      <Modal
        visible={showPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerContainer}>
            {/* Month / year navigation */}
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={prevMonth} style={styles.navButton} accessibilityLabel="Previous month">
                <Text style={styles.navButtonText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>
                {MONTH_NAMES[pickerMonth]} {pickerYear}
              </Text>
              <TouchableOpacity onPress={nextMonth} style={styles.navButton} accessibilityLabel="Next month">
                <Text style={styles.navButtonText}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Day-of-week labels */}
            <View style={styles.calendarRow}>
              {DAY_LABELS.map((label) => (
                <View key={label} style={styles.dayCell}>
                  <Text style={styles.dayLabel}>{label}</Text>
                </View>
              ))}
            </View>

            {/* Calendar day grid */}
            {renderCalendarDays()}

            {/* Selected date / range display */}
            {rangeStart !== null && (
              <Text style={styles.rangeInfo}>
                {rangeStart}
                {rangeEnd !== null ? ` → ${rangeEnd}` : ''}
              </Text>
            )}

            {/* Footer: Cancel / Done */}
            <View style={styles.pickerFooter}>
              <TouchableOpacity
                onPress={() => setShowPicker(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirm}
                style={styles.confirmButton}
              >
                <Text style={styles.confirmText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  // Input row
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  textInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: '#1a1a2e',
  },
  calendarIconButton: {
    padding: 6,
    marginLeft: 4,
  },
  calendarIcon: {
    fontSize: 20,
  },
  // Event cards
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
  // Modal overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '90%',
  },
  // Picker header
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  navButton: {
    padding: 8,
  },
  navButtonText: {
    fontSize: 22,
    color: '#4a6cf7',
  },
  // Calendar grid
  calendarRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
  },
  dayText: {
    fontSize: 14,
    color: '#1a1a2e',
  },
  daySelected: {
    backgroundColor: '#4a6cf7',
    borderRadius: 20,
  },
  dayTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  dayInRange: {
    backgroundColor: '#dde4ff',
  },
  // Range info
  rangeInfo: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 13,
    color: '#4a6cf7',
    fontWeight: '500',
  },
  // Footer
  pickerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  cancelText: {
    fontSize: 15,
    color: '#555',
  },
  confirmButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 6,
    backgroundColor: '#4a6cf7',
  },
  confirmText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
});

export default NLPCalendar;
