import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getEvent, updateEvent } from '../../src/api/events';

const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', date: '', location: '', guestCount: '', status: 'Scheduled' });

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
        });
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
      });
      setEvent(updated);
      navigate('/events');
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
          <button className="eg-btn" type="button" onClick={() => navigate('/events')}>Back to events</button>
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
          <button className="eg-btn" type="button" onClick={() => navigate('/events')}>Back</button>
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
                <div className="eg-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="eg-btn eg-btnPrimary" type="submit" disabled={saving}>
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                  <button className="eg-btn" type="button" onClick={() => navigate('/events')} disabled={saving}>
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
