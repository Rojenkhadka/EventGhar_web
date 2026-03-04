import React, { useState, useEffect } from 'react';
import { Search, Bell, User } from 'lucide-react';

const Header = ({ user, currentTab = 'Dashboard', searchQuery, setSearchQuery, myBookingsLength = 0, showNotifications = false, onNotificationClick, onProfileClick, onLogout, fullWidth = false }) => {
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const [profilePic, setProfilePic] = useState(null);

  // Load profile pic from localStorage or user prop
  useEffect(() => {
    const loadProfilePic = () => {
      const currentUser = JSON.parse(localStorage.getItem('eventghar_current_user') || '{}');
      const userPic = user?.profilePic || currentUser.profilePic;
      setProfilePic(userPic);
    };
    loadProfilePic();
    
    // Listen for profile updates
    const handleUserUpdate = () => loadProfilePic();
    window.addEventListener('eventghar_user_updated', handleUserUpdate);
    return () => window.removeEventListener('eventghar_user_updated', handleUserUpdate);
  }, [user]);

  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 32px',
    height: 'auto',
    background: '#ffffff',
    borderBottom: '1px solid #e8edf3',
    boxShadow: '0 1px 4px rgba(15,23,42,0.05)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    gap: 20,
    width: '100%',
    alignSelf: 'stretch',
    marginBottom: '32px',
  };

  return (
    <header style={containerStyle}>
      {/* Left: Page title */}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '1.0625rem', color: '#0f172a', letterSpacing: '-0.2px' }}>
          Welcome back{user && user.fullName ? `, ${user.fullName}` : ''}!
        </div>
        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 1 }}>
          {currentDate}
        </div>
      </div>

      {/* Right: search + bell + profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Search */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, color: '#94a3b8', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search events…"
            value={searchQuery}
            onChange={e => setSearchQuery && setSearchQuery(e.target.value)}
            style={{
              paddingLeft: 34,
              paddingRight: 14,
              paddingTop: 8,
              paddingBottom: 8,
              borderRadius: 10,
              border: '1.5px solid #e2e8f0',
              background: '#f8fafc',
              fontSize: '0.875rem',
              color: '#0f172a',
              outline: 'none',
              width: 200,
              transition: 'border 0.2s, width 0.2s',
            }}
            onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.width = '240px'; }}
            onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.width = '200px'; }}
          />
        </div>

        {/* Bell */}
        <div
          onClick={onNotificationClick}
          style={{
            position: 'relative',
            width: 40,
            height: 40,
            borderRadius: 10,
            border: '1.5px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
          onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
        >
          <Bell size={18} color="#475569" />
          {myBookingsLength > 0 && !showNotifications && (
            <span style={{
              position: 'absolute',
              top: 7,
              right: 7,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#ef4444',
              border: '2px solid #fff',
            }} />
          )}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 28, background: '#e2e8f0', flexShrink: 0 }} />

        {/* Profile */}
        <div
          onClick={onProfileClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            padding: '6px 10px 6px 6px',
            borderRadius: 12,
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {/* Avatar */}
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            overflow: 'hidden',
            flexShrink: 0,
            background: profilePic ? 'transparent' : 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.9375rem',
            color: '#fff',
            border: '2px solid #e2e8f0',
          }}>
            {profilePic ? (
              <img src={profilePic} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'
            )}
          </div>
          {/* Name + Role */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', lineHeight: 1.3 }}>
              {user?.fullName || 'Guest'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.3 }}>
              {user?.role === 'organizer' ? 'Organizer' : 'User'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
