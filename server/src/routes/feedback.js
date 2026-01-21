import express from 'express';
import pg from 'pg';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/eventghar',
});

// Get all feedback for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await pool.query(
      'SELECT * FROM feedback WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json({
      feedback: result.rows.map(item => ({
        id: item.id,
        subject: item.subject,
        message: item.message,
        rating: item.rating,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      })),
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ message: 'Failed to fetch feedback' });
  }
});

// Get all feedback (admin only)
router.get('/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        f.*,
        u.full_name as user_name,
        u.email as user_email
      FROM feedback f
      JOIN users u ON f.user_id = u.id
      ORDER BY f.created_at DESC
    `);

    res.json({
      feedback: result.rows.map(item => ({
        id: item.id,
        subject: item.subject,
        message: item.message,
        rating: item.rating,
        userName: item.user_name,
        userEmail: item.user_email,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      })),
    });
  } catch (error) {
    console.error('Get all feedback error:', error);
    res.status(500).json({ message: 'Failed to fetch all feedback' });
  }
});

// Get feedback by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(
      'SELECT * FROM feedback WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    const feedback = result.rows[0];
    res.json({
      feedback: {
        id: feedback.id,
        subject: feedback.subject,
        message: feedback.message,
        rating: feedback.rating,
        createdAt: feedback.created_at,
        updatedAt: feedback.updated_at,
      },
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ message: 'Failed to fetch feedback' });
  }
});

// Create new feedback
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { subject, message, rating } = req.body;
    const userId = req.user.userId;

    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message are required' });
    }

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const result = await pool.query(
      'INSERT INTO feedback (user_id, subject, message, rating) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, subject, message, rating || null]
    );

    const feedback = result.rows[0];
    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback: {
        id: feedback.id,
        subject: feedback.subject,
        message: feedback.message,
        rating: feedback.rating,
        createdAt: feedback.created_at,
      },
    });
  } catch (error) {
    console.error('Create feedback error:', error);
    res.status(500).json({ message: 'Failed to submit feedback' });
  }
});

// Update feedback
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, message, rating } = req.body;
    const userId = req.user.userId;

    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message are required' });
    }

    if (rating !== undefined && rating !== null && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const result = await pool.query(
      'UPDATE feedback SET subject = $1, message = $2, rating = $3 WHERE id = $4 AND user_id = $5 RETURNING *',
      [subject, message, rating || null, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    const feedback = result.rows[0];
    res.json({
      message: 'Feedback updated successfully',
      feedback: {
        id: feedback.id,
        subject: feedback.subject,
        message: feedback.message,
        rating: feedback.rating,
        updatedAt: feedback.updated_at,
      },
    });
  } catch (error) {
    console.error('Update feedback error:', error);
    res.status(500).json({ message: 'Failed to update feedback' });
  }
});

// Delete feedback
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(
      'DELETE FROM feedback WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Delete feedback error:', error);
    res.status(500).json({ message: 'Failed to delete feedback' });
  }
});

export default router;
