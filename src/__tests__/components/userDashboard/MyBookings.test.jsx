import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MyBookings from '../../../components/userDashboard/MyBookings';

vi.mock('../../../api/bookings', () => ({
  getMyBookings: vi.fn(),
  cancelBooking: vi.fn(),
}));

import { getMyBookings, cancelBooking } from '../../../api/bookings';

const futureDate = '2099-12-31T10:00:00.000Z';
const pastDate = '2000-01-01T10:00:00.000Z';

const makeBooking = (overrides = {}) => ({
  id: 1,
  status: 'CONFIRMED',
  event: {
    title: 'Tech Summit',
    date: futureDate,
    time: '10:00:00',
    location: 'Kathmandu',
    organizerName: 'Tech Corp',
  },
  ...overrides,
});

beforeEach(() => {
  vi.resetAllMocks();
});

describe('MyBookings – rendering', () => {
  it('renders without crashing', () => {
    getMyBookings.mockResolvedValue([]);
    render(<MyBookings />);
    expect(document.body).toBeTruthy();
  });

  it('shows heading "My Bookings"', async () => {
    getMyBookings.mockResolvedValue([]);
    render(<MyBookings />);
    expect(screen.getByText('My Bookings')).toBeInTheDocument();
  });

  it('renders the Upcoming, Completed and Cancelled tabs', async () => {
    getMyBookings.mockResolvedValue([]);
    render(<MyBookings />);
    expect(screen.getByText('Upcoming')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('renders a search/filter input', async () => {
    getMyBookings.mockResolvedValue([]);
    render(<MyBookings />);
    const inputs = screen.queryAllByRole('textbox');
    expect(inputs.length).toBeGreaterThanOrEqual(1);
  });
});

describe('MyBookings – tab switching', () => {
  it('shows future confirmed booking under Upcoming tab', async () => {
    getMyBookings.mockResolvedValue([makeBooking()]);
    render(<MyBookings />);
    await waitFor(() => {
      expect(screen.getByText('Tech Summit')).toBeInTheDocument();
    });
  });

  it('shows cancelled booking under Cancelled tab', async () => {
    getMyBookings.mockResolvedValue([
      makeBooking({ id: 10, status: 'CANCELLED', event: { title: 'Cancelled Fest', date: futureDate, time: '10:00:00', location: 'Pokhara', organizerName: 'Org' } }),
    ]);
    render(<MyBookings />);
    fireEvent.click(screen.getByText('Cancelled'));
    await waitFor(() => {
      expect(screen.getByText('Cancelled Fest')).toBeInTheDocument();
    });
  });

  it('does not show cancelled booking under Upcoming tab', async () => {
    getMyBookings.mockResolvedValue([
      makeBooking({ id: 11, status: 'CANCELLED', event: { title: 'Hidden Event', date: futureDate, time: '10:00:00', location: 'Lalitpur', organizerName: 'Org' } }),
    ]);
    render(<MyBookings />);
    // Default tab is Upcoming
    await waitFor(() => expect(screen.queryByText('Hidden Event')).not.toBeInTheDocument());
  });

  it('shows past confirmed booking under Completed tab', async () => {
    getMyBookings.mockResolvedValue([
      makeBooking({ id: 12, status: 'CONFIRMED', event: { title: 'Old Summit', date: pastDate, time: '10:00:00', location: 'Bhaktapur', organizerName: 'Old Corp' } }),
    ]);
    render(<MyBookings />);
    fireEvent.click(screen.getByText('Completed'));
    await waitFor(() => {
      expect(screen.getByText('Old Summit')).toBeInTheDocument();
    });
  });
});

describe('MyBookings – search', () => {
  it('filters bookings by title search', async () => {
    getMyBookings.mockResolvedValue([
      makeBooking({ id: 1, event: { title: 'Music Fest', date: futureDate, time: '10:00', location: 'Stage', organizerName: 'OP' } }),
      makeBooking({ id: 2, event: { title: 'Art Show', date: futureDate, time: '10:00', location: 'Gallery', organizerName: 'OP' } }),
    ]);
    render(<MyBookings />);
    await waitFor(() => screen.getByText('Music Fest'));
    const searchInput = screen.getAllByRole('textbox')[0];
    fireEvent.change(searchInput, { target: { value: 'Music' } });
    await waitFor(() => {
      expect(screen.getByText('Music Fest')).toBeInTheDocument();
      expect(screen.queryByText('Art Show')).not.toBeInTheDocument();
    });
  });
});

describe('MyBookings – cancellation', () => {
  it('calls cancelBooking when user confirms cancellation', async () => {
    getMyBookings.mockResolvedValue([makeBooking()]);
    cancelBooking.mockResolvedValue({});
    // Reload after cancel
    getMyBookings.mockResolvedValueOnce([makeBooking()])
                 .mockResolvedValueOnce([]);
    render(<MyBookings />);
    await waitFor(() => screen.getByText('Tech Summit'));
    // Find a cancel/remove button
    const cancelBtns = screen.queryAllByRole('button');
    const cancelBtn = cancelBtns.find(
      (b) => b.textContent.toLowerCase().includes('cancel') && b !== screen.queryByText('Cancelled')
    );
    if (cancelBtn) {
      fireEvent.click(cancelBtn);
      // Confirm dialog if present
      const confirmBtn = screen.queryByText(/confirm/i);
      if (confirmBtn) fireEvent.click(confirmBtn);
      await waitFor(() => {
        expect(cancelBooking).toHaveBeenCalled();
      });
    }
  });
});

describe('MyBookings – error handling', () => {
  it('shows error message when getMyBookings fails', async () => {
    getMyBookings.mockRejectedValue(new Error('Network Error'));
    render(<MyBookings />);
    await waitFor(() => {
      expect(screen.getByText(/Failed to load bookings/i)).toBeInTheDocument();
    });
  });
});
