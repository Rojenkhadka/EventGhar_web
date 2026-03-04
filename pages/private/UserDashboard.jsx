import React, { useState, useEffect, useRef } from 'react';

import { useNavigate } from 'react-router-dom';
import { getMyBookings, cancelBooking, createBooking } from '../../src/api/bookings';
import { getPublicEvents } from '../../src/api/events';
import { getMe, updateMe } from '../../src/api/me';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../../src/api/notifications';

import EventGharLogo from '../../src/assets/images/EventGhar_logo.png';
import '../../src/styles/organizer_dashboard.css';
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  MapPin,
  Store,
  Heart,
  Settings,
  LogOut,
  User,
  Palette,
  Lock,
  Camera,
  Bell,
  Search,
  Trash2,
  Users
} from 'lucide-react';
import EventDetailsModal from '../../src/components/EventDetailsModal';
import BookingConfirmModal from '../../src/components/BookingConfirmModal';
import Sparkline from '../../src/components/Sparkline';
const UserDashboard = ({ currentUser }) => {
  const navigate = useNavigate();

  // Pre-populate from localStorage immediately so header never shows 'Guest'
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('eventghar_current_user');
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    return currentUser || null;
  });
  const [publicEvents, setPublicEvents] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [bookingFilter, setBookingFilter] = useState('Upcoming');
  const [bookingSearch, setBookingSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const bellRef = useRef();
  const notifDropdownRef = useRef();

   // Add missing states for notifications and modals
   const [notifications, setNotifications] = useState([]);
   const [unreadCount, setUnreadCount] = useState(0);
   const [detailsEvent, setDetailsEvent] = useState(null);
   const [bookingEvent, setBookingEvent] = useState(null);
   const [bookingLoading, setBookingLoading] = useState(false);
   const [bookingError, setBookingError] = useState("");

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const loadNotifications = async () => {
    try {
      const [notifs, count] = await Promise.all([
        getNotifications(),
        getUnreadCount()
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  // ── Initial data load ──────────────────────────────────────────────────────
  const loadData = async () => {
    setLoading(true);
    try {
      const [meData, eventsData, bookingsData] = await Promise.all([
        getMe().catch(() => null),
        getPublicEvents().catch(() => ({ events: [] })),
        getMyBookings().catch(() => ({ bookings: [] })),
      ]);

      if (meData) {
        setUser(meData);
        try {
          localStorage.setItem('eventghar_current_user', JSON.stringify(meData));
          if (meData.profilePic) localStorage.setItem('eventghar_profile_pic', meData.profilePic);
        } catch (_) {}
        window.dispatchEvent(new Event('eventghar_user_updated'));
      }

      const events = Array.isArray(eventsData?.events)
        ? eventsData.events
        : Array.isArray(eventsData)
          ? eventsData
          : [];
      setPublicEvents(events);

      setMyBookings(bookingsData?.bookings || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadNotifications();
    // refresh notifications every 30 seconds
    const t = setInterval(loadNotifications, 30_000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (showNotifications && unreadCount > 0) {
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  }, [showNotifications]);

  useEffect(() => {
    if (!showNotifications) return;
    const handleClick = (e) => {
      if (
        bellRef.current && bellRef.current.contains(e.target)
      ) return;
      if (
        notifDropdownRef.current && notifDropdownRef.current.contains(e.target)
      ) return;
      setShowNotifications(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showNotifications]);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('eventghar_token');
    localStorage.removeItem('eventghar_current_user');
    navigate('/login', { replace: true });
  };

  // Navigation handler
  const handleNavigation = (item) => {
    if (item.isLogout) {
      handleLogout();
      return;
    }

    // If the clicked item corresponds to an internal dashboard tab,
    // activate the tab instead of navigating away.
    const internalTabs = ['Dashboard', 'Events', 'My Bookings', 'Settings', 'Profile'];
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
  const statsCards = (() => {
    const now = new Date();
    const in7 = new Date();
    in7.setDate(now.getDate() + 7);

    const upcomingEventsCount = publicEvents.filter(e => {
      if (!e?.date) return false;
      const d = new Date(e.date);
      return e.status === 'APPROVED' && d >= now && d <= in7;
    }).length;

    const profileFields = ['fullName', 'email', 'profilePic'];
    const filled = profileFields.filter(f => !!user?.[f]).length;
    const profileCompletion = Math.round((filled / profileFields.length) * 100);

    return [
      {
        title: 'Available Events',
        value: publicEvents.length || 0,
        color: '#4A90E2',
        badge: `${publicEvents.length ? `+${Math.max(0, Math.floor(publicEvents.length * 0.25))} this week` : ''}`,
        bgGradient: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
        data: [Math.max(0, (publicEvents.length || 0) - 3), Math.max(0, (publicEvents.length || 0) - 1), (publicEvents.length || 0), (publicEvents.length || 0) + 2, (publicEvents.length || 0) + 4]
      },
      {
        title: 'My Bookings',
        value: myBookings.length || 0,
        color: '#5CB85C',
        badge: `${myBookings.filter(b => { const d = b.event?.date ? new Date(b.event.date) : null; return d ? d > new Date() : false; }).length} upcoming`,
        bgGradient: 'linear-gradient(135deg, #5CB85C 0%, #4CAF50 100%)',
        data: [Math.max(0, (myBookings.length || 0) - 2), Math.max(0, (myBookings.length || 0) - 1), (myBookings.length || 0), (myBookings.length || 0) + 1, (myBookings.length || 0) + 2]
      },
      {
        title: 'Upcoming Events',
        value: upcomingEventsCount,
        color: '#2563eb',
        badge: `${upcomingEventsCount} in 7 days`,
        bgGradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        data: [Math.max(0, upcomingEventsCount - 2), Math.max(0, upcomingEventsCount - 1), upcomingEventsCount, upcomingEventsCount + 1, upcomingEventsCount + 2]
      },
      {
        title: 'Profile Completion',
        value: profileCompletion,
        color: '#f59e0b',
        badge: profileCompletion >= 80 ? 'Profile complete' : 'Complete your profile',
        bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
        data: [Math.max(0, profileCompletion - 10), Math.max(0, profileCompletion - 5), profileCompletion - 2, profileCompletion, profileCompletion]
      }
    ];
  })();

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
    { name: 'Settings', icon: <Settings size={20} /> },
  ];

  // Track active tab for highlighting
  const [activeTab, setActiveTab] = useState('Dashboard');

  // Profile state (for Profile tab)
  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Settings state
  const [settingsSubTab, setSettingsSubTab] = useState('General');
  const [notifEventAlerts, setNotifEventAlerts] = useState(true);
  const [notifReminders, setNotifReminders] = useState(true);
  const [settingsForm, setSettingsForm] = useState({ name: '', displayName: '', email: '', phone: '', currentPassword: '', newPassword: '' });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Sync profile form when user data loads
  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.fullName || '', email: user.email || '' });
      setSettingsForm(f => ({ ...f, name: user.fullName || '', email: user.email || '', phone: user.phone || '' }));
      // Load notification preferences from user data
      setNotifEventAlerts(user.notifEventAlerts !== false);
      setNotifReminders(user.notifEventReminders !== false);
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

  // Settings avatar file input ref and handler
  const settingsPicInputRef = useRef(null);
  const handleSettingsProfilePicChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await updateMe({ profilePic: dataUrl });
      // fetch fresh user including profilePic
      const me = await getMe();
      setUser(me);
      try {
        localStorage.setItem('eventghar_profile_pic', dataUrl);
        localStorage.setItem('eventghar_current_user', JSON.stringify(me));
      } catch (err) {
        // ignore localStorage errors
      }
      window.dispatchEvent(new Event('eventghar_user_updated'));
    } catch (err) {
      console.error('Failed to upload profile pic', err);
    } finally {
      // clear the input so the same file can be selected again if needed
      if (settingsPicInputRef.current) settingsPicInputRef.current.value = '';
    }
  };

  // Helper to check if user has booked an event
  const hasBookedEvent = (eventId) => myBookings.some(b => b.eventId === eventId);

  const userName = user?.fullName || user?.name || 'User';
  const profilePic = user?.profilePic || null;

  return (
    <div className="org-layout">

      {/* ── Full-width Top Bar ── */}
      <header className="org-topbar">
        {/* Logo section */}
        <div style={{
          width: 260,
          minWidth: 260,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 20px',
          borderRight: '1px solid #e8edf3',
          height: '100%',
          flexShrink: 0,
        }}>
          <img src={EventGharLogo} alt="EventGhar" style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'contain' }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', letterSpacing: '-0.3px', lineHeight: 1.1 }}>EventGhar</div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500, letterSpacing: '0.5px' }}>Event Management</div>
          </div>
        </div>

        {/* Right: welcome + search + bell + profile */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', gap: 16 }}>
          {/* Page title */}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '1.0625rem', color: '#0f172a', letterSpacing: '-0.2px' }}>
              Welcome back{userName ? `, ${userName}` : ''}!
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 1 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </div>

          {/* search + bell + profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Search */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, color: '#94a3b8', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search events…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  paddingLeft: 34, paddingRight: 14, paddingTop: 8, paddingBottom: 8,
                  borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc',
                  fontSize: '0.875rem', color: '#0f172a', outline: 'none', width: 200, transition: 'border 0.2s, width 0.2s',
                }}
                onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.width = '240px'; }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.width = '200px'; }}
              />
            </div>

            {/* Bell */}
            <div
              ref={bellRef}
              style={{
                position: 'relative', width: 40, height: 40, borderRadius: 10,
                border: '1.5px solid #e2e8f0', background: '#f8fafc',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
              onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
              onClick={() => { const open = !showNotifications; setShowNotifications(open); if (open) loadNotifications(); }}
            >
              <Bell size={18} color="#475569" />
              {unreadCount > 0 && !showNotifications && (
                <span style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, background: '#ef4444', border: '2px solid #fff', display: 'block' }} />
              )}
              {showNotifications && (
                <div ref={notifDropdownRef} style={{
                  position: 'fixed', top: 70, right: 32, width: 380, maxHeight: 500,
                  background: 'white', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  zIndex: 1000, display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #e2e8f0'
                }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>
                      Notifications
                      {unreadCount > 0 && <span style={{ marginLeft: 8, background: '#ef4444', color: 'white', borderRadius: 12, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>{unreadCount}</span>}
                    </div>
                    <button onClick={async () => { if (unreadCount > 0) { setUnreadCount(0); setNotifications(prev => prev.map(n => ({ ...n, read: true }))); await markAllAsRead(); loadNotifications(); } }} disabled={unreadCount === 0}
                      style={{ background: 'transparent', border: 'none', color: unreadCount > 0 ? '#3b82f6' : '#cbd5e1', fontSize: 13, fontWeight: 600, cursor: unreadCount > 0 ? 'pointer' : 'not-allowed', opacity: unreadCount > 0 ? 1 : 0.6 }}>
                      Mark all read
                    </button>
                  </div>
                  <div style={{ overflowY: 'auto', maxHeight: 420 }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                        <Bell size={48} color="#cbd5e1" style={{ marginBottom: 12 }} />
                        <div>No notifications yet</div>
                      </div>
                    ) : notifications.map(notif => (
                      <div key={notif.id} onClick={async () => { if (!notif.read) { await markAsRead(notif.id); loadNotifications(); } }}
                        style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: notif.read ? 'white' : '#eff6ff', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = notif.read ? 'white' : '#eff6ff'}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: notif.read ? 'transparent' : '#3b82f6', marginTop: 6, flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 4 }}>{notif.title}</div>
                            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>{notif.message}</div>
                            <div style={{ fontSize: 12, color: '#94a3b8' }}>{new Date(notif.created_at).toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 28, background: '#e2e8f0', flexShrink: 0 }} />

            {/* Profile */}
            <div onClick={() => { setActiveTab('Settings'); setSettingsSubTab('General'); }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '6px 10px 6px 6px', borderRadius: 12, transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: 700, fontSize: '0.9375rem', color: '#fff', border: '2px solid #e2e8f0',
              }}>
                {profilePic
                  ? <img src={profilePic} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span>{userName.charAt(0).toUpperCase()}</span>
                }
              </div>
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a', whiteSpace: 'nowrap' }}>{userName}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>User</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar — starts below topbar */}
      <aside className="org-sidebar">
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
          <div className="org-nav-item logout" onClick={handleLogout}>
            <LogOut size={20} />
            Logout
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="org-main" style={{ paddingLeft: 32, paddingRight: 32 }}>

        {/* Dashboard Tab */}
        {activeTab === 'Dashboard' && (
          <>
            {/* Overview header */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ width: '100%' }}>
                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Dashboard Overview</h3>
                <div style={{ color: '#64748b', marginTop: 6, fontSize: 14 }}>Welcome back — here's a snapshot of your activity</div>
              </div>
            </div>

            <div className="org-stat-cards">
              {statsCards.map(card => (
                <div key={card.title} className="org-stat-card" style={{ color: card.color, background: card.bgGradient }}>
                  <div style={{ position: 'absolute', top: 12, right: 12 }}>
                    {/* Sparkline */}
                    <div style={{ width: 120, height: 44 }}>
                      <Sparkline data={card.data} width={120} height={44} stroke="rgba(255,255,255,0.95)" fill="rgba(255,255,255,0.12)" />
                    </div>
                  </div>
                  <div style={{ fontSize: 36, fontWeight: 900, color: 'rgba(255,255,255,0.95)', marginBottom: 8 }}>{card.value}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.95)', marginBottom: 6 }}>{card.title}</div>
                  {card.badge && <div style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.95)', display: 'inline-block', padding: '6px 12px', borderRadius: 12, fontWeight: 700 }}>{card.badge}</div>}
                </div>
              ))}
            </div>
            <div className="org-dashboard-section">
              <h3>Upcoming Events</h3>
              <div className="org-dashboard-event-grid">
                {publicEvents.filter(event => event.status === 'APPROVED').length === 0 ? (
                  <div className="org-placeholder">No upcoming events.</div>
                ) : (
                  publicEvents.filter(event => event.status === 'APPROVED').map(event => {
                    const maxAttendees = event.maxAttendees || 0;
                    const ticketsSold = event.ticketsSold || 0;
                    const availableSeats = maxAttendees - ticketsSold;
                    const isSoldOut = maxAttendees > 0 && availableSeats <= 0;
                    
                    return (
                    <div key={event.id} className="org-dashboard-event-card">
                      <div className="org-dashboard-event-image" style={{ backgroundImage: `url(${event.image || EventGharLogo})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                        {isSoldOut && (
                          <div style={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                            color: 'white',
                            padding: '6px 14px',
                            borderRadius: 8,
                            fontWeight: 700,
                            fontSize: 13,
                            letterSpacing: 0.5,
                            textTransform: 'uppercase',
                            boxShadow: '0 4px 12px rgba(239,68,68,0.4)'
                          }}>Sold Out</div>
                        )}
                      </div>
                      <div className="org-dashboard-event-content">
                        <div className="org-dashboard-event-title" style={{ fontWeight: 700, fontSize: '1.15rem', marginBottom: 6 }}>{event.title}</div>
                        <div style={{ color: '#64748b', fontSize: 14, marginBottom: 8 }}>
                          {event.organizerName && <span>By <strong>{event.organizerName}</strong></span>}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                          <span><strong>Date:</strong> {event.date ? new Date(event.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '-'}</span>
                          <span><strong>Location:</strong> {event.location || '-'}</span>
                          {maxAttendees > 0 && (
                            <span style={{ color: isSoldOut ? '#ef4444' : availableSeats <= 10 ? '#f59e0b' : '#10b981', fontWeight: 700 }}>
                              {isSoldOut ? (
                                <>
                                  <Ticket size={16} style={{ marginRight: 4, verticalAlign: 'middle' }} /> All Tickets Sold Out!
                                </>
                              ) : (
                                <>
                                  <Ticket size={16} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                                  {`${availableSeats} / ${maxAttendees} Seats Available`}
                                </>
                              )}
                            </span>
                          )}
                        </div>
                        {event.description && (
                          <div style={{ color: '#334155', fontSize: 14, marginBottom: 8, minHeight: 32 }}>
                            {event.description.length > 100 ? event.description.slice(0, 100) + '...' : event.description}
                          </div>
                        )}
                      </div>
                      <div className="org-dashboard-event-footer" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center', padding: 16 }}>
                        {hasBookedEvent(event.id) ? (
                          <button className="org-btn org-btn-success" style={{ minWidth: 0, background: '#6ee7b7', color: '#134e4a', fontWeight: 700, fontSize: 18, borderRadius: 14, padding: '14px 0', width: '100%' }} disabled>Booked</button>
                        ) : (
                          <>
                            <button className="org-btn org-btn-secondary" style={{ minWidth: 0 }} onClick={() => setDetailsEvent(event)}>View Details</button>
                            <button 
                              className="org-btn org-btn-primary" 
                              style={{ 
                                minWidth: 0,
                                opacity: isSoldOut ? 0.5 : 1,
                                cursor: isSoldOut ? 'not-allowed' : 'pointer',
                                background: isSoldOut ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                color: '#fff',
                                border: 'none',
                              }} 
                              onClick={() => !isSoldOut && setBookingEvent(event)}
                              disabled={isSoldOut}
                            >
                              {isSoldOut ? 'Sold Out' : 'Book'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                  })
                )}
              </div>
            </div>
          </>
        )}

        {/* Events Tab */}
        {activeTab === 'Events' && (
          <>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>Events</h2>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>Browse and book from all available upcoming events</p>
            </div>
            <div className="org-my-events">
            <div className="org-dashboard-event-grid">
              {publicEvents.filter(event => event.status === 'APPROVED').length === 0 && <div className="org-placeholder">No events available.</div>}
              {publicEvents.filter(event => event.status === 'APPROVED').map(event => {
                const maxAttendees = event.maxAttendees || 0;
                const ticketsSold = event.ticketsSold || 0;
                const availableSeats = maxAttendees - ticketsSold;
                const isSoldOut = maxAttendees > 0 && availableSeats <= 0;
                
                return (
                <div key={event.id} className="org-dashboard-event-card">
                  <div className="org-dashboard-event-image" style={{ backgroundImage: `url(${event.image || EventGharLogo})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                    {isSoldOut && (
                      <div style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        color: 'white',
                        padding: '6px 14px',
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: 13,
                        letterSpacing: 0.5,
                        textTransform: 'uppercase',
                        boxShadow: '0 4px 12px rgba(239,68,68,0.4)'
                      }}>Sold Out</div>
                    )}
                  </div>
                  <div className="org-dashboard-event-content">
                    <div className="org-dashboard-event-title" style={{ fontWeight: 700, fontSize: '1.15rem', marginBottom: 6 }}>{event.title}</div>
                    <div style={{ color: '#64748b', fontSize: 14, marginBottom: 8 }}>
                      {event.organizerName && <span>By <strong>{event.organizerName}</strong></span>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                      <span><strong>Date:</strong> {event.date ? new Date(event.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '-'}</span>
                      <span><strong>Location:</strong> {event.location || '-'}</span>
                      {maxAttendees > 0 && (
                        <span style={{ color: isSoldOut ? '#ef4444' : availableSeats <= 10 ? '#f59e0b' : '#10b981', fontWeight: 700 }}>
                          {isSoldOut ? (
                            <>
                              <Ticket size={16} style={{ marginRight: 4, verticalAlign: 'middle' }} /> All Tickets Sold Out!
                            </>
                          ) : (
                            <>
                              <Ticket size={16} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                              {`${availableSeats} / ${maxAttendees} Seats Available`}
                            </>
                          )}
                        </span>
                      )}
                    </div>
                    {event.description && (
                      <div style={{ color: '#334155', fontSize: 14, marginBottom: 8, minHeight: 32 }}>
                        {event.description.length > 100 ? event.description.slice(0, 100) + '...' : event.description}
                      </div>
                    )}
                  </div>
                  <div className="org-dashboard-event-footer" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center', padding: 16 }}>
                    {hasBookedEvent(event.id) ? (
                      <button className="org-btn org-btn-success" style={{ minWidth: 0, background: '#6ee7b7', color: '#134e4a', fontWeight: 700, fontSize: 18, borderRadius: 14, padding: '14px 0', width: '100%' }} disabled>Booked</button>
                    ) : (
                      <>
                        <button className="org-btn org-btn-secondary" style={{ minWidth: 0 }} onClick={() => setDetailsEvent(event)}>View Details</button>
                        <button 
                          className="org-btn org-btn-primary" 
                          style={{ 
                            minWidth: 0,
                            opacity: isSoldOut ? 0.5 : 1,
                            cursor: isSoldOut ? 'not-allowed' : 'pointer',
                            background: isSoldOut ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            color: '#fff',
                            border: 'none',
                          }} 
                          onClick={() => !isSoldOut && setBookingEvent(event)}
                          disabled={isSoldOut}
                        >
                          {isSoldOut ? 'Sold Out' : 'Book'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
              })}
            </div>
            </div>
          </>
        )}

        {/* My Bookings Tab */}
        {activeTab === 'My Bookings' && (() => {
          const now = new Date();
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const formatBookingDate = (dateInput, timeStr) => {
            if (!dateInput) return '';
            const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
            const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
            const month = months[d.getMonth()];
            const day = d.getDate();
            if (timeStr) {
              const match = String(timeStr).match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/i);
              if (match) {
                let h = parseInt(match[1], 10);
                const min = match[2];
                const ap = match[3];
                if (ap) {
                  if (ap.toUpperCase() === 'PM' && h < 12) h += 12;
                  if (ap.toUpperCase() === 'AM' && h === 12) h = 0;
                }
                const ampm = h >= 12 ? 'PM' : 'AM';
                const displayH = (h % 12 || 12).toString().padStart(2, '0');
                return `${month} ${day} • ${displayH}:${min} ${ampm}`;
              }
            }
            const hours = d.getHours();
            const minutes = d.getMinutes().toString().padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const displayHours = (hours % 12 || 12).toString().padStart(2, '0');
            return `${month} ${day} • ${displayHours}:${minutes} ${ampm}`;
          };
          const filteredBookings = myBookings
            .filter(booking => {
              const event = booking.event || {};
              const rawDate = event.date || booking.eventDate || null;
              const eventDate = rawDate ? new Date(rawDate) : null;
              const isCancelled = booking.status === 'CANCELLED' || booking.status === 'CANCELED';
              const isUpcomingEvt = eventDate ? eventDate >= startOfToday : true;
              const isPastEvt = eventDate ? eventDate < startOfToday : false;
              if (bookingFilter === 'Upcoming') return !isCancelled && isUpcomingEvt;
              if (bookingFilter === 'Completed') return !isCancelled && isPastEvt;
              if (bookingFilter === 'Cancelled') return isCancelled;
              return true;
            })
            .filter(booking => {
              if (!bookingSearch) return true;
              const s = bookingSearch.toLowerCase();
              const event = booking.event || {};
              return (event.title || booking.eventTitle || '').toLowerCase().includes(s)
                || (event.location || booking.eventLocation || '').toLowerCase().includes(s);
            });

          return (
            <div style={{ padding: '0 36px 36px 0', minHeight: '100%', background: '#f8fafc' }}>
              {/* Page Header */}
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontWeight: 800, fontSize: '1.75rem', color: '#0f172a', margin: 0 }}>My Bookings</h2>
                <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0' }}>Manage and view all your event bookings</p>
              </div>

              {/* Filter Tabs + Search Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
                {/* Filter Pills */}
                <div style={{ display: 'flex', gap: 4, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 50, padding: 4 }}>
                  {['Upcoming', 'Completed', 'Cancelled'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setBookingFilter(tab)}
                      style={{
                        padding: '8px 20px',
                        borderRadius: 50,
                        border: 'none',
                        background: bookingFilter === tab ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'transparent',
                        color: bookingFilter === tab ? '#fff' : '#64748b',
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                {/* Search Bar */}
                <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
                  <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    placeholder="Search events, venues..."
                    value={bookingSearch}
                    onChange={e => setBookingSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 16px 10px 40px',
                      borderRadius: 50,
                      border: '1px solid #e2e8f0',
                      background: '#fff',
                      fontSize: 14,
                      color: '#0f172a',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Booking List */}
              {filteredBookings.length === 0 ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', padding: '80px 20px', textAlign: 'center',
                  background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0',
                  boxShadow: '0 8px 32px rgba(30,41,59,0.08)',
                }}>
                  <div style={{
                    width: 100, height: 100, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
                  }}>
                    <Ticket size={44} color="#3b82f6" strokeWidth={1.5} />
                  </div>
                  <h3 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>
                    {myBookings.length === 0 ? 'No Bookings Yet' : `No ${bookingFilter} Bookings`}
                  </h3>
                  <p style={{ fontSize: 15, color: '#64748b', margin: '0 0 24px', maxWidth: 380 }}>
                    {myBookings.length === 0
                      ? "You haven't booked any events yet! Explore and book events from the Events tab."
                      : `You have no ${bookingFilter.toLowerCase()} bookings at this time.`}
                  </p>
                  {myBookings.length === 0 && (
                    <button
                      onClick={() => setActiveTab('Events')}
                      className="org-btn org-btn-primary"
                      style={{ fontSize: 15, padding: '13px 30px', borderRadius: 12 }}
                    >
                      Browse Events
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                  {filteredBookings.map(booking => {
                    const event = booking.event || {};
                    const isCancelled = booking.status === 'CANCELLED' || booking.status === 'CANCELED';
                    const isPending = booking.status === 'PENDING';
                    const eventTitle = event.title || booking.eventTitle || 'Event';
                    const eventDateRaw = event.date || booking.eventDate || null;
                    const eventDate = eventDateRaw ? new Date(eventDateRaw) : null;
                    const eventLocation = event.location || booking.eventLocation || null;
                    const eventImage = event.image || booking.eventImage || null;
                    const eventDescription = event.description || null;
                    const organizerName = event.organizerName || booking.organizerName || null;
                    const maxAttendees = event.maxAttendees || booking.eventMaxAttendees || null;
                    const ticketCount = booking.attendeeCount || booking.ticketCount || 1;
                    const eventTime = event.time || booking.eventTime || null;
                    const isUpcomingEvt = eventDate ? eventDate >= startOfToday : true;

                    const badgeBg = isCancelled
                      ? 'rgba(100,116,139,0.88)'
                      : isPending
                        ? 'rgba(245,158,11,0.92)'
                        : 'rgba(34,197,94,0.92)';
                    const badgeText = isCancelled ? 'CANCELLED' : isPending ? 'PENDING' : 'CONFIRMED';

                    return (
                      <div
                        key={booking.id}
                        style={{
                          background: '#fff',
                          borderRadius: 20,
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 2px 12px rgba(30,41,59,0.06)',
                          overflow: 'hidden',
                          transition: 'box-shadow 0.2s, transform 0.2s',
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(30,41,59,0.13)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(30,41,59,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                      >
                        {/* Banner Image */}
                        <div style={{ position: 'relative', width: '100%', height: 180, overflow: 'hidden', background: 'linear-gradient(135deg, #c7d2fe 0%, #a5b4fc 50%, #818cf8 100%)', flexShrink: 0 }}>
                          {eventImage ? (
                            <img
                              src={eventImage}
                              alt={eventTitle}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                              onError={e => { e.target.style.display = 'none'; e.target.parentNode.style.background = 'linear-gradient(135deg, #c7d2fe 0%, #818cf8 100%)'; }}
                            />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                              <Calendar size={52} color="rgba(255,255,255,0.7)" strokeWidth={1.2} />
                              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600 }}>No banner uploaded</span>
                            </div>
                          )}
                          {/* Gradient overlay for readability */}
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,0.55) 0%, transparent 60%)' }} />
                          {/* Status Badge */}
                          <div style={{
                            position: 'absolute', top: 12, left: 12,
                            background: badgeBg, color: '#fff',
                            fontSize: 11, fontWeight: 800, padding: '4px 12px',
                            borderRadius: 20, letterSpacing: 0.8,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                            backdropFilter: 'blur(4px)',
                          }}>
                            {badgeText}
                          </div>
                          {/* Date badge on image */}
                          {eventDate && (
                            <div style={{
                              position: 'absolute', bottom: 12, left: 12,
                              background: 'rgba(255,255,255,0.15)',
                              backdropFilter: 'blur(8px)',
                              color: '#fff',
                              fontSize: 12, fontWeight: 700, padding: '5px 12px',
                              borderRadius: 20, letterSpacing: 0.3,
                              border: '1px solid rgba(255,255,255,0.2)',
                            }}>
                              {formatBookingDate(eventDate, eventTime)}
                            </div>
                          )}
                        </div>

                        {/* Card Body */}
                        <div style={{ padding: '18px 20px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>
                            {eventTitle}
                          </h3>
                          {organizerName && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <span style={{ color: '#fff', fontSize: 10, fontWeight: 800 }}>{organizerName.charAt(0).toUpperCase()}</span>
                              </div>
                              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>By {organizerName}</span>
                            </div>
                          )}
                          {eventDescription && (
                            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {eventDescription}
                            </p>
                          )}
                          {/* Meta row */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
                            {eventLocation && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <MapPin size={13} color="#94a3b8" />
                                <span style={{ fontSize: 13, color: '#64748b', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {eventLocation}
                                </span>
                              </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <Ticket size={13} color="#94a3b8" />
                              <span style={{ fontSize: 13, color: '#64748b' }}>
                                {ticketCount} {ticketCount === 1 ? 'Ticket' : 'Tickets'}
                              </span>
                            </div>
                            {maxAttendees && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <Users size={13} color="#94a3b8" />
                                <span style={{ fontSize: 13, color: '#64748b' }}>{maxAttendees} capacity</span>
                              </div>
                            )}
                          </div>

                          {/* Booking ID */}
                          <div style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 600, marginTop: 2 }}>
                            Booking #{booking.id}
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div style={{
                          display: 'flex', gap: 10, padding: '12px 20px',
                          borderTop: '1px solid #f1f5f9', background: '#fafbfc',
                        }}>
                          {isCancelled ? (
                            <div style={{ flex: 1, textAlign: 'center', padding: '10px', color: '#94a3b8', fontSize: 14, fontWeight: 700 }}>
                              Booking Cancelled
                            </div>
                          ) : isPending ? (
                            <>
                              <button style={{
                                flex: 1, padding: '10px 18px', borderRadius: 12,
                                border: '1.5px solid #e2e8f0', background: '#f1f5f9',
                                color: '#64748b', fontSize: 14, fontWeight: 700, cursor: 'default',
                              }}>
                                Waiting for Confirmation
                              </button>
                              {isUpcomingEvt && (
                                <button
                                  onClick={async () => {
                                    if (window.confirm('Are you sure you want to cancel this booking?')) {
                                      try {
                                        await cancelBooking(booking.id);
                                        const bookingsRes = await getMyBookings();
                                        setMyBookings(bookingsRes?.bookings || []);
                                      } catch (err) {
                                        console.error('Failed to cancel booking:', err);
                                        alert('Failed to cancel booking. Please try again.');
                                      }
                                    }
                                  }}
                                  style={{
                                    width: 42, height: 42, borderRadius: 12,
                                    border: '1.5px solid #fee2e2', background: '#fff',
                                    cursor: 'pointer', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                    transition: 'background 0.2s',
                                  }}
                                  onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
                                  title="Cancel Booking"
                                >
                                  <Trash2 size={16} color="#ef4444" />
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                const fullEvent = publicEvents.find(e => e.id === event.id);
                                setDetailsEvent(fullEvent || event);
                              }}
                              style={{
                                flex: 1, padding: '10px 18px', borderRadius: 12,
                                border: 'none',
                                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                                transition: 'opacity 0.2s',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
                              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                            >
                              View Ticket
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* Settings Tab */}
        {(activeTab === 'Settings' || activeTab === 'Profile') && (() => {
          const inputStyle = {
            width: '100%', fontSize: 16, color: '#1e293b', background: '#f8fafc',
            border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '13px 18px',
            outline: 'none', fontWeight: 600, boxSizing: 'border-box', transition: 'border-color 0.2s',
          };
          const labelStyle = { fontWeight: 700, color: '#374151', fontSize: 14, marginBottom: 8, display: 'block' };
          const cardStyle = { background: '#fff', borderRadius: 18, border: '1px solid #e2e8f0', marginBottom: 24, overflow: 'hidden' };
          const cardHeaderStyle = { padding: '20px 32px', borderBottom: '1px solid #f1f5f9' };
          const cardBodyStyle = { padding: '28px 32px' };
          return (
            <div style={{ minHeight: '100%', background: '#f8fafc', padding: '0 36px 36px 0', boxSizing: 'border-box' }}>
              {/* Page header */}
              <div style={{ marginBottom: 16 }}>
                <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>Settings</h2>
                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>Manage your account, profile and notification preferences</p>
              </div>
              {/* Two-Column Layout */}
              <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

                {/* LEFT PANEL */}
                <div className="settings-left" style={{ width: 320, flexShrink: 0 }}>
                  {/* User Profile Card */}
                  <div style={{ ...cardStyle, marginBottom: 16, padding: '28px 22px', textAlign: 'center' }}>
                      <div style={{ position: 'relative', display: 'inline-block', marginBottom: 18 }}>
                      <input ref={settingsPicInputRef} type="file" accept="image/*" onChange={handleSettingsProfilePicChange} style={{ display: 'none' }} />
                      <div style={{
                        width: 100, height: 100, borderRadius: '50%',
                        background: (user?.profilePic || localStorage.getItem('eventghar_profile_pic')) ? 'transparent' : 'linear-gradient(135deg, #f4c08a, #e8a55a)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 40, fontWeight: 900, color: '#fff',
                        boxShadow: '0 6px 22px rgba(0,0,0,0.12)',
                        overflow: 'hidden',
                      }}>
                        {(user?.profilePic || localStorage.getItem('eventghar_profile_pic')) ? (
                          <img src={user?.profilePic || localStorage.getItem('eventghar_profile_pic')} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          user?.fullName?.charAt(0)?.toUpperCase() || 'U'
                        )}
                      </div>
                      <button aria-label="Change avatar" type="button" onClick={() => settingsPicInputRef.current && settingsPicInputRef.current.click()} style={{
                        position: 'absolute', bottom: 0, right: 0, width: 30, height: 30,
                        background: '#3b82f6', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '3px solid #fff', cursor: 'pointer', padding: 0,
                      }}>
                        <Camera size={13} color="#fff" />
                      </button>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>{user?.fullName || 'User'}</div>
                    <div style={{ color: '#64748b', fontSize: 13, marginTop: 6 }}>{user?.email || ''}</div>
                    <div style={{ marginTop: 12, display: 'inline-block', background: '#eff6ff', color: '#3b82f6', borderRadius: 22, padding: '6px 14px', fontSize: 13, fontWeight: 800 }}>Attendee</div>
                  </div>

                  {/* Settings Navigation */}
                  <div style={{ ...cardStyle, marginBottom: 14 }}>
                    {[
                      { id: 'General', icon: <User size={18} />, desc: 'Profile & notifications' },
                      { id: 'Preferences', icon: <Palette size={18} />, desc: 'Appearance & language' },
                      { id: 'Security', icon: <Lock size={18} />, desc: 'Password & access' },
                    ].map((item, i, arr) => (
                      <div key={item.id} onClick={() => setSettingsSubTab(item.id)} style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '18px 20px',
                        cursor: 'pointer', transition: 'background 0.15s',
                        background: settingsSubTab === item.id ? '#eff6ff' : '#fff',
                        borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none',
                        borderLeft: `4px solid ${settingsSubTab === item.id ? '#3b82f6' : 'transparent'}`,
                      }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: settingsSubTab === item.id ? '#ebf5ff' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {item.icon}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: 15, color: settingsSubTab === item.id ? '#3b82f6' : '#0f172a' }}>{item.id}</div>
                          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.desc}</div>
                        </div>
                        {settingsSubTab === item.id && <span style={{ marginLeft: 'auto', color: '#3b82f6', fontSize: 16 }}>›</span>}
                      </div>
                    ))}
                  </div>

                  {/* Logout */}
                  <div onClick={handleLogout} style={{
                    background: '#fff', border: '1px solid #fee2e2', borderRadius: 14, padding: '16px 20px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <LogOut size={18} color="#ef4444" />
                    <span style={{ fontWeight: 800, color: '#ef4444', fontSize: 15 }}>Log Out from EventGhar</span>
                  </div>
                </div>

                {/* RIGHT PANEL */}
                <div className="settings-right" style={{ flex: 1, minWidth: 0 }}>

                  {/* General Tab */}
                  {settingsSubTab === 'General' && (
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      setSettingsSaving(true);
                      setSettingsError('');
                      setSettingsSuccess('');
                      const prevName = user?.fullName || '';
                      try {
                        await updateMe({ 
                          name: settingsForm.name, 
                          email: settingsForm.email, 
                          phone: settingsForm.phone,
                          notifEventAlerts,
                          notifEventReminders: notifReminders
                        });
                        // Fetch fresh user (includes all fields like profilePic)
                        const me = await getMe();
                        setUser(me);
                        // Persist full user to localStorage so reloads reflect changes
                        try { localStorage.setItem('eventghar_current_user', JSON.stringify(me)); } catch (err) {}
                        window.dispatchEvent(new Event('eventghar_user_updated'));
                        // Show success message when name changed
                        if (prevName !== (me.fullName || '')) {
                          setSettingsSuccess('Name changed successfully');
                          setTimeout(() => setSettingsSuccess(''), 3000);
                        }
                      } catch (err) {
                        console.error('Update profile error:', err);
                        setSettingsError(err.message || 'Failed to update profile.');
                      } finally {
                        setSettingsSaving(false);
                      }
                    }}>

                      {/* Personal Details Card */}
                      <div style={cardStyle}>
                        <div style={cardHeaderStyle}>
                          <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Personal Details</div>
                          <div style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>Update your name, email and contact information</div>
                        </div>
                        <div style={cardBodyStyle}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 18 }}>
                            <div>
                              <label style={labelStyle}>Full Name</label>
                              <input style={inputStyle} value={settingsForm.name} onChange={e => setSettingsForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" required />
                            </div>
                            <div>
                              <label style={labelStyle}>Display Name</label>
                              <input style={inputStyle} value={settingsForm.displayName} onChange={e => setSettingsForm(f => ({ ...f, displayName: e.target.value }))} placeholder="How others see you" />
                            </div>
                          </div>
                          <div style={{ marginBottom: 18 }}>
                            <label style={labelStyle}>Email Address</label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                              <input style={{ ...inputStyle, paddingRight: 90 }} value={settingsForm.email} onChange={e => setSettingsForm(f => ({ ...f, email: e.target.value }))} placeholder="your@email.com" />
                              <span style={{ position: 'absolute', right: 12, background: '#dcfce7', color: '#16a34a', fontWeight: 800, fontSize: 10, borderRadius: 6, padding: '3px 8px', letterSpacing: 0.5 }}>VERIFIED</span>
                            </div>
                          </div>
                          <div style={{ maxWidth: 340 }}>
                            <label style={labelStyle}>Phone Number</label>
                            <input style={inputStyle} value={settingsForm.phone} onChange={e => setSettingsForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 (555) 000-0000" type="tel" />
                          </div>
                        </div>
                      </div>

                      {/* Notifications Card */}
                      <div style={cardStyle}>
                        <div style={cardHeaderStyle}>
                          <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>Notifications</div>
                          <div style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Choose what updates you want to receive</div>
                        </div>
                        <div style={cardBodyStyle}>
                          {[
                            { label: 'New Event Alerts', sub: 'Notify me about upcoming events in my area', val: notifEventAlerts, set: setNotifEventAlerts },
                            { label: 'Event Reminders', sub: 'Send reminders 24 hours before booked events', val: notifReminders, set: setNotifReminders },
                          ].map((n, i, arr) => (
                            <div key={n.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: i < arr.length - 1 ? 18 : 0, marginBottom: i < arr.length - 1 ? 18 : 0, borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                              <div>
                                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 15 }}>{n.label}</div>
                                <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>{n.sub}</div>
                              </div>
                              <div onClick={() => n.set(!n.val)} style={{
                                width: 44, height: 26, borderRadius: 13, cursor: 'pointer', transition: 'background 0.2s',
                                background: n.val ? '#3b82f6' : '#cbd5e1', position: 'relative', flexShrink: 0,
                              }}>
                                <div style={{
                                  position: 'absolute', top: 3, left: n.val ? 21 : 3, width: 20, height: 20,
                                  borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
                                  boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                                }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Row */}
                      {settingsError && <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 14, marginBottom: 16, padding: '12px 18px', background: '#fef2f2', borderRadius: 12, border: '1px solid #fee2e2' }}>{settingsError}</div>}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14 }}>
                        <button type="button" onClick={() => setSettingsForm(f => ({ ...f, name: user?.fullName || '', email: user?.email || '' }))} style={{
                          padding: '12px 26px', borderRadius: 12, border: '1.5px solid #e2e8f0',
                          background: '#fff', color: '#374151', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                        }}>Reset</button>
                        <button type="submit" disabled={settingsSaving} style={{
                          padding: '12px 32px', borderRadius: 12, border: 'none', cursor: 'pointer',
                          background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                          color: '#fff', fontWeight: 800, fontSize: 15,
                          boxShadow: '0 6px 18px rgba(59,130,246,0.28)', opacity: settingsSaving ? 0.8 : 1,
                        }}>{settingsSaving ? 'Saving…' : 'Save Changes'}</button>
                      </div>
                    </form>
                  )}

                  {/* Preferences Tab */}
                  {settingsSubTab === 'Preferences' && (
                    <div style={cardStyle}>
                      <div style={cardHeaderStyle}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Preferences</div>
                        <div style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>Customize your app experience</div>
                      </div>
                      <div style={{ ...cardBodyStyle, color: '#94a3b8', fontSize: 14, textAlign: 'center', padding: '48px 28px' }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>🎨</div>
                        <div style={{ fontWeight: 600, color: '#64748b' }}>Preferences coming soon</div>
                        <div style={{ fontSize: 13, marginTop: 4 }}>Theme, language, and display settings will appear here.</div>
                      </div>
                    </div>
                  )}

                  {/* Security Tab */}
                  {settingsSubTab === 'Security' && (
                    <div style={cardStyle}>
                      <div style={cardHeaderStyle}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Change Password</div>
                        <div style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>Keep your account secure with a strong password</div>
                      </div>
                      <div style={cardBodyStyle}>
                        <div style={{ maxWidth: 420 }}>
                          <div style={{ marginBottom: 18 }}>
                            <label style={labelStyle}>Current Password</label>
                            <input style={inputStyle} type="password" value={settingsForm.currentPassword} onChange={e => setSettingsForm(f => ({ ...f, currentPassword: e.target.value }))} placeholder="Enter your current password" />
                          </div>
                          <div style={{ marginBottom: 24 }}>
                            <label style={labelStyle}>New Password</label>
                            <input style={inputStyle} type="password" value={settingsForm.newPassword} onChange={e => setSettingsForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="Choose a strong new password" />
                          </div>
                          <div style={{ display: 'flex', gap: 12 }}>
                            <button
                              type="button"
                              onClick={async () => {
                                setSettingsError('');
                                setSettingsSuccess('');
                                if (!settingsForm.currentPassword || !settingsForm.newPassword) {
                                  setSettingsError('Both current and new password are required.');
                                  return;
                                }
                                setSettingsSaving(true);
                                try {
                                  await updateMe({ currentPassword: settingsForm.currentPassword, password: settingsForm.newPassword });
                                  // refresh user
                                  const me = await getMe();
                                  setUser(me);
                                  try { localStorage.setItem('eventghar_current_user', JSON.stringify(me)); } catch (e) {}
                                  window.dispatchEvent(new Event('eventghar_user_updated'));
                                  setSettingsSuccess('Password updated successfully');
                                  setSettingsForm(f => ({ ...f, currentPassword: '', newPassword: '' }));
                                  setTimeout(() => setSettingsSuccess(''), 3000);
                                } catch (err) {
                                  console.error('Password update failed', err);
                                  setSettingsError(err?.message || 'Failed to update password');
                                } finally {
                                  setSettingsSaving(false);
                                }
                              }}
                              style={{
                                padding: '10px 28px', borderRadius: 10, border: 'none', cursor: 'pointer',
                                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                                color: '#fff', fontWeight: 700, fontSize: 14,
                                boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
                              }}
                            >{settingsSaving ? 'Updating…' : 'Update Password'}</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          );
        })()}
      </main>
      
      {/* Event Details Modal */}
      <EventDetailsModal event={detailsEvent} onClose={() => setDetailsEvent(null)} />

      {/* Booking Confirmation Modal */}
      <BookingConfirmModal
        event={bookingEvent}
        open={!!bookingEvent}
        loading={bookingLoading}
        error={bookingError}
        onCancel={() => { setBookingEvent(null); setBookingError(""); }}
        onConfirm={async () => {
          if (!bookingEvent) return;
          setBookingLoading(true);
          setBookingError("");
          try {
            await createBooking({ eventId: bookingEvent.id });
            setBookingEvent(null);
            // Always reload from API to get full event data (title, image, location, etc.)
            const bookingsRes = await getMyBookings();
            setMyBookings(bookingsRes?.bookings || []);
          } catch (err) {
            setBookingError(err?.message || 'Failed to send booking request.');
          } finally {
            setBookingLoading(false);
          }
        }}
      />

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div style={{
          position: 'fixed',
          top: 70,
          right: 32,
          width: 380,
          maxHeight: 500,
          background: 'white',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #e2e8f0'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>
              Notifications
              {unreadCount > 0 && (
                <span style={{
                  marginLeft: 8,
                  background: '#ef4444',
                  color: 'white',
                  borderRadius: 12,
                  padding: '2px 8px',
                  fontSize: 12,
                  fontWeight: 700
                }}>
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={async () => {
                if (unreadCount > 0) {
                  setUnreadCount(0); // Optimistically hide the dot
                  setNotifications(prev => prev.map(n => ({ ...n, read: true }))); // Mark all as read locally
                  await markAllAsRead();
                  loadNotifications();
                }
              }}
              disabled={unreadCount === 0}
              style={{
                background: 'transparent',
                border: 'none',
                color: unreadCount > 0 ? '#3b82f6' : '#cbd5e1',
                fontSize: 13,
                fontWeight: 600,
                cursor: unreadCount > 0 ? 'pointer' : 'not-allowed',
                opacity: unreadCount > 0 ? 1 : 0.6
              }}
            >
              Mark all read
            </button>
          </div>

          {/* Notifications List */}
          <div style={{ overflowY: 'auto', maxHeight: 420 }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: 14
              }}>
                <Bell size={48} color="#cbd5e1" style={{ marginBottom: 12 }} />
                <div>No notifications yet</div>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={async () => {
                    if (!notif.read) {
                      await markAsRead(notif.id);
                      loadNotifications();
                    }
                  }}
                  style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid #f1f5f9',
                    cursor: 'pointer',
                    background: notif.read ? 'white' : notif.type === 'event_cancelled' ? '#fee2e2' : '#eff6ff',
                    transition: 'background 0.2s',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = notif.type === 'event_cancelled' ? '#fecaca' : '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = notif.read ? 'white' : notif.type === 'event_cancelled' ? '#fee2e2' : '#eff6ff'}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12
                  }}>
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: notif.read ? 'transparent' : notif.type === 'event_cancelled' ? '#ef4444' : '#3b82f6',
                      marginTop: 6,
                      flexShrink: 0
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 700,
                        fontSize: 14,
                        color: notif.type === 'event_cancelled' ? '#ef4444' : '#0f172a',
                        marginBottom: 4
                      }}>
                        {notif.title}
                        {notif.type === 'event_cancelled' && (
                          <span style={{
                            marginLeft: 8,
                            background: '#ef4444',
                            color: 'white',
                            borderRadius: 8,
                            padding: '2px 8px',
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: 0.5,
                            textTransform: 'uppercase',
                          }}>Cancelled</span>
                        )}
                      </div>
                      <div style={{
                        fontSize: 13,
                        color: '#64748b',
                        marginBottom: 6
                      }}>
                        {notif.message}
                      </div>
                      <div style={{
                        fontSize: 12,
                        color: '#94a3b8'
                      }}>
                        {new Date(notif.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      {/* Confirm Logout Modal */}
      {showLogoutModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(30, 41, 59, 0.35)', zIndex: 2000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'white', borderRadius: 16,
            boxShadow: '0 8px 32px rgba(30,41,59,0.18)',
            padding: '36px 32px 28px 32px',
            minWidth: 340, maxWidth: '90vw', textAlign: 'center', zIndex: 2001,
          }}>
            <h3 style={{ fontWeight: 800, fontSize: 22, color: '#0f172a', marginBottom: 18 }}>Confirm Logout</h3>
            <p style={{ color: '#64748b', fontSize: 15, marginBottom: 28 }}>Are you sure you want to log out?</p>
            <div style={{ display: 'flex', gap: 20, justifyContent: 'center', paddingTop: 6 }}>
              <button
                onClick={() => setShowLogoutModal(false)}
                style={{
                  background: '#f1f5f9',
                  color: '#64748b',
                  fontWeight: 700,
                  fontSize: 15,
                  border: 'none',
                  borderRadius: 18,
                  padding: '14px 44px',
                  cursor: 'pointer',
                  boxShadow: 'none'
                }}
              >Cancel</button>
              <button
                onClick={confirmLogout}
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 15,
                  border: 'none',
                  borderRadius: 18,
                  padding: '14px 44px',
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(220,38,38,0.18)'
                }}
              >Log Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserDashboard;
