const express = require('express')
const router = express.Router()
const { getSuppliers, getSupplierById, createSupplier, updateSupplier, deleteSupplier } = require('../controllers/supplierController')
const { authenticate, authorize } = require('../middleware/authMiddleware')

router.use(authenticate)

router.get('/',     getSuppliers)
router.get('/:id',  getSupplierById)
router.post('/',    authorize('admin', 'manager'), createSupplier)
router.put('/:id',  authorize('admin', 'manager'), updateSupplier)
router.delete('/:id', authorize('admin'),          deleteSupplier)

module.exports = router