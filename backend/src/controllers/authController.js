const pool = require('../config/db')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

// REGISTER
const register = async (req, res) => {
  const { name, email, password, role } = req.body

  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email, and password are required' })

  try {
    // cek email sudah ada belum
    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email])
    if (exists.rows.length > 0)
      return res.status(409).json({ error: 'Email already registered' })

    const hashedPassword = await bcrypt.hash(password, 10)

    const result = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name, email, hashedPassword, role || 'staff']
    )

    res.status(201).json({ message: 'User registered', user: result.rows[0] })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// LOGIN
const login = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' })

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    const user = result.rows[0]

    if (!user)
      return res.status(401).json({ error: 'Invalid credentials' })

    if (!user.is_active)
      return res.status(403).json({ error: 'Account is deactivated' })

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch)
      return res.status(401).json({ error: 'Invalid credentials' })

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { register, login }