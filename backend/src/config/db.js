const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

// test koneksi
pool.connect()
  .then(() => console.log('PostgreSQL connected'))
  .catch(err => console.error('DB connection error:', err.message))

module.exports = pool