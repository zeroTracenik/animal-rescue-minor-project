/**
 * Animal Rescue Connect - Main Express Server
 * Simple, robust, modern web architecture for citizen & rescue team coordination.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');
const ngoRoutes = require('./routes/ngoRoutes');
const statsRoutes = require('./routes/statsRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Security & utility middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Static Assets
app.use('/public', express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use('/css', express.static(path.join(__dirname, '../frontend/css')));
app.use('/js', express.static(path.join(__dirname, '../frontend/js')));
app.use('/pages', express.static(path.join(__dirname, '../frontend/pages')));
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ngos', ngoRoutes);
app.use('/api/stats', statsRoutes);

// Clean Page Routing
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/report', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/report.html'));
});

app.get('/cases', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/cases.html'));
});

app.get('/track', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/track.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/about.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/register.html'));
});

app.get('/ngo-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/ngo-dashboard.html'));
});

app.get('/volunteer-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/volunteer-dashboard.html'));
});

app.get('/admin-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/admin-dashboard.html'));
});

// 404 Fallback for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found.' });
});

// Fallback for SPA/browser navigation
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'An unexpected error occurred on the server.'
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🐾 Animal Rescue Connect Server is Running!`);
  console.log(`📍 Web Application URL: http://localhost:${PORT}`);
  console.log(`🌐 System Status: Online & Operational`);
  console.log(`====================================================`);
});
