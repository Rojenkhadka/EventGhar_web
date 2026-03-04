import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { getEvent, updateEvent } from '../../src/api/events';

const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', date: '', location: '', guestCount: '', status: 'Scheduled', image: null });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageDragOver, setImageDragOver] = useState(false);
  const imageInputRef = useRef(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getEvent(eventId);
        if (!alive) return;
        setEvent(data);
        setForm({
          title: data?.title || '',
          date: data?.date ? String(data.date).slice(0, 10) : '',
          location: data?.location || '',
          guestCount: data?.guestCount ?? '',
          status: data?.status || 'Scheduled',
          image: data?.image || null,
        });
        setImagePreview(data?.image || null);
      } catch (err) {
        if (alive) setError(err?.message || 'Failed to load event.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [eventId]);

  const save = async (e) => {
    e.preventDefault();
    if (!eventId) return;

    try {
      setSaving(true);
      setError('');
      const updated = await updateEvent(eventId, {
        title: String(form.title || '').trim(),
        date: form.date || null,
        location: String(form.location || '').trim() || null,
        guestCount: form.guestCount === '' || form.guestCount == null ? null : Number(form.guestCount),
        status: String(form.status || 'Scheduled').toUpperCase(),
        image: form.image || null,
      });
      setEvent(updated);
      if (location.state && location.state.from === 'organizer-my-events') {
        navigate('/organizer/dashboard', { state: { tab: 'My Events' } });
      } else {
        navigate(-1);
      }
    } catch (err) {
      setError(err?.message || 'Failed to save event.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="eg-page" style={{ maxWidth: 980 }}>
        <div className="eg-muted">Loading...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="eg-page" style={{ maxWidth: 980 }}>
        <div className="eg-heading">
          <div>
            <h1 className="eg-title">Event not found</h1>
            <p className="eg-subtitle">
              {error ? error : <>No event exists with id: <code>{String(eventId)}</code></>}
            </p>
          </div>
          <button className="eg-btn" type="button" onClick={() => {
            if (location.state && location.state.from === 'organizer-my-events') {
              navigate('/organizer/dashboard', { state: { tab: 'My Events' } });
            } else {
              navigate(-1);
            }
          }}>Back to events</button>
        </div>
      </div>
    );
  }

  return (
    <div className="eg-page" style={{ maxWidth: 980 }}>
      <div className="eg-heading" style={{ gap: 12 }}>
        <div>
          <h1 className="eg-title">Event details</h1>
          <p className="eg-subtitle">Review and update event information.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="eg-btn" type="button" onClick={() => {
            if (location.state && location.state.from === 'organizer-my-events') {
              navigate('/organizer/dashboard', { state: { tab: 'My Events' } });
            } else {
              navigate(-1);
            }
          }}>Back</button>
        </div>
      </div>

      <section className="eg-card" style={{ marginTop: 12 }}>
        <div className="eg-cardHeader" style={{ alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0 }}>Details</h2>
          <span className="eg-pill" title="Event identifier">ID: {event.id}</span>
        </div>

        <div className="eg-cardBody">
          {error ? (
            <div
              role="alert"
              style={{
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#991B1B',
                padding: '10px 12px',
                borderRadius: 10,
                marginBottom: 12,
              }}
            >
              {error}
            </div>
          ) : null}

          <form onSubmit={save}>
            <div className="eg-form" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
              <label style={{ gridColumn: '1 / -1' }}>
                Title
                <input
                  className="eg-input"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Annual Meetup 2026"
                  required
                />
                <div className="eg-muted" style={{ marginTop: 6 }}>Use a clear, searchable name.</div>
              </label>

              <label>
                Date
                <input
                  className="eg-input"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                />
                <div className="eg-muted" style={{ marginTop: 6 }}>Leave empty if not decided.</div>
              </label>

              <label>
                Status
                <select
                  className="eg-select"
                  value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                >
                  <option>Scheduled</option>
                  <option>Planning</option>
                  <option>Confirmed</option>
                  <option>Draft</option>
                  <option>Cancelled</option>
                </select>
                <div className="eg-muted" style={{ marginTop: 6 }}>Set the current lifecycle state.</div>
              </label>

              <label style={{ gridColumn: '1 / -1' }}>
                Location
                <input
                  className="eg-input"
                  value={form.location}
                  onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                  placeholder="e.g. Kathmandu, Nepal"
                />
              </label>

              <label>
                Guest count
                <input
                  className="eg-input"
                  type="number"
                  min="0"
                  value={form.guestCount}
                  onChange={(e) => setForm((p) => ({ ...p, guestCount: e.target.value }))}
                  placeholder="e.g. 150"
                  inputMode="numeric"
                />
                <div className="eg-muted" style={{ marginTop: 6 }}>Optional. Use 0 if unknown.</div>
              </label>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151', fontSize: 14 }}>Event Image</label>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files && e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      setImagePreview(reader.result);
                      setForm(p => ({ ...p, image: reader.result }));
                    };
                    reader.readAsDataURL(file);
                    if (imageInputRef.current) imageInputRef.current.value = '';
                  }}
                />
                <div
                  onClick={() => imageInputRef.current && imageInputRef.current.click()}
                  onDragOver={(e) => { e.preventDefault(); setImageDragOver(true); }}
                  onDragLeave={() => setImageDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setImageDragOver(false);
                    const file = e.dataTransfer.files && e.dataTransfer.files[0];
                    if (!file || !file.type.startsWith('image/')) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      setImagePreview(reader.result);
                      setForm(p => ({ ...p, image: reader.result }));
                    };
                    reader.readAsDataURL(file);
                  }}
                  style={{
                    border: `2px dashed ${imageDragOver ? '#3b82f6' : '#e2e8f0'}`,
                    borderRadius: 14,
                    background: imageDragOver ? '#eff6ff' : '#f8fafc',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    overflow: 'hidden',
                    minHeight: imagePreview ? 0 : 140,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  {imagePreview ? (
                    <div style={{ position: 'relative', width: '100%' }}>
                      <img
                        src={imagePreview}
                        alt="Event preview"
                        style={{ width: '100%', maxHeight: 260, objectFit: 'cover', display: 'block', borderRadius: 12 }}
                      />
                      <div style={{
                        position: 'absolute', inset: 0, background: 'rgba(15,23,42,0)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: 12, transition: 'background 0.2s',
                        opacity: 0,
                      }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(15,23,42,0.45)'; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '0'; e.currentTarget.style.background = 'rgba(15,23,42,0)'; }}
                      >
                        <span style={{ color: '#fff', fontWeight: 700, fontSize: 15, background: 'rgba(0,0,0,0.45)', borderRadius: 8, padding: '8px 18px' }}>Click to change image</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setImagePreview(null); setForm(p => ({ ...p, image: null })); }}
                        style={{
                          position: 'absolute', top: 10, right: 10,
                          background: 'rgba(239,68,68,0.92)', border: 'none',
                          borderRadius: '50%', width: 32, height: 32,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', color: '#fff', fontWeight: 900, fontSize: 18,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                        }}
                        title="Remove image"
                      >&times;</button>
                    </div>
                  ) : (
                    <div style={{ padding: '28px 24px', textAlign: 'center' }}>
                      <div style={{
                        width: 52, height: 52, borderRadius: '50%',
                        background: '#eff6ff', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 14px',
                      }}>
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21 15 16 10 5 21"/>
                        </svg>
                      </div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 15, marginBottom: 6 }}>Upload Event Image</div>
                      <div style={{ color: '#64748b', fontSize: 13 }}>Drag & drop or <span style={{ color: '#3b82f6', fontWeight: 700 }}>click to browse</span></div>
                      <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 6 }}>PNG, JPG, WEBP · Max 5 MB</div>
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>Recommended: 1200 × 630 px (16:9 ratio).</div>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <div className="eg-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="eg-btn eg-btnPrimary" type="submit" disabled={saving}>
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                  <button className="eg-btn" type="button" onClick={() => {
                    if (location.state && location.state.from === 'organizer-my-events') {
                      navigate('/organizer/dashboard', { state: { tab: 'My Events' } });
                    } else {
                      navigate(-1);
                    }
                  }} disabled={saving}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};

export default EventDetails;
