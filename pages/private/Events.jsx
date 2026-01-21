import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listEvents, createEvent, updateEvent, deleteEvent } from '../../src/api/events';
import '../../src/CSS/pages.css';

const todayIso = () => new Date().toISOString().slice(0, 10);

const uid = () => crypto?.randomUUID?.() ?? String(Date.now());

const pillClassForStatus = (status) => {
  const s = String(status || '').toLowerCase();
  if (s.includes('confirm')) return 'eg-pill eg-pill--confirmed';
  if (s.includes('plan')) return 'eg-pill eg-pill--planning';
  if (s.includes('draft')) return 'eg-pill eg-pill--draft';
  if (s.includes('cancel')) return 'eg-pill eg-pill--cancelled';
  return 'eg-pill eg-pill--scheduled';
};

const iconForStatus = (status) => {
  const s = String(status || '').toLowerCase();
  if (s.includes('confirm')) return '✅';
  if (s.includes('plan')) return '🗂️';
  if (s.includes('draft')) return '📝';
  if (s.includes('cancel')) return '⛔';
  return '📅';
};

const Events = () => {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    date: todayIso(),
    location: '',
    guestCount: '',
    status: 'Scheduled',
  });

  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const data = await listEvents();
        if (alive) setEvents(Array.isArray(data) ? data : []);
      } catch (err) {
        if (alive) setError(err?.message || 'Failed to load events.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const upcoming = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return events.filter((e) => {
      const t = new Date(e?.date).getTime();
      return Number.isFinite(t) && t >= startOfToday;
    }).length;
  }, [events]);

  const resetForm = () => {
    setForm({ title: '', date: todayIso(), location: '', guestCount: '', status: 'Scheduled' });
    setEditingId(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const title = String(form.title || '').trim();
    if (!title) return;

    try {
      setError('');
      if (editingId) {
        const updated = await updateEvent(editingId, {
          title,
          date: form.date || null,
          location: String(form.location || '').trim() || null,
          guestCount: form.guestCount === '' || form.guestCount == null ? null : Number(form.guestCount),
          status: String(form.status || 'Scheduled').toUpperCase(),
        });
        setEvents((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      } else {
        const created = await createEvent({
          title,
          date: form.date || null,
          location: String(form.location || '').trim() || null,
          guestCount: form.guestCount === '' || form.guestCount == null ? null : Number(form.guestCount),
          status: String(form.status || 'Scheduled').toUpperCase(),
        });
        setEvents((prev) => [created, ...prev]);
      }

      resetForm();
    } catch (err) {
      setError(err?.message || 'Failed to save event.');
    }
  };

  const startEdit = (evt) => {
    setEditingId(evt.id);
    setForm({
      title: evt.title || '',
      date: evt.date ? String(evt.date).slice(0, 10) : todayIso(),
      location: evt.location || '',
      guestCount: evt.guestCount ?? '',
      status: evt.status || 'Scheduled',
    });
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      setError('');
      await deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setError(err?.message || 'Failed to delete event.');
    }
  };

  return (
    <div className="eg-page">
      <div className="eg-heading">
        <div>
          <h1 className="eg-title">Events</h1>
          <p className="eg-subtitle">Create, update and manage your events.</p>
        </div>
        <button className="eg-btn" type="button" onClick={() => navigate('/dashboard')}>Back to dashboard</button>
      </div>

      <p className="eg-kpi">Total: {events.length} • Upcoming: {upcoming}</p>
      {error ? <div className="eg-alert" style={{ marginBottom: 12 }}>{error}</div> : null}

      <div className="eg-grid">
        <section className="eg-card">
          <div className="eg-cardHeader">
            <h2>{editingId ? 'Edit event' : 'Create event'}</h2>
          </div>
          <div className="eg-cardBody">
            <form onSubmit={onSubmit}>
              <div className="eg-form">
                <label>
                  Title
                  <input
                    className="eg-input"
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Engagement ceremony"
                    required
                  />
                </label>

                <label>
                  Date
                  <input
                    className="eg-input"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                  />
                </label>

                <label>
                  Location
                  <input
                    className="eg-input"
                    value={form.location}
                    onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                    placeholder="e.g. Kathmandu"
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
                </label>

                <div className="eg-actions">
                  <button className="eg-btn eg-btnPrimary" type="submit">{editingId ? 'Save changes' : 'Add event'}</button>
                  <button className="eg-btn" type="button" onClick={resetForm} disabled={!editingId && !form.title && !form.location}>
                    Clear
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>

        <section className="eg-card">
          <div className="eg-cardHeader">
            <h2>All events</h2>
          </div>
          <div className="eg-cardBody">
            {loading ? (
              <div className="eg-muted">Loading...</div>
            ) : events.length === 0 ? (
              <div className="eg-muted">No events yet.</div>
            ) : (
              <div className="eg-list">
                {events.map((e) => (
                  <div key={e.id} className="eg-item">
                    <div className="eg-itemTitleRow">
                      <strong>{e.title}</strong>
                      <span className={pillClassForStatus(e.status)}>
                        {iconForStatus(e.status)} {e.status}
                      </span>
                    </div>
                    <div className="eg-muted" style={{ marginTop: 4, fontSize: 13 }}>
                      {e.date || ''}{e.location ? ` • ${e.location}` : ''}{e.guestCount != null ? ` • ${e.guestCount} guests` : ''}
                    </div>

                    <div className="eg-actions" style={{ marginTop: 10 }}>
                      <button className="eg-btn" type="button" onClick={() => navigate(`/events/${encodeURIComponent(e.id)}`)}>Details</button>
                      <button className="eg-btn" type="button" onClick={() => startEdit(e)}>Edit</button>
                      <button className="eg-btn eg-btnDanger" type="button" onClick={() => remove(e.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Events;
