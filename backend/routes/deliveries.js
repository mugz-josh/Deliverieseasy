const express = require('express');
const pool = require('../db');

const router = express.Router();

// Get all deliveries
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*, u.name as customer_name, u.phone as customer_phone
      FROM deliveries d
      LEFT JOIN users u ON d.customer_id = u.id
      ORDER BY d.created_at DESC
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error('Get deliveries error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get delivery by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      SELECT d.*, u.name as customer_name, u.phone as customer_phone,
             r.name as rider_name, r.phone as rider_phone
      FROM deliveries d
      LEFT JOIN users u ON d.customer_id = u.id
      LEFT JOIN users r ON d.rider_id = r.id
      WHERE d.id = $1
    `, [id]);

    const row = result.rows[0];

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
  } catch (err) {
    console.error('Get delivery error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create new delivery
router.post('/', async (req, res) => {
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

  try {
    const result = await pool.query(`
      INSERT INTO deliveries (
        customer_id, pickup_address, delivery_address,
        package_description, package_weight, delivery_fee,
        payment_method, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING *
    `, [customer_id, pickup_address, delivery_address, package_description, package_weight, delivery_fee, payment_method]);

    res.status(201).json({
      success: true,
      message: 'Delivery created successfully',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Create delivery error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
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
router.put('/:id/location', async (req, res) => {
  const { id } = req.params;
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({
      success: false,
      message: 'Latitude and longitude are required'
    });
  }

  try {
    const result = await pool.query(`
      UPDATE deliveries
      SET current_location_lat = $1, current_location_lng = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [latitude, longitude, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    res.json({
      success: true,
      message: 'Location updated',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Update location error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
