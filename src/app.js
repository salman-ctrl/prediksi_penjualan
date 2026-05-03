const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const listEndpoints = require('express-list-endpoints');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const kategoriRoutes = require('./routes/kategoriRoutes');
const produkRoutes = require('./routes/produkRoutes');
const transaksiRoutes = require('./routes/transaksiRoutes');
const pelangganRoutes = require('./routes/pelangganRoutes');
const predictionRoutes = require('./routes/predictionRoutes');

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', kategoriRoutes);
app.use('/api/products', produkRoutes);
app.use('/api/transactions', transaksiRoutes);
app.use('/api/customers', pelangganRoutes);
app.use('/api/predictions', predictionRoutes);

console.log('--- Registered Routes ---');

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

module.exports = app;