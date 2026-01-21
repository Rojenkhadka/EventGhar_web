import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listVendors, createVendor, updateVendor, deleteVendor } from '../../src/api/vendors';
import '../../src/CSS/pages.css';

const uid = () => crypto?.randomUUID?.() ?? String(Date.now());

const Vendors = () => {
  const navigate = useNavigate();

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState({ name: '', category: '', phone: '', rating: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const data = await listVendors();
        if (alive) setVendors(Array.isArray(data) ? data : []);
      } catch (err) {
        if (alive) setError(err?.message || 'Failed to load vendors.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const reset = () => {
    setForm({ name: '', category: '', phone: '', rating: '' });
    setEditingId(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const name = String(form.name || '').trim();
    if (!name) return;

    try {
      setError('');
      const payload = {
        name,
        category: String(form.category || '').trim() || null,
        phone: String(form.phone || '').trim() || null,
        rating: form.rating === '' || form.rating == null ? null : Number(form.rating),
      };

      if (editingId) {
        const updated = await updateVendor(editingId, payload);
        setVendors((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      } else {
        const created = await createVendor(payload);
        setVendors((prev) => [created, ...prev]);
      }

      reset();
    } catch (err) {
      setError(err?.message || 'Failed to save vendor.');
    }
  };

  const edit = (v) => {
    setEditingId(v.id);
    setForm({
      name: v.name || '',
      category: v.category || '',
      phone: v.phone || '',
      rating: v.rating ?? '',
    });
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this vendor?')) return;
    try {
      setError('');
      await deleteVendor(id);
      setVendors((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      setError(err?.message || 'Failed to delete vendor.');
    }
  };

  return (
    <div className="eg-page">
      <div className="eg-heading">
        <div>
          <h1 className="eg-title">Vendors</h1>
          <p className="eg-subtitle">Save vendors you can reuse across events.</p>
        </div>
        <button className="eg-btn" type="button" onClick={() => navigate('/dashboard')}>Back to dashboard</button>
      </div>

      {error ? <div className="eg-alert" style={{ marginTop: 10 }}>{error}</div> : null}

      <div className="eg-grid" style={{ marginTop: 12 }}>
        <section className="eg-card">
          <div className="eg-cardHeader">
            <h2>{editingId ? 'Edit vendor' : 'Add vendor'}</h2>
          </div>
          <div className="eg-cardBody">
            <form onSubmit={onSubmit}>
              <div className="eg-form">
                <label>
                  Name
                  <input className="eg-input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. ABC Catering" required />
                </label>
                <label>
                  Category
                  <input className="eg-input" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder="e.g. Catering" />
                </label>
                <label>
                  Phone
                  <input className="eg-input" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="e.g. +977-98xxxxxxxx" />
                </label>
                <label>
                  Rating (0-5)
                  <input className="eg-input" type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(e) => setForm((p) => ({ ...p, rating: e.target.value }))} placeholder="e.g. 4.5" />
                </label>

                <div className="eg-actions">
                  <button className="eg-btn eg-btnPrimary" type="submit">{editingId ? 'Save changes' : 'Add vendor'}</button>
                  <button className="eg-btn" type="button" onClick={reset}>Clear</button>
                </div>
              </div>
            </form>
          </div>
        </section>

        <section className="eg-card">
          <div className="eg-cardHeader">
            <h2>All vendors</h2>
          </div>
          <div className="eg-cardBody">
            {loading ? (
              <div className="eg-muted">Loading...</div>
            ) : vendors.length === 0 ? (
              <div className="eg-muted">No vendors yet.</div>
            ) : (
              <div className="eg-list">
                {vendors.map((v) => (
                  <div key={v.id} className="eg-item">
                    <div className="eg-itemTitleRow">
                      <strong>{v.name}</strong>
                      <span className="eg-pill">{v.category || 'Vendor'}</span>
                    </div>
                    <div className="eg-muted" style={{ marginTop: 4, fontSize: 13 }}>
                      {v.phone ? `Phone: ${v.phone}` : 'No phone'}{v.rating != null ? ` • Rating: ${v.rating}` : ''}
                    </div>
                    <div className="eg-actions" style={{ marginTop: 10 }}>
                      <button className="eg-btn" type="button" onClick={() => edit(v)}>Edit</button>
                      <button className="eg-btn eg-btnDanger" type="button" onClick={() => remove(v.id)}>Delete</button>
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

export default Vendors;
