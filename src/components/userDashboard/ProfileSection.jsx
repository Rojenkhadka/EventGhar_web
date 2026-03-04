import React, { useEffect, useState, useRef } from 'react';
import { getMe, updateMe } from '../../api/me';

export default function ProfileSection() {
  const [user, setUser] = useState(null);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profilePic, setProfilePic] = useState(null); // Always start with null
  const fileInputRef = useRef();

  useEffect(() => {
    // Clear old global profile pic cache to prevent showing other users' pictures
    localStorage.removeItem('eventghar_profile_pic');
    // Reset profile pic state to null before fetching
    setProfilePic(null);
    
    getMe().then((u) => {
      setUser(u);
      setForm({ name: u?.name || '', email: u?.email || '' });
      // Only set profile pic if it exists in server response
      setProfilePic(u?.profilePic || null);
    }).catch((err) => {
      // If unable to fetch current user (e.g. not authenticated), clear stale current user
      try { localStorage.removeItem('eventghar_current_user'); } catch (e) {}
      setUser(null);
      setProfilePic(null);
    });
  }, []);
  // Handle profile picture file selection and upload
  const handleProfilePicChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      setProfilePic(dataUrl);
      try {
        // Upload profile picture to server by saving as base64 data URL
        const updated = await updateMe({ profilePic: dataUrl });
        // updateMe returns the updated user
        if (updated) {
          // refresh local user state
          setUser(prev => ({ ...prev, ...updated }));
          // Update current user in localStorage
          const currentUser = JSON.parse(localStorage.getItem('eventghar_current_user') || '{}');
          currentUser.profilePic = dataUrl;
          localStorage.setItem('eventghar_current_user', JSON.stringify(currentUser));
          // notify other components
          window.dispatchEvent(new Event('eventghar_user_updated'));
          setSuccess('Profile picture updated');
          setTimeout(() => setSuccess(''), 2500);
        }
      } catch (err) {
        console.error('Failed to upload profile picture', err);
        setError('Failed to upload profile picture');
      }
    };
    reader.readAsDataURL(file);
  };

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
    <div className="org-profile-view" style={{ animation: 'fadeIn 0.5s', maxWidth: 1100, margin: '0 auto', padding: '0 0 32px 0' }}>
      <div style={{
        background: 'white',
        borderRadius: '28px',
        boxShadow: '0 4px 32px 0 rgba(59,130,246,0.10)',
        padding: '48px 56px 48px 56px',
        margin: '0 auto',
        width: '100%',
        minHeight: 320,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 48,
        position: 'relative',
      }}>
        <div style={{ flex: '0 0 180px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div className="org-profile-avatar-large" style={{
            width: 120, height: 120, fontSize: 48,
            background: profilePic ? `url(${profilePic}) center/cover no-repeat` : 'linear-gradient(135deg, #3b82f6 0%, #a855f7 100%)',
            color: profilePic ? 'transparent' : 'white',
            border: '4px solid #fff',
            boxShadow: '0 8px 32px 0 rgba(168,85,247,0.18)',
            marginBottom: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', cursor: 'pointer'
          }}
            title="Click to update profile picture"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
          >
            {!profilePic && initials}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleProfilePicChange}
            />
            <span style={{
              position: 'absolute',
              bottom: 6,
              left: 0,
              width: '100%',
              textAlign: 'center',
              fontSize: 13,
              color: '#fff',
              background: 'rgba(59,130,246,0.75)',
              borderRadius: '0 0 16px 16px',
              padding: '2px 0',
              opacity: 0.92,
              letterSpacing: 0.5
            }}>Update</span>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ fontWeight: 800, fontSize: '2rem', color: '#0f172a', letterSpacing: '-1px' }}>Profile</div>
            {!edit && (
              <button className="org-btn org-btn-primary" style={{ minWidth: 140, fontWeight: 700, fontSize: 16, boxShadow: '0 2px 12px #3b82f633' }} onClick={() => setEdit(true)}>Edit Profile</button>
            )}
          </div>
          {!edit ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div className="org-profile-row" style={{ border: 'none', padding: '18px 0 8px 0', justifyContent: 'flex-start' }}>
                  <label style={{ color: '#64748b', fontWeight: 700, fontSize: 18, minWidth: 120 }}>Name</label>
                  <span style={{ color: '#0f172a', fontWeight: 700, fontSize: 20, textAlign: 'left' }}>{user.name || user.fullName}</span>
                </div>
                <div className="org-profile-row" style={{ border: 'none', padding: '8px 0 18px 0', justifyContent: 'flex-start' }}>
                  <label style={{ color: '#64748b', fontWeight: 700, fontSize: 18, minWidth: 120 }}>Email</label>
                  <span style={{ color: '#334155', fontWeight: 700, fontSize: 20, textAlign: 'left' }}>{user.email}</span>
                </div>
                {success && <div style={{ background: 'linear-gradient(90deg,#bbf7d0,#f0fdf4)', color: '#15803d', padding: 12, borderRadius: 10, fontWeight: 600, marginTop: 18, textAlign: 'center', fontSize: 15 }}>{success}</div>}
                {error && <div style={{ background: 'linear-gradient(90deg,#fee2e2,#fef2f2)', color: '#b91c1c', padding: 12, borderRadius: 10, fontWeight: 600, marginTop: 18, textAlign: 'center', fontSize: 15 }}>{error}</div>}
              </div>
            </>
          ) : (
            <form className="org-profile-form" style={{ marginTop: 0, width: '100%' }} onSubmit={handleSave}>
              <div className="org-form-group">
                <label>Name</label>
                <input className="org-form-input" name="name" value={form.name} onChange={handleChange} />
              </div>
              <div className="org-form-group">
                <label>Email</label>
                <input className="org-form-input" name="email" value={form.email} onChange={handleChange} />
              </div>
              <div className="org-form-actions" style={{ justifyContent: 'flex-start' }}>
                <button type="button" className="org-btn org-btn-secondary" style={{ minWidth: 110 }} onClick={() => { setEdit(false); setError(''); setSuccess(''); }} disabled={saving}>Cancel</button>
                <button type="submit" className="org-btn org-btn-primary" style={{ minWidth: 130 }} disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
              </div>
              {success && <div style={{ background: 'linear-gradient(90deg,#bbf7d0,#f0fdf4)', color: '#15803d', padding: 12, borderRadius: 10, fontWeight: 600, marginTop: 18, textAlign: 'center', fontSize: 15 }}>{success}</div>}
              {error && <div style={{ background: 'linear-gradient(90deg,#fee2e2,#fef2f2)', color: '#b91c1c', padding: 12, borderRadius: 10, fontWeight: 600, marginTop: 18, textAlign: 'center', fontSize: 15 }}>{error}</div>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
