import React, { useEffect, useState } from 'react';
import { getMe, updateMe } from '../../api/me';

export default function ProfileSection() {
  const [user, setUser] = useState(null);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    getMe().then((u) => {
      setUser(u);
      setForm({ name: u?.name || '', email: u?.email || '' });
    }).catch(() => {});
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updated = await updateMe(form);
      setUser(updated);
      setEdit(false);
      setSuccess('Profile updated!');
    } catch (err) {
      setError('Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return <div className="org-profile-view">Loading...</div>;

  const initials = (user.name || user.fullName || 'U').split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase();

  return (
    <div className="org-profile-view">
      <h2 style={{ margin: 0 }}>Profile</h2>
      <div className="org-profile-card">
        <div className="org-profile-avatar-large">{initials}</div>

        <div className="org-profile-details">
          {!edit ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>{user.name || user.fullName}</div>
                  <div style={{ color: 'var(--text-muted)', marginTop: 6 }}>{user.role || 'Organizer'}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="org-btn org-btn-primary" onClick={() => setEdit(true)}>Edit Profile</button>
                </div>
              </div>

              <div className="org-profile-row">
                <label>Name:</label>
                <span>{user.name || user.fullName}</span>
              </div>

              <div className="org-profile-row">
                <label>Email:</label>
                <span>{user.email}</span>
              </div>

              {success && <div style={{ background: '#ecfdf5', color: '#065f46', padding: 10, borderRadius: 8 }}>{success}</div>}
              {error && <div style={{ background: '#fff1f2', color: '#7f1d1d', padding: 10, borderRadius: 8 }}>{error}</div>}
            </>
          ) : (
            <form className="org-profile-form" onSubmit={handleSave}>
              <div className="org-form-group">
                <label>Name</label>
                <input className="org-form-input" name="name" value={form.name} onChange={handleChange} />
              </div>

              <div className="org-form-group">
                <label>Email</label>
                <input className="org-form-input" name="email" value={form.email} onChange={handleChange} />
              </div>

              <div className="org-form-actions">
                <button type="button" className="org-btn org-btn-secondary" onClick={() => { setEdit(false); setError(''); setSuccess(''); }} disabled={saving}>Cancel</button>
                <button type="submit" className="org-btn org-btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
              </div>

              {success && <div style={{ background: '#ecfdf5', color: '#065f46', padding: 10, borderRadius: 8 }}>{success}</div>}
              {error && <div style={{ background: '#fff1f2', color: '#7f1d1d', padding: 10, borderRadius: 8 }}>{error}</div>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
