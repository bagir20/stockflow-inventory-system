const pool = require('../config/db')

// POST /api/stock/in — barang masuk
const stockIn = async (req, res) => {
  const { product_id, quantity, note } = req.body

  if (!product_id || !quantity)
    return res.status(400).json({ error: 'product_id and quantity are required' })

  if (quantity <= 0)
    return res.status(400).json({ error: 'Quantity must be greater than 0' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // cek produk ada
    const product = await client.query(
      'SELECT id, name, stock FROM products WHERE id = $1 AND is_active = true',
      [product_id]
    )
    if (product.rows.length === 0)
      return res.status(404).json({ error: 'Product not found' })

    // update stock
    const updated = await client.query(
      'UPDATE products SET stock = stock + $1 WHERE id = $2 RETURNING id, name, stock',
      [quantity, product_id]
    )

    // catat movement
    await client.query(
      `INSERT INTO stock_movements (product_id, user_id, type, quantity, note)
       VALUES ($1, $2, 'in', $3, $4)`,
      [product_id, req.user.id, quantity, note || null]
    )

    await client.query('COMMIT')

    res.status(201).json({
      message: 'Stock in recorded',
      product: updated.rows[0]
    })

  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
}

// POST /api/stock/out — barang keluar
const stockOut = async (req, res) => {
  const { product_id, quantity, note } = req.body

  if (!product_id || !quantity)
    return res.status(400).json({ error: 'product_id and quantity are required' })

  if (quantity <= 0)
    return res.status(400).json({ error: 'Quantity must be greater than 0' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const product = await client.query(
      'SELECT id, name, stock FROM products WHERE id = $1 AND is_active = true',
      [product_id]
    )
    if (product.rows.length === 0)
      return res.status(404).json({ error: 'Product not found' })

    // cek stok cukup
    if (product.rows[0].stock < quantity)
      return res.status(400).json({
        error: `Insufficient stock. Available: ${product.rows[0].stock}`
      })

    const updated = await client.query(
      'UPDATE products SET stock = stock - $1 WHERE id = $2 RETURNING id, name, stock',
      [quantity, product_id]
    )

    await client.query(
      `INSERT INTO stock_movements (product_id, user_id, type, quantity, note)
       VALUES ($1, $2, 'out', $3, $4)`,
      [product_id, req.user.id, quantity, note || null]
    )

    await client.query('COMMIT')

    res.status(201).json({
      message: 'Stock out recorded',
      product: updated.rows[0]
    })

  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
}

// POST /api/stock/adjustment — koreksi stok
const stockAdjustment = async (req, res) => {
  const { product_id, new_stock, note } = req.body

  if (!product_id || new_stock === undefined)
    return res.status(400).json({ error: 'product_id and new_stock are required' })

  if (new_stock < 0)
    return res.status(400).json({ error: 'Stock cannot be negative' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const product = await client.query(
      'SELECT id, name, stock FROM products WHERE id = $1 AND is_active = true',
      [product_id]
    )
    if (product.rows.length === 0)
      return res.status(404).json({ error: 'Product not found' })

    const oldStock = product.rows[0].stock
    const diff = new_stock - oldStock  // bisa positif atau negatif

    const updated = await client.query(
      'UPDATE products SET stock = $1 WHERE id = $2 RETURNING id, name, stock',
      [new_stock, product_id]
    )

    await client.query(
      `INSERT INTO stock_movements (product_id, user_id, type, quantity, note)
       VALUES ($1, $2, 'adjustment', $3, $4)`,
      [product_id, req.user.id, diff, note || `Adjustment from ${oldStock} to ${new_stock}`]
    )

    await client.query('COMMIT')

    res.status(201).json({
      message: 'Stock adjusted',
      old_stock: oldStock,
      new_stock: updated.rows[0].stock,
      difference: diff
    })

  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
}

// GET /api/stock/history/:product_id — riwayat stok
const getStockHistory = async (req, res) => {
  const { product_id } = req.params
  const { limit = 20, offset = 0 } = req.query

  try {
    // cek produk ada
    const product = await pool.query(
      'SELECT id, name, stock FROM products WHERE id = $1',
      [product_id]
    )
    if (product.rows.length === 0)
      return res.status(404).json({ error: 'Product not found' })

    const result = await pool.query(`
      SELECT
        sm.*,
        u.name AS user_name
      FROM stock_movements sm
      LEFT JOIN users u ON sm.user_id = u.id
      WHERE sm.product_id = $1
      ORDER BY sm.created_at DESC
      LIMIT $2 OFFSET $3
    `, [product_id, limit, offset])

    const total = await pool.query(
      'SELECT COUNT(*) FROM stock_movements WHERE product_id = $1',
      [product_id]
    )

    res.json({
      product: product.rows[0],
      total: parseInt(total.rows[0].count),
      history: result.rows
    })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET /api/stock/low — produk dengan stok menipis
const getLowStock = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, c.name AS category_name, s.name AS supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.stock <= p.min_stock AND p.is_active = true
      ORDER BY p.stock ASC
    `)
    res.json({ total: result.rows.length, products: result.rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { stockIn, stockOut, stockAdjustment, getStockHistory, getLowStock }