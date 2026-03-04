
import express from 'express';
import pg from 'pg';
import { authenticateToken, requireOrganizer, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/eventghar',
});

// Helper function to filter users based on notification preferences
async function filterUsersByNotificationPreference(userIds, preferenceColumn) {
  if (userIds.length === 0) return [];
  
  const placeholders = userIds.map((_, i) => `$${i + 1}`).join(', ');
  const result = await pool.query(
    `SELECT id FROM users WHERE id IN (${placeholders}) AND ${preferenceColumn} = true`,
    userIds
  );
  
  return result.rows.map(row => row.id);
}

// Get all events for the current organizer (all statuses)
router.get('/my', authenticateToken, requireOrganizer, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    if (!userId) {
      return res.status(400).json({ message: 'No userId in token' });
    }
    const result = await pool.query(`
      SELECT 
        e.id, 
        e.title, 
        e.description, 
        e.date, 
        e.time,
        e.location, 
        e.max_attendees,
        e.status,
        e.created_at,
        e.image,
        COALESCE(SUM(b.attendee_count), 0)::int as tickets_sold
      FROM events e
      LEFT JOIN bookings b ON e.id = b.event_id AND b.status = 'CONFIRMED'
      WHERE e.user_id = $1
      GROUP BY e.id
      ORDER BY e.created_at DESC
    `, [userId]);

    res.json({
      events: result.rows.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        time: event.time,
        location: event.location,
        maxAttendees: event.max_attendees,
        ticketsSold: event.tickets_sold,
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
        e.time,
        e.location, 
        e.max_attendees,
        e.status,
        e.created_at,
        e.image,
        u.full_name as organizer_name,
        COALESCE(SUM(b.attendee_count), 0)::int as tickets_sold
      FROM events e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN bookings b ON e.id = b.event_id AND b.status = 'CONFIRMED'
      WHERE e.status = 'APPROVED'
      GROUP BY e.id, u.full_name
      ORDER BY e.date ASC
    `);

    res.json({
      events: result.rows.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        time: event.time,
        location: event.location,
        maxAttendees: event.max_attendees,
        ticketsSold: event.tickets_sold,
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
        e.time,
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
        time: event.time,
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
        time: event.time,
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
    const { title, description, date, time, location, venue, maxAttendees, image } = req.body;
    const eventLocation = location || venue;
    const userId = req.user.userId;

    if (!title || !date || !eventLocation) {
      return res.status(400).json({ message: 'Title, date, and location are required' });
    }

    // Default time to 00:00:00 if not provided
    const eventTime = time || '00:00:00';

    const result = await pool.query(
      `INSERT INTO events (title, description, date, time, location, max_attendees, user_id, status, image) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', $8) 
       RETURNING *`,
      [title, description, date, eventTime, eventLocation, maxAttendees || null, userId, image || null]
    );

    const event = result.rows[0];

    // Notify all admins that a new event is pending approval
    try {
      const organizerResult = await pool.query(
        `SELECT full_name FROM users WHERE id = $1`,
        [userId]
      );
      const organizerName = organizerResult.rows[0]?.full_name || 'An organizer';

      const adminsResult = await pool.query(
        `SELECT id FROM users WHERE role = 'ADMIN'`
      );

      if (adminsResult.rows.length > 0) {
        const values = adminsResult.rows.map((_, i) => {
          const b = i * 5;
          return `($${b+1}, $${b+2}, $${b+3}, $${b+4}, $${b+5})`;
        }).join(', ');
        const params = adminsResult.rows.flatMap(admin => [
          admin.id,
          'New Event Pending Approval 🕐',
          `${organizerName} submitted "${event.title}" for review. Please approve or reject it.`,
          'event_pending_admin',
          event.id,
        ]);
        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type, event_id) VALUES ${values}`,
          params
        );
        console.log(`✓ Notified ${adminsResult.rows.length} admin(s) about new pending event: ${event.title}`);
      }
    } catch (notifErr) {
      console.error('Failed to send admin notification on event create:', notifErr);
    }

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
    const { title, description, date, time, location, venue, maxAttendees, image } = req.body;
    const eventLocation = location || venue;
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

    // Default time to 00:00:00 if not provided
    const eventTime = time || '00:00:00';

    const result = await pool.query(
      `UPDATE events 
       SET title = $1, description = $2, date = $3, time = $4, location = $5, max_attendees = $6, image = $7
       WHERE id = $8
       RETURNING *`,
      [title, description, date, eventTime, eventLocation, maxAttendees || null, image || null, id]
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

    // Check if event belongs to user (unless admin) and get event info
    let eventRow;
    const checkResult = await pool.query(
      'SELECT id, user_id, title FROM events WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    eventRow = checkResult.rows[0];

    if (req.user.role !== 'ADMIN' && eventRow.user_id !== userId) {
      return res.status(403).json({ message: 'You can only delete your own events' });
    }

    // IMPORTANT: Query bookings BEFORE deleting the event 
    // (bookings have ON DELETE CASCADE, so they'll be auto-deleted with the event)
    const bookedUsersResult = await pool.query(
      `SELECT DISTINCT user_id, status FROM bookings WHERE event_id = $1 AND status IN ('CONFIRMED', 'PENDING')`,
      [id]
    );

    console.log('🔍 Found', bookedUsersResult.rows.length, 'booked users for event:', eventRow.title);

    // Send notifications to booked users BEFORE deleting the event
    try {
      if (bookedUsersResult.rows.length > 0) {
        // Cancellation is a critical notification — send to ALL booked users regardless of preference
        const allUserIds = bookedUsersResult.rows.map(r => r.user_id);
        
        console.log('📧 Sending cancellation notifications to ALL', allUserIds.length, 'booked users for event:', eventRow.title);

        const valuesSql = allUserIds.map((_, index) => {
          const base = index * 5;
          return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
        }).join(', ');

        // ⚠️ Use NULL for event_id — the event is about to be deleted and the FK
        // ON DELETE CASCADE would wipe notifications if we store the event_id.
        const params = allUserIds.flatMap(uid => [
          uid,
          'Event Cancelled ❌',
          `We're sorry — the event "${eventRow.title}" has been cancelled by the organizer. Your booking has been automatically cancelled.`,
          'event_cancelled',
          null,
        ]);

        const insertResult = await pool.query(
          `INSERT INTO notifications (user_id, title, message, type, event_id) VALUES ${valuesSql} RETURNING id, user_id`,
          params
        );

        console.log('✅ Successfully sent cancellation notifications to', insertResult.rows.length, 'users:', insertResult.rows.map(r => r.user_id));
      } else {
        console.log('ℹ️  No confirmed bookings — no cancellation notifications to send');
      }
    } catch (notifErr) {
      console.error('❌ Failed to send cancellation notifications:', notifErr.message);
      // proceed even if notifications fail
    }

    // Now delete the event (this will cascade delete bookings automatically)
    const result = await pool.query(
      'DELETE FROM events WHERE id = $1 RETURNING id, title',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    console.log('✓ Event deleted successfully:', eventRow.title);

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
      `UPDATE events SET status = 'PENDING_APPROVAL' WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const publishedEvent = result.rows[0];

    res.json({
      message: 'Event submitted for approval',
      event: publishedEvent,
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

    const event = result.rows[0];

    // Send notifications: 1) to organizer, 2) to all users
    try {
      console.log('Sending approval notifications for event:', event.title, 'Event ID:', event.id, 'Organizer ID:', event.user_id);
      
      // 1. Notify the organizer about their event being approved
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, event_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          event.user_id,
          'Event Approved! ✅',
          `Your event "${event.title}" has been approved by the admin and is now live for users to book!`,
          'event_approved_organizer',
          event.id,
        ]
      );
      console.log('✓ Sent organizer notification');

      // 2. Notify all users about the newly approved event
      // Use IS NOT FALSE so users who never changed the setting (NULL) still receive it
      const usersResult = await pool.query(
        `SELECT id FROM users WHERE role = 'USER' AND (notif_event_alerts IS NOT FALSE)`
      );
      console.log('Found', usersResult.rows.length, 'users with event alerts enabled to notify');

      if (usersResult.rows.length > 0) {
        const notificationValues = usersResult.rows.map((_, index) => {
          const base = index * 5;
          return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
        }).join(', ');

        const notificationParams = usersResult.rows.flatMap(user => [
          user.id,
          'New Event Available! 🎉',
          `"${event.title}" has just been approved and is now open for booking. Don't miss out!`,
          'event_approved',
          event.id,
        ]);

        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type, event_id)
           VALUES ${notificationValues}`,
          notificationParams
        );
        console.log('✓ Sent user notifications to', usersResult.rows.length, 'users');

        console.log(`✓✓ Sent approval notification to organizer and ${usersResult.rows.length} users for: ${event.title}`);
      }
    } catch (notifError) {
      console.error('❌ Failed to send notifications:', notifError);
      console.error('Error details:', notifError.message, notifError.stack);
      // Don't fail the approval if notifications fail
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

    const event = result.rows[0];

    // Send notification to the organizer about rejection
    try {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, event_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          event.user_id,
          'Event Rejected ❌',
          `Unfortunately, your event "${event.title}" was not approved by the admin. Please review and resubmit if needed.`,
          'event_rejected',
          event.id,
        ]
      );
      console.log(`Sent rejection notification to organizer for: ${event.title}`);
    } catch (notifError) {
      console.error('Failed to send rejection notification:', notifError);
      // Don't fail the rejection if notification fails
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
