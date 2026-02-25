import React from 'react';
import { render, screen } from '@testing-library/react-native';
import NLPCalendar from '../NLPCalendar';

describe('NLPCalendar component', () => {
  it('renders without crashing for valid input', () => {
    expect(() =>
      render(<NLPCalendar text="Meeting tomorrow at 10am" />),
    ).not.toThrow();
  });

  it('displays the event title when a date is recognised', () => {
    render(<NLPCalendar text="Book meeting tomorrow at 10am" />);
    expect(screen.getByText('Book meeting')).toBeTruthy();
  });

  it('displays the event date', () => {
    render(<NLPCalendar text="Meeting today" />);
    const today = new Date().toISOString().slice(0, 10);
    expect(screen.getByText(today)).toBeTruthy();
  });

  it('shows the time when provided', () => {
    render(<NLPCalendar text="Call today at 3pm" />);
    expect(screen.getByText(/15:00/)).toBeTruthy();
  });

  it('renders empty state with warning for unrecognised text', () => {
    render(<NLPCalendar text="no date here" />);
    expect(screen.getByText(/Could not recognise/i)).toBeTruthy();
  });

  it('renders empty state for whitespace-only text', () => {
    render(<NLPCalendar text="   " />);
    expect(screen.getByText(/No events found/i)).toBeTruthy();
  });

  it('calls onParsed with events when date is recognised', () => {
    const onParsed = jest.fn();
    render(<NLPCalendar text="Gym tomorrow" onParsed={onParsed} />);
    expect(onParsed).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) }),
      ]),
    );
  });

  it('calls onParsed with empty array when date is not recognised', () => {
    const onParsed = jest.fn();
    render(<NLPCalendar text="gibberish without a date" onParsed={onParsed} />);
    expect(onParsed).toHaveBeenCalledWith([]);
  });

  it('does not call onParsed when text is empty', () => {
    const onParsed = jest.fn();
    render(<NLPCalendar text="" onParsed={onParsed} />);
    expect(onParsed).not.toHaveBeenCalled();
  });

  it('does not crash for very long input', () => {
    const longText = 'word '.repeat(500) + 'tomorrow';
    expect(() => render(<NLPCalendar text={longText} />)).not.toThrow();
  });
});
