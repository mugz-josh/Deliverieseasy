const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const router = express.Router();
const db = new sqlite3.Database('./deliveries.db');

// Get all users (admin only)
router.get('/', async (req, res) => {
  try {
    const users = await pool.query(`
      SELECT id, name, email, phone, role, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: users.rows
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get user by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;

  db.get(`
    SELECT id, name, email, phone, role, created_at, updated_at
    FROM users
    WHERE id = ?
  `, [id], (err, row) => {
    if (err) {
      console.error('Get user error:', err);
      return res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }

    if (!row) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: row
    });
  });
});

// Get riders (for assignment)
router.get('/riders/active', (req, res) => {
  db.all(`
    SELECT id, name, email, phone
    FROM users
    WHERE role = 'rider'
    ORDER BY name
  `, [], (err, rows) => {
    if (err) {
      console.error('Get riders error:', err);
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

// Update user role (admin only)
router.put('/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['customer', 'rider', 'admin'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    const updatedUser = await pool.query(`
      UPDATE users
      SET role = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, name, email, phone, role, updated_at
    `, [role, id]);

    if (updatedUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User role updated',
      data: updatedUser.rows[0]
    });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete user (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUser = await pool.query(`
      DELETE FROM users
      WHERE id = $1
      RETURNING id, name, email
    `, [id]);

    if (deletedUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully',
      data: deletedUser.rows[0]
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
