import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardOverview from '../../../components/userDashboard/DashboardOverview';

// ── Mock API modules ──────────────────────────────────────────────────────────
vi.mock('../../../api/me', () => ({
  getMe: vi.fn(),
}));
vi.mock('../../../api/bookings', () => ({
  getMyBookings: vi.fn(),
}));

import { getMe } from '../../../api/me';
import { getMyBookings } from '../../../api/bookings';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('DashboardOverview', () => {
  it('renders without crashing', () => {
    getMe.mockResolvedValue(null);
    getMyBookings.mockResolvedValue([]);
    render(<DashboardOverview />);
    expect(document.body).toBeTruthy();
  });

  it('shows the user\'s name after loading', async () => {
    getMe.mockResolvedValue({ name: 'Rojen Khadka' });
    getMyBookings.mockResolvedValue([]);
    render(<DashboardOverview />);
    await waitFor(() => {
      expect(screen.getByText(/Welcome, Rojen Khadka!/)).toBeInTheDocument();
    });
  });

  it('falls back to "User" when user name is missing', async () => {
    getMe.mockResolvedValue({});
    getMyBookings.mockResolvedValue([]);
    render(<DashboardOverview />);
    await waitFor(() => {
      expect(screen.getByText(/Welcome, User!/)).toBeInTheDocument();
    });
  });

  it('displays total events booked count', async () => {
    getMe.mockResolvedValue({ name: 'Alice' });
    getMyBookings.mockResolvedValue([
      { id: 1, event: { name: 'Fest A' } },
      { id: 2, event: { name: 'Fest B' } },
    ]);
    render(<DashboardOverview />);
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('shows 0 when there are no bookings', async () => {
    getMe.mockResolvedValue({ name: 'Bob' });
    getMyBookings.mockResolvedValue([]);
    render(<DashboardOverview />);
    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  it('displays the name of the most recent booking', async () => {
    getMe.mockResolvedValue({ name: 'Carol' });
    getMyBookings.mockResolvedValue([
      { id: 1, event: { name: 'Recent Event' } },
      { id: 2, event: { name: 'Older Event' } },
    ]);
    render(<DashboardOverview />);
    await waitFor(() => {
      expect(screen.getByText('Recent Event')).toBeInTheDocument();
    });
  });

  it('falls back to eventName field when event.name is absent', async () => {
    getMe.mockResolvedValue({ name: 'Dave' });
    getMyBookings.mockResolvedValue([
      { id: 1, eventName: 'Fallback Event' },
    ]);
    render(<DashboardOverview />);
    await waitFor(() => {
      expect(screen.getByText('Fallback Event')).toBeInTheDocument();
    });
  });

  it('does not show "Recently Booked" section when bookings is empty', async () => {
    getMe.mockResolvedValue({ name: 'Eve' });
    getMyBookings.mockResolvedValue([]);
    render(<DashboardOverview />);
    await waitFor(() => expect(screen.getByText(/Welcome, Eve!/)).toBeInTheDocument());
    expect(screen.queryByText(/Recently Booked/)).not.toBeInTheDocument();
  });

  it('handles getMe API error gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    getMe.mockRejectedValue(new Error('Network error'));
    getMyBookings.mockResolvedValue([]);
    render(<DashboardOverview />);
    // Should not throw; user stays null → shows "User"
    await waitFor(() => {
      expect(screen.getByText(/Welcome, User!/)).toBeInTheDocument();
    });
    consoleError.mockRestore();
  });

  it('handles getMyBookings returning { bookings: [...] } shape', async () => {
    getMe.mockResolvedValue({ name: 'Frank' });
    getMyBookings.mockResolvedValue({ bookings: [{ id: 1, event: { name: 'Wrap Test' } }] });
    render(<DashboardOverview />);
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });
});
