import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import eventsRoutes from './routes/events.js';
import bookingsRoutes from './routes/bookings.js';
import adminRoutes from './routes/admin.js';
import productsRoutes from './routes/products.js';
import tasksRoutes from './routes/tasks.js';
import vendorsRoutes from './routes/vendors.js';
import feedbackRoutes from './routes/feedback.js';
import notificationsRoutes from './routes/notifications.js';
import geocodeRoutes from './routes/geocode.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging for debugging
app.use((req, res, next) => {
  if (req.method === 'PUT' || req.method === 'POST') {
    console.log(`📨 ${req.method} ${req.path}`, req.body);
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/vendors', vendorsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/geocode', geocodeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'EventGhar API is running' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 EventGhar API Server running on http://localhost:${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
