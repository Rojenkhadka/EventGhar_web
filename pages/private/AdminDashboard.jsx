import { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Users, UserCheck, CalendarDays, Settings, LogOut, Bell, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, getAdminStats, getWeeklyRegistrations, updateUserRole, deleteUser, blockUser } from '../../src/api/admin';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../../src/api/notifications';

import eventGharLogo from '../../src/assets/images/EventGhar.png';
import '../../src/styles/admin_dashboard.css';

const AdminDashboard = ({ currentUser }) => {
    // Dashboard message for block/unblock actions
    const [blockMessage, setBlockMessage] = useState('');
    const [blockMessageType, setBlockMessageType] = useState('success'); // 'success' | 'error'
    const blockMsgTimerRef = useRef(null);
    const showBlockMessage = (msg, type = 'success') => {
      if (blockMsgTimerRef.current) clearTimeout(blockMsgTimerRef.current);
      setBlockMessage(msg);
      setBlockMessageType(type);
      blockMsgTimerRef.current = setTimeout(() => setBlockMessage(''), 5000);
    };
    // Confirmation dialog state
    const [confirmDialog, setConfirmDialog] = useState({ show: false, user: null, action: null });
    const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();
  const [allUsers, setAllUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalBookings: 0,
    totalOrganizers: 0
  });
  const [pendingCount, setPendingCount] = useState(0);
  const [weeklyRegistrations, setWeeklyRegistrations] = useState({ count: 0, changePct: 0, series: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [adminEvents, setAdminEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState('');
  // Event moderation for admins
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [accountStatusFilter, setAccountStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [eventSearch, setEventSearch] = useState('');
  const [eventStatusFilter, setEventStatusFilter] = useState('');
  // Admin settings state
  const [settingsName, setSettingsName] = useState('');
  const [settingsEmail, setSettingsEmail] = useState('');
  const [settingsCurrentPassword, setSettingsCurrentPassword] = useState('');
  const [settingsNewPassword, setSettingsNewPassword] = useState('');
  const [settingsSaved, setSettingsSaved] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [settingsSubTab, setSettingsSubTab] = useState('General');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [notifEventAlerts, setNotifEventAlerts] = useState(true);
  const [notifReminders, setNotifReminders] = useState(true);

  // ── Notification state ──
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

  const loadAdminEvents = async () => {
    setEventsLoading(true);
    setEventsError('');
    try {
      const { getAllEventsAdmin } = await import('../../src/api/admin');
      const res = await getAllEventsAdmin();
      setAdminEvents(res.events || []);
    } catch (err) {
      setEventsError('Failed to load events');
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'Events') loadAdminEvents();
  }, [activeTab]);

  const handleApproveEvent = async (id) => {
    try {
      const { approveEvent } = await import('../../src/api/admin');
      await approveEvent(id);
      loadAdminEvents();
    } catch (err) {
      console.error('Failed to approve event:', err);
    }
  };
  const handleRejectEvent = async (id) => {
    try {
      const { rejectEvent } = await import('../../src/api/admin');
      await rejectEvent(id);
      loadAdminEvents();
    } catch (err) {
      console.error('Failed to reject event:', err);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Permanently delete this event? This cannot be undone.')) return;
    try {
      const { deleteEventAdmin } = await import('../../src/api/admin');
      await deleteEventAdmin(id);
      setAdminEvents(prev => prev.filter(e => e.id !== id));
    } catch {
      setEventsError('Failed to delete event.');
      setTimeout(() => setEventsError(null), 4000);
    }
  };

  const [selectedEvent, setSelectedEvent] = useState(null);

  // Get user data from localStorage
  const userData = JSON.parse(localStorage.getItem('eventghar_current_user') || '{}');
  const userName = userData.fullName || currentUser?.fullName || 'Super Admin';

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    loadNotifications();
    const t = setInterval(loadNotifications, 30_000);
    return () => clearInterval(t);
  }, []);

  // Clear red dot when dropdown opens
  useEffect(() => {
    if (showNotifications && unreadCount > 0) {
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  }, [showNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setShowNotifications(false);
    };
    if (showNotifications) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const loadAdminData = async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        getAllUsers(),
        getAdminStats()
      ]);

      const users = usersRes?.users || [];
      setAllUsers(users);

      const statsData = statsRes?.stats || {
        totalUsers: 0,
        totalEvents: 0,
        totalBookings: 0,
        totalOrganizers: 0
      };
      setStats(statsData);

      // Pending events count
      try {
        const { getPendingEvents } = await import('../../src/api/admin');
        const pendingRes = await getPendingEvents();
        setPendingCount(pendingRes?.events?.length || 0);
      } catch (e) {
        setPendingCount(0);
      }

      // Weekly registrations: fetch from server-side analytics endpoint
      try {
        const res = await getWeeklyRegistrations();
        const weekly = res?.weekly || { counts: [], total: 0, changePct: 0 };
        setWeeklyRegistrations({ count: weekly.total || 0, changePct: weekly.changePct || 0, series: weekly.counts || [] });
      } catch (e) {
        console.warn('Failed to fetch weekly registrations analytics, falling back to client-side derive', e);
        // Fallback: derive from users list (lightweight)
        const usersList = usersRes?.users || [];
        const now = new Date();
        const oneDay = 24 * 60 * 60 * 1000;
        const last7 = new Array(7).fill(0);
        usersList.forEach(u => {
          const d = u.createdAt ? new Date(u.createdAt) : null;
          if (!d) return;
          const diffDays = Math.floor((now - d) / oneDay);
          if (diffDays >= 0 && diffDays < 7) {
            last7[6 - diffDays] += 1;
          }
        });
        const count = last7.reduce((a, b) => a + b, 0);
        const prevWeekCount = Math.max(1, count - Math.floor(count * 0.15));
        const pct = Math.round(((count - prevWeekCount) / prevWeekCount) * 10000) / 100;
        setWeeklyRegistrations({ count, changePct: pct, series: last7 });
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('eventghar_token');
    localStorage.removeItem('eventghar_current_user');
    navigate('/login', { replace: true });
  };

  const handlePromoteToOrganizer = async (userId) => {
    if (!confirm('Promote this user to Organizer?')) return;
    try {
      await updateUserRole(userId, 'ORGANIZER');
      // refresh users
      const res = await getAllUsers();
      setAllUsers(res?.users || []);
    } catch (e) {
      console.error(e);
      alert('Failed to update user role');
    }
  };

  const [deleteUserId, setDeleteUserId] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const handleRemoveUser = async (userId) => {
    setDeleteUserId(userId);
  };
  const confirmDeleteUser = async () => {
    try {
      await deleteUser(deleteUserId);
      setAllUsers(prev => prev.filter(u => u.id !== deleteUserId));
      setDeleteUserId(null);
      setDeleteError("");
    } catch (e) {
      setDeleteError("Failed to delete user. Please try again.");
    }
  };

  const handleUpdateUser = async (userId) => {
    try {
      const newName = prompt('Enter new full name');
      if (!newName) return;
      // local optimistic update; backend update endpoint not implemented here
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, fullName: newName } : u));
    } catch (e) {
      console.error(e);
      alert('Failed to update user');
    }
  };

  const navItems = [
    { title: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { title: 'Users', icon: <Users size={18} /> },
    { title: 'Organizers', icon: <UserCheck size={18} /> },
    { title: 'Events', icon: <CalendarDays size={18} /> },
    { title: 'Settings', icon: <Settings size={18} /> },
  ];

  const bottomNavItems = [
    { title: 'Logout', icon: <LogOut size={18} />, isLogout: true },
  ];

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-logo-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="white"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
          </div>
          <h2>Admin Panel</h2>
        </div>

        <nav className="admin-nav" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {navItems.map((item) => (
            <div
              key={item.title}
              className={`admin-nav-item ${activeTab === item.title ? 'active' : ''}`}
              onClick={() => setActiveTab(item.title)}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span>{item.title}</span>
            </div>
          ))}
          <div
            className="admin-nav-item logout"
            style={{ marginTop: 'auto' }}
            onClick={handleLogout}
          >
            <span className="admin-nav-icon"><LogOut size={18} /></span>
            <span>Logout</span>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
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
            <img src={eventGharLogo} alt="EventGhar" style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'contain' }} />
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
                  placeholder="Search users, events…"
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
                style={{ position: 'relative', width: 40, height: 40, borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                onClick={() => { const open = !showNotifications; setShowNotifications(open); if (open) loadNotifications(); }}
              >
                <Bell size={18} color="#475569" />
                {unreadCount > 0 && !showNotifications && (
                  <span style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, background: '#ef4444', border: '2px solid #fff', display: 'block' }} />
                )}
                {showNotifications && (
                  <div style={{ position: 'fixed', top: 70, right: 32, width: 380, maxHeight: 500, background: 'white', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 1000, display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>
                        Notifications
                        {unreadCount > 0 && <span style={{ marginLeft: 8, background: '#ef4444', color: 'white', borderRadius: 12, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>{unreadCount}</span>}
                      </div>
                      <button
                        onClick={async (e) => { e.stopPropagation(); if (unreadCount > 0) { setUnreadCount(0); setNotifications(prev => prev.map(n => ({ ...n, read: true }))); await markAllAsRead(); loadNotifications(); } }}
                        disabled={unreadCount === 0}
                        style={{ background: 'transparent', border: 'none', color: unreadCount > 0 ? '#3b82f6' : '#cbd5e1', fontSize: 13, fontWeight: 600, cursor: unreadCount > 0 ? 'pointer' : 'not-allowed', opacity: unreadCount > 0 ? 1 : 0.6 }}
                      >
                        Mark all read
                      </button>
                    </div>
                    <div style={{ overflowY: 'auto', maxHeight: 420 }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                          <Bell size={40} color="#cbd5e1" style={{ marginBottom: 12 }} />
                          <div>No notifications yet</div>
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
              <div style={{ width: 1, height: 28, background: '#e2e8f0', flexShrink: 0 }} />
              {/* Profile */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '6px 10px 6px 6px', borderRadius: 12, transition: 'background 0.2s' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9375rem', color: '#fff', border: '2px solid #e2e8f0' }}>
                  <span>{userName.charAt(0).toUpperCase()}</span>
                </div>
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a', whiteSpace: 'nowrap' }}>{userName}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Admin</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="admin-content">
          {activeTab === 'Events' && (() => {
            const pendingEvents = adminEvents.filter(e => e.status === 'PENDING_APPROVAL');
            const approvedEvents = adminEvents.filter(e => e.status === 'APPROVED');
            const rejectedEvents = adminEvents.filter(e => e.status === 'REJECTED');
            const filteredEvents = adminEvents.filter(e => {
              if (eventStatusFilter && e.status !== eventStatusFilter) return false;
              if (eventSearch) {
                const q = eventSearch.toLowerCase();
                return (e.title || '').toLowerCase().includes(q) ||
                  (e.location || '').toLowerCase().includes(q) ||
                  (e.organizerName || '').toLowerCase().includes(q);
              }
              return true;
            });

            const statusMeta = {
              PENDING_APPROVAL: { label: 'Pending', bg: '#fef9c3', color: '#92400e', dot: '#f59e0b' },
              APPROVED:         { label: 'Approved', bg: '#dcfce7', color: '#166534', dot: '#22c55e' },
              REJECTED:         { label: 'Rejected', bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
            };

            return (
              <div style={{ marginTop: 20 }}>
                {/* Page Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Event Moderation</h2>
                    <p style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: 500 }}>Review, approve and manage all platform events</p>
                  </div>
                  <button
                    onClick={loadAdminEvents}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.65rem 1.2rem', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', color: '#475569', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                    Refresh
                  </button>
                </div>

                {/* Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                  {[
                    { label: 'Total Events', value: adminEvents.length, icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, grad: 'linear-gradient(135deg,#667eea,#764ba2)', light: '#f5f3ff', text: '#6d28d9' },
                    { label: 'Pending Review', value: pendingEvents.length, icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, grad: 'linear-gradient(135deg,#f59e0b,#d97706)', light: '#fffbeb', text: '#92400e' },
                    { label: 'Approved', value: approvedEvents.length, icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>, grad: 'linear-gradient(135deg,#22c55e,#16a34a)', light: '#f0fdf4', text: '#166534' },
                    { label: 'Rejected', value: rejectedEvents.length, icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>, grad: 'linear-gradient(135deg,#ef4444,#dc2626)', light: '#fef2f2', text: '#991b1b' },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'white', borderRadius: 12, padding: '1.1rem 1.3rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: s.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.icon}</div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: 2 }}>{s.label}</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{s.value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Search & Filter Bar */}
                <div style={{ background: 'white', borderRadius: 12, padding: '1.25rem', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '1rem', alignItems: 'center' }}>
                    <input
                      type="search"
                      placeholder="Search by title, location or organizer..."
                      value={eventSearch}
                      onChange={e => setEventSearch(e.target.value)}
                      style={{ padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.9rem', outline: 'none', backgroundImage: "url('data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2394a3b8\' stroke-width=\'2\'%3E%3Ccircle cx=\'11\' cy=\'11\' r=\'8\'/%3E%3Cline x1=\'21\' y1=\'21\' x2=\'16.65\' y2=\'16.65\'/%3E%3C/svg%3E')", backgroundRepeat: 'no-repeat', backgroundPosition: '0.75rem center', backgroundSize: '1.1rem' }}
                      onFocus={e => e.target.style.borderColor = '#3b82f6'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                    <select
                      value={eventStatusFilter}
                      onChange={e => setEventStatusFilter(e.target.value)}
                      style={{ padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.9rem', outline: 'none', cursor: 'pointer', backgroundColor: 'white' }}
                      onFocus={e => e.target.style.borderColor = '#3b82f6'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    >
                      <option value="">All Statuses</option>
                      <option value="PENDING_APPROVAL">Pending</option>
                      <option value="APPROVED">Approved</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                    <div style={{ fontSize: '0.875rem', color: '#64748b', whiteSpace: 'nowrap', fontWeight: 500 }}>
                      {filteredEvents.length} result{filteredEvents.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                {/* Events Table */}
                {eventsLoading ? (
                  <div style={{ background: 'white', borderRadius: 12, padding: '3rem', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                    <div style={{ color: '#94a3b8', fontSize: '1rem' }}>Loading events...</div>
                  </div>
                ) : eventsError ? (
                  <div style={{ background: '#fef2f2', borderRadius: 12, padding: '1.5rem', border: '1px solid #fecaca', color: '#dc2626', fontWeight: 600 }}>{eventsError}</div>
                ) : (
                  <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          {['EVENT', 'ORGANIZER', 'DATE & LOCATION', 'STATUS', 'SUBMITTED', 'ACTIONS'].map(h => (
                            <th key={h} style={{ padding: '1rem', textAlign: h === 'ACTIONS' ? 'center' : 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEvents.map((event, index) => {
                          const sm = statusMeta[event.status] || statusMeta.PENDING_APPROVAL;
                          return (
                            <tr key={event.id}
                              style={{ borderBottom: index < filteredEvents.length - 1 ? '1px solid #f1f5f9' : 'none', transition: 'background 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                              onMouseLeave={e => e.currentTarget.style.background = 'white'}
                            >
                              {/* Event */}
                              <td style={{ padding: '1rem', maxWidth: 220 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 17, color: 'white', flexShrink: 0 }}>
                                    {(event.title || 'E').charAt(0).toUpperCase()}
                                  </div>
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>{event.title || '—'}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>ID: #{String(event.id).slice(0, 8)}</div>
                                  </div>
                                </div>
                              </td>
                              {/* Organizer */}
                              <td style={{ padding: '1rem' }}>
                                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>{event.organizerName || '—'}</div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>{event.organizerEmail || ''}</div>
                              </td>
                              {/* Date & Location */}
                              <td style={{ padding: '1rem' }}>
                                <div style={{ fontSize: '0.875rem', color: '#0f172a', fontWeight: 600 }}>
                                  {event.date ? new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>{event.location || '—'}</div>
                              </td>
                              {/* Status */}
                              <td style={{ padding: '1rem' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.75rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, background: sm.bg, color: sm.color }}>
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: sm.dot, flexShrink: 0 }}></span>
                                  {sm.label}
                                </span>
                              </td>
                              {/* Submitted */}
                              <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#475569' }}>
                                {event.createdAt ? new Date(event.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                              </td>
                              {/* Actions */}
                              <td style={{ padding: '1rem' }}>
                                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', alignItems: 'center' }}>
                                  {/* View Details */}
                                  <button
                                    onClick={() => setSelectedEvent(event)}
                                    title="View Details"
                                    style={{ padding: '0.4rem 0.75rem', borderRadius: 6, border: 'none', background: '#f1f5f9', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', fontWeight: 600 }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#1e293b'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569'; }}
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                    View
                                  </button>
                                  {/* Approve / Reject — context-aware */}
                                  {event.status === 'APPROVED' ? (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.85rem', borderRadius: 6, background: '#dcfce7', color: '#15803d', fontSize: '0.78rem', fontWeight: 700 }}>
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                      Approved
                                    </span>
                                  ) : event.status === 'REJECTED' ? (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.85rem', borderRadius: 6, background: '#fee2e2', color: '#dc2626', fontSize: '0.78rem', fontWeight: 700 }}>
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                      Rejected
                                    </span>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => handleApproveEvent(event.id)}
                                        title="Approve Event"
                                        style={{ padding: '0.4rem 0.75rem', borderRadius: 6, border: 'none', background: '#f0fdf4', color: '#16a34a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', fontWeight: 600 }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#dcfce7'}
                                        onMouseLeave={e => e.currentTarget.style.background = '#f0fdf4'}
                                      >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => handleRejectEvent(event.id)}
                                        title="Reject Event"
                                        style={{ padding: '0.4rem 0.75rem', borderRadius: 6, border: 'none', background: '#fff7ed', color: '#ea580c', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', fontWeight: 600 }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#ffedd5'}
                                        onMouseLeave={e => e.currentTarget.style.background = '#fff7ed'}
                                      >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                        Reject
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {filteredEvents.length === 0 && (
                      <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                        {eventSearch || eventStatusFilter ? 'No events match your filters.' : 'No events found.'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Event Details Modal */}
          {selectedEvent && (() => {
            const smModal = {
              PENDING_APPROVAL: { label: 'Pending Review', bg: '#fef9c3', color: '#92400e', dot: '#f59e0b' },
              APPROVED:         { label: 'Approved', bg: '#dcfce7', color: '#166534', dot: '#22c55e' },
              REJECTED:         { label: 'Rejected', bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
            }[selectedEvent.status] || { label: 'Pending Review', bg: '#fef9c3', color: '#92400e', dot: '#f59e0b' };
            return (
              <div
                onClick={() => setSelectedEvent(null)}
                style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
              >
                <div
                  onClick={e => e.stopPropagation()}
                  style={{ background: 'white', borderRadius: 18, width: '100%', maxWidth: 520, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', position: 'relative', overflow: 'hidden' }}
                >
                  {/* Modal Header */}
                  <div style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', padding: '24px 28px 20px', position: 'relative' }}>
                    <button
                      onClick={() => setSelectedEvent(null)}
                      style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 18, color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >×</button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 22, color: 'white', flexShrink: 0 }}>
                        {(selectedEvent.title || 'E').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'white', marginBottom: 6 }}>{selectedEvent.title}</div>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.2)', borderRadius: 6, padding: '3px 10px', fontSize: '0.75rem', fontWeight: 700, color: 'white' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: smModal.dot }}></span>
                          {smModal.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Modal Body */}
                  <div style={{ padding: '24px 28px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: 20 }}>
                      {[
                        { icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, label: 'Event Date', value: selectedEvent.date ? new Date(selectedEvent.date).toLocaleDateString('en-US', { dateStyle: 'long' }) : '—' },
                        { icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, label: 'Location', value: selectedEvent.location || '—' },
                        { icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>, label: 'Organizer', value: selectedEvent.organizerName || '—' },
                        { icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>, label: 'Organizer Email', value: selectedEvent.organizerEmail || '—' },
                        { icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, label: 'Max Attendees', value: selectedEvent.maxAttendees ?? '—' },
                        { icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, label: 'Submitted', value: selectedEvent.createdAt ? new Date(selectedEvent.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' }) : '—' },
                      ].map(row => (
                        <div key={row.label} style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', border: '1px solid #f1f5f9' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                            {row.icon}
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{row.label}</span>
                          </div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>{row.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    {selectedEvent.status === 'APPROVED' ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px', borderRadius: 10, background: '#dcfce7', border: '1.5px solid #bbf7d0' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        <span style={{ fontWeight: 700, fontSize: 15, color: '#15803d' }}>This event has been Approved</span>
                      </div>
                    ) : selectedEvent.status === 'REJECTED' ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px', borderRadius: 10, background: '#fee2e2', border: '1.5px solid #fecaca' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        <span style={{ fontWeight: 700, fontSize: 15, color: '#dc2626' }}>This event has been Rejected</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button
                          onClick={() => { handleApproveEvent(selectedEvent.id); setSelectedEvent(null); }}
                          style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                          Approve Event
                        </button>
                        <button
                          onClick={() => { handleRejectEvent(selectedEvent.id); setSelectedEvent(null); }}
                          style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#f97316,#ea580c)', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          Reject Event
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
          {activeTab === 'Dashboard' && (
            <>
              <div className="admin-overview-header">
                <h2>Admin Overview</h2>
              </div>

              <div className="admin-stats-grid">
            {/* Total Users */}
            <div className="admin-stats-card purple">
              <div className="admin-stats-icon-box">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              </div>
              <div className="admin-stats-info">
                <span className="admin-stats-label">Total Users</span>
                <span className="admin-stats-value">{stats.totalUsers}</span>
                <span className="admin-stats-subtext">Registered users</span>
              </div>
            </div>

            {/* Organizers */}
            <div className="admin-stats-card green">
              <div className="admin-stats-icon-box">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              </div>
              <div className="admin-stats-info">
                <span className="admin-stats-label">Organizers</span>
                <span className="admin-stats-value">{stats.totalOrganizers}</span>
                <span className="admin-stats-subtext">Verified organizers</span>
              </div>
            </div>

            {/* Total Bookings */}
            <div className="admin-stats-card blue">
              <div className="admin-stats-icon-box">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              </div>
              <div className="admin-stats-info">
                <span className="admin-stats-label">Total Events</span>
                <span className="admin-stats-value">{stats.totalEvents}</span>
                <span className="admin-stats-subtext">Events on platform</span>
              </div>
            </div>

            {/* Total Revenue */}
            <div className="admin-stats-card orange">
              <div className="admin-stats-icon-box">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              </div>
              <div className="admin-stats-info">
                <span className="admin-stats-label">Pending</span>
                <span className="admin-stats-value">{pendingCount}</span>
                <span className="admin-stats-subtext">Events awaiting review</span>
              </div>
            </div>
            </div>

              {/* Analytics + Recent Activity Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 28 }}>
            <div className="analytics-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--admin-text-main)' }}>Weekly Registrations</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                    <div style={{ fontSize: 36, fontWeight: 800 }}>{weeklyRegistrations.count.toLocaleString()}</div>
                    <div style={{ color: weeklyRegistrations.changePct >= 0 ? '#16a34a' : '#dc2626', fontWeight: 700 }}>{weeklyRegistrations.changePct >= 0 ? '+' : ''}{weeklyRegistrations.changePct}%</div>
                  </div>
                </div>
                <a style={{ color: '#2563eb', fontWeight: 700, fontSize: 14 }}>View Details</a>
              </div>
              <div style={{ height: 120 }}>
                {/* Simple sparkline using svg based on series */}
                <svg width="100%" height="100%" viewBox="0 0 600 120" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <polyline fill="url(#g)" stroke="#3b82f6" strokeWidth="3" points={weeklyRegistrations.series.map((v,i) => `${(i/6)*600},${120 - (v/Math.max(1, Math.max(...weeklyRegistrations.series)))*100}`).join(' ')} />
                </svg>
              </div>
            </div>

            <div className="recent-activity-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h3 style={{ margin: 0, fontSize: 16 }}>Recent Activity</h3>
                <a style={{ color: '#2563eb', fontWeight: 700 }}>View All Activity</a>
              </div>
              <div className="activity-list">
                {/* Build a few activity rows from users and events */}
                {allUsers[0] && (
                  <div className="activity-item">
                    <div className="activity-icon blue">+</div>
                    <div className="activity-content">
                      <div style={{ fontWeight: 700 }}>New Organizer Signed Up</div>
                      <div style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>{allUsers[0].fullName} • {allUsers[0].email}</div>
                    </div>
                    <div className="activity-time">2m ago</div>
                  </div>
                )}
                {adminEvents[0] && (
                  <div className="activity-item">
                    <div className="activity-icon green">✓</div>
                    <div className="activity-content">
                      <div style={{ fontWeight: 700 }}>Event '{adminEvents[0].title}' Approved</div>
                      <div style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>Verified by Admin</div>
                    </div>
                    <div className="activity-time">1h ago</div>
                  </div>
                )}
                <div className="activity-item">
                  <div className="activity-icon orange">!</div>
                  <div className="activity-content">
                    <div style={{ fontWeight: 700 }}>Dispute Reported</div>
                    <div style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>Booking #88219 • Payment Issue</div>
                  </div>
                  <div className="activity-time">3h ago</div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon grey">⚙</div>
                  <div className="activity-content">
                    <div style={{ fontWeight: 700 }}>System Settings Updated</div>
                    <div style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>Currency changed to USD</div>
                  </div>
                  <div className="activity-time">Yesterday</div>
                </div>
              </div>
            </div>
              </div>
            </>
          )}

          {/* Users Tab */}
          {activeTab === 'Users' && (() => {
            // Filter users
            const filteredUsers = allUsers
              .filter(u => {
                if (roleFilter && u.role !== roleFilter) return false;
                if (!roleFilter && u.role !== 'USER') return false;
                return true;
              })
              .filter(u => {
                if (accountStatusFilter === 'active' && !u.isActive) return false;
                if (accountStatusFilter === 'inactive' && u.isActive) return false;
                return true;
              })
              .filter(u => {
                if (!searchQuery) return true;
                return `${u.fullName} ${u.email}`.toLowerCase().includes(searchQuery.toLowerCase());
              });

            // Pagination
            const totalUsers = filteredUsers.length;
            const totalPages = Math.ceil(totalUsers / itemsPerPage);
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

            return (
              <div style={{ marginTop: 20 }}>
                {/* Header with Stats Card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>User Management</h2>
                    <p style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: 500 }}>Manage and monitor all platform participants</p>
                  </div>
                  
                  {/* Stats Card - Horizontal */}
                  <div style={{ 
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    borderRadius: 12,
                    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.08)',
                    padding: '1rem 1.5rem',
                    border: '1px solid rgba(99, 102, 241, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.25)'
                    }}>
                      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: 2 }}>Total Registered Users</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{totalUsers.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                {/* Search & Filters - Horizontal */}
                <div style={{ 
                  background: 'white',
                  borderRadius: 12,
                  padding: '1.25rem',
                  marginBottom: 16,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>Search</div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                    <div>
                      <input
                        type="search"
                        placeholder="Name, email or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem 0.75rem 2.5rem',
                          borderRadius: 8,
                          border: '1px solid #e2e8f0',
                          fontSize: '0.9rem',
                          outline: 'none',
                          transition: 'all 0.2s',
                          backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2394a3b8\' stroke-width=\'2\'%3E%3Ccircle cx=\'11\' cy=\'11\' r=\'8\'/%3E%3Cline x1=\'21\' y1=\'21\' x2=\'16.65\' y2=\'16.65\'/%3E%3C/svg%3E")',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: '0.75rem center',
                          backgroundSize: '1.1rem',
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                      />
                    </div>
                    
                    
                    <div>
                      <select
                        value={accountStatusFilter}
                        onChange={(e) => setAccountStatusFilter(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          borderRadius: 8,
                          border: '1px solid #e2e8f0',
                          fontSize: '0.9rem',
                          outline: 'none',
                          cursor: 'pointer',
                          backgroundColor: 'white',
                          transition: 'all 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                      >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    
                    <button
                      onClick={() => { setCurrentPage(1); }}
                      style={{
                        padding: '0.75rem 1.75rem',
                        borderRadius: 8,
                        border: 'none',
                        background: '#3b82f6',
                        color: 'white',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
                    >Apply Filters</button>
                  </div>
                </div>

                {/* Block/Unblock Message */}
                {blockMessage && (
                  <div style={{
                    marginBottom: 12,
                    background: '#fef9c3',
                    color: '#92400e',
                    borderRadius: 8,
                    padding: '0.85rem 1.25rem',
                    fontWeight: 600,
                    fontSize: '1rem',
                    boxShadow: '0 2px 8px rgba(251,191,36,0.08)'
                  }}>
                    {blockMessage}
                  </div>
                )}

                {/* Users Table */}
                <div style={{
                  background: 'white',
                  borderRadius: 12,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>USER</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>EMAIL</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ROLE</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>JOINED DATE</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>STATUS</th>
                        <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedUsers.map((user, index) => (
                        <tr key={user.id} style={{ borderBottom: index < paginatedUsers.length - 1 ? '1px solid #f1f5f9' : 'none', transition: 'background 0.15s' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                        >
                          <td style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: 16,
                                color: 'white',
                                flexShrink: 0
                              }}>{(user.fullName || 'U').charAt(0)}</div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>{user.fullName}</div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ID: #{user.id?.toString().slice(0, 8) || 'N/A'}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#475569' }}>{user.email}</td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '0.35rem 0.75rem',
                              borderRadius: 6,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: user.role === 'ORGANIZER' ? '#dbeafe' : user.role === 'ADMIN' ? '#fef3c7' : '#f3e8ff',
                              color: user.role === 'ORGANIZER' ? '#1e40af' : user.role === 'ADMIN' ? '#92400e' : '#6b21a8'
                            }}>{user.role === 'ORGANIZER' ? 'Organizer' : user.role === 'ADMIN' ? 'Admin' : 'Attendee'}</span>
                          </td>
                          <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#475569' }}>
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            {(() => {
                              // Real status tracking
                              // If user is blocked (isActive === false and user.blocked === true), show Blocked
                              // If user is inactive for more than 30 days, show Inactive
                              // Otherwise, show Active
                              const now = new Date();
                              const lastActive = user.lastActiveAt ? new Date(user.lastActiveAt) : null;
                              const createdAt = user.createdAt ? new Date(user.createdAt) : null;
                              let status = 'Active';
                              let bg = '#dcfce7';
                              let color = '#166534';
                              if (user.blocked === true) {
                                status = 'Blocked';
                                bg = '#fee2e2';
                                color = '#991b1b';
                              } else if (lastActive && (now - lastActive) > 30 * 24 * 60 * 60 * 1000) {
                                status = 'Inactive';
                                bg = '#fef9c3';
                                color = '#92400e';
                              } else if (user.isActive === false) {
                                // fallback for legacy isActive false
                                status = 'Blocked';
                                bg = '#fee2e2';
                                color = '#991b1b';
                              }
                              return (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  padding: '0.35rem 0.75rem',
                                  borderRadius: 6,
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  background: bg,
                                  color: color
                                }}>
                                  <span style={{ fontSize: '0.5rem' }}>●</span>
                                  {status}
                                </span>
                              );
                            })()}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                              <button
                                onClick={() => setSelectedUser(user)}
                                style={{
                                  padding: '0.5rem',
                                  borderRadius: 6,
                                  border: 'none',
                                  background: '#f1f5f9',
                                  color: '#475569',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#1e293b'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569'; }}
                                title="View Details"
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                  <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                              </button>
                              <button
                                onClick={() => {
                                  setConfirmDialog({ 
                                    show: true, 
                                    user: user, 
                                    action: user.blocked ? 'unblock' : 'block' 
                                  });
                                }}
                                style={{
                                  padding: '0.5rem',
                                  borderRadius: 6,
                                  border: 'none',
                                  background: user.blocked ? '#dcfce7' : '#fef2f2',
                                  color: user.blocked ? '#16a34a' : '#dc2626',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = user.blocked ? '#bbf7d0' : '#fee2e2'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = user.blocked ? '#dcfce7' : '#fef2f2'; }}
                                title={user.blocked ? 'Unblock User' : 'Block User'}
                              >
                                {user.blocked ? (
                                  // Unlock icon — user is blocked, action is unblock
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="10" rx="2"/>
                                    <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
                                  </svg>
                                ) : (
                                  // Lock icon — user is active, action is block
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="10" rx="2"/>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                  </svg>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {paginatedUsers.length === 0 && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                      No users found matching your filters.
                    </div>
                  )}

                  {/* Pagination */}
                  {totalUsers > 0 && (
                    <div style={{ 
                      padding: '1rem 1.5rem',
                      borderTop: '1px solid #f1f5f9',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#fafbfc'
                    }}>
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                        Showing {startIndex + 1} to {Math.min(endIndex, totalUsers)} of {totalUsers.toLocaleString()} entries
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          style={{
                            padding: '0.5rem 0.75rem',
                            borderRadius: 6,
                            border: '1px solid #e2e8f0',
                            background: 'white',
                            color: '#64748b',
                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                            opacity: currentPage === 1 ? 0.5 : 1,
                            fontSize: '0.875rem'
                          }}
                        >‹</button>
                        
                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <button
                              key={i}
                              onClick={() => setCurrentPage(pageNum)}
                              style={{
                                padding: '0.5rem 0.75rem',
                                borderRadius: 6,
                                border: '1px solid #e2e8f0',
                                background: pageNum === currentPage ? '#3b82f6' : 'white',
                                color: pageNum === currentPage ? 'white' : '#64748b',
                                fontWeight: pageNum === currentPage ? 600 : 400,
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                minWidth: 36,
                                transition: 'all 0.15s'
                              }}
                              onMouseEnter={(e) => {
                                if (currentPage !== pageNum) {
                                  e.currentTarget.style.background = '#f8fafc';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (currentPage !== pageNum) {
                                  e.currentTarget.style.background = 'white';
                                }
                              }}
                            >{pageNum}</button>
                          );
                        })}
                        
                        {totalPages > 5 && currentPage < totalPages - 2 && (
                          <>
                            <span style={{ padding: '0.5rem', color: '#94a3b8' }}>...</span>
                            <button
                              onClick={() => setCurrentPage(totalPages)}
                              style={{
                                padding: '0.5rem 0.75rem',
                                borderRadius: 6,
                                border: '1px solid #e2e8f0',
                                background: 'white',
                                color: '#64748b',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                minWidth: 36
                              }}
                            >{totalPages}</button>
                          </>
                        )}
                        
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          style={{
                            padding: '0.5rem 0.75rem',
                            borderRadius: 6,
                            border: '1px solid #e2e8f0',
                            background: 'white',
                            color: '#64748b',
                            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                            opacity: currentPage === totalPages ? 0.5 : 1,
                            fontSize: '0.875rem'
                          }}
                        >›</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Organizers Tab */}
          {activeTab === 'Organizers' && (() => {
            // Filter organizers
            const filteredOrganizers = allUsers
              .filter(u => u.role === 'ORGANIZER')
              .filter(u => {
                if (accountStatusFilter === 'active' && !u.isActive) return false;
                if (accountStatusFilter === 'inactive' && u.isActive) return false;
                return true;
              })
              .filter(u => {
                if (!searchQuery) return true;
                return `${u.fullName} ${u.email}`.toLowerCase().includes(searchQuery.toLowerCase());
              });

            // Pagination
            const totalOrganizers = filteredOrganizers.length;
            const totalPages = Math.ceil(totalOrganizers / itemsPerPage);
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginatedOrganizers = filteredOrganizers.slice(startIndex, endIndex);

            return (
              <div style={{ marginTop: 20 }}>
                {/* Header with Stats Card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Organizer Management</h2>
                    <p style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: 500 }}>Manage and monitor all organizers</p>
                  </div>
                  {/* Stats Card - Horizontal */}
                  <div style={{ 
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    borderRadius: 12,
                    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.08)',
                    padding: '1rem 1.5rem',
                    border: '1px solid rgba(99, 102, 241, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.25)'
                    }}>
                      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="white" strokeWidth="2">
                        <circle cx="12" cy="7" r="4"></circle>
                        <path d="M5.5 21v-2a4.5 4.5 0 0 1 9 0v2"></path>
                      </svg>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: 2 }}>Total Organizers</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{totalOrganizers.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                {/* Search & Filters - Horizontal */}
                <div style={{ 
                  background: 'white',
                  borderRadius: 12,
                  padding: '1.25rem',
                  marginBottom: 16,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>Search</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                    <div>
                      <input
                        type="search"
                        placeholder="Name, email or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem 0.75rem 2.5rem',
                          borderRadius: 8,
                          border: '1px solid #e2e8f0',
                          fontSize: '0.9rem',
                          outline: 'none',
                          transition: 'all 0.2s',
                          backgroundImage: "url('data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2394a3b8\' stroke-width=\'2\'%3E%3Ccircle cx=\'11\' cy=\'11\' r=\'8\'/%3E%3Cline x1=\'21\' y1=\'21\' x2=\'16.65\' y2=\'16.65\'/%3E%3C/svg%3E')",
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: '0.75rem center',
                          backgroundSize: '1.1rem',
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                      />
                    </div>
                    
                    
                    <div>
                      <select
                        value={accountStatusFilter}
                        onChange={(e) => setAccountStatusFilter(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          borderRadius: 8,
                          border: '1px solid #e2e8f0',
                          fontSize: '0.9rem',
                          outline: 'none',
                          cursor: 'pointer',
                          backgroundColor: 'white',
                          transition: 'all 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                      >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    
                    <button
                      onClick={() => { setCurrentPage(1); }}
                      style={{
                        padding: '0.75rem 1.75rem',
                        borderRadius: 8,
                        border: 'none',
                        background: '#3b82f6',
                        color: 'white',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
                    >Apply Filters</button>
                  </div>
                </div>

                {/* Block/Unblock Message */}
                {blockMessage && (
                  <div style={{
                    marginBottom: 12,
                    background: '#fef9c3',
                    color: '#92400e',
                    borderRadius: 8,
                    padding: '0.85rem 1.25rem',
                    fontWeight: 600,
                    fontSize: '1rem',
                    boxShadow: '0 2px 8px rgba(251,191,36,0.08)'
                  }}>
                    {blockMessage}
                  </div>
                )}

                {/* Organizers Table */}
                <div style={{
                  background: 'white',
                  borderRadius: 12,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ORGANIZER</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>EMAIL</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ROLE</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>JOINED DATE</th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>STATUS</th>
                        <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedOrganizers.map((org, index) => (
                        <tr key={org.id} style={{ borderBottom: index < paginatedOrganizers.length - 1 ? '1px solid #f1f5f9' : 'none', transition: 'background 0.15s' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                        >
                          <td style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: 16,
                                color: 'white',
                                flexShrink: 0
                              }}>{(org.fullName || 'O').charAt(0)}</div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>{org.fullName}</div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ID: #{org.id?.toString().slice(0, 8) || 'N/A'}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#475569' }}>{org.email}</td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '0.35rem 0.75rem',
                              borderRadius: 6,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: '#dbeafe',
                              color: '#1e40af'
                            }}>Organizer</span>
                          </td>
                          <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#475569' }}>
                            {org.createdAt ? new Date(org.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            {(() => {
                              // Real status tracking
                              const now = new Date();
                              const lastActive = org.lastActiveAt ? new Date(org.lastActiveAt) : null;
                              let status = 'Active';
                              let bg = '#dcfce7';
                              let color = '#166534';
                              if (org.blocked === true) {
                                status = 'Blocked';
                                bg = '#fee2e2';
                                color = '#991b1b';
                              } else if (lastActive && (now - lastActive) > 30 * 24 * 60 * 60 * 1000) {
                                status = 'Inactive';
                                bg = '#fef9c3';
                                color = '#92400e';
                              } else if (org.isActive === false) {
                                status = 'Blocked';
                                bg = '#fee2e2';
                                color = '#991b1b';
                              }
                              return (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  padding: '0.35rem 0.75rem',
                                  borderRadius: 6,
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  background: bg,
                                  color: color
                                }}>
                                  <span style={{ fontSize: '0.5rem' }}>●</span>
                                  {status}
                                </span>
                              );
                            })()}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                              <button
                                onClick={() => setSelectedUser(org)}
                                style={{
                                  padding: '0.5rem',
                                  borderRadius: 6,
                                  border: 'none',
                                  background: '#f1f5f9',
                                  color: '#475569',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#1e293b'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569'; }}
                                title="View Details"
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                  <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                              </button>
                              <button
                                onClick={() => setConfirmDialog({ show: true, user: org, action: org.blocked ? 'unblock' : 'block' })}
                                style={{
                                  padding: '0.5rem',
                                  borderRadius: 6,
                                  border: 'none',
                                  background: org.blocked ? '#dcfce7' : '#fef2f2',
                                  color: org.blocked ? '#16a34a' : '#dc2626',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = org.blocked ? '#bbf7d0' : '#fee2e2'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = org.blocked ? '#dcfce7' : '#fef2f2'; }}
                                title={org.blocked ? 'Unblock Organizer' : 'Block Organizer'}
                              >
                                {org.blocked ? (
                                  // Unlock icon — user is blocked, action is unblock
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="10" rx="2"/>
                                    <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
                                  </svg>
                                ) : (
                                  // Lock icon — user is active, action is block
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="10" rx="2"/>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                  </svg>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {paginatedOrganizers.length === 0 && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                      No organizers found matching your filters.
                    </div>
                  )}

                  {/* Pagination */}
                  {totalOrganizers > 0 && (
                    <div style={{ 
                      padding: '1rem 1.5rem',
                      borderTop: '1px solid #f1f5f9',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#fafbfc'
                    }}>
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                        Showing {startIndex + 1} to {Math.min(endIndex, totalOrganizers)} of {totalOrganizers.toLocaleString()} entries
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          style={{
                            padding: '0.5rem 0.75rem',
                            borderRadius: 6,
                            border: '1px solid #e2e8f0',
                            background: 'white',
                            color: '#64748b',
                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                            opacity: currentPage === 1 ? 0.5 : 1,
                            fontSize: '0.875rem'
                          }}
                        >‹</button>
                        
                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <button
                              key={i}
                              onClick={() => setCurrentPage(pageNum)}
                              style={{
                                padding: '0.5rem 0.75rem',
                                borderRadius: 6,
                                border: '1px solid #e2e8f0',
                                background: pageNum === currentPage ? '#3b82f6' : 'white',
                                color: pageNum === currentPage ? 'white' : '#64748b',
                                fontWeight: pageNum === currentPage ? 600 : 400,
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                minWidth: 36,
                                transition: 'all 0.15s'
                              }}
                              onMouseEnter={(e) => {
                                if (currentPage !== pageNum) {
                                  e.currentTarget.style.background = '#f8fafc';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (currentPage !== pageNum) {
                                  e.currentTarget.style.background = 'white';
                                }
                              }}
                            >{pageNum}</button>
                          );
                        })}
                        
                        {totalPages > 5 && currentPage < totalPages - 2 && (
                          <>
                            <span style={{ padding: '0.5rem', color: '#94a3b8' }}>...</span>
                            <button
                              onClick={() => setCurrentPage(totalPages)}
                              style={{
                                padding: '0.5rem 0.75rem',
                                borderRadius: 6,
                                border: '1px solid #e2e8f0',
                                background: 'white',
                                color: '#64748b',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                minWidth: 36
                              }}
                            >{totalPages}</button>
                          </>
                        )}
                        
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          style={{
                            padding: '0.5rem 0.75rem',
                            borderRadius: 6,
                            border: '1px solid #e2e8f0',
                            background: 'white',
                            color: '#64748b',
                            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                            opacity: currentPage === totalPages ? 0.5 : 1,
                            fontSize: '0.875rem'
                          }}
                        >›</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {activeTab === 'Settings' && (() => {
            const userData = JSON.parse(localStorage.getItem('eventghar_current_user') || '{}');
            if (!settingsName && (userData.fullName || userName)) setSettingsName(userData.fullName || userName);
            if (!settingsEmail && userData.email) setSettingsEmail(userData.email);

            const handleSaveProfile = async (e) => {
              e.preventDefault();
              setSettingsSaving(true);
              setSettingsError('');
              setSettingsSaved('');
              try {
                const { updateMe, getMe } = await import('../../src/api/me');
                await updateMe({ name: settingsName.trim(), email: settingsEmail });
                const me = await getMe();
                try { localStorage.setItem('eventghar_current_user', JSON.stringify(me)); } catch (_) {}
                window.dispatchEvent(new Event('eventghar_user_updated'));
                setSettingsSaved('Profile updated successfully.');
                setTimeout(() => setSettingsSaved(''), 3000);
              } catch (err) {
                setSettingsError(err?.message || 'Failed to save profile.');
              } finally {
                setSettingsSaving(false);
              }
            };

            const handleChangePassword = async () => {
              if (!settingsCurrentPassword || !settingsNewPassword) {
                alert('Both current and new password are required.');
                return;
              }
              try {
                setSettingsSaving(true);
                const { updateMe, getMe } = await import('../../src/api/me');
                await updateMe({ currentPassword: settingsCurrentPassword, password: settingsNewPassword });
                const me = await getMe();
                try { localStorage.setItem('eventghar_current_user', JSON.stringify(me)); } catch (_) {}
                window.dispatchEvent(new Event('eventghar_user_updated'));
                setSettingsCurrentPassword('');
                setSettingsNewPassword('');
                alert('Password updated successfully.');
              } catch (err) {
                alert(err?.message || 'Failed to update password.');
              } finally {
                setSettingsSaving(false);
              }
            };

            const inputStyle = { width: '100%', fontSize: 16, color: '#1e293b', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '13px 18px', outline: 'none', fontWeight: 600, boxSizing: 'border-box', transition: 'border-color 0.2s' };
            const labelStyle = { fontWeight: 700, color: '#374151', fontSize: 14, marginBottom: 8, display: 'block' };
            const cardStyle = { background: '#fff', borderRadius: 18, border: '1px solid #e2e8f0', marginBottom: 24, overflow: 'hidden' };
            const cardHeaderStyle = { padding: '20px 32px', borderBottom: '1px solid #f1f5f9' };
            const cardBodyStyle = { padding: '28px 32px' };

            return (
              <div style={{ minHeight: '100%', background: '#f8fafc', padding: '8px 0', boxSizing: 'border-box' }}>
                {/* Page Header */}
                <div style={{ marginBottom: 28 }}>
                  <h2 style={{ fontWeight: 800, fontSize: 30, color: '#0f172a', margin: 0, letterSpacing: -0.5 }}>Settings</h2>
                  <p style={{ color: '#64748b', fontSize: 15, margin: '6px 0 0' }}>Manage your account preferences and profile information</p>
                </div>

                {/* Two-Column Layout */}
                <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

                  {/* LEFT PANEL */}
                  <div style={{ width: 280, flexShrink: 0 }}>
                    {/* Profile Card */}
                    <div style={{ ...cardStyle, marginBottom: 16, padding: '28px 22px', textAlign: 'center' }}>
                      <div style={{ position: 'relative', display: 'inline-block', marginBottom: 18 }}>
                        <div style={{
                          width: 100, height: 100, borderRadius: '50%',
                          background: 'linear-gradient(135deg, #667eea, #764ba2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 40, fontWeight: 900, color: '#fff',
                          boxShadow: '0 6px 22px rgba(0,0,0,0.12)',
                        }}>
                          {(settingsName || userName || 'A').charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>{settingsName || userName}</div>
                      <div style={{ color: '#64748b', fontSize: 13, marginTop: 6 }}>{settingsEmail}</div>
                      <div style={{ marginTop: 12, display: 'inline-block', background: '#fef3c7', color: '#92400e', borderRadius: 22, padding: '6px 14px', fontSize: 13, fontWeight: 800 }}>Admin</div>
                    </div>

                    {/* Settings Nav */}
                    <div style={{ ...cardStyle, marginBottom: 0 }}>
                      {[
                        { id: 'General', desc: 'Profile & notifications', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
                        { id: 'Preferences', desc: 'Appearance & language', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
                        { id: 'Security', desc: 'Password & access', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> },
                      ].map((item, i, arr) => (
                        <div key={item.id} onClick={() => setSettingsSubTab(item.id)} style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '18px 20px',
                          cursor: 'pointer', transition: 'background 0.15s',
                          background: settingsSubTab === item.id ? '#eff6ff' : '#fff',
                          borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none',
                          borderLeft: `4px solid ${settingsSubTab === item.id ? '#3b82f6' : 'transparent'}`,
                        }}>
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: settingsSubTab === item.id ? '#ebf5ff' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: settingsSubTab === item.id ? '#3b82f6' : '#64748b' }}>
                            {item.icon}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 800, fontSize: 15, color: settingsSubTab === item.id ? '#3b82f6' : '#0f172a' }}>{item.id}</div>
                            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 3 }}>{item.desc}</div>
                          </div>
                          {settingsSubTab === item.id && <span style={{ marginLeft: 'auto', color: '#3b82f6', fontSize: 20, lineHeight: 1 }}>›</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* RIGHT PANEL */}
                  <div style={{ flex: 1, minWidth: 0 }}>

                    {/* General Tab */}
                    {settingsSubTab === 'General' && (
                      <form onSubmit={handleSaveProfile}>
                        <div style={cardStyle}>
                          <div style={cardHeaderStyle}>
                            <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Personal Details</div>
                            <div style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>Update your name and email address</div>
                          </div>
                          <div style={cardBodyStyle}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 4 }}>
                              <div>
                                <label style={labelStyle}>Full Name</label>
                                <input style={inputStyle} value={settingsName} onChange={e => setSettingsName(e.target.value)} placeholder="Your full name" required />
                              </div>
                              <div>
                                <label style={labelStyle}>Email Address</label>
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                  <input style={{ ...inputStyle, paddingRight: 90, background: '#f1f5f9', color: '#94a3b8', cursor: 'not-allowed' }} value={settingsEmail} disabled />
                                  <span style={{ position: 'absolute', right: 12, background: '#dcfce7', color: '#16a34a', fontWeight: 800, fontSize: 10, borderRadius: 6, padding: '3px 8px', letterSpacing: 0.5 }}>VERIFIED</span>
                                </div>
                              </div>
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
                              { label: 'New Event Alerts', sub: 'Notify me about new events and registrations', val: notifEventAlerts, set: setNotifEventAlerts },
                              { label: 'System Reminders', sub: 'Send reminders about pending actions', val: notifReminders, set: setNotifReminders },
                            ].map((n, i, arr) => (
                              <div key={n.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: i < arr.length - 1 ? 18 : 0, marginBottom: i < arr.length - 1 ? 18 : 0, borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                <div>
                                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 15 }}>{n.label}</div>
                                  <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>{n.sub}</div>
                                </div>
                                <div onClick={() => n.set(!n.val)} style={{ width: 44, height: 26, borderRadius: 13, cursor: 'pointer', transition: 'background 0.2s', background: n.val ? '#3b82f6' : '#cbd5e1', position: 'relative', flexShrink: 0 }}>
                                  <div style={{ position: 'absolute', top: 3, left: n.val ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {settingsSaved && <div style={{ color: '#10b981', fontWeight: 700, fontSize: 14, marginBottom: 16, padding: '12px 18px', background: '#d1fae5', borderRadius: 12, border: '1px solid #a7f3d0' }}>{settingsSaved}</div>}
                        {settingsError && <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 14, marginBottom: 16, padding: '12px 18px', background: '#fef2f2', borderRadius: 12, border: '1px solid #fee2e2' }}>{settingsError}</div>}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14 }}>
                          <button type="button" onClick={() => { const d = JSON.parse(localStorage.getItem('eventghar_current_user') || '{}'); setSettingsName(d.fullName || userName); }} style={{ padding: '12px 26px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff', color: '#374151', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Discard</button>
                          <button type="submit" disabled={settingsSaving} style={{ padding: '12px 32px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', fontWeight: 800, fontSize: 15, boxShadow: '0 6px 18px rgba(59,130,246,0.28)', opacity: settingsSaving ? 0.8 : 1 }}>{settingsSaving ? 'Saving…' : 'Save Changes'}</button>
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
                              <input style={inputStyle} type="password" value={settingsCurrentPassword} onChange={e => setSettingsCurrentPassword(e.target.value)} placeholder="Enter your current password" />
                            </div>
                            <div style={{ marginBottom: 24 }}>
                              <label style={labelStyle}>New Password</label>
                              <input style={inputStyle} type="password" value={settingsNewPassword} onChange={e => setSettingsNewPassword(e.target.value)} placeholder="Choose a strong new password" />
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                              <button type="button" onClick={handleChangePassword} disabled={settingsSaving} style={{ padding: '10px 28px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', fontWeight: 700, fontSize: 14, boxShadow: '0 4px 14px rgba(59,130,246,0.3)', opacity: settingsSaving ? 0.8 : 1 }}>Update Password</button>
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

          {!loading && activeTab === 'Dashboard' && (
            <div className="admin-table-container" style={{ background: 'white', padding: '32px', borderRadius: '16px', border: '1px solid var(--admin-border)' }}>
              {/* Keeping the existing table but wrapping it for consistent style */}
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>Recent Users</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--admin-border)' }}>
                    <th style={{ padding: '12px 0', color: 'var(--admin-text-muted)', fontSize: '14px' }}>Name</th>
                    <th style={{ padding: '12px 0', color: 'var(--admin-text-muted)', fontSize: '14px' }}>Email</th>
                    <th style={{ padding: '12px 0', color: 'var(--admin-text-muted)', fontSize: '14px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.slice(0, 5).map((user) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '12px 0', fontSize: '14px' }}>{user.fullName}</td>
                      <td style={{ padding: '12px 0', fontSize: '14px' }}>{user.email}</td>
                      <td style={{ padding: '12px 0' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          background: user.isActive ? '#ecfdf5' : '#fef2f2',
                          color: user.isActive ? '#059669' : '#dc2626'
                        }}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* View Details Modal - Rendered at root for all tabs */}
      {selectedUser && (
        <div
          onClick={() => setSelectedUser(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'white', borderRadius: 16, padding: '32px 28px', width: '100%', maxWidth: 370, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', position: 'relative' }}
          >
            <button
              onClick={() => setSelectedUser(null)}
              style={{ position: 'absolute', top: 12, right: 12, background: '#f1f5f9', border: 'none', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', fontSize: 18, color: '#64748b', fontWeight: 700 }}
            >×</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
              <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 22, flexShrink: 0 }}>{(selectedUser.fullName || 'U').charAt(0)}</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>{selectedUser.fullName}</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{selectedUser.email}</div>
              </div>
            </div>
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 10 }}>
              <strong>Joined:</strong> {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
            </div>
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 10 }}>
              <strong>User ID:</strong> {selectedUser.id}
            </div>
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 10 }}>
              <strong>Status:</strong> {selectedUser.isActive ? 'Active' : 'Inactive'}
            </div>
            <div style={{ fontSize: 14, color: '#64748b' }}>
              <strong>Role:</strong> {selectedUser.role || 'USER'}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal - Rendered at root for all tabs */}
      {confirmDialog.show && (
        <div
          onClick={() => setConfirmDialog({ show: false, user: null, action: null })}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 2100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'white', borderRadius: 16, padding: '32px 28px', width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', position: 'relative' }}
          >
            <button
              onClick={() => setConfirmDialog({ show: false, user: null, action: null })}
              style={{ position: 'absolute', top: 12, right: 12, background: '#f1f5f9', border: 'none', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', fontSize: 18, color: '#64748b', fontWeight: 700 }}
            >×</button>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
                {confirmDialog.action === 'block' ? '⚠️ Block User' : '✓ Unblock User'}
              </div>
              <div style={{ fontSize: '0.95rem', color: '#64748b', lineHeight: 1.6 }}>
                {confirmDialog.action === 'block' 
                  ? `Are you sure you want to block '${confirmDialog.user?.fullName}'? They will not be able to log in.`
                  : `Are you sure you want to unblock '${confirmDialog.user?.fullName}'? They will regain access.`
                }
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={async () => {
                  const isBlocking = confirmDialog.action === 'block';
                  const targetUser = confirmDialog.user;
                  setConfirmDialog({ show: false, user: null, action: null });
                  try {
                    await blockUser(targetUser.id, isBlocking);
                    setAllUsers(prev => prev.map(u =>
                      u.id === targetUser.id
                        ? { ...u, blocked: isBlocking, isActive: !isBlocking }
                        : u
                    ));
                    showBlockMessage(
                      isBlocking
                        ? `✓ '${targetUser.fullName}' has been blocked and cannot log in.`
                        : `✓ '${targetUser.fullName}' has been unblocked and can log in again.`,
                      'success'
                    );
                  } catch (err) {
                    showBlockMessage('Failed to update user status. Please try again.', 'error');
                  }
                }}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  borderRadius: 10,
                  border: 'none',
                  background: confirmDialog.action === 'block' ? '#dc2626' : '#22c55e',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: 'pointer'
                }}
              >Confirm</button>
              <button
                onClick={() => setConfirmDialog({ show: false, user: null, action: null })}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  borderRadius: 10,
                  border: '1.5px solid #e5e7eb',
                  background: 'white',
                  color: '#64748b',
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: 'pointer'
                }}
              >Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal - Rendered at root for all tabs */}
      {deleteUserId && (
        <div
          onClick={() => { setDeleteUserId(null); setDeleteError(""); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 2100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'white', borderRadius: 16, padding: '28px 24px', width: '100%', maxWidth: 350, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', position: 'relative', textAlign: 'center' }}
          >
            <button
              onClick={() => { setDeleteUserId(null); setDeleteError(""); }}
              style={{ position: 'absolute', top: 10, right: 10, background: '#f1f5f9', border: 'none', borderRadius: 8, width: 26, height: 26, cursor: 'pointer', fontSize: 17, color: '#64748b', fontWeight: 700 }}
            >×</button>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#dc2626', marginBottom: 10 }}>Delete User?</div>
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 18 }}>Are you sure you want to permanently delete this user? This action cannot be undone.</div>
            {deleteError && <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 10 }}>{deleteError}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={confirmDeleteUser}
                style={{ padding: '0.5rem 1.2rem', borderRadius: 8, fontWeight: 700, fontSize: 14, background: '#dc2626', color: 'white', border: 'none', cursor: 'pointer' }}
              >Delete</button>
              <button
                onClick={() => { setDeleteUserId(null); setDeleteError(""); }}
                style={{ padding: '0.5rem 1.2rem', borderRadius: 8, fontWeight: 700, fontSize: 14, background: '#f1f5f9', color: '#334155', border: 'none', cursor: 'pointer' }}
              >Cancel</button>
            </div>
          </div>
        </div>
      )}
      {/* Confirm Logout Modal */}
      {showLogoutModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(30,41,59,0.18)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 8px 32px rgba(30,41,59,0.13)', padding: '32px 36px', minWidth: 320, textAlign: 'center' }}>
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
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
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
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

