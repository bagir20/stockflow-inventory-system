const express = require('express')
const router = express.Router()
const {
  getProducts, getProductById,
  createProduct, updateProduct, deleteProduct
} = require('../controllers/productController')
const { authenticate, authorize } = require('../middleware/authMiddleware')

// semua route wajib login
router.use(authenticate)

router.get('/',     getProducts)
router.get('/:id',  getProductById)
router.post('/',    authorize('admin', 'manager'), createProduct)
router.put('/:id',  authorize('admin', 'manager'), updateProduct)
router.delete('/:id', authorize('admin'),          deleteProduct)


// GET /api/products/scan/:code — cari by SKU atau barcode
router.get('/scan/:code', authenticate, async (req, res) => {
  const { code } = req.params
  try {
    const result = await pool.query(`
      SELECT p.*, c.name AS category_name, s.name AS supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE (p.sku = $1 OR p.barcode = $1) AND p.is_active = true
    `, [code])

    if (result.rows.length === 0)
      return res.status(404).json({ found: false, code })

    res.json({ found: true, product: result.rows[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router