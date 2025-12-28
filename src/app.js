const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const listEndpoints = require('express-list-endpoints')
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const kategoriRoutes = require('./routes/kategoriRoutes');
const produkRoutes = require('./routes/produkRoutes');
const transaksiRoutes = require('./routes/transaksiRoutes');
const pelangganRoutes = require('./routes/pelangganRoutes');
const predictionRoutes = require('./routes/predictionRoutes');


// Initialize app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', kategoriRoutes);
app.use('/api/products', produkRoutes);
app.use('/api/transactions', transaksiRoutes);
app.use('/api/customers', pelangganRoutes);
app.use('/api/predictions', predictionRoutes);

console.log({
  authRoutes,
  userRoutes,
  kategoriRoutes,
  produkRoutes,
  transaksiRoutes,
  pelangganRoutes,
  predictionRoutes
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});
console.table(listEndpoints(app))

module.exports = app;