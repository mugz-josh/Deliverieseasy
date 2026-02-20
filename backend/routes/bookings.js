const express = require('express');
const pool = require('../db');

const router = express.Router();

// Create new booking/delivery
router.post('/', async (req, res) => {
  const {
    service,
    customer_name,
    email,
    phone
  } = req.body;

  // Validate required fields
  if (!customer_name || !email) {
    return res.status(400).json({
      success: false,
      error: 'Name and email are required'
    });
  }

  try {
    // First, check if user exists or create a new user
    let userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    let customer_id;

    if (userResult.rows.length > 0) {
      // User exists, use their ID
      customer_id = userResult.rows[0].id;
    } else {
      // Create new user
      const newUserResult = await pool.query(
        'INSERT INTO users (name, email, phone, role) VALUES ($1, $2, $3, $4) RETURNING id',
        [customer_name, email, phone || null, 'customer']
      );
      customer_id = newUserResult.rows[0].id;
    }

    // Create delivery/booking
    const deliveryResult = await pool.query(
      `INSERT INTO deliveries (
        customer_id, 
        pickup_address, 
        delivery_address, 
        package_description, 
        package_weight, 
        delivery_fee,
        payment_method, 
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending') RETURNING *`,
      [
        customer_id,
        'To be arranged', // pickup_address - can be updated later
        'To be arranged', // delivery_address - can be updated later
        service || 'Delivery service', // package_description
        null, // package_weight
        null, // delivery_fee
        'cash' // payment_method
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Booking created successfully!',
      data: deliveryResult.rows[0]
    });

  } catch (err) {
    console.error('Create booking error:', err);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
