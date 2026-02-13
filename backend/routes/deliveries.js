const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const router = express.Router();
const db = new sqlite3.Database('./deliveries.db');

// Get all deliveries
router.get('/', (req, res) => {
  db.all(`
    SELECT d.*, u.name as customer_name, u.phone as customer_phone
    FROM deliveries d
    LEFT JOIN users u ON d.customer_id = u.id
    ORDER BY d.created_at DESC
  `, [], (err, rows) => {
    if (err) {
      console.error('Get deliveries error:', err);
      return res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }

    res.json({
      success: true,
      data: rows
    });
  });
});

// Get delivery by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;

  db.get(`
    SELECT d.*, u.name as customer_name, u.phone as customer_phone,
           r.name as rider_name, r.phone as rider_phone
    FROM deliveries d
    LEFT JOIN users u ON d.customer_id = u.id
    LEFT JOIN users r ON d.rider_id = r.id
    WHERE d.id = ?
  `, [id], (err, row) => {
    if (err) {
      console.error('Get delivery error:', err);
      return res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }

    if (!row) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    res.json({
      success: true,
      data: row
    });
  });
});

// Create new delivery
router.post('/', (req, res) => {
  const {
    customer_id,
    pickup_address,
    delivery_address,
    package_description,
    package_weight,
    delivery_fee,
    payment_method = 'cash'
  } = req.body;

  // Validate required fields
  if (!customer_id || !pickup_address || !delivery_address || !package_description) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    });
  }

  const sql = `
    INSERT INTO deliveries (
      customer_id, pickup_address, delivery_address,
      package_description, package_weight, delivery_fee,
      payment_method, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
  `;

  const params = [
    customer_id, pickup_address, delivery_address,
    package_description, package_weight || null, delivery_fee || null,
    payment_method
  ];

  db.run(sql, params, function(err) {
    if (err) {
      console.error('Create delivery error:', err);
      return res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }

    // Get the created delivery
    db.get('SELECT * FROM deliveries WHERE id = ?', [this.lastID], (err, row) => {
      if (err) {
        console.error('Get created delivery error:', err);
        return res.status(500).json({
          success: false,
          message: 'Server error'
        });
      }

      res.status(201).json({
        success: true,
        message: 'Delivery created successfully',
        data: row
      });
    });
  });
});

// Update delivery status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rider_id } = req.body;

    const validStatuses = ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    let query, params;

    if (rider_id) {
      query = 'UPDATE deliveries SET status = $1, rider_id = $2, updated_at = NOW() WHERE id = $3 RETURNING *';
      params = [status, rider_id, id];
    } else {
      query = 'UPDATE deliveries SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *';
      params = [status, id];
    }

    const updatedDelivery = await pool.query(query, params);

    if (updatedDelivery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    res.json({
      success: true,
      message: 'Delivery status updated',
      data: updatedDelivery.rows[0]
    });

  } catch (error) {
    console.error('Update delivery status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update delivery location (for tracking)
router.put('/:id/location', (req, res) => {
  const { id } = req.params;
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({
      success: false,
      message: 'Latitude and longitude are required'
    });
  }

  const sql = `
    UPDATE deliveries
    SET current_location_lat = ?, current_location_lng = ?, updated_at = datetime("now")
    WHERE id = ?
  `;

  db.run(sql, [latitude, longitude, id], function(err) {
    if (err) {
      console.error('Update location error:', err);
      return res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    // Get the updated delivery
    db.get('SELECT * FROM deliveries WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Get updated delivery error:', err);
        return res.status(500).json({
          success: false,
          message: 'Server error'
        });
      }

      res.json({
        success: true,
        message: 'Location updated',
        data: row
      });
    });
  });
});

module.exports = router;
