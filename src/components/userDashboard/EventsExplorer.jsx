import React, { useEffect, useState } from 'react';
import { getPublicEvents } from '../../api/events';
import { createBooking } from '../../api/bookings';

export default function EventsExplorer() {
  const [events, setEvents] = useState([]);
  const [bookingStatus, setBookingStatus] = useState({});

  useEffect(() => {
    getPublicEvents().then(setEvents);
  }, []);

  const handleBook = async (eventId) => {
    setBookingStatus((prev) => ({ ...prev, [eventId]: 'loading' }));
    try {
      await createBooking({ eventId });
      setBookingStatus((prev) => ({ ...prev, [eventId]: 'booked' }));
    } catch {
      setBookingStatus((prev) => ({ ...prev, [eventId]: 'error' }));
    }
  };

  return (
    <div className="events-explorer">
      <h2>Explore Events</h2>
      {events.length === 0 ? (
        <div>No events available.</div>
      ) : (
        <ul>
          {events.map((event) => (
            <li key={event._id || event.id} style={{ marginBottom: '1rem' }}>
              <div><strong>{event.name}</strong></div>
              <div>{event.date}</div>
              <button
                onClick={() => handleBook(event._id || event.id)}
                disabled={bookingStatus[event._id || event.id] === 'booked' || bookingStatus[event._id || event.id] === 'loading'}
              >
                {bookingStatus[event._id || event.id] === 'booked'
                  ? 'Booked'
                  : bookingStatus[event._id || event.id] === 'loading'
                  ? 'Booking...'
                  : 'Book Event'}
              </button>
              {bookingStatus[event._id || event.id] === 'error' && (
                <span style={{ color: 'red', marginLeft: 8 }}>Booking failed</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
