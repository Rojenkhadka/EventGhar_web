import express from 'express';
import pg from 'pg';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/eventghar',
});

// Get all products for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await pool.query(
      'SELECT * FROM products WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json({
      products: result.rows.map(product => ({
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        createdAt: product.created_at,
        updatedAt: product.updated_at,
      })),
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

// Get product by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(
      'SELECT * FROM products WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = result.rows[0];
    res.json({
      product: {
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        createdAt: product.created_at,
        updatedAt: product.updated_at,
      },
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
});

// Create a new product
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, price } = req.body;
    const userId = req.user.userId;

    if (!name || !price) {
      return res.status(400).json({ message: 'Name and price are required' });
    }

    if (price < 0) {
      return res.status(400).json({ message: 'Price must be a positive number' });
    }

    const result = await pool.query(
      'INSERT INTO products (user_id, name, price) VALUES ($1, $2, $3) RETURNING *',
      [userId, name, price]
    );

    const product = result.rows[0];
    res.status(201).json({
      message: 'Product created successfully',
      product: {
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        createdAt: product.created_at,
      },
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Failed to create product' });
  }
});

// Update product
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price } = req.body;
    const userId = req.user.userId;

    if (!name || !price) {
      return res.status(400).json({ message: 'Name and price are required' });
    }

    if (price < 0) {
      return res.status(400).json({ message: 'Price must be a positive number' });
    }

    const result = await pool.query(
      'UPDATE products SET name = $1, price = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
      [name, price, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = result.rows[0];
    res.json({
      message: 'Product updated successfully',
      product: {
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        updatedAt: product.updated_at,
      },
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Failed to update product' });
  }
});

// Delete product
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(
      'DELETE FROM products WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

export default router;
