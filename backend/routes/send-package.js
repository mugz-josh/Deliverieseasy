const express = require('express');
const pool = require('../db');
const { sendBookingConfirmationEmail } = require('../emailService');

const router = express.Router();

// Create new package delivery booking
router.post('/', async (req, res) => {
  const {
    sender,
    receiver,
    email,
    pickupAddress,
    deliveryAddress,
    weight
  } = req.body;

  // Validate required fields
  if (!email || !sender) {
    return res.status(400).json({
      success: false,
      error: 'Email and sender name are required'
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
        [sender, email, '', 'customer']
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
        pickupAddress || 'To be arranged',
        deliveryAddress || 'To be arranged',
        weight ? `Package (${weight}kg)` : 'Package delivery',
        weight || null,
        null,
        'cash'
      ]
    );

    const bookingId = deliveryResult.rows[0].id;

    // Send confirmation email
    console.log('📧 Sending confirmation email...');
    const emailResult = await sendBookingConfirmationEmail(email, sender, 'Package Delivery', bookingId);
    
    if (emailResult.success) {
      console.log('✅ Confirmation email sent to:', email);
    } else {
      console.log('⚠️ Email could not be sent:', emailResult.error);
    }

    res.status(201).json({
      success: true,
      message: 'Package sent successfully! Confirmation email sent.',
      data: deliveryResult.rows[0]
    });

  } catch (err) {
    console.error('Create package error:', err);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
