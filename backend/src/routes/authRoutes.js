const express = require('express')
const router = express.Router()
const { register, login } = require('../controllers/authController')
const { authenticate, authorize } = require('../middleware/authMiddleware')
const pool = require('../config/db')
const bcrypt = require('bcrypt')

router.post('/register', register)
router.post('/login', login)

// test route — cek token kerja
router.get('/me', authenticate, async (req, res) => {
  res.json({ message: 'Token valid', user: req.user })
})

// GET all users — admin only
router.get('/users', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC'
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT update user
router.put('/users/:id', authenticate, authorize('admin'), async (req, res) => {
  const { id } = req.params
  const { name, role, is_active, password } = req.body
  try {
    let hashedPassword = null
    if (password) hashedPassword = await bcrypt.hash(password, 10)

    const result = await pool.query(`
      UPDATE users SET
        name      = COALESCE($1, name),
        role      = COALESCE($2, role),
        is_active = COALESCE($3, is_active),
        password  = COALESCE($4, password)
      WHERE id = $5
      RETURNING id, name, email, role, is_active, created_at
    `, [name, role, is_active, hashedPassword, id])

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'User not found' })

    res.json({ message: 'User updated', user: result.rows[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE user
router.delete('/users/:id', authenticate, authorize('admin'), async (req, res) => {
  const { id } = req.params
  try {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id', [id]
    )
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'User not found' })
    res.json({ message: 'User deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router