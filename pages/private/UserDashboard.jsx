import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPublicEvents, getMyBookings } from '../../src/api/bookings';
import eventGharLogo from '../../src/assets/images/EventGhar.png';
import '../../src/CSS/landing.css';
import '../../src/CSS/dashboard.css';

const UserDashboard = ({ currentUser }) => {
  const navigate = useNavigate();
  const [publicEvents, setPublicEvents] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [eventsRes, bookingsRes] = await Promise.all([
        getPublicEvents(),
        getMyBookings()
      ]);
      setPublicEvents(eventsRes?.events || []);
      setMyBookings(bookingsRes?.bookings || []);
      
      // Mock upcoming events
      setUpcomingEvents([
        { 
          id: 1, 
          title: 'Summer Music Festival', 
          date: 'Jun 15, 2026', 
          location: 'Central Park',
          attendees: 1200,
          status: 'Confirmed',
          avatar: '🎵'
        },
        { 
          id: 2, 
          title: 'Tech Conference 2026', 
          date: 'Jul 20, 2026', 
          location: 'Convention Center',
          attendees: 850,
          status: 'Confirmed',
          avatar: '💻'
        },
        { 
          id: 3, 
          title: 'Food & Wine Expo', 
          date: 'Aug 5, 2026', 
          location: 'Grand Hall',
          attendees: 500,
          status: 'Pending',
          avatar: '🍷'
        },
        { 
          id: 4, 
          title: 'Art Gallery Opening', 
          date: 'Sep 10, 2026', 
          location: 'Museum District',
          attendees: 300,
          status: 'Confirmed',
          avatar: '🎨'
        },
      ]);
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

    switch (item.title) {
      case 'Dashboard':
        navigate('/dashboard');
        break;
      case 'Browse Events':
        navigate('/events');
        break;
      case 'My Bookings':
        navigate('/bookings');
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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F7FA' }}>
      {/* Sidebar */}
      <aside style={{
        width: '220px',
        background: 'linear-gradient(180deg, #2C3E50 0%, #34495E 100%)',
        padding: '24px 0',
        position: 'fixed',
        height: '100vh',
        overflowY: 'auto'
      }}>
        {/* Logo */}
        <div style={{ padding: '0 20px 30px', textAlign: 'center' }}>
          <img src={eventGharLogo} alt="EventGhar" style={{ width: '120px', marginBottom: '8px' }} />
        </div>

        {/* Navigation */}
        <nav>
          {[
            { title: 'Dashboard', icon: '🏠', active: true },
            { title: 'Browse Events', icon: '🎉' },
            { title: 'My Bookings', icon: '🎫', badge: myBookings.length },
            { title: 'Venues', icon: '📍' },
            { title: 'Vendors', icon: '🛍️' },
            { title: 'Favorites', icon: '❤️' },
            { title: 'Settings', icon: '⚙️' },
            { title: 'Logout', icon: '🚪', isLogout: true },
          ].map((item, idx) => (
            <div
              key={idx}
              onClick={() => handleNavigation(item)}
              style={{
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                background: item.active ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                borderLeft: item.active ? '4px solid #4A90E2' : '4px solid transparent',
                color: '#ffffff',
                fontSize: '14px',
                transition: 'all 0.3s ease',
                marginTop: item.isLogout ? '20px' : '0',
                borderTop: item.isLogout ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (!item.active) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                if (!item.active) e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span>{item.icon}</span>
                <span style={{ fontWeight: item.active ? '600' : '400' }}>{item.title}</span>
              </div>
              {item.badge && (
                <span style={{
                  background: '#E74C3C',
                  color: '#fff',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: '600'
                }}>
                  {item.badge}
                </span>
              )}
            </div>
          ))}
        </nav>

        {/* Quick Actions */}
        <div style={{ 
          position: 'absolute', 
          bottom: '20px', 
          left: '20px', 
          right: '20px' 
        }}>
          <button 
            onClick={() => navigate('/events')}
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(135deg, #4A90E2, #357ABD)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            Book Event
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div style={{ marginLeft: '220px', flex: 1 }}>
        {/* Top Navigation Bar */}
        <header style={{
          background: '#ffffff',
          padding: '16px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #E5E7EB',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: '600', 
            color: '#1F2937',
            margin: 0
          }}>
            Welcome back, {currentUser?.fullName || 'Guest'} 👋
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <span style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: '#9CA3AF',
                fontSize: '16px'
              }}>
                🔍
              </span>
              <input 
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '8px 12px 8px 36px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  width: '200px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Settings Icon */}
            <button 
              onClick={() => navigate('/settings')}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              ⚙️
            </button>

            {/* Notifications */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '8px',
                  position: 'relative'
                }}
              >
                🔔
                <span style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  background: '#E74C3C',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600'
                }}>
                  2
                </span>
              </button>
            </div>

            {/* Profile */}
            <div style={{ position: 'relative' }}>
              <div 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  padding: '4px 12px',
                  borderRadius: '8px',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4A90E2, #357ABD)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px'
                }}>
                  👤
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#1F2937' }}>
                    {currentUser?.fullName || 'Guest'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>
                    User
                  </div>
                </div>
                <span style={{ fontSize: '12px', color: '#6B7280' }}>▼</span>
              </div>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  background: '#fff',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  minWidth: '200px',
                  zIndex: 1000
                }}>
                  {[
                    { title: 'Profile', action: () => navigate('/profile') },
                    { title: 'My Bookings', action: () => navigate('/bookings') },
                    { title: 'Settings', action: () => navigate('/settings') },
                    { title: 'Logout', action: handleLogout }
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        item.action();
                        setShowProfileMenu(false);
                      }}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        borderBottom: idx < 3 ? '1px solid #E5E7EB' : 'none',
                        transition: 'background 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {item.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div style={{ padding: '32px' }}>
          {/* Stats Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '16px',
            marginBottom: '32px'
          }}>
            {statsCards.map((card, idx) => (
              <div
                key={idx}
                style={{
                  background: card.bgGradient,
                  borderRadius: '16px',
                  padding: '20px 24px',
                  color: '#fff',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.3s ease',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  minHeight: '140px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ 
                  position: 'absolute', 
                  top: '16px', 
                  right: '20px', 
                  fontSize: '40px', 
                  opacity: 0.2
                }}>
                  {card.icon}
                </div>
                <div>
                  <div style={{ fontSize: '36px', fontWeight: '700', marginBottom: '4px', lineHeight: 1 }}>
                    {card.value}
                  </div>
                  <div style={{ fontSize: '15px', opacity: 0.95, fontWeight: '500' }}>
                    {card.title}
                  </div>
                </div>
                {card.badge && (
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.25)',
                    display: 'inline-block',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    alignSelf: 'flex-start',
                    marginTop: '8px'
                  }}>
                    {card.badge}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Event Categories and Upcoming Events */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1.2fr', 
            gap: '20px',
            marginBottom: '32px'
          }}>
            {/* Browse Categories */}
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1F2937', margin: 0 }}>
                  Browse Categories
                </h3>
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); navigate('/events'); }}
                  style={{ fontSize: '12px', color: '#4A90E2', textDecoration: 'none' }}
                >
                  View All →
                </a>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {eventCategories.map((category, idx) => (
                  <div
                    key={idx}
                    onClick={() => navigate('/events')}
                    style={{
                      padding: '16px',
                      background: `${category.color}10`,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      border: `2px solid ${category.color}30`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>{category.icon}</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1F2937', marginBottom: '4px' }}>
                      {category.title}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6B7280' }}>
                      {category.count} events
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Events */}
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1F2937', margin: 0 }}>
                  Upcoming Events
                </h3>
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); navigate('/events'); }}
                  style={{ fontSize: '12px', color: '#4A90E2', textDecoration: 'none' }}
                >
                  View All →
                </a>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {upcomingEvents.map((event) => (
                  <div key={event.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #4A90E2, #357ABD)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px'
                    }}>
                      {event.avatar}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1F2937' }}>
                        {event.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                        📍 {event.location} • 📅 {event.date}
                      </div>
                      <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
                        👥 {event.attendees} attendees
                      </div>
                    </div>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      background: event.status === 'Confirmed' ? '#D1FAE5' : '#FEF3C7',
                      color: event.status === 'Confirmed' ? '#059669' : '#D97706'
                    }}>
                      {event.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* My Bookings Table */}
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1F2937', margin: 0 }}>
                My Recent Bookings
              </h3>
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); navigate('/bookings'); }}
                style={{ fontSize: '12px', color: '#4A90E2', textDecoration: 'none' }}
              >
                View All →
              </a>
            </div>

            {myBookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#6B7280' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎫</div>
                <p style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>No bookings yet</p>
                <p style={{ fontSize: '14px', marginBottom: '20px' }}>Start exploring events and make your first booking!</p>
                <button
                  onClick={() => navigate('/events')}
                  style={{
                    padding: '10px 24px',
                    background: 'linear-gradient(135deg, #4A90E2, #357ABD)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Browse Events
                </button>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <th style={{ padding: '12px 0', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>Event</th>
                    <th style={{ padding: '12px 0', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>Date</th>
                    <th style={{ padding: '12px 0', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>Location</th>
                    <th style={{ padding: '12px 0', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>Attendees</th>
                    <th style={{ padding: '12px 0', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6B7280' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myBookings.slice(0, 5).map((booking, idx) => (
                    <tr key={booking.id} style={{ borderBottom: idx < Math.min(myBookings.length, 5) - 1 ? '1px solid #F3F4F6' : 'none' }}>
                      <td style={{ padding: '12px 0', fontSize: '13px', color: '#1F2937', fontWeight: '500' }}>
                        {booking.event?.title || 'Event'}
                      </td>
                      <td style={{ padding: '12px 0', fontSize: '13px', color: '#6B7280' }}>
                        {booking.event?.date || 'N/A'}
                      </td>
                      <td style={{ padding: '12px 0', fontSize: '13px', color: '#6B7280' }}>
                        {booking.event?.location || 'N/A'}
                      </td>
                      <td style={{ padding: '12px 0', fontSize: '13px', color: '#6B7280' }}>
                        {booking.attendeeCount || 1}
                      </td>
                      <td style={{ padding: '12px 0' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '600',
                          background: '#D1FAE5',
                          color: '#059669'
                        }}>
                          Confirmed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
