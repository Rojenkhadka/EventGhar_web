import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, updateMe } from '../../src/api/me';
import '../../src/styles/pages.css';

const safeJsonParse = (raw, fallback) => {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const Settings = () => {
  const navigate = useNavigate();

  const currentUser = useMemo(() => {
    const raw = localStorage.getItem('eventghar_current_user');
    return safeJsonParse(raw, { fullName: 'User', email: '' });
  }, []);

  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const me = await getMe();
        if (!alive) return;
        setFullName(me?.fullName || '');
        setEmail(me?.email || '');
        localStorage.setItem('eventghar_current_user', JSON.stringify(me));
      } catch (err) {
        if (alive) setError(err?.message || 'Failed to load profile.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const saveProfile = async () => {
    try {
      setError('');
      const user = await updateMe({ fullName: String(fullName || '').trim() });
      localStorage.setItem('eventghar_current_user', JSON.stringify(user));
      alert('Saved.');
    } catch (err) {
      setError(err?.message || 'Failed to save profile.');
    }
  };

  const changePassword = async () => {
    if (!currentPassword || !newPassword) {
      setError('Current password and new password are required.');
      return;
    }

    try {
      setError('');
      await updateMe({ currentPassword, password: newPassword });
      setCurrentPassword('');
      setNewPassword('');
      alert('Password updated.');
    } catch (err) {
      setError(err?.message || 'Failed to update password.');
    }
  };

  return (
    <div className="settings-panel-container">
      <div className="settings-header-container">
        <div className="settings-header">
          <h2 className="settings-title">Settings</h2>
        </div>
        <div className="settings-tabs">
          <button className="settings-tab-button active">Profile</button>
          <button className="settings-tab-button" disabled>Security</button>
          <button className="settings-tab-button" disabled>Payout Info</button>
          <button className="settings-tab-button" disabled>Notifications</button>
        </div>
      </div>
      <div className="settings-content">
        <div className="settings-two-column-layout">
          {/* Profile Photo Column */}
          <div className="settings-profile-column">
            <div className="settings-profile-pic-container">
              <div className="settings-profile-pic no-image">
                {/* Placeholder for profile image, replace with actual image if available */}
                <span style={{ fontSize: 60 }}>👤</span>
              </div>
              <button className="settings-camera-button" title="Change profile photo">
                <span role="img" aria-label="camera" style={{ fontSize: 22 }}>📷</span>
              </button>
            </div>
            <button className="settings-change-photo-button">Change Profile Photo</button>
          </div>
          {/* Form Column */}
          <div className="settings-form-column">
            <form className="settings-form" onSubmit={e => { e.preventDefault(); saveProfile(); }}>
              {loading ? (
                <div className="eg-muted">Loading...</div>
              ) : (
                <>
                  <div className="settings-form-group">
                    <label className="settings-label">Full Name</label>
                    <input className="settings-input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Alex Sharma" />
                  </div>
                  <div className="settings-form-group">
                    <label className="settings-label">Email Address</label>
                    <input className="settings-input" value={email} disabled />
                    <div className="eg-muted" style={{ marginTop: 6 }}>Email is managed by your account provider.</div>
                  </div>
                  {error ? <div className="settings-error-message">{error}</div> : null}
                  <div className="settings-button-container">
                    <button className="settings-save-button" type="submit">Save changes</button>
                    <button className="eg-btn" type="button" style={{ marginLeft: 12 }} onClick={() => navigate('/dashboard')}>Cancel</button>
                  </div>
                </>
              )}
            </form>
            {/* Security Section (collapsed for now, can be expanded as needed) */}
            <form className="settings-form" style={{ marginTop: 32 }} onSubmit={e => { e.preventDefault(); changePassword(); }}>
              <div className="settings-form-group">
                <label className="settings-label">Current Password</label>
                <input className="settings-input" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
              </div>
              <div className="settings-form-group">
                <label className="settings-label">New Password</label>
                <input className="settings-input" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Choose a new password" />
              </div>
              {error ? <div className="settings-error-message">{error}</div> : null}
              <div className="settings-button-container">
                <button className="settings-save-button" type="submit">Update password</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
