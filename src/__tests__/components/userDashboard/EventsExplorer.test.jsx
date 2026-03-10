import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EventsExplorer from '../../../components/userDashboard/EventsExplorer';

vi.mock('../../../api/events', () => ({
  getPublicEvents: vi.fn(),
}));
vi.mock('../../../api/bookings', () => ({
  createBooking: vi.fn(),
}));

import { getPublicEvents } from '../../../api/events';
import { createBooking } from '../../../api/bookings';

const sampleEvents = [
  { id: 1, name: 'Music Fest', date: '2026-04-10' },
  { id: 2, name: 'Food Carnival', date: '2026-05-15' },
];

beforeEach(() => {
  vi.resetAllMocks();
});

describe('EventsExplorer', () => {
  it('renders without crashing', () => {
    getPublicEvents.mockResolvedValue([]);
    render(<EventsExplorer />);
    expect(document.body).toBeTruthy();
  });

  it('shows "No events available" when events list is empty', async () => {
    getPublicEvents.mockResolvedValue([]);
    render(<EventsExplorer />);
    await waitFor(() => {
      expect(screen.getByText('No events available.')).toBeInTheDocument();
    });
  });

  it('renders event names after loading', async () => {
    getPublicEvents.mockResolvedValue(sampleEvents);
    render(<EventsExplorer />);
    await waitFor(() => {
      expect(screen.getByText('Music Fest')).toBeInTheDocument();
      expect(screen.getByText('Food Carnival')).toBeInTheDocument();
    });
  });

  it('renders a "Book Event" button for each event', async () => {
    getPublicEvents.mockResolvedValue(sampleEvents);
    render(<EventsExplorer />);
    await waitFor(() => {
      const buttons = screen.getAllByText('Book Event');
      expect(buttons).toHaveLength(2);
    });
  });

  it('changes button text to "Booking..." during booking', async () => {
    getPublicEvents.mockResolvedValue([sampleEvents[0]]);
    createBooking.mockImplementation(() => new Promise(() => {})); // never resolves
    render(<EventsExplorer />);
    await waitFor(() => screen.getByText('Book Event'));
    fireEvent.click(screen.getByText('Book Event'));
    expect(await screen.findByText('Booking...')).toBeInTheDocument();
  });

  it('changes button text to "Booked" after successful booking', async () => {
    getPublicEvents.mockResolvedValue([sampleEvents[0]]);
    createBooking.mockResolvedValue({ id: 99 });
    render(<EventsExplorer />);
    await waitFor(() => screen.getByText('Book Event'));
    fireEvent.click(screen.getByText('Book Event'));
    await waitFor(() => {
      expect(screen.getByText('Booked')).toBeInTheDocument();
    });
  });

  it('shows error message when booking fails', async () => {
    getPublicEvents.mockResolvedValue([sampleEvents[0]]);
    createBooking.mockRejectedValue(new Error('Server error'));
    render(<EventsExplorer />);
    await waitFor(() => screen.getByText('Book Event'));
    fireEvent.click(screen.getByText('Book Event'));
    await waitFor(() => {
      expect(screen.getByText('Booking failed')).toBeInTheDocument();
    });
  });

  it('disables the button after successful booking', async () => {
    getPublicEvents.mockResolvedValue([sampleEvents[0]]);
    createBooking.mockResolvedValue({ id: 99 });
    render(<EventsExplorer />);
    await waitFor(() => screen.getByText('Book Event'));
    fireEvent.click(screen.getByText('Book Event'));
    await waitFor(() => {
      expect(screen.getByText('Booked').closest('button')).toBeDisabled();
    });
  });

  it('handles getPublicEvents API error gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    getPublicEvents.mockRejectedValue(new Error('Network error'));
    render(<EventsExplorer />);
    await waitFor(() => {
      expect(screen.getByText('No events available.')).toBeInTheDocument();
    });
    consoleError.mockRestore();
  });

  it('renders event dates alongside names', async () => {
    getPublicEvents.mockResolvedValue([{ id: 1, name: 'Art Show', date: '2026-03-20' }]);
    render(<EventsExplorer />);
    await waitFor(() => {
      expect(screen.getByText('Art Show')).toBeInTheDocument();
      expect(screen.getByText('2026-03-20')).toBeInTheDocument();
    });
  });
});
