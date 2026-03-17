const jwt = require('jsonwebtoken')

// cek token valid
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ error: 'No token provided' })

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded  // { id, role } tersimpan di req.user
    next()
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// cek role (contoh: authorize('admin', 'manager'))
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return res.status(403).json({ error: 'Access denied' })
    next()
  }
}

module.exports = { authenticate, authorize }