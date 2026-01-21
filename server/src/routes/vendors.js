import express from 'express';
import pg from 'pg';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/eventghar',
});

// Get all vendors for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { category } = req.query;
    
    let query = 'SELECT * FROM vendors WHERE user_id = $1';
    const params = [userId];
    
    if (category) {
      query += ' AND category = $2';
      params.push(category);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);

    res.json({
      vendors: result.rows.map(vendor => ({
        id: vendor.id,
        name: vendor.name,
        category: vendor.category,
        phone: vendor.phone,
        rating: vendor.rating,
        createdAt: vendor.created_at,
        updatedAt: vendor.updated_at,
      })),
    });
  } catch (error) {
    console.error('Get vendors error:', error);
    res.status(500).json({ message: 'Failed to fetch vendors' });
  }
});

// Get vendor by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(
      'SELECT * FROM vendors WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const vendor = result.rows[0];
    res.json({
      vendor: {
        id: vendor.id,
        name: vendor.name,
        category: vendor.category,
        phone: vendor.phone,
        rating: vendor.rating,
        createdAt: vendor.created_at,
        updatedAt: vendor.updated_at,
      },
    });
  } catch (error) {
    console.error('Get vendor error:', error);
    res.status(500).json({ message: 'Failed to fetch vendor' });
  }
});

// Create a new vendor
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, category, phone, rating } = req.body;
    const userId = req.user.userId;

    if (!name) {
      return res.status(400).json({ message: 'Vendor name is required' });
    }

    if (rating !== undefined && (rating < 0 || rating > 5)) {
      return res.status(400).json({ message: 'Rating must be between 0 and 5' });
    }

    const result = await pool.query(
      'INSERT INTO vendors (user_id, name, category, phone, rating) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, name, category || null, phone || null, rating || null]
    );

    const vendor = result.rows[0];
    res.status(201).json({
      message: 'Vendor created successfully',
      vendor: {
        id: vendor.id,
        name: vendor.name,
        category: vendor.category,
        phone: vendor.phone,
        rating: vendor.rating,
        createdAt: vendor.created_at,
      },
    });
  } catch (error) {
    console.error('Create vendor error:', error);
    res.status(500).json({ message: 'Failed to create vendor' });
  }
});

// Update vendor
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, phone, rating } = req.body;
    const userId = req.user.userId;

    if (!name) {
      return res.status(400).json({ message: 'Vendor name is required' });
    }

    if (rating !== undefined && rating !== null && (rating < 0 || rating > 5)) {
      return res.status(400).json({ message: 'Rating must be between 0 and 5' });
    }

    const result = await pool.query(
      'UPDATE vendors SET name = $1, category = $2, phone = $3, rating = $4 WHERE id = $5 AND user_id = $6 RETURNING *',
      [name, category || null, phone || null, rating || null, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const vendor = result.rows[0];
    res.json({
      message: 'Vendor updated successfully',
      vendor: {
        id: vendor.id,
        name: vendor.name,
        category: vendor.category,
        phone: vendor.phone,
        rating: vendor.rating,
        updatedAt: vendor.updated_at,
      },
    });
  } catch (error) {
    console.error('Update vendor error:', error);
    res.status(500).json({ message: 'Failed to update vendor' });
  }
});

// Delete vendor
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(
      'DELETE FROM vendors WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    res.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    console.error('Delete vendor error:', error);
    res.status(500).json({ message: 'Failed to delete vendor' });
  }
});

export default router;
