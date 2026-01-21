import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { listEvents } from '../../src/api/events';
import '../../src/CSS/dashboard.css';

const OrganizerDashboard = ({ currentUser }) => {
  const navigate = useNavigate();
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const events = await listEvents();
      setMyEvents(Array.isArray(events) ? events : []);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const pending = myEvents.filter(e => e.status === 'PENDING_APPROVAL').length;
    const approved = myEvents.filter(e => e.status === 'APPROVED').length;
    const totalBookings = myEvents.reduce((sum, e) => sum + (e.bookingCount || 0), 0);

    return [
      { label: 'Total Events', value: myEvents.length },
      { label: 'Approved', value: approved },
      { label: 'Pending', value: pending },
      { label: 'Total Bookings', value: totalBookings },
    ];
  }, [myEvents]);

  const getStatusClass = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('approved')) return 'dashboard-pill--confirmed';
    if (s.includes('pending')) return 'dashboard-pill--planning';
    if (s.includes('reject')) return 'dashboard-pill--draft';
    return 'dashboard-pill--tag';
  };

  return (
    <div className="dashboard-content">
      {/* Hero Section */}
      <section className="dashboard-hero">
        <h1 className="dashboard-heroTitle">
          Organizer Dashboard
        </h1>
        <p className="dashboard-heroSubtitle">
          Manage your events, track bookings, and grow your business
        </p>
        
        <div className="dashboard-actions">
          <button
            className="dashboard-primaryBtn"
            onClick={() => navigate('/events')}
          >
            + Create New Event
          </button>
        </div>

        {/* Stats */}
        <div className="dashboard-stats">
          {stats.map((s) => (
            <div key={s.label} className="dashboard-stat">
              <div className="dashboard-statValue">{s.value}</div>
              <div className="dashboard-statLabel">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Main Content */}
      <main className="dashboard-grid">
        <section className="dashboard-panel">
          <div className="dashboard-panelHeader">
            <h2 className="dashboard-panelTitle">My Events</h2>
            <button className="dashboard-linkBtn" onClick={() => navigate('/events')}>
              Manage All
            </button>
          </div>
          <div className="dashboard-panelBody">
            {loading ? (
              <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '60px 0' }}>
                Loading events...
              </div>
            ) : myEvents.length === 0 ? (
              <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '60px 0' }}>
                No events yet. Create your first event to get started.
              </div>
            ) : (
              <div className="dashboard-events">
                {myEvents.map((event) => (
                  <article key={event.id} className="dashboard-eventCard">
                    <div className="dashboard-thumb" />
                    <div>
                      <div className="dashboard-rowBetween">
                        <div className="dashboard-eventTitle">{event.title}</div>
                        <span className={`dashboard-pill ${getStatusClass(event.status)}`}>
                          {event.status?.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="dashboard-eventMeta">{event.date}</div>
                      <div className="dashboard-eventMeta">{event.location}</div>
                      {event.bookingCount > 0 && (
                        <div className="dashboard-eventMeta" style={{ marginTop: '8px', fontWeight: 600, color: 'var(--text)' }}>
                          {event.bookingCount} {event.bookingCount === 1 ? 'booking' : 'bookings'}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button
                          className="dashboard-secondaryBtn"
                          style={{ flex: 1, padding: '8px 12px', fontSize: '12px' }}
                          onClick={() => navigate(`/events/${event.id}`)}
                        >
                          Details
                        </button>
                        {event.bookingCount > 0 && (
                          <button
                            className="dashboard-secondaryBtn"
                            style={{ flex: 1, padding: '8px 12px', fontSize: '12px' }}
                            onClick={() => navigate(`/events/${event.id}/bookings`)}
                          >
                            Bookings
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default OrganizerDashboard;
