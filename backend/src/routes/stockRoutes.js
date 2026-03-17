const express = require('express')
const router = express.Router()
const {
  stockIn, stockOut, stockAdjustment,
  getStockHistory, getLowStock
} = require('../controllers/stockController')
const { authenticate, authorize } = require('../middleware/authMiddleware')

router.use(authenticate)

router.post('/in',            authorize('admin', 'manager'), stockIn)
router.post('/out',           authorize('admin', 'manager', 'staff'), stockOut)
router.post('/adjustment',    authorize('admin', 'manager'), stockAdjustment)
router.get('/low',            getLowStock)
router.get('/history/:product_id', getStockHistory)

module.exports = router