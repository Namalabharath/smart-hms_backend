const express = require('express');
const db = require('../config/database');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Get medicine stock
router.get('/medicines', authMiddleware, roleMiddleware('pharmacist'), async (req, res) => {
  try {
    const [medicines] = await db.query(
      `SELECT * FROM medications ORDER BY name`
    );
    res.json({ success: true, medicines });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update medicine stock
router.post('/medicines/:id/stock', authMiddleware, roleMiddleware('pharmacist'), async (req, res) => {
  try {
    const { quantity, action } = req.body; // action: 'add' or 'remove'
    const medicineId = req.params.id;

    if (action === 'add') {
      await db.query(`UPDATE medications SET quantity_in_stock = quantity_in_stock + ? WHERE id = ?`, [quantity, medicineId]);
    } else if (action === 'remove') {
      await db.query(`UPDATE medications SET quantity_in_stock = quantity_in_stock - ? WHERE id = ?`, [quantity, medicineId]);
    }

    res.json({ success: true, message: 'Stock updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get low stock medicines
router.get('/medicines/low-stock', authMiddleware, roleMiddleware('pharmacist'), async (req, res) => {
  try {
    const [lowStock] = await db.query(
      `SELECT * FROM medications WHERE quantity_in_stock < reorder_level ORDER BY name`
    );
    res.json({ success: true, lowStock });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get prescriptions for pharmacy
router.get('/prescriptions', authMiddleware, roleMiddleware('pharmacist'), async (req, res) => {
  try {
    const [prescriptions] = await db.query(
      `SELECT pr.id, pr.prescription_date, pr.instructions, 
              p.id as patient_id, u1.first_name as patient_name, u1.last_name as patient_last_name,
              d.id as doctor_id, u2.first_name as doctor_name, u2.last_name as doctor_last_name,
              m.name as medicine_name, pr.dosage, pr.duration
       FROM prescriptions pr
       JOIN patients p ON pr.patient_id = p.id
       JOIN users u1 ON p.user_id = u1.id
       JOIN doctors d ON pr.doctor_id = d.id
       JOIN users u2 ON d.user_id = u2.id
       JOIN medications m ON pr.medication_id = m.id
       ORDER BY pr.prescription_date DESC`
    );
    res.json({ success: true, prescriptions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dispense medicine (process prescription)
router.post('/prescriptions/:id/dispense', authMiddleware, roleMiddleware('pharmacist'), async (req, res) => {
  try {
    const { quantity } = req.body;
    const prescriptionId = req.params.id;

    // Get medicine info
    const [presc] = await db.query(`SELECT medication_id FROM prescriptions WHERE id = ?`, [prescriptionId]);
    
    if (!presc.length) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    const medicineId = presc[0].medication_id;

    // Update medication stock
    await db.query(
      `UPDATE medications SET quantity_in_stock = quantity_in_stock - ? WHERE id = ?`,
      [quantity, medicineId]
    );

    // Mark prescription as dispensed
    await db.query(
      `UPDATE prescriptions SET status = 'dispensed', dispensed_date = NOW() WHERE id = ?`,
      [prescriptionId]
    );

    res.json({ success: true, message: 'Medicine dispensed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pharmacy dashboard stats
router.get('/dashboard/stats', authMiddleware, roleMiddleware('pharmacist'), async (req, res) => {
  try {
    const [totalMedicines] = await db.query(`SELECT COUNT(*) as count FROM medications`);
    const [lowStockCount] = await db.query(`SELECT COUNT(*) as count FROM medications WHERE quantity_in_stock < reorder_level`);
    const [pendingPrescriptions] = await db.query(`SELECT COUNT(*) as count FROM prescriptions WHERE status != 'dispensed'`);

    res.json({
      success: true,
      stats: {
        totalMedicines: totalMedicines[0].count,
        lowStock: lowStockCount[0].count,
        pendingPrescriptions: pendingPrescriptions[0].count
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
