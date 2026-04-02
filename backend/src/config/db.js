const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

// Set search_path ke schema inventory
pool.on('connect', (client) => {
  client.query('SET search_path TO inventory')
})

pool.connect()
  .then(() => console.log('PostgreSQL connected'))
  .catch(err => console.error('DB connection error:', err.message))

module.exports = pool