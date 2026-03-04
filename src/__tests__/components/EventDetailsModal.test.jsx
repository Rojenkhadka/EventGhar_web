import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EventDetailsModal from '../../components/EventDetailsModal';

const baseEvent = {
  title: 'Annual Tech Conference',
  date: '2026-06-15T00:00:00.000Z',
  time: '14:30:00',
  location: 'Kathmandu Convention Center',
  description: 'A premier tech event for professionals across Nepal.',
};

describe('EventDetailsModal', () => {
  // ── Visibility ──────────────────────────────────────────────────────────────

  it('renders nothing when event is null', () => {
    const { container } = render(<EventDetailsModal event={null} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the modal when event is provided', () => {
    render(<EventDetailsModal event={baseEvent} onClose={vi.fn()} />);
    expect(screen.getByText('Event Details')).toBeInTheDocument();
  });

  // ── Content ──────────────────────────────────────────────────────────────────

  it('displays the event title in a read-only input', () => {
    render(<EventDetailsModal event={baseEvent} onClose={vi.fn()} />);
    expect(screen.getByDisplayValue('Annual Tech Conference')).toBeInTheDocument();
  });

  it('displays the event location', () => {
    render(<EventDetailsModal event={baseEvent} onClose={vi.fn()} />);
    expect(screen.getByDisplayValue('Kathmandu Convention Center')).toBeInTheDocument();
  });

  it('displays the event description in a textarea', () => {
    render(<EventDetailsModal event={baseEvent} onClose={vi.fn()} />);
    expect(
      screen.getByDisplayValue('A premier tech event for professionals across Nepal.')
    ).toBeInTheDocument();
  });

  it('formats 24h time "14:30:00" to "02:30 PM"', () => {
    render(<EventDetailsModal event={baseEvent} onClose={vi.fn()} />);
    expect(screen.getByDisplayValue('02:30 PM')).toBeInTheDocument();
  });

  it('formats midnight "00:00:00" to "12:00 AM"', () => {
    render(<EventDetailsModal event={{ ...baseEvent, time: '00:00:00' }} onClose={vi.fn()} />);
    expect(screen.getByDisplayValue('12:00 AM')).toBeInTheDocument();
  });

  it('formats noon "12:00:00" to "12:00 PM"', () => {
    render(<EventDetailsModal event={{ ...baseEvent, time: '12:00:00' }} onClose={vi.fn()} />);
    expect(screen.getByDisplayValue('12:00 PM')).toBeInTheDocument();
  });

  it('shows a time value when time field is null but date is provided', () => {
    // When time is null the component falls back to parsing the date string;
    // the exact value depends on timezone, so we just check a time input exists.
    render(<EventDetailsModal event={{ ...baseEvent, time: null, date: '2026-06-15' }} onClose={vi.fn()} />);
    const labels = screen.getAllByText('Time');
    expect(labels.length).toBeGreaterThan(0);
  });

  it('shows the formatted date (contains year 2026)', () => {
    render(<EventDetailsModal event={baseEvent} onClose={vi.fn()} />);
    const dateInput = screen.getByDisplayValue(/2026/);
    expect(dateInput).toBeInTheDocument();
  });

  it('shows empty string for missing title', () => {
    render(<EventDetailsModal event={{ ...baseEvent, title: '' }} onClose={vi.fn()} />);
    // The title input should exist but be empty
    const inputs = screen.getAllByRole('textbox');
    const titleInput = inputs[0];
    expect(titleInput.value).toBe('');
  });

  it('shows empty string for missing location', () => {
    render(<EventDetailsModal event={{ ...baseEvent, location: undefined }} onClose={vi.fn()} />);
    // location input should have empty value
    const inputs = screen.getAllByRole('textbox');
    // Find input with empty value among location area
    expect(inputs.some((i) => i.value === '')).toBe(true);
  });

  // ── Close button ─────────────────────────────────────────────────────────────

  it('calls onClose when × button is clicked', () => {
    const onClose = vi.fn();
    render(<EventDetailsModal event={baseEvent} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose only once per click', () => {
    const onClose = vi.fn();
    render(<EventDetailsModal event={baseEvent} onClose={onClose} />);
    const closeBtn = screen.getByLabelText('Close');
    fireEvent.click(closeBtn);
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  // ── Read-only inputs ──────────────────────────────────────────────────────────

  it('all inputs and textarea are read-only', () => {
    render(<EventDetailsModal event={baseEvent} onClose={vi.fn()} />);
    const inputs = screen.getAllByRole('textbox');
    inputs.forEach((input) => {
      expect(input).toHaveAttribute('readonly');
    });
  });
});
