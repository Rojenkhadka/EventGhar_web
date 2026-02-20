import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import CreateEventForm from '../../components/CreateEventForm';
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  MapPin,
  Store,
  Heart,
  Settings,
  LogOut,
  Search,
  Bell,
  Plus,
  X,
  Clock,
  Music,
  Monitor,
  PartyPopper,
  ChevronRight
} from 'lucide-react';
import { Users } from 'lucide-react';
import { listEvents, createEvent, updateEvent, deleteEvent, publishEvent } from '../../src/api/events';
import { getEventBookings } from '../../src/api/bookings';
import ProfileSection from '../../src/components/userDashboard/ProfileSection';
import { EventSchema } from './schema/event.schema';
import '../../src/styles/organizer_dashboard.css';
import EventGharLogo from '../../src/assets/images/EventGhar.png';

const OrganizerDashboard = ({ currentUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Dashboard');

  // Bookings state
  const [allBookings, setAllBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Set tab from navigation state if present (e.g., after returning from EventDetails)
  useEffect(() => {
    if (location.state && location.state.tab) {
      setActiveTab(location.state.tab);
    }
    // eslint-disable-next-line
  }, [location.state]);
  
  // Create Event Form State
  const [createEventForm, setCreateEventForm] = useState({
    title: '',
    eventType: 'Concert',
    description: '',
    date: new Date().toISOString().slice(0,10),
    time: '',
    venue: '',
    ticketPrice: '',
    maxParticipants: '',
    eventImage: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
    getValues
  } = useForm({
    resolver: zodResolver(EventSchema)
  });

  // User info
  const userData = JSON.parse(localStorage.getItem('eventghar_current_user') || '{}');
  const userName = userData.fullName || currentUser?.fullName || 'Organizer';


  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (activeTab === 'Bookings') {
      loadAllBookings();
    }
    // eslint-disable-next-line
  }, [activeTab, myEvents]);
  // Load all bookings for all my events
  const loadAllBookings = async () => {
    setBookingsLoading(true);
    try {
      let bookings = [];
      for (const event of myEvents) {
        const eventBookings = await getEventBookings(event.id);
        bookings = bookings.concat(eventBookings.map(b => ({ ...b, eventTitle: event.title })));
      }
      setAllBookings(bookings);
    } catch (err) {
      setAllBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      const events = await listEvents();
      setMyEvents(Array.isArray(events) ? events : []);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, data);
      } else {
        await createEvent(data);
      }
      setIsModalOpen(false);
      setEditingEvent(null);
      reset();
      loadEvents();
    } catch (err) {
      console.error('Failed to save event:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to cancel this event?')) {
      try {
        await deleteEvent(id);
        loadEvents();
      } catch (err) {
        console.error('Failed to delete event:', err);
      }
    }
  };

  const handlePublish = async (id) => {
    if (window.confirm('Publish this event? It will be visible to all users.')) {
      try {
        await publishEvent(id);
        loadEvents();
        alert('Event published successfully!');
      } catch (err) {
        console.error('Failed to publish event:', err);
        alert('Failed to publish event. Please try again.');
      }
    }
  };

  const filteredEvents = myEvents.filter(e =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.venue?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateEventSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    
    try {
      // Map to API fields (server expects: title, description, date, location, maxAttendees)
      const payload = {
        title: createEventForm.title,
        description: createEventForm.description,
        date: createEventForm.date,
        location: createEventForm.venue,
        maxAttendees: createEventForm.maxParticipants ? Number(createEventForm.maxParticipants) : null,
      };

      await createEvent(payload);
      setSubmitSuccess('Event created and published successfully!');
      
      // Reset form
      setCreateEventForm({
        title: '',
        eventType: 'Concert',
        description: '',
        date: new Date().toISOString().slice(0,10),
        time: '',
        venue: '',
        ticketPrice: '',
        maxParticipants: '',
        eventImage: null,
      });
      setImagePreview(null);
      
      // Reload events and switch to My Events tab after 2 seconds
      setTimeout(() => {
        loadEvents();
        setActiveTab('My Events');
      }, 2000);
    } catch (err) {
      setSubmitError(err?.message || 'Failed to submit event. Please try again.');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCreateEventForm({ ...createEventForm, eventImage: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCancelCreateEvent = () => {
    setCreateEventForm({
      title: '',
      eventType: 'Concert',
      description: '',
      date: new Date().toISOString().slice(0,10),
      time: '',
      venue: '',
      ticketPrice: '',
      maxParticipants: '',
      eventImage: null,
    });
    setImagePreview(null);
    setSubmitError('');
    setSubmitSuccess('');
    setActiveTab('Dashboard');
  };

  const sidebarItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'My Events', icon: <Calendar size={20} /> },
    { name: 'Create Event', icon: <Plus size={20} /> },
    { name: 'Bookings', icon: <Ticket size={20} /> },
    { name: 'Profile', icon: <Settings size={20} /> },
  ];

  const getEventIcon = (category) => {
    switch (category) {
      case 'Music': return <Music size={20} />;
      case 'Tech': return <Monitor size={20} />;
      default: return <PartyPopper size={20} />;
    }
  };

  return (
    <div className="org-layout">
      {/* Sidebar */}
      <aside className="org-sidebar">
        <div className="org-sidebar-header">
          <img src={EventGharLogo} alt="Logo" className="org-sidebar-logo" />
          <div className="org-sidebar-brand">
            EventGhar
            <div className="org-sidebar-subtitle">Event Management</div>
          </div>
        </div>
        <nav className="org-nav">
          {sidebarItems.map(item => (
            <div
              key={item.name}
              className={`org-nav-item ${activeTab === item.name ? 'active' : ''}`}
              onClick={() => {
                if (item.name === 'Create Event') {
                  // Switch to the internal Create Event tab (do not navigate away)
                  reset();
                  setEditingEvent(null);
                  // prepare create form defaults
                  setCreateEventForm({
                    title: '',
                    eventType: 'Concert',
                    description: '',
                    date: new Date().toISOString().slice(0,10),
                    time: '',
                    venue: '',
                    ticketPrice: '',
                    maxParticipants: '',
                    eventImage: null,
                  });
                  setImagePreview(null);
                  setActiveTab('Create Event');
                } else {
                  setActiveTab(item.name);
                }
              }}
              onMouseEnter={e => e.currentTarget.classList.add('hover')}
              onMouseLeave={e => e.currentTarget.classList.remove('hover')}
            >
              {item.icon}
              {item.name}
            </div>
          ))}
          <div className="org-nav-item logout" onClick={() => navigate('/')}> 
            <LogOut size={20} />
            Logout
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="org-main">
        <div className="org-top-bar">
          <div>
            <h2>Welcome, {userName}</h2>
            <div style={{ color: 'var(--text-muted)', marginTop: 6 }}>You have a great day ahead — here's your summary</div>
          </div>
          <div className="org-top-bar-actions">
            <input className="org-search-input" type="text" placeholder="Search events..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            <div className="org-notifications">
              <Bell size={22} />
              <div className="org-notifications-badge">2</div>
            </div>
            <div className="org-user-info" onClick={() => navigate('/profile')}>
              <div className="org-user-avatar">{userName.charAt(0)}</div>
              <div className="org-user-details">
                <div className="org-user-name">{userName}</div>
                <div className="org-user-role">Organizer</div>
              </div>
            </div>
            {/* New Event button removed - use sidebar Create Event instead */}
          </div>
        </div>

        {/* Content by tab */}
        {activeTab === 'Dashboard' && (
          <>
            {/* Overview header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Dashboard Overview</h3>
                <div style={{ color: '#64748b', marginTop: 6, fontSize: 14 }}>Welcome back — here’s a snapshot of your activity</div>
              </div>
              <div>{/* CTA removed - use sidebar Create Event */}</div>
            </div>

            {/* Stats row - use stat cards from CSS */}
            <div className="org-stat-cards">
              <div className="org-stat-card blue">
                <div className="org-stat-icon"><Calendar size={20} /></div>
                <div className="org-stat-title">ACTIVE EVENTS</div>
                <div className="org-stat-number">{myEvents.length}</div>
                <div style={{ color: 'var(--green-primary)', marginTop: 8, fontWeight: 700 }}>+2%</div>
              </div>

              <div className="org-stat-card green">
                <div className="org-stat-icon"><Ticket size={20} /></div>
                <div className="org-stat-title">TICKET SALES</div>
                <div className="org-stat-number">$14.2k</div>
                <div style={{ color: 'var(--green-primary)', marginTop: 8, fontWeight: 700 }}>+15%</div>
              </div>

              <div className="org-stat-card purple">
                <div className="org-stat-icon"><Users size={20} /></div>
                <div className="org-stat-title">REGISTERED PARTICIPANTS</div>
                <div className="org-stat-number">1,240</div>
                <div style={{ color: 'var(--green-primary)', marginTop: 8, fontWeight: 700 }}>+8.4% this month</div>
              </div>
            </div>

            {/* Upcoming Events + Quick Insights */}
            <div className="org-dashboard-section">
              <div className="org-section-header">
                <h3>Upcoming Events</h3>
                <a href="#" style={{ color: 'var(--blue-primary)', fontWeight: 800 }}>View All</a>
              </div>

              <div className="org-dashboard-event-grid">
                {filteredEvents[0] ? (
                  <div className="org-dashboard-event-card">
                    <div className="org-dashboard-event-image" style={{ backgroundImage: `url(${filteredEvents[0].image || EventGharLogo})`, backgroundSize: 'cover' }} />
                    <div className="org-dashboard-event-content">
                      <div className="org-event-header">
                        <div className="org-dashboard-event-title">{filteredEvents[0].title}</div>
                        <div className="org-dashboard-event-badge">LIVE SOON</div>
                      </div>
                      <div className="org-dashboard-event-meta">
                        <span>{filteredEvents[0].date || '-'} • {filteredEvents[0].venue || 'TBD'}</span>
                        <div style={{ height: 8, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, (filteredEvents[0].ticketsSold || 0) / (filteredEvents[0].capacity || 200) * 100)}%`, background: 'var(--blue-primary)', height: '100%' }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button className="org-btn org-btn-primary" style={{ flex: 1 }} onClick={() => navigate(`/events/${filteredEvents[0].id}`)}>Manage Event</button>
                        <button className="org-btn org-btn-secondary">...</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="org-placeholder">
                    <div style={{ fontWeight: 700 }}>No upcoming events</div>
                    <div style={{ marginTop: 8 }}>Create your first event to see it here.</div>
                  </div>
                )}
              </div>

              <div style={{ marginTop: 20 }}>
                <h3 style={{ marginBottom: 12 }}>Quick Insights</h3>
                <div style={{ background: 'white', borderRadius: 12, padding: 16, boxShadow: '0 6px 18px rgba(15,23,42,0.04)' }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ background: '#eef2ff', padding: 12, borderRadius: 10 }}><LayoutDashboard size={18} color="#2563eb" /></div>
                    <div>
                      <div style={{ fontWeight: 700 }}>Sales Peak Detected</div>
                      <div style={{ color: 'var(--text-muted)', marginTop: 6 }}>You've sold 45 tickets in the last 24 hours for the Tech Summit. Consider increasing your ad budget.</div>
                      <a href="#" style={{ color: 'var(--blue-primary)', fontWeight: 700, display: 'inline-block', marginTop: 10 }}>Analyze Trends &gt;</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'Create Event' && (
          <div className="org-dashboard-section" style={{ maxWidth: 800, margin: '0 auto' }}>
            <div className="org-section-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Create New Event</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>Fill in the details below to create a new event. Your event will be submitted for admin approval.</p>
            </div>

            {submitError && (
              <div style={{ background: '#fee2e2', color: '#991b1b', padding: 16, borderRadius: 12, marginBottom: 20, fontWeight: 600 }}>
                {submitError}
              </div>
            )}

            {submitSuccess && (
              <div style={{ background: '#dcfce7', color: '#065f46', padding: 16, borderRadius: 12, marginBottom: 20, fontWeight: 600 }}>
                {submitSuccess}
              </div>
            )}

            <form onSubmit={handleCreateEventSubmit} style={{ background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
              {/* 1. Event Basic Information */}
              <div style={{ marginBottom: 32 }}>
                <h4 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 12, color: 'var(--text-dark)' }}>Event details</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#334155' }}>Event Title / Name *</label>
                    <input
                      type="text"
                      required
                      value={createEventForm.title}
                      onChange={(e) => setCreateEventForm({ ...createEventForm, title: e.target.value })}
                      placeholder="e.g. Tech Conference 2026"
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 15 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#334155' }}>Event Type *</label>
                    <select
                      required
                      value={createEventForm.eventType}
                      onChange={(e) => setCreateEventForm({ ...createEventForm, eventType: e.target.value })}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 15 }}
                    >
                      <option value="Concert">Concert</option>
                      <option value="Workshop">Workshop</option>
                      <option value="Seminar">Seminar</option>
                      <option value="Cultural Program">Cultural Program</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#334155' }}>Event Description *</label>
                    <textarea
                      required
                      value={createEventForm.description}
                      onChange={(e) => setCreateEventForm({ ...createEventForm, description: e.target.value })}
                      placeholder="Short details about the event..."
                      rows={4}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 15, fontFamily: 'inherit', resize: 'vertical' }}
                    />
                  </div>
                </div>
              </div>

              {/* 2. Date and Time Section */}
              <div style={{ marginBottom: 32 }}>
                <h4 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 12, color: 'var(--text-dark)' }}>Date & time</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#334155' }}>Event Date *</label>
                    <input
                      type="date"
                      required
                      value={createEventForm.date}
                      onChange={(e) => setCreateEventForm({ ...createEventForm, date: e.target.value })}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 15 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#334155' }}>Event Time *</label>
                    <input
                      type="time"
                      required
                      value={createEventForm.time}
                      onChange={(e) => setCreateEventForm({ ...createEventForm, time: e.target.value })}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 15 }}
                    />
                  </div>
                </div>
              </div>

              {/* 3. Venue Information */}
              <div style={{ marginBottom: 32 }}>
                <h4 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 12, color: 'var(--text-dark)' }}>Venue</h4>
                
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#334155' }}>Venue Name / Location *</label>
                  <input
                    type="text"
                    required
                    value={createEventForm.venue}
                    onChange={(e) => setCreateEventForm({ ...createEventForm, venue: e.target.value })}
                    placeholder="e.g. Softwarica College Hall"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 15 }}
                  />
                </div>
              </div>

              {/* 4. Ticket / Price Information */}
              <div style={{ marginBottom: 32 }}>
                <h4 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 12, color: 'var(--text-dark)' }}>Ticket & pricing</h4>
                
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#334155' }}>Ticket Price</label>
                  <input
                    type="text"
                    value={createEventForm.ticketPrice}
                    onChange={(e) => setCreateEventForm({ ...createEventForm, ticketPrice: e.target.value })}
                    placeholder="e.g. Rs. 500 or Free"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 15 }}
                  />
                  <p style={{ color: '#64748b', fontSize: 13, marginTop: 6 }}>Leave blank for free events</p>
                </div>
              </div>

              {/* 5. Event Capacity */}
              <div style={{ marginBottom: 32 }}>
                <h4 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 12, color: 'var(--text-dark)' }}>Capacity</h4>
                
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#334155' }}>Maximum Participants</label>
                  <input
                    type="number"
                    min="1"
                    value={createEventForm.maxParticipants}
                    onChange={(e) => setCreateEventForm({ ...createEventForm, maxParticipants: e.target.value })}
                    placeholder="e.g. 100 seats"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 15 }}
                  />
                  <p style={{ color: '#64748b', fontSize: 13, marginTop: 6 }}>Optional but helps manage registrations</p>
                </div>
              </div>

              {/* 6. Event Image / Banner */}
              <div style={{ marginBottom: 32 }}>
                <h4 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 12, color: 'var(--text-dark)' }}>Image / banner (optional)</h4>
                
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#334155' }}>Upload Event Poster or Banner</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 15 }}
                  />
                  {imagePreview && (
                    <div style={{ marginTop: 12 }}>
                      <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                    </div>
                  )}
                </div>
              </div>

              {/* 7. Event Status Info */}
              <div style={{ marginBottom: 32, background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid var(--border-light)' }}>
                <h4 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 8, color: 'var(--text-dark)' }}>Status</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 8 }}>Your event will be <strong>Published</strong> immediately and visible to all users.</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>Users will be able to browse and book tickets for your event.</p>
              </div>

              {/* 8. Action Buttons */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleCancelCreateEvent}
                  className="org-btn org-btn-secondary"
                  style={{ padding: '12px 24px', fontSize: 15 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="org-btn org-btn-primary"
                  style={{ padding: '12px 32px', fontSize: 15 }}
                >
                  Publish Event
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'My Events' && (
          <div className="org-my-events">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.25rem', margin: 0 }}>Manage Events</h3>
              <button className="org-btn org-btn-primary" onClick={() => {
                setActiveTab('Create Event');
                reset();
              }}>+ New Event</button>
            </div>

            {loading ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '1rem', textAlign: 'center', margin: '32px 0' }}>Loading events...</div>
            ) : filteredEvents.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '1rem', textAlign: 'center', margin: '32px 0' }}>No events found.</div>
            ) : (
              <div className="org-dashboard-event-grid">
                {filteredEvents.map(event => {
                  const capacity = event.capacity || event.maxAttendees || 0;
                  const sold = event.ticketsSold || event.tickets_sold || 0;
                  const percent = capacity > 0 ? Math.min(100, Math.round((sold / capacity) * 100)) : 0;
                  let badgeText = '';
                  if (event.status === 'APPROVED') badgeText = 'Approved';
                  else if (event.status === 'PENDING_APPROVAL') badgeText = 'Pending Approval';
                  else badgeText = (event.status || '').toUpperCase();
                  return (
                    <div key={event.id} className="org-dashboard-event-card">
                      <div className="org-dashboard-event-image" style={{ backgroundImage: `url(${event.image || EventGharLogo})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                        <span className="org-dashboard-event-badge">{badgeText}</span>
                      </div>
                      <div className="org-dashboard-event-content">
                        <div className="org-dashboard-event-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span>{event.title}</span>
                        </div>
                        <div className="org-dashboard-event-meta">
                          <span><Calendar size={16} /> {event.date || '-'} {event.time ? `• ${event.time}` : ''}</span>
                          <span><MapPin size={16} /> {event.venue || 'TBD'}</span>
                        </div>
                        <div style={{ margin: '12px 0 0 0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ color: 'var(--text-muted)' }}>Registration Progress</div>
                            <a href="#" style={{ color: 'var(--blue-primary)', fontWeight: 700 }}>{sold}/{capacity || '—'} Attendees</a>
                          </div>
                          <div style={{ height: 10, background: '#f1f5f9', borderRadius: 8, overflow: 'hidden', marginTop: 8 }}>
                            <div style={{ width: `${percent}%`, background: 'linear-gradient(90deg,#3b82f6,#60a5fa)', height: '100%' }} />
                          </div>
                        </div>
                      </div>
                      <div className="org-dashboard-event-footer">
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: event.status === 'APPROVED' ? 'repeat(4, 1fr)' : 'repeat(5, 1fr)',
                          gap: 12
                        }}>
                          {event.status !== 'APPROVED' && (
                            <button 
                              className="org-btn org-btn-success" 
                              style={{ minWidth: 0, background: '#10b981', color: 'white' }} 
                              onClick={() => handlePublish(event.id)}
                              title="Publish this event to make it visible to users"
                            >
                              Publish
                            </button>
                          )}
                          <button className="org-btn org-btn-primary" style={{ minWidth: 0 }} onClick={() => navigate(`/events/${event.id}`, { state: { from: 'organizer-my-events' } })}>Manage</button>
                          <button className="org-btn org-btn-secondary" style={{ minWidth: 0 }} onClick={() => navigate(`/events/${event.id}/settings`)}>Settings</button>
                          <button className="org-btn org-btn-secondary" style={{ minWidth: 0 }} onClick={() => {
                            setEditingEvent(event);
                            reset({
                              title: event.title,
                              date: event.date,
                              time: event.time || '',
                              venue: event.venue || '',
                              description: event.description || '',
                              category: event.category || 'General',
                            });
                            setIsModalOpen(true);
                          }}>Edit Details</button>
                          <button className="org-btn org-btn-danger" style={{ minWidth: 0 }} onClick={() => handleDelete(event.id)}>Cancel</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'Bookings' && (
          <div style={{ background: 'white', borderRadius: '18px', padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: '32px' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '12px' }}>Bookings</h3>
            {bookingsLoading ? (
              <div style={{ color: '#64748b' }}>Loading bookings...</div>
            ) : allBookings.length === 0 ? (
              <div style={{ color: '#64748b' }}>No bookings found for your events.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {allBookings.map((booking, idx) => (
                  <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, background: '#f9fafb', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{booking.eventTitle}</div>
                    <div style={{ color: '#334155', fontSize: 15 }}>By: <strong>{booking.userName}</strong> ({booking.userEmail})</div>
                    <div style={{ color: '#64748b', fontSize: 14 }}>Status: <strong>{booking.status}</strong></div>
                    <div style={{ color: '#64748b', fontSize: 14 }}>Requested: {new Date(booking.createdAt).toLocaleString()}</div>
                    {booking.notes && <div style={{ color: '#64748b', fontSize: 14 }}>Notes: {booking.notes}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'Profile' && (
          <div style={{ background: 'white', borderRadius: '18px', padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: '32px' }}>
            <ProfileSection />
          </div>
        )}
      </main>

      {/* Event Modal */}
      {isModalOpen && (
        <CreateEventForm
          onSubmit={onSubmit}
          onCancel={() => { setIsModalOpen(false); setEditingEvent(null); reset(); }}
          defaultValues={editingEvent ? {
            title: editingEvent.title,
            date: editingEvent.date,
            time: editingEvent.time || '',
            venue: editingEvent.venue || '',
            description: editingEvent.description || '',
            category: editingEvent.category || 'General',
          } : {}}
          errors={errors}
        />
      )}
    </div>
  );
};

export default OrganizerDashboard;


