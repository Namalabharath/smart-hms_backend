const express = require('express');
const db = require('../config/database');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Get medicine stock
router.get('/medicines', authMiddleware, roleMiddleware('pharmacist'), async (req, res) => {
  try {
    const [medicines] = await db.query(
      `SELECT DISTINCT 
        id, name, generic_name, strength, form, manufacturer, 
        stock_quantity, reorder_level, price, expiry_date, 
        created_at, updated_at
       FROM medications 
       ORDER BY name ASC`
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
    const medicineId = parseInt(req.params.id);

    if (!medicineId || isNaN(medicineId)) {
      return res.status(400).json({ error: 'Invalid medicine ID' });
    }

    if (!quantity || isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }

    // Check if medicine exists
    const [medicine] = await db.query('SELECT id, stock_quantity FROM medications WHERE id = ?', [medicineId]);
    if (medicine.length === 0) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    const currentStock = medicine[0].stock_quantity || 0;

    if (action === 'add') {
      await db.query(
        `UPDATE medications SET stock_quantity = stock_quantity + ?, updated_at = NOW() WHERE id = ?`,
        [quantity, medicineId]
      );
    } else if (action === 'remove') {
      if (currentStock < quantity) {
        return res.status(400).json({ error: `Cannot remove ${quantity}. Current stock is only ${currentStock}` });
      }
      await db.query(
        `UPDATE medications SET stock_quantity = stock_quantity - ?, updated_at = NOW() WHERE id = ?`,
        [quantity, medicineId]
      );
    } else {
      return res.status(400).json({ error: 'Invalid action. Use "add" or "remove"' });
    }

    // Get updated medicine
    const [updated] = await db.query('SELECT id, name, stock_quantity FROM medications WHERE id = ?', [medicineId]);
    
    res.json({ 
      success: true, 
      message: `Stock ${action === 'add' ? 'added' : 'removed'} successfully`,
      medicine: updated[0]
    });
  } catch (error) {
    console.error('Stock update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get low stock medicines
router.get('/medicines/low-stock', authMiddleware, roleMiddleware('pharmacist'), async (req, res) => {
  try {
    const [lowStock] = await db.query(
      `SELECT * FROM medications WHERE stock_quantity < reorder_level ORDER BY name`
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
      `SELECT pr.id, pr.prescription_date, pr.instructions, pr.status, pr.dosage, pr.frequency, pr.duration,
              p.id as patient_id, u1.first_name as patient_name, u1.last_name as patient_last_name,
              d.id as doctor_id, u2.first_name as doctor_name, u2.last_name as doctor_last_name,
              m.name as medicine_name
       FROM prescriptions pr
       JOIN patients p ON pr.patient_id = p.id
       JOIN users u1 ON p.user_id = u1.id
       JOIN doctors d ON pr.doctor_id = d.id
       JOIN users u2 ON d.user_id = u2.id
       JOIN medications m ON pr.medication_id = m.id
       ORDER BY pr.created_at DESC, pr.prescription_date DESC`
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
      `UPDATE medications SET stock_quantity = GREATEST(0, stock_quantity - ?) WHERE id = ?`,
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
    const [lowStockCount] = await db.query(`SELECT COUNT(*) as count FROM medications WHERE stock_quantity < reorder_level`);
    const [pendingPrescriptions] = await db.query(`SELECT COUNT(*) as count FROM prescriptions WHERE status != 'dispensed' OR status IS NULL`);

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
