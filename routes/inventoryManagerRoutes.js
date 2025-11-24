const express = require('express');
const db = require('../config/database');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Get inventory status
router.get('/inventory', authMiddleware, roleMiddleware('inventory_manager'), async (req, res) => {
  try {
    const [inventory] = await db.query(
      `SELECT * FROM medications ORDER BY name`
    );
    res.json({ success: true, inventory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new medication to inventory
router.post('/inventory/add', authMiddleware, roleMiddleware('inventory_manager'), async (req, res) => {
  try {
    const { name, category, quantity, unitPrice, reorderLevel, expiryDate, supplier } = req.body;

    const [result] = await db.query(
      `INSERT INTO medications (name, category, quantity_in_stock, unit_price, reorder_level, expiry_date, supplier) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, category, quantity, unitPrice, reorderLevel, expiryDate, supplier]
    );

    res.json({ success: true, message: 'Medication added', medicationId: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update medication details
router.put('/inventory/:id', authMiddleware, roleMiddleware('inventory_manager'), async (req, res) => {
  try {
    const { quantity, unitPrice, reorderLevel, expiryDate } = req.body;

    await db.query(
      `UPDATE medications SET quantity_in_stock = ?, unit_price = ?, reorder_level = ?, expiry_date = ? WHERE id = ?`,
      [quantity, unitPrice, reorderLevel, expiryDate, req.params.id]
    );

    res.json({ success: true, message: 'Medication updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get expired medications
router.get('/inventory/expired', authMiddleware, roleMiddleware('inventory_manager'), async (req, res) => {
  try {
    const [expired] = await db.query(
      `SELECT * FROM medications WHERE expiry_date <= CURDATE() ORDER BY expiry_date`
    );
    res.json({ success: true, expired });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get low stock items
router.get('/inventory/low-stock', authMiddleware, roleMiddleware('inventory_manager'), async (req, res) => {
  try {
    const [lowStock] = await db.query(
      `SELECT * FROM medications WHERE quantity_in_stock < reorder_level ORDER BY quantity_in_stock`
    );
    res.json({ success: true, lowStock });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get inventory dashboard stats
router.get('/dashboard/stats', authMiddleware, roleMiddleware('inventory_manager'), async (req, res) => {
  try {
    const [totalItems] = await db.query(`SELECT COUNT(*) as count FROM medications`);
    const [lowStockItems] = await db.query(`SELECT COUNT(*) as count FROM medications WHERE quantity_in_stock < reorder_level`);
    const [expiredItems] = await db.query(`SELECT COUNT(*) as count FROM medications WHERE expiry_date <= CURDATE()`);
    const [totalValue] = await db.query(`SELECT SUM(quantity_in_stock * unit_price) as value FROM medications`);

    res.json({
      success: true,
      stats: {
        totalItems: totalItems[0].count,
        lowStockItems: lowStockItems[0].count,
        expiredItems: expiredItems[0].count,
        totalValue: totalValue[0].value || 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
