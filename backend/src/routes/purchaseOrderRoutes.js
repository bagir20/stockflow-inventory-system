const express = require('express')
const router = express.Router()
const {
  getPurchaseOrders, getPurchaseOrderById,
  createPurchaseOrder, receivePurchaseOrder, cancelPurchaseOrder
} = require('../controllers/purchaseOrderController')
const { authenticate, authorize } = require('../middleware/authMiddleware')

router.use(authenticate)

router.get('/',        getPurchaseOrders)
router.get('/:id',     getPurchaseOrderById)
router.post('/',       authorize('admin', 'manager'), createPurchaseOrder)
router.put('/:id/receive', authorize('admin', 'manager'), receivePurchaseOrder)
router.put('/:id/cancel',  authorize('admin', 'manager'), cancelPurchaseOrder)

module.exports = router