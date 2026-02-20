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
    <div className="eg-page" style={{ maxWidth: 900 }}>
      <div className="eg-heading">
        <div>
          <h1 className="eg-title">Settings</h1>
          <p className="eg-subtitle">Manage your profile.</p>
        </div>
        <button className="eg-btn" type="button" onClick={() => navigate('/dashboard')}>Back to dashboard</button>
      </div>

      <section className="eg-card" style={{ marginTop: 12 }}>
        <div className="eg-cardHeader">
          <h2>Profile</h2>
        </div>
        <div className="eg-cardBody">
          {loading ? (
            <div className="eg-muted">Loading...</div>
          ) : (
            <div className="eg-form">
              <label>
                Full name
                <input className="eg-input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Alex Sharma" />
              </label>
              <label>
                Email
                <input className="eg-input" value={email} disabled />
                <div className="eg-muted" style={{ marginTop: 6 }}>Email is managed by your account provider.</div>
              </label>
              {error ? <div className="eg-alert" style={{ fontSize: 13 }}>{error}</div> : null}
              <div className="eg-actions">
                <button className="eg-btn eg-btnPrimary" type="button" onClick={saveProfile}>Save changes</button>
                <button className="eg-btn" type="button" onClick={() => navigate('/dashboard')}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="eg-card" style={{ marginTop: 12 }}>
        <div className="eg-cardHeader">
          <h2>Security</h2>
        </div>
        <div className="eg-cardBody">
          <div className="eg-form">
            <label>
              Current password
              <input className="eg-input" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
            </label>
            <label>
              New password
              <input className="eg-input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Choose a new password" />
            </label>
            {error ? <div className="eg-alert" style={{ fontSize: 13 }}>{error}</div> : null}
            <div className="eg-actions">
              <button className="eg-btn eg-btnPrimary" type="button" onClick={changePassword}>Update password</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Settings;
