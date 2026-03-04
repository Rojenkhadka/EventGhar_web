import React, { useEffect, useState } from 'react';

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: 'rgba(30, 41, 59, 0.35)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const modalBoxStyle = {
  background: 'white',
  borderRadius: 16,
  boxShadow: '0 8px 32px rgba(30,41,59,0.18)',
  padding: '36px 32px 28px 32px',
  minWidth: 340,
  maxWidth: '90vw',
  textAlign: 'center',
  zIndex: 1001,
};
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import CreateEventForm from '../../components/CreateEventForm';
const LocationPickerMap = React.lazy(() => import('../../src/components/LocationPickerMap'));
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
  ChevronRight,
  BarChart2,
  UserCheck,
  Camera,
  User,
  Palette,
  Lock,
  Users
} from 'lucide-react';
import Sparkline from '../../src/components/Sparkline';
import { listEvents, listMyEvents, createEvent, updateEvent, deleteEvent, publishEvent } from '../../src/api/events';
import { getEventBookings } from '../../src/api/bookings';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../../src/api/notifications';
import ProfileSection from '../../src/components/userDashboard/ProfileSection';
import { EventSchema } from './schema/event.schema';
import '../../src/styles/organizer_dashboard.css';
import '../../src/styles/settings_panel.css';
import EventGharLogo from '../../src/assets/images/EventGhar_logo.png';
import { getMe, updateMe } from '../../src/api/me';

// Settings Panel Component
const SettingsPanel = ({ user: initialUser, onProfilePicChange, resetToProfileTime }) => {
  const navigate = useNavigate();
  const [settingsSubTab, setSettingsSubTab] = useState('General');
  const [user, setUser] = useState(null);
  const [notifEventAlerts, setNotifEventAlerts] = useState(true);
  const [notifReminders, setNotifReminders] = useState(true);
  const [settingsForm, setSettingsForm] = useState({ name: '', displayName: '', email: '', phone: '', currentPassword: '', newPassword: '' });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const settingsPicInputRef = React.useRef(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (resetToProfileTime) {
      setSettingsSubTab('General');
    }
  }, [resetToProfileTime]);

  useEffect(() => {
    if (user) {
      setSettingsForm(f => ({ ...f, name: user.fullName || '', email: user.email || '', phone: user.phone || '' }));
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      const userData = await getMe();
      setUser(userData);
    } catch (err) {
      console.error('Failed to load user:', err);
    }
  };

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
      const me = await getMe();
      setUser(me);
      try {
        localStorage.setItem('eventghar_profile_pic', dataUrl);
        localStorage.setItem('eventghar_current_user', JSON.stringify(me));
      } catch (err) {}
      window.dispatchEvent(new Event('eventghar_user_updated'));
      if (onProfilePicChange) onProfilePicChange(dataUrl);
    } catch (err) {
      console.error('Failed to upload profile pic', err);
    } finally {
      if (settingsPicInputRef.current) settingsPicInputRef.current.value = '';
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
    <div className="settings-page" style={{ minHeight: '100%', background: '#f8fafc', padding: '0', boxSizing: 'border-box' }}>
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
                  user?.fullName?.charAt(0)?.toUpperCase() || 'O'
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
            <div style={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>{user?.fullName || 'Organizer'}</div>
            <div style={{ color: '#64748b', fontSize: 13, marginTop: 6 }}>{user?.email || ''}</div>
            <div style={{ marginTop: 12, display: 'inline-block', background: '#eff6ff', color: '#3b82f6', borderRadius: 22, padding: '6px 14px', fontSize: 13, fontWeight: 800 }}>Organizer</div>
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
                await updateMe({ name: settingsForm.name, email: settingsForm.email, phone: settingsForm.phone });
                const me = await getMe();
                setUser(me);
                try { localStorage.setItem('eventghar_current_user', JSON.stringify(me)); } catch (err) {}
                window.dispatchEvent(new Event('eventghar_user_updated'));
                if (prevName !== (me.fullName || '')) {
                  setSettingsSuccess('Name changed successfully');
                  setTimeout(() => setSettingsSuccess(''), 3000);
                }
              } catch (err) {
                setSettingsError('Failed to update profile.');
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
              {settingsSuccess && <div style={{ color: '#10b981', fontWeight: 700, fontSize: 14, marginBottom: 16, padding: '12px 18px', background: '#d1fae5', borderRadius: 12, border: '1px solid #a7f3d0' }}>{settingsSuccess}</div>}
              {settingsError && <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 14, marginBottom: 16, padding: '12px 18px', background: '#fef2f2', borderRadius: 12, border: '1px solid #fee2e2' }}>{settingsError}</div>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14 }}>
                <button type="button" onClick={() => setSettingsForm(f => ({ ...f, name: user?.fullName || '', email: user?.email || '' }))} style={{
                  padding: '12px 26px', borderRadius: 12, border: '1.5px solid #e2e8f0',
                  background: '#fff', color: '#374151', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                }}>Discard</button>
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
                        // use settingsForm, setSettingsSaving, setSettingsError, setSettingsSuccess from above scope
                        try {
                          // validation
                          if (!settingsForm.currentPassword || !settingsForm.newPassword) {
                            alert('Both current and new password are required.');
                            return;
                          }
                          // set loading indicator if available
                          if (typeof setSettingsSaving === 'function') setSettingsSaving(true);
                          await updateMe({ currentPassword: settingsForm.currentPassword, password: settingsForm.newPassword });
                          const me = await getMe();
                          if (typeof setUser === 'function') setUser(me);
                          try { localStorage.setItem('eventghar_current_user', JSON.stringify(me)); } catch (e) {}
                          window.dispatchEvent(new Event('eventghar_user_updated'));
                          alert('Password updated successfully');
                          // clear fields
                          if (typeof setSettingsForm === 'function') setSettingsForm(f => ({ ...f, currentPassword: '', newPassword: '' }));
                        } catch (err) {
                          console.error('Password update failed', err);
                          alert(err?.message || 'Failed to update password');
                        } finally {
                          if (typeof setSettingsSaving === 'function') setSettingsSaving(false);
                        }
                      }}
                      style={{
                        padding: '10px 28px', borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                        color: '#fff', fontWeight: 700, fontSize: 14,
                        boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
                      }}
                    >Update Password</button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
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

