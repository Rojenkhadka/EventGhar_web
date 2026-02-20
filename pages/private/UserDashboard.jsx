import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyBookings } from '../../src/api/bookings';
import { getPublicEvents } from '../../src/api/events';
import { getMe, updateMe } from '../../src/api/me';

import EventGharLogo from '../../src/assets/images/EventGhar.png';
import '../../src/styles/organizer_dashboard.css';
import Header from '../../src/components/Header';
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  MapPin,
  Store,
  Heart,
  Settings,
  LogOut
} from 'lucide-react';
import EventDetailsModal from '../../src/components/EventDetailsModal';
import BookingConfirmModal from '../../src/components/BookingConfirmModal';
import { createBooking } from '../../src/api/bookings';

const UserDashboard = ({ currentUser }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [publicEvents, setPublicEvents] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [detailsEvent, setDetailsEvent] = useState(null);
  const [bookingEvent, setBookingEvent] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [userData, eventsRes, bookingsRes] = await Promise.all([
        getMe(),
        getPublicEvents(),
        getMyBookings()
      ]);
      setUser(userData);
      setPublicEvents(eventsRes?.events || []);
      setMyBookings(bookingsRes?.bookings || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('eventghar_token');
    localStorage.removeItem('eventghar_current_user');
    navigate('/', { replace: true });
  };

  // Navigation handler
  const handleNavigation = (item) => {
    if (item.isLogout) {
      handleLogout();
      return;
    }

    // If the clicked item corresponds to an internal dashboard tab,
    // activate the tab instead of navigating away.
    const internalTabs = ['Dashboard', 'Events', 'My Bookings', 'Profile'];
    if (internalTabs.includes(item.title)) {
      setActiveTab(item.title);
      return;
    }

    // Otherwise keep legacy behavior of navigating to global pages
    switch (item.title) {
      case 'Browse Events':
        navigate('/events');
        break;
      case 'Venues':
        navigate('/venue');
        break;
      case 'Vendors':
        navigate('/vendors');
        break;
      case 'Favorites':
        navigate('/favorites');
        break;
      case 'Settings':
        navigate('/settings');
        break;
      default:
        navigate(`/${item.title.toLowerCase().replace(/\s+/g, '-')}`);
    }
  };

  // User stats cards
  const statsCards = [
    { 
      title: 'Available Events', 
      value: publicEvents.length || 48, 
      icon: '🎉', 
      color: '#4A90E2',
      badge: '+12 this week',
      bgGradient: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)'
    },
    { 
      title: 'My Bookings', 
      value: myBookings.length || 8, 
      icon: '🎫', 
      color: '#5CB85C',
      badge: '3 upcoming',
      bgGradient: 'linear-gradient(135deg, #5CB85C 0%, #4CAF50 100%)'
    },
    { 
      title: 'Venues Explored', 
      value: 24, 
      icon: '📍', 
      color: '#9B59B6',
      badge: '',
      bgGradient: 'linear-gradient(135deg, #9B59B6 0%, #8E44AD 100%)'
    },
    { 
      title: 'Saved Items', 
      value: 15, 
      icon: '❤️', 
      color: '#E74C3C',
      badge: '5 new',
      bgGradient: 'linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)'
    },
  ];

  // Event categories
  const eventCategories = [
    { title: 'Wedding Venues', icon: '💒', count: 120, color: '#FF6B9D' },
    { title: 'Conferences', icon: '💼', count: 85, color: '#4A90E2' },
    { title: 'Concerts', icon: '🎵', count: 45, color: '#9B59B6' },
    { title: 'Exhibitions', icon: '🎨', count: 38, color: '#F39C12' },
    { title: 'Workshops', icon: '🎓', count: 62, color: '#5CB85C' },
    { title: 'Sports Events', icon: '⚽', count: 28, color: '#E74C3C' },
  ];


  // Sidebar items for user dashboard
  const sidebarItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Events', icon: <Calendar size={20} /> },
    { name: 'My Bookings', icon: <Ticket size={20} /> },
    { name: 'Profile', icon: <Settings size={20} /> },
  ];

  // Track active tab for highlighting
  const [activeTab, setActiveTab] = useState('Dashboard');

  // Profile state (for Profile tab)
  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Sync profile form when user data loads
  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.fullName || '', email: user.email || '' });
    }
  }, [user]);

  // Handle profile form changes
  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };
  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError('');
    try {
      const updated = await updateMe(profileForm);
      setUser(updated);
      setEditProfile(false);
    } catch (err) {
      setProfileError('Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div className="org-layout">
      {/* Sidebar - modern style */}
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
                setActiveTab(item.name);
                handleNavigation({ title: item.name });
              }}
            >
              {item.icon}
              {item.name}
            </div>
          ))}
          <div className={`org-nav-item logout`} onClick={handleLogout}>
            <LogOut size={20} />
            Logout
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="org-main">
        <div className="org-top-bar">
          <h2>Welcome, {user?.fullName || 'User'} 👋</h2>
          <div className="org-top-bar-actions">
            <input type="text" placeholder="Search events..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="org-search-input" />
            <div className="org-notifications">
              <Ticket size={24} />
              {myBookings.length > 0 && (
                <span className="org-notifications-badge">{myBookings.length}</span>
              )}
            </div>
            <div className="org-user-info">
              <div className="org-user-avatar">{user?.fullName?.charAt(0) || 'U'}</div>
              <div className="org-user-details">
                <span className="org-user-name">{user?.fullName || 'User'}</span>
                <span className="org-user-role">Attendee</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'Dashboard' && (
          <>
            <div className="org-stat-cards">
              {statsCards.map(card => (
                <div key={card.title} className="org-stat-card" style={{ color: card.color, background: card.bgGradient }}>
                  <div className="org-stat-icon">{card.icon}</div>
                  <div className="org-stat-number">{card.value}</div>
                  <div className="org-stat-title">{card.title}</div>
                  {card.badge && <div className="org-stat-badge">{card.badge}</div>}
                </div>
              ))}
            </div>
            <div className="org-dashboard-section">
              <h3>Upcoming Events</h3>
              <div className="org-dashboard-event-grid">
                {publicEvents.filter(event => event.status === 'APPROVED').length === 0 ? (
                  <div className="org-placeholder">No upcoming events.</div>
                ) : (
                  publicEvents.filter(event => event.status === 'APPROVED').map(event => (
                    <div key={event.id} className="org-dashboard-event-card">
                      <div className="org-dashboard-event-image" style={{ backgroundImage: `url(${event.image || EventGharLogo})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                      </div>
                      <div className="org-dashboard-event-content">
                        <div className="org-dashboard-event-title" style={{ fontWeight: 700, fontSize: '1.15rem', marginBottom: 6 }}>{event.title}</div>
                        <div style={{ color: '#64748b', fontSize: 14, marginBottom: 8 }}>
                          {event.organizerName && <span>By <strong>{event.organizerName}</strong></span>}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                          <span><strong>Date:</strong> {event.date ? new Date(event.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '-'}</span>
                          <span><strong>Location:</strong> {event.location || '-'}</span>
                        </div>
                        {event.description && (
                          <div style={{ color: '#334155', fontSize: 14, marginBottom: 8, minHeight: 32 }}>
                            {event.description.length > 100 ? event.description.slice(0, 100) + '...' : event.description}
                          </div>
                        )}
                      </div>
                      <div className="org-dashboard-event-footer" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center', padding: 16 }}>
                        <button className="org-btn org-btn-secondary" style={{ minWidth: 0 }} onClick={() => setDetailsEvent(event)}>View Details</button>
                        <button className="org-btn org-btn-primary" style={{ minWidth: 0 }} onClick={() => setBookingEvent(event)}>Book</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* Events Tab */}
        {activeTab === 'Events' && (
          <div className="org-my-events">
            <div className="org-section-header">
              <h3>Available Events</h3>
            </div>
            <div className="org-dashboard-event-grid">
              {publicEvents.filter(event => event.status === 'APPROVED').length === 0 && <div className="org-placeholder">No events available.</div>}
              {publicEvents.filter(event => event.status === 'APPROVED').map(event => (
                <div key={event.id} className="org-dashboard-event-card">
                  <div className="org-dashboard-event-image" style={{ backgroundImage: `url(${event.image || EventGharLogo})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                  </div>
                  <div className="org-dashboard-event-content">
                    <div className="org-dashboard-event-title" style={{ fontWeight: 700, fontSize: '1.15rem', marginBottom: 6 }}>{event.title}</div>
                    <div style={{ color: '#64748b', fontSize: 14, marginBottom: 8 }}>
                      {event.organizerName && <span>By <strong>{event.organizerName}</strong></span>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                      <span><strong>Date:</strong> {event.date ? new Date(event.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '-'}</span>
                      <span><strong>Location:</strong> {event.location || '-'}</span>
                    </div>
                    {event.description && (
                      <div style={{ color: '#334155', fontSize: 14, marginBottom: 8, minHeight: 32 }}>
                        {event.description.length > 100 ? event.description.slice(0, 100) + '...' : event.description}
                      </div>
                    )}
                  </div>
                  <div className="org-dashboard-event-footer" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center', padding: 16 }}>
                        <button className="org-btn org-btn-secondary" style={{ minWidth: 0 }} onClick={() => setDetailsEvent(event)}>View Details</button>
                    <button className="org-btn org-btn-primary" style={{ minWidth: 0 }} onClick={() => setBookingEvent(event)}>Book</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Bookings Tab */}
        {activeTab === 'My Bookings' && (
          <div className="org-bookings-section">
            <div className="org-section-header">
              <h3>My Bookings</h3>
            </div>
            <div className="org-bookings-list">
              {myBookings.map(booking => (
                <div key={booking.id} className="org-booking-item">
                  <div className="org-booking-header">
                    <div className="org-booking-info">
                      <div className="org-booking-event">{booking.eventTitle || 'Event'}</div>
                    </div>
                    <div className="org-booking-meta">
                      <span className="org-booking-tickets">🎫 {booking.ticketCount || 1} tickets</span>
                      <span className={`org-booking-status ${booking.status}`}>{booking.status}</span>
                    </div>
                  </div>
                  <div className="org-booking-actions">
                    <button className="org-btn org-btn-secondary">View Details</button>
                  </div>
                </div>
              ))}
              {myBookings.length === 0 && <div className="org-placeholder">No bookings found.</div>}
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'Profile' && (
          <div className="org-profile-section">
            <div className="org-section-header">
              <h3>Profile</h3>
              <button className="org-btn org-btn-primary" onClick={() => setEditProfile(!editProfile)}>
                {editProfile ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
            {!editProfile ? (
              <div className="org-profile-view">
                <div className="org-profile-card">
                  <div className="org-profile-avatar-large">{user?.fullName?.charAt(0) || 'U'}</div>
                  <div className="org-profile-details">
                    <div className="org-profile-row">
                      <label>Name</label>
                      <span>{user?.fullName}</span>
                    </div>
                    <div className="org-profile-row">
                      <label>Email</label>
                      <span>{user?.email}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="org-profile-edit">
                <div className="org-profile-card">
                  <form className="org-profile-form" onSubmit={handleProfileSave}>
                    <div className="org-form-group">
                      <label>Name</label>
                      <input name="name" value={profileForm.name} onChange={handleProfileChange} className="org-form-input" />
                    </div>
                    <div className="org-form-group">
                      <label>Email</label>
                      <input name="email" value={profileForm.email} onChange={handleProfileChange} className="org-form-input" />
                    </div>
                    {profileError && <div style={{ color: '#ef4444' }}>{profileError}</div>}
                    <div className="org-form-actions">
                      <button type="submit" className="org-btn org-btn-primary" disabled={profileSaving}>{profileSaving ? 'Saving...' : 'Save'}</button>
                      <button type="button" className="org-btn org-btn-secondary" disabled={profileSaving} onClick={() => setEditProfile(false)}>Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      
      {/* Event Details Modal */}
      <EventDetailsModal event={detailsEvent} onClose={() => setDetailsEvent(null)} />

      {/* Booking Confirmation Modal */}
      <BookingConfirmModal
        event={bookingEvent}
        open={!!bookingEvent}
        loading={bookingLoading}
        onCancel={() => setBookingEvent(null)}
        onConfirm={async () => {
          if (!bookingEvent) return;
          setBookingLoading(true);
          try {
            await createBooking({ eventId: bookingEvent.id });
            setBookingEvent(null);
            // Optionally reload bookings or show a toast
            alert('Booking request sent! Organizer will review your request.');
          } catch (err) {
            alert('Failed to send booking request.');
          } finally {
            setBookingLoading(false);
          }
        }}
      />
    </div>
  );
};

export default UserDashboard;
