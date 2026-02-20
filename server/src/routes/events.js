
import express from 'express';
import pg from 'pg';
import { authenticateToken, requireOrganizer, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/eventghar',
});

// Get all events for the current organizer (all statuses)
router.get('/my', authenticateToken, requireOrganizer, async (req, res) => {
  try {
    console.log('DEBUG /api/events/my req.user:', req.user);
    const userId = req.user.userId || req.user.id;
    console.log('DEBUG /api/events/my userId:', userId);
    if (!userId) {
      return res.status(400).json({ message: 'No userId in token' });
    }
    const result = await pool.query(`
      SELECT 
        e.id, 
        e.title, 
        e.description, 
        e.date, 
        e.location, 
        e.max_attendees,
        e.status,
        e.created_at,
        e.image
      FROM events e
      WHERE e.user_id = $1
      ORDER BY e.created_at DESC
    `, [userId]);

    res.json({
      events: result.rows.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        location: event.location,
        maxAttendees: event.max_attendees,
        status: event.status,
        createdAt: event.created_at,
        image: event.image,
      })),
    });
  } catch (error) {
    console.error('Get my events error:', error);
    res.status(500).json({ message: 'Failed to fetch your events' });
  }
});

// Get all public events (must be before /:id route)
router.get('/public', async (req, res) => {
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
        e.created_at,
        e.image,
        u.full_name as organizer_name
      FROM events e
      JOIN users u ON e.user_id = u.id
      WHERE e.status = 'APPROVED'
      ORDER BY e.date ASC
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
        createdAt: event.created_at,
        image: event.image,
      })),
    });
  } catch (error) {
    console.error('Get public events error:', error);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
});

// Get all events (public - for backward compatibility)
router.get('/', async (req, res) => {
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
        e.created_at,
        e.image,
        u.full_name as organizer_name
      FROM events e
      JOIN users u ON e.user_id = u.id
      WHERE e.status = 'APPROVED'
      ORDER BY e.date ASC
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
        createdAt: event.created_at,
        image: event.image,
      })),
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
});

// Get event by ID (must be after specific routes like /public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        e.*, 
        u.full_name as organizer_name,
        u.email as organizer_email
      FROM events e
      JOIN users u ON e.user_id = u.id
      WHERE e.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const event = result.rows[0];
    res.json({
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        location: event.location,
        maxAttendees: event.max_attendees,
        status: event.status,
        organizerName: event.organizer_name,
        organizerEmail: event.organizer_email,
        createdAt: event.created_at,
        image: event.image,
      },
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Failed to fetch event' });
  }
});

// Create event (organizer only)
router.post('/', authenticateToken, requireOrganizer, async (req, res) => {
  try {
    const { title, description, date, location, maxAttendees, image } = req.body;
    const userId = req.user.userId;

    if (!title || !date || !location) {
      return res.status(400).json({ message: 'Title, date, and location are required' });
    }

    const result = await pool.query(
      `INSERT INTO events (title, description, date, location, max_attendees, user_id, status, image) 
       VALUES ($1, $2, $3, $4, $5, $6, 'PENDING_APPROVAL', $7) 
       RETURNING *`,
      [title, description, date, location, maxAttendees || null, userId, image || null]
    );

    const event = result.rows[0];
    res.status(201).json({
      message: 'Event created and pending approval.',
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        location: event.location,
        maxAttendees: event.max_attendees,
        status: event.status,
        image: event.image,
      },
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Failed to create event' });
  }
});

// Update event (organizer only, own events)
router.put('/:id', authenticateToken, requireOrganizer, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, date, location, maxAttendees, image } = req.body;
    const userId = req.user.userId;

    // Check if event belongs to user (unless admin)
    if (req.user.role !== 'ADMIN') {
      const checkResult = await pool.query(
        'SELECT user_id FROM events WHERE id = $1',
        [id]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ message: 'Event not found' });
      }

      if (checkResult.rows[0].user_id !== userId) {
        return res.status(403).json({ message: 'You can only edit your own events' });
      }
    }

    const result = await pool.query(
      `UPDATE events 
       SET title = $1, description = $2, date = $3, location = $4, max_attendees = $5, image = $6
       WHERE id = $7
       RETURNING *`,
      [title, description, date, location, maxAttendees || null, image || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const event = result.rows[0];
    res.json({
      message: 'Event updated successfully. Waiting for admin approval.',
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        location: event.location,
        maxAttendees: event.max_attendees,
        status: event.status,
      },
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Failed to update event' });
  }
});

// Delete event
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if event belongs to user (unless admin)
    if (req.user.role !== 'ADMIN') {
      const checkResult = await pool.query(
        'SELECT user_id FROM events WHERE id = $1',
        [id]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ message: 'Event not found' });
      }

      if (checkResult.rows[0].user_id !== userId) {
        return res.status(403).json({ message: 'You can only delete your own events' });
      }
    }

    const result = await pool.query(
      'DELETE FROM events WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Failed to delete event' });
  }
});

// Publish event (organizer can publish their own events)
router.patch('/:id/publish', authenticateToken, requireOrganizer, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if event belongs to user (unless admin)
    if (req.user.role !== 'ADMIN') {
      const checkResult = await pool.query(
        'SELECT user_id FROM events WHERE id = $1',
        [id]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ message: 'Event not found' });
      }

      if (checkResult.rows[0].user_id !== userId) {
        return res.status(403).json({ message: 'You can only publish your own events' });
      }
    }

    const result = await pool.query(
      `UPDATE events SET status = 'APPROVED' WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({
      message: 'Event published successfully',
      event: result.rows[0],
    });
  } catch (error) {
    console.error('Publish event error:', error);
    res.status(500).json({ message: 'Failed to publish event' });
  }
});

// Approve event (admin only)
router.patch('/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE events SET status = 'APPROVED' WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({
      message: 'Event approved successfully',
      event: result.rows[0],
    });
  } catch (error) {
    console.error('Approve event error:', error);
    res.status(500).json({ message: 'Failed to approve event' });
  }
});

// Reject event (admin only)
router.patch('/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE events SET status = 'REJECTED' WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({
      message: 'Event rejected successfully',
      event: result.rows[0],
    });
  } catch (error) {
    console.error('Reject event error:', error);
    res.status(500).json({ message: 'Failed to reject event' });
  }
});

// Get all events for admin (includes all statuses)
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        e.*, 
        u.full_name as organizer_name,
        u.email as organizer_email
      FROM events e
      JOIN users u ON e.user_id = u.id
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
        createdAt: event.created_at,
      })),
    });
  } catch (error) {
    console.error('Get all events error:', error);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
});

export default router;
