import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listProducts, createProduct, updateProduct, deleteProduct } from '../../src/api/products';
import '../../src/styles/pages.css';

const uid = () => crypto?.randomUUID?.() ?? String(Date.now());

const Products = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ productName: '', productPrice: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const data = await listProducts();
        if (alive) setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        if (alive) setError(err?.message || 'Failed to load products.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const reset = () => {
    setForm({ productName: '', productPrice: '' });
    setEditingId(null);
    setError('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const name = String(form.productName || '').trim();
    const priceRaw = String(form.productPrice || '').trim();

    if (!name) {
      setError('Product Name required');
      return;
    }
    if (!priceRaw) {
      setError('Price is required');
      return;
    }

    const price = Number(priceRaw);
    if (!Number.isFinite(price) || price < 0) {
      setError('Price must be a valid number');
      return;
    }

    try {
      if (editingId) {
        const updated = await updateProduct(editingId, { name, price });
        setProducts((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      } else {
        const created = await createProduct({ name, price });
        setProducts((prev) => [created, ...prev]);
      }
      reset();
    } catch (err) {
      setError(err?.message || 'Failed to save product.');
    }
  };

  const edit = (p) => {
    setEditingId(p.id);
    setForm({ productName: p.name || '', productPrice: String(p.price ?? '') });
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      setError('');
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err?.message || 'Failed to delete product.');
    }
  };

  return (
    <div className="eg-page">
      <div className="eg-heading">
        <div>
          <h1 className="eg-title">Products</h1>
          <p className="eg-subtitle">Track products/services and their prices.</p>
        </div>
        <button className="eg-btn" type="button" onClick={() => navigate('/dashboard')}>Back to dashboard</button>
      </div>

      <div className="eg-grid" style={{ marginTop: 12 }}>
        <section className="eg-card">
          <div className="eg-cardHeader">
            <h2>{editingId ? 'Edit product' : 'Add product'}</h2>
          </div>
          <div className="eg-cardBody">
            <form onSubmit={onSubmit}>
              <div className="eg-form">
                <label>
                  Product name
                  <input
                    className="eg-input"
                    value={form.productName}
                    onChange={(e) => setForm((p) => ({ ...p, productName: e.target.value }))}
                    placeholder="e.g. Catering (per plate)"
                    required
                  />
                </label>
                <label>
                  Price
                  <input
                    className="eg-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.productPrice}
                    onChange={(e) => setForm((p) => ({ ...p, productPrice: e.target.value }))}
                    placeholder="e.g. 12.50"
                    required
                  />
                  <div className="eg-muted" style={{ marginTop: 6 }}>Stored in your default currency.</div>
                </label>

                {error ? <div className="eg-alert" style={{ fontSize: 13 }}>{error}</div> : null}

                <div className="eg-actions">
                  <button className="eg-btn eg-btnPrimary" type="submit">{editingId ? 'Save changes' : 'Add product'}</button>
                  <button className="eg-btn" type="button" onClick={reset}>Clear</button>
                </div>
              </div>
            </form>
          </div>
        </section>

        <section className="eg-card">
          <div className="eg-cardHeader">
            <h2>All products</h2>
          </div>
          <div className="eg-cardBody">
            {loading ? (
              <div className="eg-muted">Loading...</div>
            ) : products.length === 0 ? (
              <div className="eg-muted">No products yet.</div>
            ) : (
              <div className="eg-list">
                {products.map((p) => (
                  <div key={p.id} className="eg-item">
                    <div className="eg-itemTitleRow">
                      <strong>{p.name}</strong>
                      <span className="eg-pill">${Number(p.price).toFixed(2)}</span>
                    </div>
                    <div className="eg-actions" style={{ marginTop: 10 }}>
                      <button className="eg-btn" type="button" onClick={() => edit(p)}>Edit</button>
                      <button className="eg-btn eg-btnDanger" type="button" onClick={() => remove(p.id)}>Delete</button>
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

export default Products;
