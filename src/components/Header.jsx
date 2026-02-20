import React from 'react';
import { Search, Bell, User } from 'lucide-react';

const Header = ({ user, searchQuery, setSearchQuery, myBookingsLength = 0, onNotificationClick, onProfileClick, onLogout }) => {
  return (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1200px', margin: '0 auto 20px', padding: '14px 20px', background: 'var(--topbar-bg)', borderRadius: 16, border: '1px solid rgba(15,23,42,0.04)', boxShadow: '0 10px 30px rgba(15,23,42,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Welcome{user?.fullName ? `, ${user.fullName}` : ''}</div>
        <div style={{ marginLeft: 8, color: '#64748b' }}>Explore and manage your bookings</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--card-bg)', borderRadius: 14, padding: '10px 14px', boxShadow: '0 6px 18px rgba(15,23,42,0.04)' }}>
          <Search size={16} style={{ color: '#94a3b8', marginRight: 8 }} />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={e => setSearchQuery && setSearchQuery(e.target.value)}
            style={{ border: 'none', outline: 'none', width: 320, fontSize: 14, background: 'transparent' }}
          />
        </div>

        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={onNotificationClick}>
          <Bell size={20} style={{ color: 'var(--text-dark)' }} />
          {myBookingsLength > 0 && (
            <span style={{ position: 'absolute', top: -8, right: -8, background: 'linear-gradient(135deg,#ef4444,#fb7185)', color: '#fff', fontSize: 11, padding: '4px 7px', borderRadius: 20, fontWeight: 800, boxShadow: '0 4px 12px rgba(239,68,68,0.25)' }}>{myBookingsLength}</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--card-bg)', padding: '8px 12px', borderRadius: 999, boxShadow: '0 6px 18px rgba(15,23,42,0.04)', cursor: 'pointer' }} onClick={onProfileClick}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{user?.fullName ? user.fullName.charAt(0) : 'U'}</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{user?.fullName || 'Guest User'}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{user?.email || ''}</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
