const pool = require('../config/db')

const getSuppliers = async (req, res) => {
  const { search } = req.query
  try {
    let query = `
      SELECT s.*, COUNT(p.id) AS total_products
      FROM suppliers s
      LEFT JOIN products p ON p.supplier_id = s.id AND p.is_active = true
      GROUP BY s.id
    `
    const params = []

    if (search) {
      params.push(`%${search}%`)
      query += ` HAVING s.name ILIKE $1 OR s.contact_name ILIKE $1`
    }

    query += ` ORDER BY s.name ASC`

    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const getSupplierById = async (req, res) => {
  const { id } = req.params
  try {
    const result = await pool.query('SELECT * FROM suppliers WHERE id = $1', [id])
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Supplier not found' })

    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const createSupplier = async (req, res) => {
  const { name, contact_name, email, phone, address } = req.body
  if (!name) return res.status(400).json({ error: 'Name is required' })

  try {
    const result = await pool.query(`
      INSERT INTO suppliers (name, contact_name, email, phone, address)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name, contact_name || null, email || null, phone || null, address || null])

    res.status(201).json({ message: 'Supplier created', supplier: result.rows[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const updateSupplier = async (req, res) => {
  const { id } = req.params
  const { name, contact_name, email, phone, address } = req.body

  try {
    const result = await pool.query(`
      UPDATE suppliers SET
        name         = COALESCE($1, name),
        contact_name = COALESCE($2, contact_name),
        email        = COALESCE($3, email),
        phone        = COALESCE($4, phone),
        address      = COALESCE($5, address)
      WHERE id = $6
      RETURNING *
    `, [name, contact_name, email, phone, address, id])

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Supplier not found' })

    res.json({ message: 'Supplier updated', supplier: result.rows[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const deleteSupplier = async (req, res) => {
  const { id } = req.params
  try {
    const inUse = await pool.query(
      'SELECT id FROM products WHERE supplier_id = $1 AND is_active = true LIMIT 1',
      [id]
    )
    if (inUse.rows.length > 0)
      return res.status(400).json({ error: 'Supplier is used by existing products' })

    const result = await pool.query(
      'DELETE FROM suppliers WHERE id = $1 RETURNING id', [id]
    )
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Supplier not found' })

    res.json({ message: 'Supplier deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { getSuppliers, getSupplierById, createSupplier, updateSupplier, deleteSupplier }