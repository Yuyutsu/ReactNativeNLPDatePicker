/**
 * NLPCalendar — Example App
 *
 * Demonstrates how to use the react-native-nlp-calendar package:
 *   • Live text input → instant NLP parsing → rendered calendar events
 *   • Tap a preset phrase to populate the input quickly
 *   • Raw parsed JSON shown at the bottom for debugging / integration
 */

import React, { useCallback, useState } from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CalendarEvent, NLPCalendar } from 'react-native-nlp-calendar';

// ---------------------------------------------------------------------------
// Preset example phrases shown as quick-fill chips
// ---------------------------------------------------------------------------
const EXAMPLES: string[] = [
  'Book meeting tomorrow at 10am',
  'Team sync next Friday at 3pm',
  'Doctor appointment March 15 at 9:30am',
  'Dentist in 5 days',
  'Stand-up today at 14:00',
  'Flight 2025-06-20',
  'Review 15 April at 11am',
];

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export default function App(): React.ReactElement {
  const [text, setText] = useState('');
  const [parsedEvents, setParsedEvents] = useState<ReadonlyArray<CalendarEvent>>([]);

  const handleParsed = useCallback((events: ReadonlyArray<CalendarEvent>) => {
    setParsedEvents(events);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.title}>📅 NLPCalendar</Text>
          <Text style={styles.subtitle}>
            Type a natural language event description and watch it parse in real time.
          </Text>
        </View>

        {/* ── Text input ── */}
        <Text style={styles.label}>Event description</Text>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="e.g. Meeting tomorrow at 3pm"
          placeholderTextColor="#aaa"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="done"
          clearButtonMode="while-editing"
        />

        {/* ── NLPCalendar component ── */}
        <Text style={styles.label}>Parsed result</Text>
        <View style={styles.resultBox}>
          <NLPCalendar text={text} onParsed={handleParsed} />
        </View>

        {/* ── Example chips ── */}
        <Text style={styles.label}>Try an example</Text>
        <View style={styles.chipRow}>
          {EXAMPLES.map((example) => (
            <TouchableOpacity
              key={example}
              style={styles.chip}
              onPress={() => setText(example)}
              activeOpacity={0.7}
            >
              <Text style={styles.chipText}>{example}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Raw JSON debug view ── */}
        {parsedEvents.length > 0 && (
          <View style={styles.debugBox}>
            <Text style={styles.debugTitle}>Raw CalendarEvent data</Text>
            <Text style={styles.debugText}>
              {JSON.stringify(parsedEvents, null, 2)}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    marginTop: Platform.OS === 'android' ? 24 : 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    marginBottom: 6,
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#dde3ff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 16,
    color: '#1a1a2e',
    backgroundColor: '#fafbff',
  },
  resultBox: {
    borderWidth: 1,
    borderColor: '#e8ecff',
    borderRadius: 10,
    minHeight: 56,
    backgroundColor: '#fafbff',
    justifyContent: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#eef1ff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#d0d8ff',
  },
  chipText: {
    fontSize: 13,
    color: '#4a6cf7',
    fontWeight: '500',
  },
  debugBox: {
    marginTop: 24,
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 16,
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7a7fa8',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  debugText: {
    fontSize: 13,
    color: '#a8d8a8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 20,
  },
});