const OrganizerDashboard = ({ currentUser }) => {
  // Cancel event modal state (must be inside component)
  const [cancelModal, setCancelModal] = useState({ open: false, eventId: null });
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => setShowLogoutModal(true);
  const confirmLogout = () => {
    localStorage.removeItem('eventghar_token');
    localStorage.removeItem('eventghar_current_user');
    navigate('/login', { replace: true });
  };
  const location = useLocation();
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [settingsResetTime, setSettingsResetTime] = useState(0);
  // Fix: Add missing searchFocused state
  const [searchFocused, setSearchFocused] = useState(false);

  // Bookings state
  const [allBookings, setAllBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Attendees page state
  const [attendeesSearchQuery, setAttendeesSearchQuery] = useState('');
  const [attendeesFilter, setAttendeesFilter] = useState('All Events'); // 'All Events', 'Registered', 'Checked-in', 'VIF'
  const [allAttendees, setAllAttendees] = useState([]);
  const [attendeesLoading, setAttendeesLoading] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const bellRef = React.useRef(null);

  const loadNotifications = async () => {
    try {
      const [notifs, count] = await Promise.all([
        getNotifications(),
        getUnreadCount()
      ]);
      console.log('Loaded notifications:', notifs, 'Count:', count);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  // Clear red dot when notification dropdown opens
  useEffect(() => {
    if (showNotifications && unreadCount > 0) {
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  }, [showNotifications]);

  // Set tab from navigation state if present (e.g., after returning from EventDetails)
  useEffect(() => {
    if (location.state && location.state.tab) {
      setActiveTab(location.state.tab);
    }
    // eslint-disable-next-linels
  }, [location.state]);

  // Create Event Form State
  const [createEventForm, setCreateEventForm] = useState({
    title: '',
    eventType: 'Concert',
    description: '',
    date: new Date().toISOString().slice(0, 10),
    time: '',
    venue: '',
    ticketPrice: '',
    maxParticipants: '',
    eventImage: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [currentCreateStep, setCurrentCreateStep] = useState(1);
  const [locationSearch, setLocationSearch] = useState('');
  const [mapKey, setMapKey] = useState(0);
  const [endTime, setEndTime] = useState('');
  const [maxPerUser, setMaxPerUser] = useState('');
  const [ticketTypeName, setTicketTypeName] = useState('');
  const [contactEmail, setContactEmail] = useState(() => {
    const userData = JSON.parse(localStorage.getItem('eventghar_current_user') || '{}');
    return userData.email || currentUser?.email || '';
  });
  const [contactPhone, setContactPhone] = useState('');
  const [eventMode, setEventMode] = useState('Physical');

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
  const [userName, setUserName] = useState(() => {
    const userData = JSON.parse(localStorage.getItem('eventghar_current_user') || '{}');
    return userData.fullName || currentUser?.fullName || 'Organizer';
  });

  useEffect(() => {
    const syncUserName = () => {
      const userData = JSON.parse(localStorage.getItem('eventghar_current_user') || '{}');
      setUserName(userData.fullName || currentUser?.fullName || 'Organizer');
    };
    window.addEventListener('storage', syncUserName);
    window.addEventListener('eventghar_user_updated', syncUserName);
    // Also sync on every render in case localStorage is updated in same tab
    syncUserName();
    return () => {
      window.removeEventListener('storage', syncUserName);
      window.removeEventListener('eventghar_user_updated', syncUserName);
    };
  }, [currentUser]);
  const [profilePic, setProfilePic] = useState(() => localStorage.getItem('eventghar_profile_pic') || null);

  useEffect(() => {
    // Also check server as secondary source
    getMe().then(u => { if (u?.profilePic && !localStorage.getItem('eventghar_profile_pic')) setProfilePic(u.profilePic); }).catch(() => { });
  }, []);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    loadNotifications();
    // refresh notifications and unread count periodically
    const t = setInterval(() => {
      loadNotifications();
    }, 30 * 1000); // Every 30 seconds
    return () => clearInterval(t);
  }, []);

  // Step validation logic
  const canContinueStep = (() => {
    if (currentCreateStep === 1) {
      // Step 1: Basic Info
      return (
        createEventForm.title?.trim() &&
        createEventForm.eventType?.trim() &&
        createEventForm.date?.trim() &&
        createEventForm.time?.trim() &&
        createEventForm.venue?.trim()
      );
    }
    if (currentCreateStep === 2) {
      // Step 2: Ticket Details
      return (
        createEventForm.ticketPrice !== '' &&
        createEventForm.maxParticipants !== ''
      );
    }
    if (currentCreateStep === 3) {
      // Step 3: Organizer Info
      return (
        userName?.trim() &&
        contactEmail?.trim() &&
        contactPhone?.trim()
      );
    }
    return true;
  })();

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  useEffect(() => {
    if (activeTab === 'Ticket Sales') {
      loadAllBookings();
    }
    if (activeTab === 'Attendees') {
      loadAllAttendees();
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

  // Load all attendees for attendees page
  const loadAllAttendees = async () => {
    setAttendeesLoading(true);
    try {
      let attendees = [];
      for (const event of myEvents) {
        const eventBookings = await getEventBookings(event.id);
        // Transform bookings into attendee records with additional UI data
        const eventAttendees = eventBookings.map(booking => ({
          id: booking.id,
          name: booking.userName,
          email: booking.userEmail,
          eventName: event.title,
          eventId: event.id,
          passType: booking.attendeeCount > 1 ? 'Group Pass' : 'General Entry',
          status: booking.status || 'REGISTERED', // REGISTERED, CHECKED-IN, CANCELLED
          checkedIn: booking.status === 'CHECKED-IN',
          createdAt: booking.createdAt,
          notes: booking.notes,
        }));
        attendees = attendees.concat(eventAttendees);
      }
      setAllAttendees(attendees);
    } catch (err) {
      setAllAttendees([]);
    } finally {
      setAttendeesLoading(false);
    }
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      const events = await listMyEvents();
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

  // Show cancel modal instead of window.confirm
  const handleDelete = (id) => {
    setCancelModal({ open: true, eventId: id });
    setCancelError('');
  };

  // Confirm cancel event
  const confirmCancelEvent = async () => {
    if (!cancelModal.eventId) return;
    setCancelLoading(true);
    setCancelError('');
    try {
      await deleteEvent(cancelModal.eventId);
      setCancelModal({ open: false, eventId: null });
      loadEvents();
    } catch (err) {
      setCancelError('Failed to cancel event. Please try again.');
    } finally {
      setCancelLoading(false);
    }
  };
      {/* Cancel Event Modal */}
      {cancelModal.open && (
        <div style={modalOverlayStyle}>
          <div style={modalBoxStyle}>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#b91c1c', marginBottom: 10 }}>Cancel Event</div>
            <div style={{ color: '#334155', fontSize: 15, marginBottom: 18 }}>
              Are you sure you want to cancel this event? This action cannot be undone.
            </div>
            {cancelError && <div style={{ color: '#b91c1c', fontWeight: 600, marginBottom: 10 }}>{cancelError}</div>}
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
              <button
                onClick={() => setCancelModal({ open: false, eventId: null })}
                style={{
                  padding: '10px 28px',
                  background: '#f1f5f9',
                  color: '#334155',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: cancelLoading ? 'not-allowed' : 'pointer',
                  opacity: cancelLoading ? 0.7 : 1,
                  transition: 'all 0.2s',
                }}
                disabled={cancelLoading}
              >
                Cancel
              </button>
              <button
                onClick={confirmCancelEvent}
                style={{
                  padding: '10px 28px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: cancelLoading ? 'not-allowed' : 'pointer',
                  opacity: cancelLoading ? 0.7 : 1,
                  transition: 'all 0.2s',
                }}
                disabled={cancelLoading}
              >
                {cancelLoading ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

  const handlePublish = async (id) => {
    if (window.confirm('Publish this event? It will be visible to all users.')) {
      try {
        await publishEvent(id);
        loadEvents();
        // Optionally show a dashboard toast or message here for publish success
      } catch (err) {
        console.error('Failed to publish event:', err);
        // Optionally show a dashboard toast or message here for publish failure
      }
    }
  };

  const filteredEvents = myEvents.filter(e =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.venue?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateEventSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    // Only allow submission on step 4 (Review & Publish)
    if (currentCreateStep !== 4) {
      return;
    }

    // Validate required fields
    if (!createEventForm.title) {
      setSubmitError('Please enter an event title in Step 1.');
      return;
    }
    if (!createEventForm.venue) {
      setSubmitError('Please enter a venue/location in Step 1.');
      return;
    }
    if (!createEventForm.date) {
      setSubmitError('Please select a date in Step 1.');
      return;
    }
    
    setSubmitError('');
    setSubmitSuccess('');

    try {
      // Map to API fields (server expects: title, description, date, location, maxAttendees, image)
      const payload = {
        title: createEventForm.title,
        description: createEventForm.description,
        date: createEventForm.date,
        location: createEventForm.venue,
        maxAttendees: createEventForm.maxParticipants ? Number(createEventForm.maxParticipants) : null,
        image: imagePreview || null,
      };

      const created = await createEvent(payload);
      setSubmitSuccess('Event submitted for approval successfully!');

      // Optimistically add the new event to myEvents with status PENDING_APPROVAL
      setMyEvents(prev => [
        {
          ...created,
          status: 'PENDING_APPROVAL',
          venue: created.location,
          image: created.image || imagePreview || null,
        },
        ...prev
      ]);

      // Reset form
      setCreateEventForm({
        title: '',
        eventType: 'Concert',
        description: '',
        date: new Date().toISOString().slice(0, 10),
        time: '',
        venue: '',
        ticketPrice: '',
        maxParticipants: '',
        eventImage: null,
      });
      setImagePreview(null);
      setCurrentCreateStep(1);

      // Switch to My Events tab after 2 seconds
      setTimeout(() => {
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
      date: new Date().toISOString().slice(0, 10),
      time: '',
      venue: '',
      ticketPrice: '',
      maxParticipants: '',
      eventImage: null,
    });
    setImagePreview(null);
    setSubmitError('');
    setSubmitSuccess('');
    setCurrentCreateStep(1);
    setLocationSearch('');
    setActiveTab('Dashboard');
  };

  const sidebarItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Create Event', icon: <Plus size={20} /> },
    { name: 'My Events', icon: <Calendar size={20} /> },
    { name: 'Ticket Sales', icon: <BarChart2 size={20} /> },
    { name: 'Attendees', icon: <UserCheck size={20} /> },
    { name: 'Settings', icon: <Settings size={20} /> },
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

      {/* ── Full-width Top Bar ── */}
      <header className="org-topbar">
        {/* Logo section — sits over the sidebar width */}
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
          {/* Left: Page title */}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '1.0625rem', color: '#0f172a', letterSpacing: '-0.2px' }}>
              Welcome back{userName ? `, ${userName}` : ''}!
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 1 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
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
                <div style={{
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
            <div onClick={() => { setActiveTab('Settings'); setSettingsResetTime(Date.now()); }}
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
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Organizer</div>
              </div>
              <ChevronRight size={14} color="#94a3b8" style={{ marginLeft: 2 }} />
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
                if (item.name === 'Create Event') {
                  reset();
                  setEditingEvent(null);
                  setCreateEventForm({
                    title: '',
                    eventType: 'Concert',
                    description: '',
                    date: new Date().toISOString().slice(0, 10),
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
          <div className="org-nav-item logout" onClick={handleLogout}>
            <LogOut size={20} />
            Logout
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="org-main" style={{ paddingLeft: 32, paddingRight: 32 }}>

        {/* Content by tab */}
        {activeTab === 'Dashboard' && (
          <>
            {/* Page header — outside any card */}
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>Dashboard Overview</h2>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>Welcome back — here’s a snapshot of your activity</p>
            </div>

            {/* Stats row - match user dashboard style */}
            {(() => {
              // Calculate stats
              const totalEvents = myEvents.length;
              const pendingEvents = myEvents.filter(e => e.status === 'PENDING_APPROVAL').length;
              const approvedEvents = myEvents.filter(e => e.status === 'APPROVED').length;
              const totalTickets = myEvents.reduce((sum, e) => sum + (e.ticketsSold || e.tickets_sold || 0), 0);
              const totalRevenue = myEvents.reduce((sum, e) => sum + (e.revenue || 0), 0);
              const totalParticipants = myEvents.reduce((sum, e) => sum + (e.maxParticipants || e.maxAttendees || 0), 0);
              // Fake sparkline data for now (replace with real trends if available)
              const spark1 = [approvedEvents-2, approvedEvents-1, approvedEvents, approvedEvents+1, approvedEvents+2].map(v => Math.max(0, v));
              const spark2 = [totalTickets-2, totalTickets-1, totalTickets, totalTickets+1, totalTickets+2].map(v => Math.max(0, v));
              const spark3 = [totalParticipants-10, totalParticipants-5, totalParticipants-2, totalParticipants, totalParticipants].map(v => Math.max(0, v));
              const statsCards = [
                {
                  title: 'Active Events',
                  value: approvedEvents,
                  color: '#4A90E2',
                  badge: pendingEvents ? `${pendingEvents} pending` : '',
                  bgGradient: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
                  data: spark1,
                },
                {
                  title: 'Ticket Sales',
                  value: totalTickets,
                  color: '#5CB85C',
                  badge: totalRevenue ? `Rs. ${totalRevenue.toLocaleString()}` : '',
                  bgGradient: 'linear-gradient(135deg, #5CB85C 0%, #4CAF50 100%)',
                  data: spark2,
                },
                {
                  title: 'Registered Participants',
                  value: totalParticipants,
                  color: '#8b5cf6',
                  badge: totalEvents ? `${totalEvents} events` : '',
                  bgGradient: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                  data: spark3,
                },
              ];
              return (
                <div className="org-stat-cards">
                  {statsCards.map(card => (
                    <div key={card.title} className="org-stat-card" style={{ color: card.color, background: card.bgGradient, position: 'relative' }}>
                      <div style={{ position: 'absolute', top: 12, right: 12 }}>
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
              );
            })()}

            {/* Upcoming Events + Quick Insights */}
            <div className="org-dashboard-section">
              <div className="org-section-header">
                <h3>Upcoming Events</h3>
                <a href="#" style={{ color: 'var(--blue-primary)', fontWeight: 800 }}>View All</a>
              </div>

              <div className="org-dashboard-event-grid">
                {filteredEvents.length === 0 ? (
                  <div className="org-placeholder">
                    <div style={{ fontWeight: 700 }}>No upcoming events</div>
                    <div style={{ marginTop: 8 }}>Create your first event to see it here.</div>
                  </div>
                ) : (
                  filteredEvents.map(event => {
                    const capacity = event.capacity || event.maxAttendees || 0;
                    const sold = event.ticketsSold || event.tickets_sold || 0;
                    const percent = capacity > 0 ? Math.min(100, Math.round((sold / capacity) * 100)) : 0;
                    let badgeText = '';
                    let badgeStyle = {};
                    
                    if (event.status === 'APPROVED') {
                      badgeText = 'Approved';
                      badgeStyle = {
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        boxShadow: '0 6px 16px rgba(16, 185, 129, 0.35)'
                      };
                    } else if (event.status === 'PENDING_APPROVAL') {
                      badgeText = 'Pending Approval';
                      badgeStyle = {
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        boxShadow: '0 6px 16px rgba(245, 158, 11, 0.35)'
                      };
                    } else if (event.status === 'REJECTED') {
                      badgeText = 'Rejected';
                      badgeStyle = {
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        boxShadow: '0 6px 16px rgba(239, 68, 68, 0.35)'
                      };
                    } else {
                      badgeText = (event.status || '').toUpperCase();
                      badgeStyle = {
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        boxShadow: '0 6px 16px rgba(59, 130, 246, 0.35)'
                      };
                    }

                    const formattedDate = event.date ? new Date(event.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '-';
                    const venue = event.venue || event.location || 'TBD';

                    return (
                      <div key={event.id} className="org-dashboard-event-card">
                        <div className="org-dashboard-event-image" style={event.image ? { backgroundImage: `url(${event.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {!event.image && (
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                          )}
                          <span className="org-dashboard-event-badge" style={badgeStyle}>{badgeText}</span>
                        </div>
                        <div className="org-dashboard-event-content">
                          <div className="org-dashboard-event-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span>{event.title}</span>
                          </div>
                          <div className="org-dashboard-event-meta">
                            <span><Calendar size={16} /> {formattedDate} {event.time ? `• ${event.time}` : ''}</span>
                            <span><MapPin size={16} /> {venue}</span>
                          </div>
                          <div style={{ margin: '12px 0 0 0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ color: 'var(--text-muted)' }}>Registration Progress</div>
                              <span style={{ color: 'var(--blue-primary)', fontWeight: 700 }}>{sold}/{capacity || '—'} Attendees</span>
                            </div>
                            <div style={{ height: 10, background: '#f1f5f9', borderRadius: 8, overflow: 'hidden', marginTop: 8 }}>
                              <div style={{ width: `${percent}%`, background: 'linear-gradient(90deg,#3b82f6,#60a5fa)', height: '100%' }} />
                            </div>
                            {/* Description preview - clamp to 3 lines */}
                            {event.description && (
                              <div style={{
                                marginTop: 12,
                                color: '#334155',
                                fontSize: 14,
                                lineHeight: '1.45',
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {event.description}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="org-dashboard-event-footer">
                          <div style={{
                            display: 'flex',
                            flexDirection: 'row',
                            gap: 18,
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                            marginTop: 18,
                            padding: '0 8px 8px 8px',
                            width: '100%',
                          }}>
                            <button
                              className="org-btn org-btn-primary"
                              style={{
                                minWidth: 120,
                                padding: '10px 0',
                                borderRadius: 8,
                                fontSize: 15,
                                fontWeight: 600,
                                boxShadow: 'none',
                                background: 'linear-gradient(90deg,#2563eb,#60a5fa)',
                                color: 'white',
                                border: 'none',
                                transition: 'background 0.15s',
                                letterSpacing: 0.2,
                              }}
                              onClick={() => navigate(`/events/${event.id}`, { state: { from: 'organizer-dashboard' } })}
                            >
                              Manage
                            </button>
                            <button
                              className="org-btn org-btn-danger"
                              style={{
                                minWidth: 120,
                                padding: '10px 0',
                                borderRadius: 8,
                                fontSize: 15,
                                fontWeight: 600,
                                boxShadow: 'none',
                                background: 'linear-gradient(90deg,#ef4444,#f87171)',
                                color: 'white',
                                border: 'none',
                                transition: 'background 0.15s',
                                letterSpacing: 0.2,
                              }}
                              onClick={() => handleDelete(event.id)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
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
          <div style={{
            minHeight: '100vh',
            background: '#f8fafc',
            padding: '0',
            display: 'flex',
            flexDirection: 'column',
            width: '100%'
          }}>
            {/* Header */}
            <div style={{ padding: '8px 12px 0 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <button type="button" onClick={handleCancelCreateEvent} style={{
                    background: 'white',
                    border: '2px solid #e2e8f0',
                    cursor: 'pointer',
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    color: '#1e293b',
                    transition: 'all 0.3s'
                  }}>←</button>
                  <h2 style={{ fontWeight: 800, fontSize: '2rem', color: '#0f172a', margin: 0 }}>Create Event</h2>
                </div>
                <button type="button" onClick={handleCancelCreateEvent} style={{
                  background: 'white',
                  border: '2px solid #e2e8f0',
                  color: '#2563eb',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  padding: '10px 24px',
                  borderRadius: 10,
                  transition: 'all 0.3s'
                }}>Save Draft</button>
              </div>

              {/* Step Dots */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 0, paddingBottom: 12 }}>
                {[1, 2, 3, 4].map(s => (
                  <div key={s} style={{
                    width: s === currentCreateStep ? 40 : 12,
                    height: 12,
                    borderRadius: 8,
                    background: s === currentCreateStep ? '#2563eb' : '#cbd5e1',
                    transition: 'all 0.3s',
                    cursor: 'pointer'
                  }} onClick={() => setCurrentCreateStep(s)} />
                ))}
              </div>
            </div>

            {/* Form Content */}
            <div style={{ flex: 1, padding: '0 12px 32px 12px' }}>
              {/* Alerts */}
              {submitError && (
                <div style={{
                  background: '#fee2e2',
                  color: '#991b1b',
                  padding: '14px 20px',
                  borderRadius: 12,
                  marginBottom: 24,
                  fontWeight: 600,
                  fontSize: '1rem',
                  maxWidth: '1400px',
                  margin: '0 auto 24px'
                }}>
                  ⚠️ {submitError}
                </div>
              )}
              {submitSuccess && (
                <div style={{
                  background: '#dcfce7',
                  color: '#065f46',
                  padding: '14px 20px',
                  borderRadius: 12,
                  marginBottom: 24,
                  fontWeight: 600,
                  fontSize: '1rem',
                  maxWidth: '1400px',
                  margin: '0 auto 24px'
                }}>
                  ✅ {submitSuccess}
                </div>
              )}

              <div style={{ width: '100%' }}>

                {/* ===== STEP 1: Event Details ===== */}
                {currentCreateStep === 1 && (
                  <div style={{
                    background: 'white',
                    borderRadius: 16,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    padding: '28px 32px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 28
                  }}>
                    <div>
                      <h2 style={{ fontWeight: 800, fontSize: '2rem', color: '#0f172a', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Event Details</h2>
                      <div style={{ color: '#2563eb', fontWeight: 600, fontSize: '1.125rem' }}>Step 1 of 4: Basic Information</div>
                    </div>

                    {/* Two Column Layout */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                      {/* Left Column */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                        {/* Event Title */}
                        <div>
                          <label style={{
                            display: 'block',
                            fontWeight: 600,
                            marginBottom: 8,
                            color: '#64748b',
                            fontSize: '0.875rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>Event Title</label>
                          <input
                            type="text"
                            value={createEventForm.title}
                            onChange={(e) => setCreateEventForm({ ...createEventForm, title: e.target.value })}
                            placeholder="e.g. Annual Music Festival"
                            style={{
                              width: '100%',
                              padding: '14px 16px',
                              borderRadius: 12,
                              border: '2px solid #e2e8f0',
                              fontSize: '1rem',
                              outline: 'none',
                              boxSizing: 'border-box',
                              transition: 'border 0.3s'
                            }}
                            onFocus={e => e.target.style.borderColor = '#2563eb'}
                            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                          />
                        </div>

                        {/* Category */}
                        <div>
                          <label style={{
                            display: 'block',
                            fontWeight: 600,
                            marginBottom: 8,
                            color: '#64748b',
                            fontSize: '0.875rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>Category</label>
                          <div style={{ position: 'relative' }}>
                            <select
                              value={createEventForm.eventType}
                              onChange={(e) => setCreateEventForm({ ...createEventForm, eventType: e.target.value })}
                              style={{
                                width: '100%',
                                padding: '14px 40px 14px 16px',
                                borderRadius: 12,
                                border: '2px solid #e2e8f0',
                                fontSize: '1rem',
                                background: 'white',
                                cursor: 'pointer',
                                boxSizing: 'border-box',
                                appearance: 'none',
                                outline: 'none'
                              }}
                            >
                              <option value="">Select category</option>
                              <option value="Concert">Concert</option>
                              <option value="Workshop">Workshop</option>
                              <option value="Seminar">Seminar</option>
                              <option value="Sports">Sports</option>
                              <option value="Festival">Festival</option>
                              <option value="Cultural Program">Cultural Program</option>
                            </select>
                            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#2563eb', pointerEvents: 'none', fontSize: 18 }}>⌄</span>
                          </div>
                        </div>

                        {/* Date */}
                        <div>
                          <label style={{
                            display: 'block',
                            fontWeight: 600,
                            marginBottom: 8,
                            color: '#64748b',
                            fontSize: '0.875rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>Date</label>
                          <input
                            type="date"
                            value={createEventForm.date}
                            onChange={(e) => setCreateEventForm({ ...createEventForm, date: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '14px 16px',
                              borderRadius: 12,
                              border: '2px solid #e2e8f0',
                              fontSize: '1rem',
                              boxSizing: 'border-box',
                              outline: 'none',
                              transition: 'border 0.3s'
                            }}
                            onFocus={e => e.target.style.borderColor = '#2563eb'}
                            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                          />
                        </div>

                        {/* Time */}
                        <div>
                          <label style={{
                            display: 'block',
                            fontWeight: 600,
                            marginBottom: 8,
                            color: '#64748b',
                            fontSize: '0.875rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>Time</label>
                          <input
                            type="time"
                            value={createEventForm.time}
                            onChange={(e) => setCreateEventForm({ ...createEventForm, time: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '14px 16px',
                              borderRadius: 12,
                              border: '2px solid #e2e8f0',
                              fontSize: '1rem',
                              boxSizing: 'border-box',
                              outline: 'none',
                              transition: 'border 0.3s'
                            }}
                            onFocus={e => e.target.style.borderColor = '#2563eb'}
                            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                          />
                        </div>
                      </div>

                      {/* Right Column */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                        {/* Venue/Location */}
                        <div>
                          <label style={{
                            display: 'block',
                            fontWeight: 600,
                            marginBottom: 8,
                            color: '#64748b',
                            fontSize: '0.875rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>Venue/Location</label>
                          <React.Suspense fallback={<div style={{ height: 290, background: '#f1f5f9', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 14 }}>Loading map…</div>}>
                            <LocationPickerMap
                              value={createEventForm.venue}
                              onChange={(val) => setCreateEventForm({ ...createEventForm, venue: val })}
                            />
                          </React.Suspense>
                        </div>

                        {/* Event Banner */}
                        <div>
                          <label style={{
                            display: 'block',
                            fontWeight: 600,
                            marginBottom: 8,
                            color: '#64748b',
                            fontSize: '0.875rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>Event Banner</label>
                          {!imagePreview ? (
                            <label htmlFor="banner-upload" style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '2px dashed #cbd5e1',
                              borderRadius: 12,
                              padding: '32px 24px',
                              cursor: 'pointer',
                              background: '#f8fafc',
                              gap: 10,
                              minHeight: 180
                            }}>
                              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>☁️</div>
                              <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9375rem' }}>Click to upload banner</div>
                              <div style={{ color: '#94a3b8', fontSize: '0.8125rem' }}>PNG, JPG up to 10MB</div>
                              <input id="banner-upload" type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                            </label>
                          ) : (
                            <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '2px solid #e2e8f0' }}>
                              <img src={imagePreview} alt="Banner" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 12, display: 'block' }} />
                              <button type="button" onClick={() => { setImagePreview(null); setCreateEventForm({ ...createEventForm, eventImage: null }); }}
                                style={{
                                  position: 'absolute',
                                  top: 10,
                                  right: 10,
                                  background: 'rgba(15,23,42,0.8)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: 8,
                                  padding: '6px 12px',
                                  fontWeight: 600,
                                  fontSize: '0.8125rem',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s'
                                }}>Remove</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Event Description - Full Width */}
                    <div>
                      <label style={{
                        display: 'block',
                        fontWeight: 600,
                        marginBottom: 8,
                        color: '#64748b',
                        fontSize: '0.875rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>Event Description</label>
                      <textarea
                        value={createEventForm.description}
                        onChange={(e) => setCreateEventForm({ ...createEventForm, description: e.target.value })}
                        placeholder="Tell people what your event is about..."
                        rows={6}
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          border: '2px solid #e2e8f0',
                          borderRadius: 12,
                          fontSize: '1rem',
                          fontFamily: 'inherit',
                          resize: 'vertical',
                          outline: 'none',
                          boxSizing: 'border-box',
                          minHeight: 150,
                          transition: 'border 0.3s'
                        }}
                        onFocus={e => e.target.style.borderColor = '#2563eb'}
                        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                      />
                    </div>


                  </div>
                )}

                {/* ===== STEP 2: Ticket Details ===== */}
                {currentCreateStep === 2 && (
                  <div style={{
                    background: 'white',
                    borderRadius: 16,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    padding: '28px 32px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 24
                  }}>
                    <div>
                      <h2 style={{ fontWeight: 800, fontSize: '1.5rem', color: '#0f172a', margin: '0 0 4px 0' }}>Ticket Details</h2>
                      <div style={{ color: '#2563eb', fontWeight: 500, fontSize: 14 }}>Step 2 of 4: Pricing & Capacity</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 9, color: '#1e293b', fontSize: 16 }}>Ticket Price (Rs.)</label>
                        <input type="number" min="0" value={createEventForm.ticketPrice} onChange={(e) => setCreateEventForm({ ...createEventForm, ticketPrice: e.target.value })} placeholder="0"
                          style={{ width: '100%', padding: '16px 18px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 17, boxSizing: 'border-box' }}
                          onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                        <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 5 }}>Leave 0 for free events</p>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 9, color: '#1e293b', fontSize: 16 }}>Total Tickets Available</label>
                        <input type="number" min="1" value={createEventForm.maxParticipants} onChange={(e) => setCreateEventForm({ ...createEventForm, maxParticipants: e.target.value })} placeholder="e.g. 200"
                          style={{ width: '100%', padding: '16px 18px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 17, boxSizing: 'border-box' }}
                          onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 9, color: '#1e293b', fontSize: 16 }}>Max Tickets per User</label>
                        <input type="number" min="1" max="20" value={maxPerUser} onChange={e => setMaxPerUser(e.target.value)} placeholder="e.g. 4"
                          style={{ width: '100%', padding: '16px 18px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 17, boxSizing: 'border-box' }}
                          onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                      </div>
                    </div>
                  </div>
                )}

                {/* ===== STEP 3: Organizer Info ===== */}
                {currentCreateStep === 3 && (
                  <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div>
                      <h2 style={{ fontWeight: 800, fontSize: '2rem', color: '#0f172a', margin: '0 0 6px 0' }}>Organizer Info</h2>
                      <div style={{ color: '#2563eb', fontWeight: 500, fontSize: 16 }}>Step 3 of 4: Your Details</div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: 9, color: '#1e293b', fontSize: 16 }}>Organizer Name</label>
                      <input type="text" defaultValue={userName} placeholder="Your name"
                        style={{ width: '100%', padding: '16px 18px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 17, background: '#f8fafc', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: 9, color: '#1e293b', fontSize: 16 }}>Contact Email</label>
                      <input type="email" value={contactEmail} readOnly
                        style={{ width: '100%', padding: '16px 18px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 17, boxSizing: 'border-box', background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: 9, color: '#1e293b', fontSize: 16 }}>Contact Phone</label>
                      <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+977-98XXXXXXXX"
                        style={{ width: '100%', padding: '16px 18px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 17, boxSizing: 'border-box' }}
                        onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: 10, color: '#1e293b', fontSize: 16 }}>Event Mode</label>
                      <div style={{ display: 'flex', gap: 14 }}>
                        {['Physical', 'Online'].map(mode => (
                          <label key={mode} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '14px 28px', borderRadius: 12, border: `1.5px solid ${eventMode === mode ? '#2563eb' : '#e2e8f0'}`, fontWeight: 600, fontSize: 16, color: eventMode === mode ? '#2563eb' : '#334155', background: eventMode === mode ? '#eff6ff' : '#f8fafc' }}>
                            <input type="radio" name="eventMode" value={mode} checked={eventMode === mode} onChange={() => setEventMode(mode)} style={{ accentColor: '#2563eb' }} />
                            {mode === 'Physical' ? '🏢 Physical' : '💻 Online'}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ===== STEP 4: Review & Publish ===== */}
                {currentCreateStep === 4 && (
                  <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div>
                      <h2 style={{ fontWeight: 800, fontSize: '2rem', color: '#0f172a', margin: '0 0 6px 0' }}>Review & Publish</h2>
                      <div style={{ color: '#2563eb', fontWeight: 500, fontSize: 16 }}>Step 4 of 4: Confirm your event</div>
                    </div>
                    {[
                      { label: 'Title', value: createEventForm.title },
                      { label: 'Category', value: createEventForm.eventType },
                      { label: 'Date', value: createEventForm.date },
                      { label: 'Time', value: createEventForm.time },
                      { label: 'Venue', value: createEventForm.venue },
                      { label: 'Ticket Price', value: createEventForm.ticketPrice ? `Rs. ${createEventForm.ticketPrice}` : 'Free' },
                      { label: 'Max Tickets', value: createEventForm.maxParticipants || '—' },
                      { label: 'Mode', value: eventMode },
                    ].map(row => (
                      <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', padding: '12px 0' }}>
                        <span style={{ color: '#64748b', fontWeight: 600, fontSize: 16 }}>{row.label}</span>
                        <span style={{ color: '#0f172a', fontWeight: 700, fontSize: 16, textAlign: 'right', maxWidth: '60%' }}>{row.value || <span style={{ color: '#cbd5e1' }}>Not set</span>}</span>
                      </div>
                    ))}
                    {imagePreview && <img src={imagePreview} alt="Banner" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 12, marginTop: 8 }} />}
                  </div>
                )}

                {/* Bottom Navigation */}
                <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                  <button
                    type="button"
                    onClick={() => setCurrentCreateStep(s => Math.max(1, s - 1))}
                    style={{ flex: 1, padding: '10px 0', borderRadius: 20, border: '1.5px solid #cbd5e1', background: 'white', color: '#2563eb', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
                  >
                    Previous
                  </button>
                  {currentCreateStep < 4 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentCreateStep(s => Math.min(4, s + 1))}
                      style={{ flex: 1, padding: '10px 0', borderRadius: 20, border: 'none', background: '#2563eb', color: 'white', fontWeight: 600, fontSize: 14, cursor: canContinueStep ? 'pointer' : 'not-allowed', opacity: canContinueStep ? 1 : 0.6, boxShadow: '0 2px 8px rgba(37,99,235,0.2)' }}
                      disabled={!canContinueStep}
                    >
                      Continue
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCreateEventSubmit}
                      style={{ flex: 1, padding: '10px 0', borderRadius: 20, border: 'none', background: '#2563eb', color: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.2)' }}
                    >
                      Submit for Approval
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'My Events' && (
          <>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>My Events</h2>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>Create, manage and track all your events</p>
            </div>
            <div className="org-my-events">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              
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
                  let badgeStyle = {};
                  
                  if (event.status === 'APPROVED') {
                    badgeText = 'Approved';
                    badgeStyle = {
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      boxShadow: '0 6px 16px rgba(16, 185, 129, 0.35)'
                    };
                  } else if (event.status === 'PENDING_APPROVAL') {
                    badgeText = 'Pending Approval';
                    badgeStyle = {
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      boxShadow: '0 6px 16px rgba(245, 158, 11, 0.35)'
                    };
                  } else if (event.status === 'REJECTED') {
                    badgeText = 'Rejected';
                    badgeStyle = {
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      boxShadow: '0 6px 16px rgba(239, 68, 68, 0.35)'
                    };
                  } else {
                    badgeText = (event.status || '').toUpperCase();
                    badgeStyle = {
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      boxShadow: '0 6px 16px rgba(59, 130, 246, 0.35)'
                    };
                  }

                  // Format date and venue for consistent display
                  const formattedDate = event.date ? new Date(event.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '-';
                  const venue = event.venue || event.location || 'TBD';

                  return (
                    <div key={event.id} className="org-dashboard-event-card">
                      <div className="org-dashboard-event-image" style={event.image ? { backgroundImage: `url(${event.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {!event.image && (
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        )}
                        <span className="org-dashboard-event-badge" style={badgeStyle}>{badgeText}</span>
                      </div>
                      <div className="org-dashboard-event-content">
                        <div className="org-dashboard-event-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span>{event.title}</span>
                        </div>
                        <div className="org-dashboard-event-meta">
                          <span><Calendar size={16} /> {formattedDate} {event.time ? `• ${event.time}` : ''}</span>
                          <span><MapPin size={16} /> {venue}</span>
                        </div>
                        <div style={{ margin: '12px 0 0 0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ color: 'var(--text-muted)' }}>Registration Progress</div>
                            <span style={{ color: 'var(--blue-primary)', fontWeight: 700 }}>{sold}/{capacity || '—'} Attendees</span>
                          </div>
                          <div style={{ height: 10, background: '#f1f5f9', borderRadius: 8, overflow: 'hidden', marginTop: 8 }}>
                            <div style={{ width: `${percent}%`, background: 'linear-gradient(90deg,#3b82f6,#60a5fa)', height: '100%' }} />
                          </div>
                          {/* Description preview - clamp to 3 lines */}
                          {event.description && (
                            <div style={{
                              marginTop: 12,
                              color: '#334155',
                              fontSize: 14,
                              lineHeight: '1.45',
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {event.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="org-dashboard-event-footer">
                        <div style={{
                          display: 'flex',
                          flexDirection: 'row',
                          gap: 18,
                          justifyContent: 'flex-end',
                          alignItems: 'center',
                          marginTop: 18,
                          padding: '0 8px 8px 8px',
                          width: '100%',
                        }}>
                          <button
                            className="org-btn org-btn-primary"
                            style={{
                              minWidth: 120,
                              padding: '10px 0',
                              borderRadius: 8,
                              fontSize: 15,
                              fontWeight: 600,
                              boxShadow: 'none',
                              background: 'linear-gradient(90deg,#2563eb,#60a5fa)',
                              color: 'white',
                              border: 'none',
                              transition: 'background 0.15s',
                              letterSpacing: 0.2,
                            }}
                            onClick={() => navigate(`/events/${event.id}`, { state: { from: 'organizer-my-events' } })}
                          >
                            Manage
                          </button>
                          <button
                            className="org-btn org-btn-danger"
                            style={{
                              minWidth: 120,
                              padding: '10px 0',
                              borderRadius: 8,
                              fontSize: 15,
                              fontWeight: 600,
                              boxShadow: 'none',
                              background: 'linear-gradient(90deg,#ef4444,#f87171)',
                              color: 'white',
                              border: 'none',
                              transition: 'background 0.15s',
                              letterSpacing: 0.2,
                            }}
                            onClick={() => handleDelete(event.id)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          </>
        )}

        {activeTab === 'Ticket Sales' && (
          <>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>Ticket Sales</h2>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>Track ticket revenue and sales across all your events</p>
            </div>
          <div className="org-dashboard-section">
            {/* Header with export button */}
            <div className="org-section-header" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <button 
                style={{
                  padding: '10px 20px',
                  background: 'white',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                Export
              </button>
            </div>

            {/* Search Bar */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search by name, email, or event..."
                  value={attendeesSearchQuery}
                  onChange={(e) => setAttendeesSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 48px',
                    fontSize: 15,
                    border: '1.5px solid #e2e8f0',
                    borderRadius: 10,
                    outline: 'none',
                    transition: 'all 0.2s',
                    background: 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1.5px solid #e2e8f0', paddingBottom: 0 }}>
              {['All Sales', 'Confirmed', 'Pending', 'Cancelled'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setAttendeesFilter(filter)}
                  style={{
                    padding: '10px 20px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: attendeesFilter === filter ? '3px solid #4f46e5' : '3px solid transparent',
                    fontSize: 14,
                    fontWeight: attendeesFilter === filter ? 700 : 600,
                    color: attendeesFilter === filter ? '#4f46e5' : '#64748b',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    marginBottom: '-1.5px'
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Ticket Sales Count */}
            {(() => {
              // Filter logic
              let filteredSales = allBookings.filter(b => {
                const matchesSearch = b.userName.toLowerCase().includes(attendeesSearchQuery.toLowerCase()) || 
                                     b.userEmail.toLowerCase().includes(attendeesSearchQuery.toLowerCase()) ||
                                     (b.eventTitle || '').toLowerCase().includes(attendeesSearchQuery.toLowerCase());
                const matchesFilter = attendeesFilter === 'All Sales' ? true :
                                     attendeesFilter === 'Confirmed' ? b.status === 'CONFIRMED' :
                                     attendeesFilter === 'Pending' ? b.status === 'PENDING' :
                                     attendeesFilter === 'Cancelled' ? b.status === 'CANCELLED' : true;
                return matchesSearch && matchesFilter;
              });

              return (
                <>
                  <div style={{ 
                    fontSize: 13, 
                    fontWeight: 700, 
                    color: '#64748b', 
                    marginBottom: 16, 
                    letterSpacing: '0.5px' 
                  }}>
                    {filteredSales.length} SALES FOUND
                  </div>

                  {/* Ticket Sales List */}
                  {bookingsLoading ? (
                    <div style={{ textAlign: 'center', color: '#64748b', padding: '48px 0' }}>
                      Loading sales...
                    </div>
                  ) : filteredSales.length === 0 ? (
                    <div style={{ 
                      textAlign: 'center', 
                      color: '#94a3b8', 
                      padding: '48px 0',
                      background: 'white',
                      borderRadius: 12,
                      border: '1.5px solid #e2e8f0'
                    }}>
                      No ticket sales found.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {filteredSales.map((sale, index) => {
                        // Generate initials for avatar
                        const initials = sale.userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                        // Status colors
                        const statusColors = {
                          'CONFIRMED': { bg: '#dbeafe', color: '#2563eb' },
                          'PENDING': { bg: '#fef9c3', color: '#92400e' },
                          'CANCELLED': { bg: '#fee2e2', color: '#ef4444' }
                        };
                        const statusColor = statusColors[sale.status] || statusColors['CONFIRMED'];

                        return (
                          <div 
                            key={sale.id}
                            style={{
                              background: 'white',
                              borderRadius: 12,
                              padding: '16px 20px',
                              border: '1.5px solid #e2e8f0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              transition: 'all 0.2s',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                              e.currentTarget.style.borderColor = '#cbd5e1';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.boxShadow = 'none';
                              e.currentTarget.style.borderColor = '#e2e8f0';
                            }}
                          >
                            {/* Left: Avatar + Info */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                              {/* Avatar */}
                              <div style={{
                                width: 48,
                                height: 48,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 700,
                                fontSize: 16,
                                flexShrink: 0
                              }}>
                                {initials}
                              </div>

                              {/* Info */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>
                                    {sale.userName}
                                  </div>
                                  <span style={{
                                    padding: '3px 10px',
                                    borderRadius: 20,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    background: statusColor.bg,
                                    color: statusColor.color,
                                    letterSpacing: '0.3px'
                                  }}>
                                    {sale.status}
                                  </span>
                                </div>
                                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>
                                  {sale.userEmail}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b' }}>
                                    <Calendar size={14} />
                                    <span>{sale.eventTitle}</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b' }}>
                                    <Ticket size={14} />
                                    <span>{sale.attendeeCount > 1 ? 'Group Pass' : 'General Entry'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Right: Action Buttons */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // TODO: Implement more options menu
                                  // TODO: Implement more options menu
                                }}
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 8,
                                  background: '#f8fafc',
                                  border: '1px solid #e2e8f0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
                              >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                  <div style={{ width: 3, height: 3, borderRadius: '50%', background: '#64748b' }}></div>
                                  <div style={{ width: 3, height: 3, borderRadius: '50%', background: '#64748b' }}></div>
                                  <div style={{ width: 3, height: 3, borderRadius: '50%', background: '#64748b' }}></div>
                                </div>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
          </>
        )}

        {activeTab === 'Attendees' && (
          <>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>Attendees</h2>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>View and manage all registered attendees for your events</p>
            </div>
          <div className="org-dashboard-section">
            {/* Header with export button */}
            <div className="org-section-header" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <button 
                style={{
                  padding: '10px 20px',
                  background: 'white',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                Export
              </button>
            </div>

            {/* Search Bar */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={attendeesSearchQuery}
                  onChange={(e) => setAttendeesSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 48px',
                    fontSize: 15,
                    border: '1.5px solid #e2e8f0',
                    borderRadius: 10,
                    outline: 'none',
                    transition: 'all 0.2s',
                    background: 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1.5px solid #e2e8f0', paddingBottom: 0 }}>
              {['All Events', 'VIP'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setAttendeesFilter(filter)}
                  style={{
                    padding: '10px 20px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: attendeesFilter === filter ? '3px solid #4f46e5' : '3px solid transparent',
                    fontSize: 14,
                    fontWeight: attendeesFilter === filter ? 700 : 600,
                    color: attendeesFilter === filter ? '#4f46e5' : '#64748b',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    marginBottom: '-1.5px'
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Attendees Count */}
            {(() => {
              // Filter logic
              let filteredAttendees = allAttendees.filter(a => {
                const matchesSearch = a.name.toLowerCase().includes(attendeesSearchQuery.toLowerCase()) || 
                                     a.email.toLowerCase().includes(attendeesSearchQuery.toLowerCase());
                const matchesFilter = attendeesFilter === 'All Events' ? true :
                                     attendeesFilter === 'VIP' ? a.passType.toLowerCase().includes('vip') : true;
                return matchesSearch && matchesFilter;
              });

              return (
                <>
                  <div style={{ 
                    fontSize: 13, 
                    fontWeight: 700, 
                    color: '#64748b', 
                    marginBottom: 16, 
                    letterSpacing: '0.5px' 
                  }}>
                    {filteredAttendees.length} ATTENDEES FOUND
                  </div>

                  {/* Attendees List */}
                  {attendeesLoading ? (
                    <div style={{ textAlign: 'center', color: '#64748b', padding: '48px 0' }}>
                      Loading attendees...
                    </div>
                  ) : filteredAttendees.length === 0 ? (
                    <div style={{ 
                      textAlign: 'center', 
                      color: '#94a3b8', 
                      padding: '48px 0',
                      background: 'white',
                      borderRadius: 12,
                      border: '1.5px solid #e2e8f0'
                    }}>
                      No attendees found.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {filteredAttendees.map((attendee, index) => {
                        // Generate initials for avatar
                        const initials = attendee.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                        
                        // Status colors
                        const statusColors = {
                          'CHECKED-IN': { bg: '#dcfce7', color: '#16a34a' },
                          'REGISTERED': { bg: '#dbeafe', color: '#2563eb' },
                          'CANCELLED': { bg: '#fee2e2', color: '#ef4444' }
                        };
                        const statusColor = statusColors[attendee.status] || statusColors['REGISTERED'];

                        return (
                          <div 
                            key={attendee.id}
                            style={{
                              background: 'white',
                              borderRadius: 12,
                              padding: '16px 20px',
                              border: '1.5px solid #e2e8f0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              transition: 'all 0.2s',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                              e.currentTarget.style.borderColor = '#cbd5e1';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.boxShadow = 'none';
                              e.currentTarget.style.borderColor = '#e2e8f0';
                            }}
                          >
                            {/* Left: Avatar + Info */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                              {/* Avatar */}
                              <div style={{
                                width: 48,
                                height: 48,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 700,
                                fontSize: 16,
                                flexShrink: 0
                              }}>
                                {initials}
                              </div>

                              {/* Info */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>
                                    {attendee.name}
                                  </div>
                                  <span style={{
                                    padding: '3px 10px',
                                    borderRadius: 20,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    background: statusColor.bg,
                                    color: statusColor.color,
                                    letterSpacing: '0.3px'
                                  }}>
                                    {attendee.status}
                                  </span>
                                </div>
                                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>
                                  {attendee.email}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b' }}>
                                    <Calendar size={14} />
                                    <span>{attendee.eventName}</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b' }}>
                                    <Ticket size={14} />
                                    <span>{attendee.passType}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Right: Action Buttons */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              {attendee.status === 'REGISTERED' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // TODO: Implement check-in functionality
                                    // TODO: Implement check-in functionality
                                  }}
                                  style={{
                                    padding: '8px 16px',
                                    background: '#4f46e5',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 8,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = '#4338ca'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = '#4f46e5'}
                                >
                                  Check-in
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // TODO: Implement more options menu
                                  // TODO: Implement more options menu
                                }}
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 8,
                                  background: '#f8fafc',
                                  border: '1px solid #e2e8f0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
                              >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                  <div style={{ width: 3, height: 3, borderRadius: '50%', background: '#64748b' }}></div>
                                  <div style={{ width: 3, height: 3, borderRadius: '50%', background: '#64748b' }}></div>
                                  <div style={{ width: 3, height: 3, borderRadius: '50%', background: '#64748b' }}></div>
                                </div>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
          </>
        )}


        {activeTab === 'Settings' && (
          <>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>Settings</h2>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>Manage your account, profile and notification preferences</p>
            </div>
            <div className="org-settings-panel-wrapper">
              <SettingsPanel user={currentUser} onProfilePicChange={setProfilePic} resetToProfileTime={settingsResetTime} />
            </div>
          </>
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

      {/* Cancel Event Modal (must be inside main return) */}
      {cancelModal.open && (
        <div style={modalOverlayStyle}>
          <div style={modalBoxStyle}>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#b91c1c', marginBottom: 10 }}>Cancel Event</div>
            <div style={{ color: '#334155', fontSize: 15, marginBottom: 18 }}>
              Are you sure you want to cancel this event? This action cannot be undone.
            </div>
            {cancelError && <div style={{ color: '#b91c1c', fontWeight: 600, marginBottom: 10 }}>{cancelError}</div>}
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
              <button
                onClick={() => setCancelModal({ open: false, eventId: null })}
                style={{
                  padding: '10px 28px',
                  background: '#f1f5f9',
                  color: '#334155',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: cancelLoading ? 'not-allowed' : 'pointer',
                  opacity: cancelLoading ? 0.7 : 1,
                  transition: 'all 0.2s',
                }}
                disabled={cancelLoading}
              >
                Cancel
              </button>
              <button
                onClick={confirmCancelEvent}
                style={{
                  padding: '10px 28px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: cancelLoading ? 'not-allowed' : 'pointer',
                  opacity: cancelLoading ? 0.7 : 1,
                  transition: 'all 0.2s',
                }}
                disabled={cancelLoading}
              >
                {cancelLoading ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Confirm Logout Modal */}
      {showLogoutModal && (
        <div style={modalOverlayStyle}>
          <div style={modalBoxStyle}>
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

export default OrganizerDashboard;


