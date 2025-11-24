const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const comprehensiveRoutes = require('./routes/comprehensiveRoutes');
const receptionistRoutes = require('./routes/receptionistRoutes');
const pharmacistRoutes = require('./routes/pharmacistRoutes');
const labTechnicianRoutes = require('./routes/labTechnicianRoutes');
const inventoryManagerRoutes = require('./routes/inventoryManagerRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Hospital routes
app.use('/api', hospitalRoutes);

// Comprehensive routes (doctor, patient, nurse, admin specific endpoints)
app.use('/api', comprehensiveRoutes);

// Receptionist routes
app.use('/api/receptionist', receptionistRoutes);

// Pharmacist routes
app.use('/api/pharmacist', pharmacistRoutes);

// Lab Technician routes
app.use('/api/lab-technician', labTechnicianRoutes);

// Inventory Manager routes
app.use('/api/inventory-manager', inventoryManagerRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`\n✓ Hospital Management System Backend`);
    console.log(`✓ Server running on http://localhost:${PORT}`);
    console.log(`✓ ZKP Authentication enabled`);
    console.log(`\n[${new Date().toISOString()}] Server started\n`);
});

module.exports = app;
