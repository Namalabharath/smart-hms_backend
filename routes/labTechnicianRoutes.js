const express = require('express');
const db = require('../config/database');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/lab-reports/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/jpeg', 'image/png'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// ============ SAMPLE COLLECTION ENDPOINTS ============

// Get all patient samples
router.get('/samples', authMiddleware, roleMiddleware('lab_technician'), async (req, res) => {
  try {
    const [samples] = await db.query(
      `SELECT ps.id, ps.sample_type, ps.collection_date, ps.status, ps.notes,
              p.id as patient_id, u.first_name, u.last_name
       FROM patient_samples ps
       JOIN patients p ON ps.patient_id = p.id
       JOIN users u ON p.user_id = u.id
       ORDER BY ps.collection_date DESC`
    );

    const samplesWithNames = samples.map(s => ({
      ...s,
      patient_name: `${s.first_name} ${s.last_name}`
    }));

    res.json({ success: true, samples: samplesWithNames });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Collect new sample
router.post('/samples/collect', authMiddleware, roleMiddleware('lab_technician'), async (req, res) => {
  try {
    const { patientId, sampleType, collectionDate, notes } = req.body;

    const [result] = await db.query(
      `INSERT INTO patient_samples (patient_id, sample_type, collection_date, status, notes, collected_by_id)
       VALUES (?, ?, ?, 'collected', ?, ?)`,
      [patientId, sampleType, collectionDate, notes, req.user.id]
    );

    res.json({ success: true, message: 'Sample collected successfully', sampleId: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update sample status
router.put('/samples/:id/status', authMiddleware, roleMiddleware('lab_technician'), async (req, res) => {
  try {
    const { status } = req.body;

    await db.query(
      `UPDATE patient_samples SET status = ? WHERE id = ?`,
      [status, req.params.id]
    );

    res.json({ success: true, message: 'Sample status updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ TEST REQUEST ENDPOINTS ============

// Get all test requests
router.get('/test-requests', authMiddleware, roleMiddleware('lab_technician'), async (req, res) => {
  try {
    const [requests] = await db.query(
      `SELECT lr.id, lr.test_type, lr.request_date, lr.status,
              p.id as patient_id, u1.first_name, u1.last_name,
              d.id as doctor_id, u2.first_name as doctor_first_name, u2.last_name as doctor_last_name
       FROM lab_requests lr
       JOIN patients p ON lr.patient_id = p.id
       JOIN users u1 ON p.user_id = u1.id
       JOIN doctors d ON lr.doctor_id = d.id
       JOIN users u2 ON d.user_id = u2.id
       ORDER BY lr.request_date DESC`
    );

    const requestsWithNames = requests.map(r => ({
      ...r,
      patient_name: `${r.first_name} ${r.last_name}`,
      doctor_name: `${r.doctor_first_name} ${r.doctor_last_name}`
    }));

    res.json({ success: true, requests: requestsWithNames });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload test report with details
router.post('/test-requests/upload-report', authMiddleware, roleMiddleware('lab_technician'), upload.single('reportFile'), async (req, res) => {
  try {
    const { testRequestId, testName, result, referenceRange, unit, status, remarks } = req.body;
    const reportFilePath = req.file ? req.file.path : null;

    // Insert test result
    const [resultInsert] = await db.query(
      `INSERT INTO test_results (lab_request_id, test_name, result, reference_range, unit, status, remarks, report_file, uploaded_by_id, uploaded_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [testRequestId, testName, result, referenceRange, unit, status, remarks, reportFilePath, req.user.id]
    );

    // Update lab request status to completed
    await db.query(
      `UPDATE lab_requests SET status = 'completed', completed_date = NOW() WHERE id = ?`,
      [testRequestId]
    );

    res.json({ success: true, message: 'Test report uploaded successfully', resultId: resultInsert.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get patients list (for dropdown)
router.get('/patients', authMiddleware, roleMiddleware('lab_technician'), async (req, res) => {
  try {
    const [patients] = await db.query(
      `SELECT p.id, u.first_name, u.last_name
       FROM patients p
       JOIN users u ON p.user_id = u.id
       ORDER BY u.first_name ASC`
    );

    res.json({ success: true, patients });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ LEGACY ENDPOINTS (for backward compatibility) ============

// Update lab request status
router.put('/requests/:id/status', authMiddleware, roleMiddleware('lab_technician'), async (req, res) => {
  try {
    const { status } = req.body;

    await db.query(
      `UPDATE lab_requests SET status = ? WHERE id = ?`,
      [status, req.params.id]
    );

    res.json({ success: true, message: 'Status updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload lab result (legacy)
router.post('/requests/:id/results', authMiddleware, roleMiddleware('lab_technician'), async (req, res) => {
  try {
    const { testResult, remarks } = req.body;
    const requestId = req.params.id;

    await db.query(
      `UPDATE lab_requests SET status = 'completed', result = ?, remarks = ?, completed_date = NOW() WHERE id = ?`,
      [testResult, remarks, requestId]
    );

    res.json({ success: true, message: 'Results uploaded' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard stats
router.get('/dashboard/stats', authMiddleware, roleMiddleware('lab_technician'), async (req, res) => {
  try {
    const [pendingTests] = await db.query(`SELECT COUNT(*) as count FROM lab_requests WHERE status = 'pending'`);
    const [completedTests] = await db.query(`SELECT COUNT(*) as count FROM lab_requests WHERE status = 'completed'`);

    res.json({
      success: true,
      stats: {
        pendingTests: pendingTests[0].count,
        completedTests: completedTests[0].count
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
