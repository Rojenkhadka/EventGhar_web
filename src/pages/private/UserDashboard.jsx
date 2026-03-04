

import {
  LayoutDashboard,
  Calendar,
  Ticket,
  User,
  LogOut,
  Search,
  Bell,
  ChevronRight
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../../api/notifications';

const SIDEBAR_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { key: 'events', label: 'Events', icon: <Calendar size={20} /> },
  { key: 'bookings', label: 'My Bookings', icon: <Ticket size={20} /> },
  { key: 'profile', label: 'Profile', icon: <User size={20} /> },
  { key: 'logout', label: 'Logout', icon: <LogOut size={20} /> },
];



export default function UserDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // ── Notifications ──
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const bellRef = useRef(null);

  const loadNotifications = async () => {
    try {
      const [notifs, count] = await Promise.all([getNotifications(), getUnreadCount()]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  const [userName, setUserName] = useState(() => {
    const userData = JSON.parse(localStorage.getItem('eventghar_current_user') || '{}');
    return userData.fullName || userData.name || 'User';
  });
  const [profilePic, setProfilePic] = useState(() => {
    const userData = JSON.parse(localStorage.getItem('eventghar_current_user') || '{}');
    return userData.profilePic || null;
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Clear old global profile pic cache to prevent showing other users' pictures
    localStorage.removeItem('eventghar_profile_pic');
    
    const syncUserData = () => {
      const userData = JSON.parse(localStorage.getItem('eventghar_current_user') || '{}');
      setUserName(userData.fullName || userData.name || 'User');
      setProfilePic(userData.profilePic || null);
    };
    window.addEventListener('storage', syncUserData);
    window.addEventListener('eventghar_user_updated', syncUserData);
    syncUserData();
    return () => {
      window.removeEventListener('storage', syncUserData);
      window.removeEventListener('eventghar_user_updated', syncUserData);
    };
  }, []);

  useEffect(() => {
    // Also check server as secondary source
    // Optionally, you can fetch user profile pic from server if needed
  }, []);

  useEffect(() => {
    loadNotifications();
    const t = setInterval(loadNotifications, 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (showNotifications && unreadCount > 0) {
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  }, [showNotifications]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setShowNotifications(false);
    };
    if (showNotifications) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const handleSidebarClick = (key) => {
    if (key === 'logout') {
      clearAuthSession();
      navigate('/');
      return;
    }
    setActiveSection(key);
  };

  return (
    <div className="user-dashboard-container" style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <aside
        className="sidebar"
        style={{
          width: 220,
          background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '32px 0',
          boxShadow: '2px 0 16px rgba(59,130,246,0.08)',
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 32, letterSpacing: -1 }}>User Dashboard</div>
        <ul style={{ listStyle: 'none', padding: 0, width: '100%' }}>
          {SIDEBAR_ITEMS.map((item) => (
            <li
              key={item.key}
              className={activeSection === item.key ? 'active' : ''}
              onClick={() => handleSidebarClick(item.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 32px',
                fontWeight: 600,
                fontSize: 16,
                borderRadius: 12,
                marginBottom: 8,
                cursor: 'pointer',
                background: activeSection === item.key ? 'rgba(255,255,255,0.18)' : 'none',
                boxShadow: activeSection === item.key ? '0 2px 8px rgba(59,130,246,0.10)' : 'none',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.10)')}
              onMouseLeave={e => (e.currentTarget.style.background = activeSection === item.key ? 'rgba(255,255,255,0.18)' : 'none')}
            >
              {item.icon}
              {item.label}
            </li>
          ))}
        </ul>
      </aside>
      <main className="dashboard-content" style={{ flex: 1, padding: 0 }}>
        {/* Top Bar - New Organizer Style */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 48px',
          height: 96,
          background: '#fff',
          borderBottom: '1px solid #e8edf3',
          boxShadow: '0 1px 4px rgba(15,23,42,0.05)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          width: '100%',
          alignSelf: 'stretch',
        }}>
          {/* Left: Title and date */}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 32, color: '#0f172a', letterSpacing: '-1px', lineHeight: 1.1 }}>
              {SIDEBAR_ITEMS.find(i => i.key === activeSection)?.label || ''}
            </div>
            <div style={{ fontSize: 18, color: '#94a3b8', marginTop: 4, fontWeight: 500 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </div>

          {/* Right: search + bell + divider + profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* Search */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', background: '#f8fafc', borderRadius: 12, border: '2px solid #e2e8f0', padding: '0 24px', height: 56, minWidth: 320 }}>
              <Search size={22} style={{ color: '#94a3b8', marginRight: 8 }} />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  width: 220,
                  fontSize: 20,
                  background: 'transparent',
                  color: '#64748b',
                  height: 56,
                }}
              />
            </div>

            {/* Bell */}
            <div
              ref={bellRef}
              style={{ position: 'relative', cursor: 'pointer', background: '#f8fafc', borderRadius: 12, width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #e2e8f0' }}
              onClick={() => { const open = !showNotifications; setShowNotifications(open); if (open) loadNotifications(); }}
            >
              <Bell size={26} style={{ color: '#64748b' }} />
              {unreadCount > 0 && !showNotifications && (
                <span style={{ position: 'absolute', top: 14, right: 14, background: '#ef4444', width: 12, height: 12, borderRadius: 6, border: '2px solid #fff', display: 'block' }} />
              )}
              {showNotifications && (
                <div style={{ position: 'fixed', top: 80, right: 32, width: 380, maxHeight: 500, background: 'white', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.14)', zIndex: 1000, display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>
                      Notifications
                      {unreadCount > 0 && <span style={{ marginLeft: 8, background: '#ef4444', color: 'white', borderRadius: 12, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>{unreadCount}</span>}
                    </div>
                    <button
                      onClick={async (e) => { e.stopPropagation(); if (unreadCount > 0) { setUnreadCount(0); setNotifications(prev => prev.map(n => ({ ...n, read: true }))); await markAllAsRead(); loadNotifications(); } }}
                      disabled={unreadCount === 0}
                      style={{ background: 'transparent', border: 'none', color: unreadCount > 0 ? '#3b82f6' : '#cbd5e1', fontSize: 13, fontWeight: 600, cursor: unreadCount > 0 ? 'pointer' : 'not-allowed' }}
                    >
                      Mark all read
                    </button>
                  </div>
                  <div style={{ overflowY: 'auto', maxHeight: 420 }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                        <Bell size={40} color="#cbd5e1" style={{ marginBottom: 12 }} />
                        <div style={{ marginTop: 8 }}>No notifications yet</div>
                      </div>
                    ) : notifications.map(notif => (
                      <div key={notif.id}
                        onClick={async (e) => { e.stopPropagation(); if (!notif.read) { await markAsRead(notif.id); loadNotifications(); } }}
                        style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: notif.read ? 'white' : '#eff6ff', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = notif.read ? 'white' : '#eff6ff'}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: notif.read ? 'transparent' : '#3b82f6', marginTop: 6, flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 4 }}>{notif.title}</div>
                            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>{notif.message}</div>
                            <div style={{ fontSize: 12, color: '#94a3b8' }}>{notif.createdAt ? new Date(notif.createdAt).toLocaleString() : ''}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div style={{ width: 2, height: 40, background: '#e2e8f0', margin: '0 12px' }} />

            {/* Profile Card */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }} onClick={() => setActiveSection('profile')}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: profilePic ? 'none' : 'linear-gradient(135deg,#3b82f6,#7c3aed)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 24 }}>
                {profilePic
                  ? <img src={profilePic} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  : userName.charAt(0).toUpperCase()
                }
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 20 }}>{userName}</div>
                <div style={{ fontSize: 16, color: '#64748b', fontWeight: 500 }}>Attendee</div>
              </div>
            </div>
          </div>
        </div>
        {/* Main Content */}
        <div style={{ padding: '40px 48px' }}>
          {activeSection === 'dashboard' && <DashboardOverview />}
          {activeSection === 'events' && <EventsExplorer />}
          {activeSection === 'bookings' && <MyBookings />}
          {activeSection === 'profile' && <ProfileSection />}
        </div>
      </main>
    </div>
  );
}
