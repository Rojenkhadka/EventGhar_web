import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BookingConfirmModal from '../../components/BookingConfirmModal';

const baseEvent = {
  title: 'Annual Tech Meetup',
  organizerName: 'Tech Corp',
  maxAttendees: 100,
  ticketsSold: 20,
};

describe('BookingConfirmModal', () => {
  // ── Visibility ──────────────────────────────────────────────────────────────

  it('renders nothing when open=false', () => {
    const { container } = render(
      <BookingConfirmModal event={baseEvent} open={false} onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when event is null', () => {
    const { container } = render(
      <BookingConfirmModal event={null} open={true} onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders modal when open=true and event is provided', () => {
    render(
      <BookingConfirmModal event={baseEvent} open={true} onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.getByText('Confirm Booking')).toBeInTheDocument();
  });

  // ── Content ─────────────────────────────────────────────────────────────────

  it('displays the event title inside the message', () => {
    render(
      <BookingConfirmModal event={baseEvent} open={true} onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.getByText(/Annual Tech Meetup/)).toBeInTheDocument();
  });

  it('displays the organizer name', () => {
    render(
      <BookingConfirmModal event={baseEvent} open={true} onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.getByText(/Tech Corp/)).toBeInTheDocument();
  });

  it('shows available seat count when maxAttendees is set', () => {
    render(
      <BookingConfirmModal event={baseEvent} open={true} onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    // 100 - 20 = 80 available
    expect(screen.getByText(/80 \/ 100 seats available/)).toBeInTheDocument();
  });

  it('shows warning when seats are low (≤10 remaining)', () => {
    const lowSeatsEvent = { ...baseEvent, maxAttendees: 100, ticketsSold: 93 };
    render(
      <BookingConfirmModal event={lowSeatsEvent} open={true} onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.getByText(/7 \/ 100 seats available/)).toBeInTheDocument();
  });

  it('shows sold out message when all seats are taken', () => {
    const soldOutEvent = { ...baseEvent, maxAttendees: 100, ticketsSold: 100 };
    render(
      <BookingConfirmModal event={soldOutEvent} open={true} onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.getByText(/All tickets sold out/)).toBeInTheDocument();
  });

  it('shows error message when error prop is provided', () => {
    render(
      <BookingConfirmModal
        event={baseEvent}
        open={true}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        error="Payment failed. Please try again."
      />
    );
    expect(screen.getByText('Payment failed. Please try again.')).toBeInTheDocument();
  });

  // ── Buttons ──────────────────────────────────────────────────────────────────

  it('calls onConfirm when Confirm button is clicked', () => {
    const onConfirm = vi.fn();
    render(
      <BookingConfirmModal event={baseEvent} open={true} onConfirm={onConfirm} onCancel={vi.fn()} />
    );
    fireEvent.click(screen.getByText('Confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when Cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(
      <BookingConfirmModal event={baseEvent} open={true} onConfirm={vi.fn()} onCancel={onCancel} />
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows "Booking..." text when loading=true', () => {
    render(
      <BookingConfirmModal event={baseEvent} open={true} onConfirm={vi.fn()} onCancel={vi.fn()} loading={true} />
    );
    expect(screen.getByText('Booking...')).toBeInTheDocument();
  });

  it('disables both buttons when loading=true', () => {
    render(
      <BookingConfirmModal event={baseEvent} open={true} onConfirm={vi.fn()} onCancel={vi.fn()} loading={true} />
    );
    expect(screen.getByText('Cancel')).toBeDisabled();
    expect(screen.getByText('Booking...')).toBeDisabled();
  });

  it('shows "Sold Out" text and disables Confirm when sold out', () => {
    const soldOutEvent = { ...baseEvent, maxAttendees: 50, ticketsSold: 50 };
    render(
      <BookingConfirmModal event={soldOutEvent} open={true} onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.getByText('Sold Out')).toBeDisabled();
  });

  it('does not show seat count section when maxAttendees is 0', () => {
    const unlimitedEvent = { ...baseEvent, maxAttendees: 0, ticketsSold: 0 };
    render(
      <BookingConfirmModal event={unlimitedEvent} open={true} onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.queryByText(/seats available/)).not.toBeInTheDocument();
  });
});
