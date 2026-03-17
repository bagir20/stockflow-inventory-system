const pool = require('../config/db')

const getCategories = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, COUNT(p.id) AS total_products
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.is_active = true
      GROUP BY c.id
      ORDER BY c.name ASC
    `)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const createCategory = async (req, res) => {
  const { name, description } = req.body
  if (!name) return res.status(400).json({ error: 'Name is required' })

  try {
    const exists = await pool.query('SELECT id FROM categories WHERE name = $1', [name])
    if (exists.rows.length > 0)
      return res.status(409).json({ error: 'Category already exists' })

    const result = await pool.query(
      'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
      [name, description || null]
    )
    res.status(201).json({ message: 'Category created', category: result.rows[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const updateCategory = async (req, res) => {
  const { id } = req.params
  const { name, description } = req.body

  try {
    const result = await pool.query(`
      UPDATE categories SET
        name        = COALESCE($1, name),
        description = COALESCE($2, description)
      WHERE id = $3
      RETURNING *
    `, [name, description, id])

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Category not found' })

    res.json({ message: 'Category updated', category: result.rows[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const deleteCategory = async (req, res) => {
  const { id } = req.params
  try {
    // cek apakah ada produk yang pakai category ini
    const inUse = await pool.query(
      'SELECT id FROM products WHERE category_id = $1 AND is_active = true LIMIT 1',
      [id]
    )
    if (inUse.rows.length > 0)
      return res.status(400).json({ error: 'Category is used by existing products' })

    const result = await pool.query(
      'DELETE FROM categories WHERE id = $1 RETURNING id', [id]
    )
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Category not found' })

    res.json({ message: 'Category deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { getCategories, createCategory, updateCategory, deleteCategory }