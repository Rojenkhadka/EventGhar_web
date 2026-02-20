import React, { useEffect, useState } from 'react';
import { getMyBookings } from '../../api/bookings';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyBookings().then((res) => {
      setBookings(res?.bookings || res || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="my-bookings">
      <h2>My Bookings</h2>
      {loading ? (
        <div>Loading...</div>
      ) : bookings.length === 0 ? (
        <div>No bookings found.</div>
      ) : (
        <ul>
          {bookings.map((booking) => (
            <li key={booking._id || booking.id} style={{ marginBottom: '1rem' }}>
              <div><strong>Event:</strong> {booking.event?.name || booking.eventName}</div>
              <div><strong>Status:</strong> {booking.status}</div>
              <div><strong>Date:</strong> {booking.event?.date || booking.date}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
