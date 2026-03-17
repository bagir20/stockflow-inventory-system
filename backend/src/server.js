require('dotenv').config()
const express = require('express')
const cors = require('cors')
const pool = require('./config/db')

const authRoutes = require('./routes/authRoutes')
const productRoutes = require('./routes/productRoutes')
const categoryRoutes = require('./routes/categoryRoutes')
const supplierRoutes = require('./routes/supplierRoutes')
const stockRoutes = require('./routes/stockRoutes')
const purchaseOrderRoutes = require('./routes/purchaseOrderRoutes')

const app = express()

app.use(cors({
  origin: '*',
  credentials: true
}))

app.use(express.json())

// log request (optional)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`)
  next()
})

app.get('/', (req, res) => res.send('StockFlow API running...'))

app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as time')
    res.json({ status: 'ok', time: result.rows[0].time })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// routes
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/suppliers', supplierRoutes)
app.use('/api/stock', stockRoutes)
app.use('/api/purchase-orders', purchaseOrderRoutes)

// error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))