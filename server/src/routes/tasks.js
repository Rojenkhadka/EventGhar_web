import express from 'express';
import pg from 'pg';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/eventghar',
});

// Get all tasks for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { done } = req.query;
    
    let query = 'SELECT * FROM tasks WHERE user_id = $1';
    const params = [userId];
    
    if (done !== undefined) {
      query += ' AND done = $2';
      params.push(done === 'true');
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);

    res.json({
      tasks: result.rows.map(task => ({
        id: task.id,
        text: task.text,
        done: task.done,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
      })),
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
});

// Get task by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(
      'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const task = result.rows[0];
    res.json({
      task: {
        id: task.id,
        text: task.text,
        done: task.done,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
      },
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Failed to fetch task' });
  }
});

// Create a new task
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;
    const userId = req.user.userId;

    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Task text is required' });
    }

    const result = await pool.query(
      'INSERT INTO tasks (user_id, text, done) VALUES ($1, $2, false) RETURNING *',
      [userId, text.trim()]
    );

    const task = result.rows[0];
    res.status(201).json({
      message: 'Task created successfully',
      task: {
        id: task.id,
        text: task.text,
        done: task.done,
        createdAt: task.created_at,
      },
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Failed to create task' });
  }
});

// Update task
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { text, done } = req.body;
    const userId = req.user.userId;

    if (text !== undefined && text.trim() === '') {
      return res.status(400).json({ message: 'Task text cannot be empty' });
    }

    const updates = [];
    const params = [];
    let paramCount = 1;

    if (text !== undefined) {
      updates.push(`text = $${paramCount++}`);
      params.push(text.trim());
    }

    if (done !== undefined) {
      updates.push(`done = $${paramCount++}`);
      params.push(done);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    params.push(id, userId);

    const result = await pool.query(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${paramCount} AND user_id = $${paramCount + 1} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const task = result.rows[0];
    res.json({
      message: 'Task updated successfully',
      task: {
        id: task.id,
        text: task.text,
        done: task.done,
        updatedAt: task.updated_at,
      },
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Failed to update task' });
  }
});

// Toggle task done status
router.patch('/:id/toggle', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(
      'UPDATE tasks SET done = NOT done WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const task = result.rows[0];
    res.json({
      message: 'Task toggled successfully',
      task: {
        id: task.id,
        text: task.text,
        done: task.done,
        updatedAt: task.updated_at,
      },
    });
  } catch (error) {
    console.error('Toggle task error:', error);
    res.status(500).json({ message: 'Failed to toggle task' });
  }
});

// Delete task
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Failed to delete task' });
  }
});

// Delete all completed tasks
router.delete('/completed/all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      'DELETE FROM tasks WHERE user_id = $1 AND done = true RETURNING id',
      [userId]
    );

    res.json({ 
      message: `${result.rows.length} completed task(s) deleted successfully`,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Delete completed tasks error:', error);
    res.status(500).json({ message: 'Failed to delete completed tasks' });
  }
});

export default router;
