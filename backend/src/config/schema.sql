-- USERS
CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(100) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  role        VARCHAR(20) DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff')),
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- CATEGORIES
CREATE TABLE categories (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- SUPPLIERS
CREATE TABLE suppliers (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  contact_name VARCHAR(100),
  email        VARCHAR(100),
  phone        VARCHAR(20),
  address      TEXT,
  created_at   TIMESTAMP DEFAULT NOW()
);

-- PRODUCTS
CREATE TABLE products (
  id              SERIAL PRIMARY KEY,
  sku             VARCHAR(50) UNIQUE NOT NULL,
  name            VARCHAR(150) NOT NULL,
  description     TEXT,
  category_id     INT REFERENCES categories(id) ON DELETE SET NULL,
  supplier_id     INT REFERENCES suppliers(id) ON DELETE SET NULL,
  unit            VARCHAR(20) DEFAULT 'pcs',
  purchase_price  NUMERIC(12,2) DEFAULT 0,
  selling_price   NUMERIC(12,2) DEFAULT 0,
  stock           INT DEFAULT 0,
  min_stock       INT DEFAULT 5,
  image_url       TEXT,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- STOCK MOVEMENTS (barang masuk / keluar)
CREATE TABLE stock_movements (
  id          SERIAL PRIMARY KEY,
  product_id  INT REFERENCES products(id) ON DELETE CASCADE,
  user_id     INT REFERENCES users(id) ON DELETE SET NULL,
  type        VARCHAR(10) CHECK (type IN ('in', 'out', 'adjustment')),
  quantity    INT NOT NULL,
  note        TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- PURCHASE ORDERS
CREATE TABLE purchase_orders (
  id           SERIAL PRIMARY KEY,
  po_number    VARCHAR(50) UNIQUE NOT NULL,
  supplier_id  INT REFERENCES suppliers(id) ON DELETE SET NULL,
  user_id      INT REFERENCES users(id) ON DELETE SET NULL,
  status       VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'cancelled')),
  total_amount NUMERIC(12,2) DEFAULT 0,
  notes        TEXT,
  created_at   TIMESTAMP DEFAULT NOW()
);

-- PURCHASE ORDER ITEMS
CREATE TABLE purchase_order_items (
  id          SERIAL PRIMARY KEY,
  po_id       INT REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id  INT REFERENCES products(id) ON DELETE CASCADE,
  quantity    INT NOT NULL,
  unit_price  NUMERIC(12,2) NOT NULL
);