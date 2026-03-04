import React, { useEffect, useState } from 'react';
import { getMe } from '../../api/me';
import { getMyBookings } from '../../api/bookings';

export default function DashboardOverview() {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    getMe().then(setUser);
    getMyBookings().then((res) => setBookings(res?.bookings || res || []));
  }, []);

  const userName = user?.name || 'User';
  const totalEventsBooked = bookings.length;
  const recentEvent = bookings.length > 0 ? bookings[0].event?.name || bookings[0].eventName : null;

  return (
    <div className="dashboard-overview">
      <h2>Welcome, {userName}!</h2>
      <div>Total Events Booked: <strong>{totalEventsBooked}</strong></div>
      {recentEvent && (
        <div>Recently Booked: <span>{recentEvent}</span></div>
      )}
    </div>
  );
}
