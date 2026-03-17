const pool = require('../config/db')

// GET /api/products — list semua produk + search
const getProducts = async (req, res) => {
  const { search, category_id, low_stock } = req.query

  try {
    let query = `
      SELECT p.*, c.name AS category_name, s.name AS supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.is_active = true
    `
    const params = []

    if (search) {
      params.push(`%${search}%`)
      query += ` AND (p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length})`
    }

    if (category_id) {
      params.push(category_id)
      query += ` AND p.category_id = $${params.length}`
    }

    if (low_stock === 'true') {
      query += ` AND p.stock <= p.min_stock`
    }

    query += ` ORDER BY p.created_at DESC`

    const result = await pool.query(query, params)
    res.json({ total: result.rows.length, products: result.rows })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET /api/products/:id — detail produk
const getProductById = async (req, res) => {
  const { id } = req.params
  try {
    const result = await pool.query(`
      SELECT p.*, c.name AS category_name, s.name AS supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = $1 AND p.is_active = true
    `, [id])

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Product not found' })

    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// POST /api/products — tambah produk
const createProduct = async (req, res) => {
 const {
  sku, name, description, category_id, supplier_id,
  unit, purchase_price, selling_price, stock, min_stock,
  image_url, barcode  
} = req.body

  if (!sku || !name)
    return res.status(400).json({ error: 'SKU and name are required' })

  try {
    // cek SKU duplikat
    const exists = await pool.query('SELECT id FROM products WHERE sku = $1', [sku])
    if (exists.rows.length > 0)
      return res.status(409).json({ error: 'SKU already exists' })

   const result = await pool.query(`
  INSERT INTO products
    (sku, name, description, category_id, supplier_id, unit,
     purchase_price, selling_price, stock, min_stock, image_url, barcode)
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
  RETURNING *
`, [
  sku, name, description, category_id || null, supplier_id || null,
  unit || 'pcs', purchase_price || 0, selling_price || 0,
  stock || 0, min_stock || 5, image_url || null, barcode || null
])

    // catat stock awal di stock_movements kalau stock > 0
    if (stock > 0) {
      await pool.query(`
        INSERT INTO stock_movements (product_id, user_id, type, quantity, note)
        VALUES ($1, $2, 'in', $3, 'Initial stock')
      `, [result.rows[0].id, req.user.id, stock])
    }

    res.status(201).json({ message: 'Product created', product: result.rows[0] })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// PUT /api/products/:id — edit produk
const updateProduct = async (req, res) => {
  const { id } = req.params
  const {
  name, description, category_id, supplier_id,
  unit, purchase_price, selling_price, min_stock,
  image_url, barcode 
} = req.body
  // stock sengaja tidak bisa diubah langsung di sini
  // stock hanya berubah lewat stock_movements

  try {
   const result = await pool.query(`
  UPDATE products SET
    name           = COALESCE($1, name),
    description    = COALESCE($2, description),
    category_id    = COALESCE($3, category_id),
    supplier_id    = COALESCE($4, supplier_id),
    unit           = COALESCE($5, unit),
    purchase_price = COALESCE($6, purchase_price),
    selling_price  = COALESCE($7, selling_price),
    min_stock      = COALESCE($8, min_stock),
    image_url      = COALESCE($9, image_url),
    barcode        = COALESCE($10, barcode)
  WHERE id = $11 AND is_active = true
  RETURNING *
`, [name, description, category_id, supplier_id,
    unit, purchase_price, selling_price, min_stock,
    image_url, barcode || null, id])
    
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Product not found' })

    res.json({ message: 'Product updated', product: result.rows[0] })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// DELETE /api/products/:id — soft delete
const deleteProduct = async (req, res) => {
  const { id } = req.params
  try {
    const result = await pool.query(
      'UPDATE products SET is_active = false WHERE id = $1 AND is_active = true RETURNING id',
      [id]
    )

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Product not found' })

    res.json({ message: 'Product deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct }