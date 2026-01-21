import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listFeedback, createFeedback, updateFeedback, deleteFeedback } from '../../src/api/feedback';
import '../../src/CSS/pages.css';

const uid = () => crypto?.randomUUID?.() ?? String(Date.now());

const Feedback = () => {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ subject: '', message: '', rating: '5' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const data = await listFeedback();
        if (alive) setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        if (alive) setError(err?.message || 'Failed to load feedback.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const reset = () => {
    setForm({ subject: '', message: '', rating: '5' });
    setEditingId(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const subject = String(form.subject || '').trim();
    const message = String(form.message || '').trim();
    if (!subject || !message) return;

    try {
      setError('');
      const payload = {
        subject,
        message,
        rating: Number.isFinite(Number(form.rating)) ? Number(form.rating) : 5,
      };

      if (editingId) {
        const updated = await updateFeedback(editingId, payload);
        setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      } else {
        const created = await createFeedback(payload);
        setItems((prev) => [created, ...prev]);
      }

      reset();
    } catch (err) {
      setError(err?.message || 'Failed to save feedback.');
    }
  };

  const edit = (x) => {
    setEditingId(x.id);
    setForm({ subject: x.subject || '', message: x.message || '', rating: String(x.rating ?? 5) });
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this feedback?')) return;
    try {
      setError('');
      await deleteFeedback(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (err) {
      setError(err?.message || 'Failed to delete feedback.');
    }
  };

  return (
    <div className="eg-page">
      <div className="eg-heading">
        <div>
          <h1 className="eg-title">Feedback</h1>
          <p className="eg-subtitle">Collect and manage feedback notes.</p>
        </div>
        <button className="eg-btn" type="button" onClick={() => navigate('/dashboard')}>Back to dashboard</button>
      </div>

      {error ? <div className="eg-alert" style={{ marginTop: 10 }}>{error}</div> : null}

      <div className="eg-grid" style={{ marginTop: 12 }}>
        <section className="eg-card">
          <div className="eg-cardHeader">
            <h2>{editingId ? 'Edit feedback' : 'Add feedback'}</h2>
          </div>
          <div className="eg-cardBody">
            <form onSubmit={onSubmit}>
              <div className="eg-form">
                <label>
                  Subject
                  <input className="eg-input" value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} placeholder="e.g. Venue arrangement" required />
                </label>
                <label>
                  Message
                  <textarea className="eg-textarea" value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} rows={4} placeholder="Write feedback details..." required />
                </label>
                <label>
                  Rating
                  <select className="eg-select" value={form.rating} onChange={(e) => setForm((p) => ({ ...p, rating: e.target.value }))}>
                    <option value="5">5</option>
                    <option value="4">4</option>
                    <option value="3">3</option>
                    <option value="2">2</option>
                    <option value="1">1</option>
                  </select>
                </label>
                <div className="eg-actions">
                  <button className="eg-btn eg-btnPrimary" type="submit">{editingId ? 'Save changes' : 'Add feedback'}</button>
                  <button className="eg-btn" type="button" onClick={reset}>Clear</button>
                </div>
              </div>
            </form>
          </div>
        </section>

        <section className="eg-card">
          <div className="eg-cardHeader">
            <h2>All feedback</h2>
          </div>
          <div className="eg-cardBody">
            {loading ? (
              <div className="eg-muted">Loading...</div>
            ) : items.length === 0 ? (
              <div className="eg-muted">No feedback yet.</div>
            ) : (
              <div className="eg-list">
                {items.map((x) => (
                  <div key={x.id} className="eg-item">
                    <div className="eg-itemTitleRow">
                      <strong>{x.subject}</strong>
                      <span className="eg-pill">Rating: {x.rating}</span>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 13, whiteSpace: 'pre-wrap' }} className="eg-muted">
                      {x.message}
                    </div>
                    <div className="eg-actions" style={{ marginTop: 10 }}>
                      <button className="eg-btn" type="button" onClick={() => edit(x)}>Edit</button>
                      <button className="eg-btn eg-btnDanger" type="button" onClick={() => remove(x.id)}>Delete</button>
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

export default Feedback;
