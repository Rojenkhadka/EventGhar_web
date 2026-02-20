import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listTasks, createTask, updateTask, deleteTask } from '../../src/api/tasks';
import '../../src/styles/pages.css';

const Tasks = () => {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const data = await listTasks();
        if (alive) setTasks(Array.isArray(data) ? data : []);
      } catch (err) {
        if (alive) setError(err?.message || 'Failed to load tasks.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    const t = String(text || '').trim();
    if (!t) return;

    try {
      setError('');
      if (editingId) {
        const updated = await updateTask(editingId, { text: t });
        setTasks((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      } else {
        const created = await createTask({ text: t, done: false });
        setTasks((prev) => [created, ...prev]);
      }
      setText('');
      setEditingId(null);
    } catch (err) {
      setError(err?.message || 'Failed to save task.');
    }
  };

  const toggle = async (id) => {
    const current = tasks.find((x) => x.id === id);
    if (!current) return;

    try {
      setError('');
      const updated = await updateTask(id, { done: !current.done });
      setTasks((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    } catch (err) {
      setError(err?.message || 'Failed to update task.');
    }
  };

  const edit = (task) => {
    setEditingId(task.id);
    setText(task.text || '');
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      setError('');
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setText('');
      }
    } catch (err) {
      setError(err?.message || 'Failed to delete task.');
    }
  };

  const clearDone = async () => {
    const doneIds = tasks.filter((t) => t.done).map((t) => t.id);
    if (doneIds.length === 0) return;
    if (!window.confirm('Clear all done tasks?')) return;

    try {
      setError('');
      // sequential delete to keep it simple
      for (const id of doneIds) {
        // eslint-disable-next-line no-await-in-loop
        await deleteTask(id);
      }
      setTasks((prev) => prev.filter((t) => !t.done));
    } catch (err) {
      setError(err?.message || 'Failed to clear done tasks.');
    }
  };

  const openCount = tasks.filter((t) => !t.done).length;

  return (
    <div className="eg-page" style={{ maxWidth: 1000 }}>
      <div className="eg-heading">
        <div>
          <h1 className="eg-title">Tasks</h1>
          <p className="eg-subtitle">Keep track of what needs to be done.</p>
        </div>
        <button className="eg-btn" type="button" onClick={() => navigate('/dashboard')}>Back to dashboard</button>
      </div>

      <p className="eg-kpi">Total: {tasks.length} • Open: {openCount}</p>

      <section className="eg-card" style={{ marginTop: 12 }}>
        <div className="eg-cardHeader">
          <h2>{editingId ? 'Edit task' : 'Add task'}</h2>
          <button className="eg-btnLink" type="button" onClick={clearDone} disabled={!tasks.some((t) => t.done)}>
            Clear done
          </button>
        </div>
        <div className="eg-cardBody">
          <form onSubmit={submit} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              className="eg-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={editingId ? 'Update task' : 'New task'}
              style={{ flex: '1 1 260px' }}
              required
            />
            <button className="eg-btn eg-btnPrimary" type="submit">{editingId ? 'Save changes' : 'Add task'}</button>
            <button className="eg-btn" type="button" onClick={() => { setText(''); setEditingId(null); }}>
              Clear
            </button>
          </form>
          {error ? <div className="eg-alert" style={{ marginTop: 8 }}>{error}</div> : null}
        </div>
      </section>

      <section className="eg-card" style={{ marginTop: 12 }}>
        <div className="eg-cardHeader">
          <h2>List</h2>
        </div>
        <div className="eg-cardBody">
          {loading ? (
            <div className="eg-muted">Loading...</div>
          ) : tasks.length === 0 ? (
            <div className="eg-muted">No tasks yet.</div>
          ) : (
            <div className="eg-list">
              {tasks.map((t) => (
                <div key={t.id} className="eg-item" style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="checkbox" checked={!!t.done} onChange={() => toggle(t.id)} />
                    <div style={{ textDecoration: t.done ? 'line-through' : 'none', color: t.done ? 'rgba(11, 18, 32, 0.55)' : 'rgba(11, 18, 32, 0.86)' }}>
                      {t.text}
                    </div>
                  </div>
                  <div className="eg-actions">
                    <button className="eg-btn" type="button" onClick={() => edit(t)}>Edit</button>
                    <button className="eg-btn eg-btnDanger" type="button" onClick={() => remove(t.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Tasks;
