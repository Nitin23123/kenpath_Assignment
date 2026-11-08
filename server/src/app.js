const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const readingsRoutes = require('./routes/readingsRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Sweety Blood Glucose Tracker API'
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/readings', readingsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/doctor', doctorRoutes);

// 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found.' });
});

// Centralized Error Handling
app.use(errorHandler);

module.exports = app;
