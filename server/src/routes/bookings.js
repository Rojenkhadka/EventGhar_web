import express from 'express';
import pg from 'pg';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/eventghar',
});

// Get all bookings for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await pool.query(`
      SELECT 
        b.*,
        e.id as eid,
        e.title as event_title,
        e.date as event_date,
        e.time as event_time,
        e.location as event_location,
        e.image as event_image,
        e.description as event_description,
        e.status as event_status,
        e.max_attendees as event_max_attendees,
        u.full_name as organizer_name
      FROM bookings b
      LEFT JOIN events e ON b.event_id = e.id
      LEFT JOIN users u ON e.user_id = u.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
    `, [userId]);

    res.json({
      bookings: result.rows.map(booking => ({
        id: booking.id,
        eventId: booking.event_id,
        eventTitle: booking.event_title,
        eventDate: booking.event_date,
        eventTime: booking.event_time,
        eventLocation: booking.event_location,
        eventImage: booking.event_image,
        eventStatus: booking.event_status,
        eventMaxAttendees: booking.event_max_attendees,
        organizerName: booking.organizer_name,
        status: booking.status,
        attendeeCount: booking.attendee_count,
        notes: booking.notes,
        createdAt: booking.created_at,
        event: {
          id: booking.event_id,
          title: booking.event_title,
          date: booking.event_date,
          time: booking.event_time,
          location: booking.event_location,
          image: booking.event_image,
          description: booking.event_description,
          status: booking.event_status,
          maxAttendees: booking.event_max_attendees,
          organizerName: booking.organizer_name,
        },
      })),
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
});

// Get booking by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(`
      SELECT 
        b.*,
        e.title as event_title,
        e.description as event_description,
        e.date as event_date,
        e.location as event_location,
        e.max_attendees as event_max_attendees
      FROM bookings b
      JOIN events e ON b.event_id = e.id
      WHERE b.id = $1 AND b.user_id = $2
    `, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = result.rows[0];
    res.json({
      booking: {
        id: booking.id,
        eventId: booking.event_id,
        eventTitle: booking.event_title,
        eventDescription: booking.event_description,
        eventDate: booking.event_date,
        eventLocation: booking.event_location,
        eventMaxAttendees: booking.event_max_attendees,
        status: booking.status,
        attendeeCount: booking.attendee_count,
        notes: booking.notes,
        createdAt: booking.created_at,
      },
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Failed to fetch booking' });
  }
});

// Create a new booking
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { eventId, attendeeCount, notes } = req.body;
    const userId = req.user.userId;

    if (!eventId) {
      return res.status(400).json({ message: 'Event ID is required' });
    }

    // Check if event exists and is approved
    const eventCheck = await pool.query(
      'SELECT id, max_attendees, status FROM events WHERE id = $1',
      [eventId]
    );

    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (eventCheck.rows[0].status !== 'APPROVED') {
      return res.status(400).json({ message: 'Event is not approved yet' });
    }

    // Check if user already booked this event
    const existingBooking = await pool.query(
      'SELECT id FROM bookings WHERE event_id = $1 AND user_id = $2',
      [eventId, userId]
    );

    if (existingBooking.rows.length > 0) {
      return res.status(400).json({ message: 'You have already booked this event' });
    }

    // Check available capacity
    const maxAttendees = eventCheck.rows[0].max_attendees;
    if (maxAttendees) {
      const soldTickets = await pool.query(
        `SELECT COALESCE(SUM(attendee_count), 0)::int as total_sold 
         FROM bookings 
         WHERE event_id = $1 AND status = 'CONFIRMED'`,
        [eventId]
      );
      
      const totalSold = soldTickets.rows[0].total_sold;
      const requestedCount = attendeeCount || 1;
      
      if (totalSold + requestedCount > maxAttendees) {
        const availableSeats = maxAttendees - totalSold;
        return res.status(400).json({ 
          message: availableSeats > 0 
            ? `Only ${availableSeats} seat(s) remaining. Cannot book ${requestedCount} ticket(s).`
            : 'All tickets are sold out for this event'
        });
      }
    }

    // Create booking
    const result = await pool.query(
      `INSERT INTO bookings (event_id, user_id, attendee_count, notes, status) 
       VALUES ($1, $2, $3, $4, 'CONFIRMED') 
       RETURNING *`,
      [eventId, userId, attendeeCount || 1, notes || null]
    );

    const booking = result.rows[0];
    res.status(201).json({
      message: 'Booking created successfully',
      booking: {
        id: booking.id,
        eventId: booking.event_id,
        status: booking.status,
        attendeeCount: booking.attendee_count,
        notes: booking.notes,
        createdAt: booking.created_at,
      },
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Failed to create booking' });
  }
});

// Update booking
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { attendeeCount, notes, status } = req.body;
    const userId = req.user.userId;

    // Check if booking belongs to user
    const checkResult = await pool.query(
      'SELECT user_id FROM bookings WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (checkResult.rows[0].user_id !== userId) {
      return res.status(403).json({ message: 'You can only update your own bookings' });
    }

    const result = await pool.query(
      `UPDATE bookings 
       SET attendee_count = $1, notes = $2, status = $3
       WHERE id = $4
       RETURNING *`,
      [attendeeCount, notes, status || 'CONFIRMED', id]
    );

    const booking = result.rows[0];
    res.json({
      message: 'Booking updated successfully',
      booking: {
        id: booking.id,
        eventId: booking.event_id,
        status: booking.status,
        attendeeCount: booking.attendee_count,
        notes: booking.notes,
      },
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ message: 'Failed to update booking' });
  }
});

// Cancel/Delete booking
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if booking belongs to user
    const checkResult = await pool.query(
      'SELECT user_id FROM bookings WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (checkResult.rows[0].user_id !== userId) {
      return res.status(403).json({ message: 'You can only cancel your own bookings' });
    }

    await pool.query('DELETE FROM bookings WHERE id = $1', [id]);

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({ message: 'Failed to cancel booking' });
  }
});

// Get bookings for a specific event (for organizers)
router.get('/event/:eventId', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;

    const result = await pool.query(`
      SELECT 
        b.*,
        u.full_name as user_name,
        u.email as user_email
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      WHERE b.event_id = $1
      ORDER BY b.created_at DESC
    `, [eventId]);

    res.json({
      bookings: result.rows.map(booking => ({
        id: booking.id,
        userName: booking.user_name,
        userEmail: booking.user_email,
        status: booking.status,
        attendeeCount: booking.attendee_count,
        notes: booking.notes,
        createdAt: booking.created_at,
      })),
    });
  } catch (error) {
    console.error('Get event bookings error:', error);
    res.status(500).json({ message: 'Failed to fetch event bookings' });
  }
});

export default router;
