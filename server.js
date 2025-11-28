const express = require('express');
const cors = require('cors');
require('dotenv').config();

console.log('[INIT] Starting server initialization...');

try {
    console.log('[INIT] Loading auth routes...');
    const authRoutes = require('./routes/authRoutes');
    console.log('[INIT] ✓ Auth routes loaded');
    
    console.log('[INIT] Loading hospital routes...');
    const hospitalRoutes = require('./routes/hospitalRoutes');
    console.log('[INIT] ✓ Hospital routes loaded');
    
    console.log('[INIT] Loading comprehensive routes...');
    const comprehensiveRoutes = require('./routes/comprehensiveRoutes');
    console.log('[INIT] ✓ Comprehensive routes loaded');
    
    console.log('[INIT] Loading receptionist routes...');
    const receptionistRoutes = require('./routes/receptionistRoutes');
    console.log('[INIT] ✓ Receptionist routes loaded');
    
    console.log('[INIT] Loading pharmacist routes...');
    const pharmacistRoutes = require('./routes/pharmacistRoutes');
    console.log('[INIT] ✓ Pharmacist routes loaded');
    
    console.log('[INIT] Loading lab technician routes...');
    const labTechnicianRoutes = require('./routes/labTechnicianRoutes');
    console.log('[INIT] ✓ Lab technician routes loaded');
    
    console.log('[INIT] Loading inventory manager routes...');
    const inventoryManagerRoutes = require('./routes/inventoryManagerRoutes');
    console.log('[INIT] ✓ Inventory manager routes loaded');
    
    console.log('[INIT] Loading prescription analyze routes...');
    const prescriptionAnalyzeRoutes = require('./routes/prescriptionAnalyzeRoutes');
    console.log('[INIT] ✓ Prescription analyze routes loaded');

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

    // Prescription Analysis routes
    app.use('/api', prescriptionAnalyzeRoutes);

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

    console.log('[LISTEN] About to call app.listen...');
    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`\n✓ Hospital Management System Backend`);
        console.log(`✓ Server running on http://localhost:${PORT}`);
        console.log(`✓ ZKP Authentication enabled`);
        console.log(`\n[${new Date().toISOString()}] Server started\n`);
    });
    
    console.log('[LISTEN] app.listen() call completed');

    // Handle server errors
    server.on('error', (err) => {
        console.error('❌ Server error:', err);
        process.exit(1);
    });
    
    console.log('[LISTEN] Error handler registered');

} catch (error) {
    console.error('[INIT] ❌ Failed to start server:', error);
    process.exit(1);
}

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
});
