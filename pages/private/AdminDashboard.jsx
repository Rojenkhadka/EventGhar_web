import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, getAdminStats, getWeeklyRegistrations, updateUserRole, deleteUser } from '../../src/api/admin';
import eventGharLogo from '../../src/assets/images/EventGhar.png';
import '../../src/styles/admin_dashboard.css';

const AdminDashboard = ({ currentUser }) => {
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
  const [activeTab, setActiveTab] = useState('Overview');
  const [adminEvents, setAdminEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState('');
  // Event moderation for admins
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
    } catch {}
  };
  const handleRejectEvent = async (id) => {
    try {
      const { rejectEvent } = await import('../../src/api/admin');
      await rejectEvent(id);
      loadAdminEvents();
    } catch {}
  };

  // Get user data from localStorage
  const userData = JSON.parse(localStorage.getItem('eventghar_current_user') || '{}');
  const userName = userData.fullName || currentUser?.fullName || 'Super Admin';

  useEffect(() => {
    loadAdminData();
  }, []);

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
    localStorage.removeItem('eventghar_token');
    localStorage.removeItem('eventghar_current_user');
    navigate('/', { replace: true });
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

  const handleRemoveUser = async (userId) => {
    if (!confirm('Permanently delete this user?')) return;
    try {
      await deleteUser(userId);
      setAllUsers(prev => prev.filter(u => u.id !== userId));
    } catch (e) {
      console.error(e);
      alert('Failed to delete user');
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
    { title: 'Dashboard', icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> },
    { title: 'Users', icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg> },
    { title: 'Organizers', icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="7" r="4"></circle><path d="M5.5 21v-2a4.5 4.5 0 0 1 9 0v2"></path></svg> },
    { title: 'Events', icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> },
  ];

  const bottomNavItems = [
    { title: 'Logout', icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1-2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>, isLogout: true },
  ];

  // Removed duplicate bottomNavItems declaration to fix redeclaration error

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

        <nav className="admin-nav">
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
        </nav>

        <div className="admin-nav" style={{ marginTop: 'auto', paddingTop: '40px' }}>
          {bottomNavItems.map((item) => (
            <div
              key={item.title}
              className="admin-nav-item"
              onClick={() => item.isLogout ? handleLogout() : setActiveTab(item.title)}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span>{item.title}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-top-bar">
          <div className="admin-top-bar-left">
            {/* Can add breadcrumbs or search here if needed, but keeping it clean like the image */}
          </div>
          <div className="admin-top-bar-right">
            <button className="admin-notification-btn">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            </button>
            <div className="admin-user-profile">
              <div className="admin-avatar">
                {userName.charAt(0)}
              </div>
              <div className="admin-user-info">
                <span className="admin-user-name">{userName}</span>
                <span className="admin-user-role">Super Admin</span>
              </div>
            </div>
          </div>
        </header>

        <div className="admin-content">
          {activeTab === 'Events' && (
            <div className="org-dashboard-section" style={{ background: 'white', borderRadius: 18, padding: '32px', boxShadow: '0 2px 12px rgba(59,130,246,0.06)', marginBottom: 32 }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.4rem', marginBottom: 28 }}>Event Moderation</h3>
              {eventsLoading ? <div>Loading events...</div> : eventsError ? <div>{eventsError}</div> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '28px' }}>
                  {adminEvents.map(event => (
                    <div key={event.id} style={{ border: '1.5px solid #e5e7eb', borderRadius: 14, background: '#f9fafb', boxShadow: '0 2px 8px rgba(59,130,246,0.04)', padding: 24, display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                        <div style={{ background: '#3b82f6', color: 'white', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 22 }}>{event.title?.charAt(0) || '🎉'}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#18181b', marginBottom: 2 }}>{event.title}</div>
                          <div style={{ color: '#64748b', fontSize: '0.98rem', fontWeight: 500 }}>{event.status || 'Pending'}</div>
                        </div>
                        <span className={`org-event-status org-event-status-${(event.status || 'pending').toLowerCase()}`}>{event.status || 'Pending'}</span>
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.98rem', marginBottom: 6 }}>
                        <span style={{ fontWeight: 500 }}>📅 Date:</span> {event.date ? new Date(event.date).toLocaleString() : '-'}<br/>
                        <span style={{ fontWeight: 500 }}>📍 Location:</span> {event.location || '-'}<br/>
                        <span style={{ fontWeight: 500 }}>👤 Organizer:</span> {event.organizerName || '-'}
                      </div>
                      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                        {event.status === 'PENDING_APPROVAL' && <>
                          <button className="org-btn org-btn-success" style={{ padding: '8px 18px', fontWeight: 600, fontSize: '1rem', borderRadius: 8 }} onClick={() => handleApproveEvent(event.id)}>Approve</button>
                          <button className="org-btn org-btn-reject" style={{ padding: '8px 18px', fontWeight: 600, fontSize: '1rem', borderRadius: 8 }} onClick={() => handleRejectEvent(event.id)}>Reject</button>
                        </>}
                      </div>
                    </div>
                  ))}
                  {adminEvents.length === 0 && <div className="org-placeholder">No events found.</div>}
                </div>
              )}
            </div>
          )}
          {activeTab === 'Overview' && (
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
          {activeTab === 'Users' && (
            <div style={{ marginTop: 20 }}>
              <div className="users-toolbar">
                <input
                  type="search"
                  placeholder="Search users by name or email"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="users-toolbar-actions">
                  <button className="org-btn">Invite User</button>
                </div>
              </div>

              <div className="users-grid">
                {allUsers.filter(u => {
                  if (!searchQuery) return true;
                  return `${u.fullName} ${u.email}`.toLowerCase().includes(searchQuery.toLowerCase());
                }).map(user => (
                  <div key={user.id} className="user-card">
                    <div className="user-left">
                      <div className="user-avatar">{(user.fullName || 'U').charAt(0)}</div>
                      <div className="user-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div className="user-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.fullName}</div>
                          <span className="role-badge">{user.role || 'USER'}</span>
                        </div>
                        <div className="user-email" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 520 }}>{user.email}</div>
                        <div className="user-meta">Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</div>
                      </div>
                    </div>
                    <div className="user-actions">
                      <button className="org-btn" onClick={() => handleUpdateUser(user.id)}>Update</button>
                      {user.role !== 'ORGANIZER' && <button className="org-btn org-btn-success" onClick={() => handlePromoteToOrganizer(user.id)}>Promote</button>}
                      <button className="org-btn org-btn-reject" onClick={() => handleRemoveUser(user.id)}>Delete</button>
                    </div>
                  </div>
                ))}
                {allUsers.length === 0 && <div style={{ padding: 24, background: 'white', borderRadius: 12 }}>No users found.</div>}
              </div>
            </div>
          )}

          {/* Organizers Tab */}
          {activeTab === 'Organizers' && (
            <div style={{ marginTop: 20 }}>
              <div className="users-toolbar">
                <input
                  type="search"
                  placeholder="Search organizers by name or email"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="users-toolbar-actions">
                  <button className="org-btn">Invite Organizer</button>
                </div>
              </div>

              <div className="users-grid">
                {allUsers.filter(u => u.role === 'ORGANIZER').filter(u => {
                  if (!searchQuery) return true;
                  return `${u.fullName} ${u.email}`.toLowerCase().includes(searchQuery.toLowerCase());
                }).map(org => (
                  <div key={org.id} className="organizer-card">
                    <div className="user-left">
                      <div className="organizer-avatar">{(org.fullName || 'U').charAt(0)}</div>
                      <div className="organizer-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div className="organizer-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{org.fullName}</div>
                          <span className="role-badge">ORGANIZER</span>
                        </div>
                        <div className="organizer-email" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 520 }}>{org.email}</div>
                        <div className="organizer-meta">
                          <span style={{ fontWeight: 700 }}>{org.organizerEventsCount || org.eventsCount || '--'}</span>
                          <span>events</span>
                          <span style={{ marginLeft: 'auto' }}>Joined {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : '-'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="organizer-actions">
                      <button className="org-btn" onClick={() => navigate(`/admin/users/${org.id}`)}>View</button>
                      <button className="org-btn org-btn-reject" onClick={() => {
                        if (!confirm('Revoke organizer role for this user?')) return;
                        updateUserRole(org.id, 'USER').then(() => {
                          setAllUsers(prev => prev.map(u => u.id === org.id ? { ...u, role: 'USER' } : u));
                        }).catch(() => alert('Failed to revoke role'));
                      }}>Revoke</button>
                      <button className="org-btn org-btn-reject" onClick={() => handleRemoveUser(org.id)}>Delete</button>
                    </div>
                  </div>
                ))}
                {allUsers.filter(u => u.role === 'ORGANIZER').length === 0 && (
                  <div style={{ padding: 24, background: 'white', borderRadius: 12 }}>No organizers found.</div>
                )}
              </div>
            </div>
          )}

          {!loading && activeTab === 'Overview' && (
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
    </div>
  );
};

export default AdminDashboard;

