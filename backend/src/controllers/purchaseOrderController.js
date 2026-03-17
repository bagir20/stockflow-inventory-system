const pool = require('../config/db')

// GET semua PO
const getPurchaseOrders = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT po.*,
        s.name AS supplier_name,
        u.name AS created_by,
        COUNT(poi.id) AS total_items
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      LEFT JOIN users u ON po.user_id = u.id
      LEFT JOIN purchase_order_items poi ON poi.po_id = po.id
      GROUP BY po.id, s.name, u.name
      ORDER BY po.created_at DESC
    `)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET detail PO + items
const getPurchaseOrderById = async (req, res) => {
  const { id } = req.params
  try {
    const po = await pool.query(`
      SELECT po.*,
        s.name AS supplier_name,
        s.email AS supplier_email,
        s.phone AS supplier_phone,
        u.name AS created_by
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      LEFT JOIN users u ON po.user_id = u.id
      WHERE po.id = $1
    `, [id])

    if (po.rows.length === 0)
      return res.status(404).json({ error: 'PO not found' })

    const items = await pool.query(`
      SELECT poi.*,
        p.name AS product_name,
        p.sku AS product_sku,
        p.unit AS product_unit
      FROM purchase_order_items poi
      LEFT JOIN products p ON poi.product_id = p.id
      WHERE poi.po_id = $1
    `, [id])

    res.json({ ...po.rows[0], items: items.rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// POST buat PO baru
const createPurchaseOrder = async (req, res) => {
  const { supplier_id, notes, items } = req.body

  if (!supplier_id || !items || items.length === 0)
    return res.status(400).json({ error: 'Supplier and items are required' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // generate PO number: PO-20260317-001
    const date = new Date()
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
    const countRes = await client.query(
      "SELECT COUNT(*) FROM purchase_orders WHERE created_at::date = CURRENT_DATE"
    )
    const count = parseInt(countRes.rows[0].count) + 1
    const poNumber = `PO-${dateStr}-${String(count).padStart(3, '0')}`

    // hitung total
    const totalAmount = items.reduce((sum, item) =>
      sum + (item.quantity * item.unit_price), 0)

    // insert PO
    const poRes = await client.query(`
      INSERT INTO purchase_orders (po_number, supplier_id, user_id, status, total_amount, notes)
      VALUES ($1, $2, $3, 'pending', $4, $5)
      RETURNING *
    `, [poNumber, supplier_id, req.user.id, totalAmount, notes || null])

    const poId = poRes.rows[0].id

    // insert items
    for (const item of items) {
      await client.query(`
        INSERT INTO purchase_order_items (po_id, product_id, quantity, unit_price)
        VALUES ($1, $2, $3, $4)
      `, [poId, item.product_id, item.quantity, item.unit_price])
    }

    await client.query('COMMIT')
    res.status(201).json({ message: 'Purchase order created', po: poRes.rows[0] })

  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
}

// PUT receive PO → otomatis stock in
const receivePurchaseOrder = async (req, res) => {
  const { id } = req.params

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // cek PO ada dan masih pending
    const po = await client.query(
      'SELECT * FROM purchase_orders WHERE id = $1', [id]
    )
    if (po.rows.length === 0)
      return res.status(404).json({ error: 'PO not found' })
    if (po.rows[0].status !== 'pending')
      return res.status(400).json({ error: `PO is already ${po.rows[0].status}` })

    // ambil semua items
    const items = await client.query(
      'SELECT * FROM purchase_order_items WHERE po_id = $1', [id]
    )

    // stock in semua items
    for (const item of items.rows) {
      await client.query(
        'UPDATE products SET stock = stock + $1 WHERE id = $2',
        [item.quantity, item.product_id]
      )
      await client.query(`
        INSERT INTO stock_movements (product_id, user_id, type, quantity, note)
        VALUES ($1, $2, 'in', $3, $4)
      `, [item.product_id, req.user.id, item.quantity, `Received from PO ${po.rows[0].po_number}`])
    }

    // update PO status
    const updated = await client.query(
      "UPDATE purchase_orders SET status = 'received' WHERE id = $1 RETURNING *",
      [id]
    )

    await client.query('COMMIT')
    res.json({ message: 'PO received — stock updated', po: updated.rows[0] })

  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
}

// PUT cancel PO
const cancelPurchaseOrder = async (req, res) => {
  const { id } = req.params
  try {
    const result = await pool.query(`
      UPDATE purchase_orders SET status = 'cancelled'
      WHERE id = $1 AND status = 'pending'
      RETURNING *
    `, [id])

    if (result.rows.length === 0)
      return res.status(400).json({ error: 'PO not found or already processed' })

    res.json({ message: 'PO cancelled', po: result.rows[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = {
  getPurchaseOrders, getPurchaseOrderById,
  createPurchaseOrder, receivePurchaseOrder, cancelPurchaseOrder
}