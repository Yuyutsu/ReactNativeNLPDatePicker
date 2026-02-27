import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
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

// ---------------------------------------------------------------------------
// Input field
// ---------------------------------------------------------------------------

describe('NLPCalendar — input field', () => {
  it('renders a TextInput with the default placeholder', () => {
    render(<NLPCalendar />);
    expect(screen.getByPlaceholderText('Type a date or event…')).toBeTruthy();
  });

  it('accepts a custom placeholder via prop', () => {
    render(<NLPCalendar placeholder="Enter date…" />);
    expect(screen.getByPlaceholderText('Enter date…')).toBeTruthy();
  });

  it('initialises the input with the text prop', () => {
    render(<NLPCalendar text="Meeting tomorrow" />);
    expect(screen.getByDisplayValue('Meeting tomorrow')).toBeTruthy();
  });

  it('re-parses and shows events when the user types in the input', () => {
    render(<NLPCalendar />);
    fireEvent.changeText(screen.getByPlaceholderText('Type a date or event…'), 'Gym today');
    const today = new Date().toISOString().slice(0, 10);
    expect(screen.getByText(today)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Calendar icon and date-picker modal
// ---------------------------------------------------------------------------

describe('NLPCalendar — calendar icon and picker modal', () => {
  it('renders the calendar icon button', () => {
    render(<NLPCalendar />);
    expect(screen.getByLabelText('Open date picker')).toBeTruthy();
  });

  it('opens the date picker modal when the calendar icon is pressed', () => {
    render(<NLPCalendar text="Meeting today" />);
    fireEvent.press(screen.getByLabelText('Open date picker'));
    expect(screen.getByText('Done')).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeTruthy();
  });

  it('closes the picker when Cancel is pressed', () => {
    render(<NLPCalendar text="Meeting today" />);
    fireEvent.press(screen.getByLabelText('Open date picker'));
    fireEvent.press(screen.getByText('Cancel'));
    expect(screen.queryByText('Done')).toBeNull();
  });

  it('shows the current month and year in the picker header', () => {
    const MONTH_NAMES = ['January','February','March','April','May','June',
      'July','August','September','October','November','December'];
    render(<NLPCalendar text="Meeting today" />);
    fireEvent.press(screen.getByLabelText('Open date picker'));
    expect(screen.getByText(new RegExp(MONTH_NAMES[new Date().getMonth()]))).toBeTruthy();
  });

  it('navigates to the previous month without crashing', () => {
    render(<NLPCalendar text="Meeting today" />);
    fireEvent.press(screen.getByLabelText('Open date picker'));
    fireEvent.press(screen.getByLabelText('Previous month'));
    expect(screen.getByText('Done')).toBeTruthy();
  });

  it('navigates to the next month without crashing', () => {
    render(<NLPCalendar text="Meeting today" />);
    fireEvent.press(screen.getByLabelText('Open date picker'));
    fireEvent.press(screen.getByLabelText('Next month'));
    expect(screen.getByText('Done')).toBeTruthy();
  });

  it('calls onDateChange when a single date is confirmed', () => {
    const onDateChange = jest.fn();
    render(<NLPCalendar text="Meeting today" onDateChange={onDateChange} />);
    fireEvent.press(screen.getByLabelText('Open date picker'));
    fireEvent.press(screen.getByText('Done'));
    expect(onDateChange).toHaveBeenCalledWith(
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    );
  });

  it('does not call onDateChange when Done is pressed with no date selected', () => {
    const onDateChange = jest.fn();
    // No text prop → picker opens with no pre-selection
    render(<NLPCalendar onDateChange={onDateChange} />);
    fireEvent.press(screen.getByLabelText('Open date picker'));
    fireEvent.press(screen.getByText('Done'));
    expect(onDateChange).not.toHaveBeenCalled();
  });

  it('calls onDateRangeChange when two dates are selected and Done is pressed', () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day1 = `${year}-${month}-01`;
    const day10 = `${year}-${month}-10`;
    const onDateRangeChange = jest.fn();
    render(<NLPCalendar onDateRangeChange={onDateRangeChange} />);
    fireEvent.press(screen.getByLabelText('Open date picker'));
    fireEvent.press(screen.getByLabelText(`Select ${day1}`));
    fireEvent.press(screen.getByLabelText(`Select ${day10}`));
    fireEvent.press(screen.getByText('Done'));
    expect(onDateRangeChange).toHaveBeenCalledWith({ start: day1, end: day10 });
  });
});
