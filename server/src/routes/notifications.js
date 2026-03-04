import express from 'express';
import pg from 'pg';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/eventghar',
});

// Get all notifications for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    
    console.log('📬 Fetching notifications for user:', userId);
    
    const result = await pool.query(
      `SELECT 
        n.id,
        n.type,
        n.title,
        n.message,
        n.read,
        n.created_at,
        n.event_id,
        e.title as event_title
      FROM notifications n
      LEFT JOIN events e ON n.event_id = e.id
      WHERE n.user_id = $1
      ORDER BY n.created_at DESC
      LIMIT 50`,
      [userId]
    );

    console.log('📬 Found', result.rows.length, 'notifications for user:', userId);

    res.json({
      notifications: result.rows.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.read,
        createdAt: n.created_at,
        eventId: n.event_id,
        eventTitle: n.event_title
      }))
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// Get unread notification count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    
    console.log('🔢 Fetching unread count for user:', userId);
    
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = FALSE',
      [userId]
    );

    const count = parseInt(result.rows[0].count);
    console.log('🔢 Unread notifications:', count, 'for user:', userId);

    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Failed to fetch unread count' });
  }
});

// Mark notification as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user.id;

    const result = await pool.query(
      `UPDATE notifications 
       SET read = TRUE 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    await pool.query(
      'UPDATE notifications SET read = TRUE WHERE user_id = $1 AND read = FALSE',
      [userId]
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ message: 'Failed to mark all notifications as read' });
  }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user.id;

    const result = await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
});

export default router;
