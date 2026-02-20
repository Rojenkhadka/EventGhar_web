import express from 'express';
import pg from 'pg';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/eventghar',
});

// Apply authentication middleware to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// Get all users
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, full_name, email, role, created_at FROM users ORDER BY created_at DESC'
    );

    res.json({
      users: result.rows.map(user => ({
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
      })),
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Update user role
router.put('/users/:userId/role', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['USER', 'ORGANIZER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, full_name, email, role',
      [role, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      message: 'User role updated successfully',
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: 'Failed to update user role' });
  }
});

// Delete user
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Get admin statistics
router.get('/stats', async (req, res) => {
  try {
    const [usersResult, eventsResult, bookingsResult, organizersResult] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM events'),
      pool.query('SELECT COUNT(*) FROM bookings'),
      pool.query("SELECT COUNT(*) FROM users WHERE role = 'ORGANIZER'"),
    ]);

    res.json({
      stats: {
        totalUsers: parseInt(usersResult.rows[0].count),
        totalEvents: parseInt(eventsResult.rows[0].count),
        totalBookings: parseInt(bookingsResult.rows[0].count),
        totalOrganizers: parseInt(organizersResult.rows[0].count),
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
});

// Weekly registrations analytics (last 7 days + previous week for comparison)
router.get('/analytics/weekly-registrations', async (req, res) => {
  try {
    // Fetch counts for the last 14 days so we can build current 7-day and previous 7-day windows
    const result = await pool.query(
      `SELECT date_trunc('day', created_at) AS day, COUNT(*) AS cnt
       FROM users
       WHERE created_at >= NOW() - INTERVAL '14 days'
       GROUP BY day
       ORDER BY day ASC`
    );

    // Build a map of YYYY-MM-DD -> count
    const countsMap = new Map();
    result.rows.forEach(r => {
      const key = r.day.toISOString().slice(0, 10);
      countsMap.set(key, parseInt(r.cnt, 10));
    });

    // Prepare last 14 days array (oldest -> newest)
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setUTCHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ day: key, count: countsMap.get(key) || 0 });
    }

    const prev7 = days.slice(0, 7).map(d => d.count);
    const last7 = days.slice(7).map(d => d.count);

    const sum = arr => arr.reduce((a, b) => a + b, 0);
    const total = sum(last7);
    const prevTotal = sum(prev7) || 1; // avoid div by zero
    const changePct = Math.round(((total - prevTotal) / prevTotal) * 10000) / 100;

    res.json({
      weekly: {
        days: days.slice(7).map(d => d.day),
        counts: last7,
        total,
        prevTotal: sum(prev7),
        changePct
      }
    });
  } catch (error) {
    console.error('Weekly registrations analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch weekly registrations analytics' });
  }
});

// Get pending events
router.get('/events/pending', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        e.id, 
        e.title, 
        e.description, 
        e.date, 
        e.location, 
        e.max_attendees,
        e.status,
        u.full_name as organizer_name,
        u.email as organizer_email
      FROM events e
      JOIN users u ON e.user_id = u.id
      WHERE e.status = 'PENDING_APPROVAL'
      ORDER BY e.created_at DESC
    `);

    res.json({
      events: result.rows.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        location: event.location,
        maxAttendees: event.max_attendees,
        status: event.status,
        organizerName: event.organizer_name,
        organizerEmail: event.organizer_email,
      })),
    });
  } catch (error) {
    console.error('Get pending events error:', error);
    res.status(500).json({ message: 'Failed to fetch pending events' });
  }
});

// Create admin user
router.post('/users/create-admin', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, full_name, email, role',
      [fullName, email, hashedPassword, 'ADMIN']
    );

    const user = result.rows[0];
    res.status(201).json({
      message: 'Admin user created successfully',
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Create admin error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Failed to create admin user' });
  }
});

export default router;
