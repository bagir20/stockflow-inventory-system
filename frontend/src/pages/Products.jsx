import { useEffect, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Package, X, QrCode } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import QRModal from '../components/QRModal'
import api from '../services/api'
import './Products.css'
import PageTransition from '../components/PageTransition'
     import toast from 'react-hot-toast'
import { exportToExcel } from '../utils/exportExcel'
import { exportToPDF }   from '../utils/exportPDF'
import { Download }      from 'lucide-react'

const emptyForm = {
  sku: '', name: '', description: '',
  category_id: '', supplier_id: '',
  unit: 'pcs', purchase_price: '', selling_price: '',
  stock: '', min_stock: '5', barcode: '',
}

export default function Products() {
  const [products,     setProducts]     = useState([])
  const [categories,   setCategories]   = useState([])
  const [suppliers,    setSuppliers]    = useState([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [filterCat,    setFilterCat]    = useState('')
  const [qrProduct,    setQrProduct]    = useState(null)
  const [showModal,    setShowModal]    = useState(false)
  const [showDelete,   setShowDelete]   = useState(false)
  const [editTarget,   setEditTarget]   = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form,         setForm]         = useState(emptyForm)
  const [saving,       setSaving]       = useState(false)


  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const [pRes, cRes, sRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories'),
        api.get('/suppliers'),
      ])
      setProducts(pRes.data.products)
      setCategories(cRes.data)
      setSuppliers(sRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchProducts = async () => {
      const params = new URLSearchParams()
      if (search)    params.append('search', search)
      if (filterCat) params.append('category_id', filterCat)
      const res = await api.get(`/products?${params}`)
      setProducts(res.data.products)
    }
    const t = setTimeout(fetchProducts, 300)
    return () => clearTimeout(t)
  }, [search, filterCat])

  const openAdd = () => {
    setEditTarget(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (p) => {
    setEditTarget(p)
    setForm({
      sku:            p.sku,
      name:           p.name,
      description:    p.description || '',
      category_id:    p.category_id || '',
      supplier_id:    p.supplier_id || '',
      unit:           p.unit,
      purchase_price: p.purchase_price,
      selling_price:  p.selling_price,
      stock:          p.stock,
      min_stock:      p.min_stock,
      barcode:        p.barcode || '',
    })
    setShowModal(true)
  }

  const productColumns = [
  { header: 'SKU',            value: p => p.sku },
  { header: 'Name',           value: p => p.name },
  { header: 'Category',       value: p => p.category_name || '—' },
  { header: 'Supplier',       value: p => p.supplier_name || '—' },
  { header: 'Unit',           value: p => p.unit },
  { header: 'Stock',          value: p => p.stock },
  { header: 'Min Stock',      value: p => p.min_stock },
  { header: 'Purchase Price', value: p => p.purchase_price },
  { header: 'Selling Price',  value: p => p.selling_price },
  { header: 'Barcode',        value: p => p.barcode || '—' },
]

const handleExportExcel = () => {
  exportToExcel(products, productColumns, 'StockFlow-Products')
  toast.success('Excel exported!')
}

const handleExportPDF = () => {
  exportToPDF(
    'Products Report',
    `${products.length} products total`,
    productColumns,
    products,
    'StockFlow-Products'
  )
  toast.success('PDF exported!')
}
  const openDelete = (p) => {
    setDeleteTarget(p)
    setShowDelete(true)
  }

  const handleSave = async () => {
  setSaving(true)
  try {
    if (editTarget) {
      await api.put(`/products/${editTarget.id}`, {
        ...form,
        barcode: form.barcode || null,
      })
      toast.success('Product updated!')
    } else {
      await api.post('/products', {
        ...form,
        stock:          parseInt(form.stock) || 0,
        min_stock:      parseInt(form.min_stock) || 5,
        purchase_price: parseFloat(form.purchase_price) || 0,
        selling_price:  parseFloat(form.selling_price) || 0,
        category_id:    form.category_id || null,
        supplier_id:    form.supplier_id || null,
        barcode:        form.barcode || null,
      })
      toast.success('Product created!')
    }
    setShowModal(false)
    fetchAll()
  } catch (err) {
    toast.error(err.response?.data?.error || 'Failed to save')
  } finally {
    setSaving(false)
  }
}

const handleDelete = async () => {
  try {
    await api.delete(`/products/${deleteTarget.id}`)
    setShowDelete(false)
    toast.success('Product deleted!')
    fetchAll()
  } catch (err) {
    toast.error(err.response?.data?.error || 'Failed to delete')
  }
}

  const fmt = (n) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

  if (loading) return (
    <>
      <Sidebar />
      <div className="products-loading">
        <div className="spinner-sm" /> LOADING...
      </div>
    </>
  )

  return (
    <div className="products-page">
      <Sidebar />
<PageTransition>
      <div className="products-main">
        <div className="products-content">

          {/* Header */}
          <div className="products-header">
            <div>
              <h1 className="products-title">Products</h1>
              <p className="products-subtitle">{products.length} products total</p>
            </div>
          <div style={{display:'flex', gap:8, alignItems:'center'}}>
  <button className="btn-export" onClick={handleExportExcel}>
    <Download size={14} /> Excel
  </button>
  <button className="btn-export" onClick={handleExportPDF}>
    <Download size={14} /> PDF
  </button>
  <button className="btn-add" onClick={openAdd}>
    <Plus size={16} strokeWidth={2.5} />
    Add Product
  </button>
</div>
          </div>

          {/* Toolbar */}
          <div className="products-toolbar">
            <div className="search-wrapper">
              <Search size={15} />
              <input
                className="search-input"
                placeholder="Search by name or SKU..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select className="filter-select" value={filterCat}
              onChange={e => setFilterCat(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Table */}
          <div className="table-card">

            {/* Desktop */}
            <table className="products-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Purchase Price</th>
                  <th>Selling Price</th>
                  <th>Supplier</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="table-empty">
                        <Package size={40} />
                        <p>No products found</p>
                      </div>
                    </td>
                  </tr>
                ) : products.map(p => (
                  <tr key={p.id}>
                    <td>
                      <p className="td-product-name">{p.name}</p>
                      <p className="td-sku">{p.sku}</p>
                      {p.barcode && <p className="td-sku">{p.barcode}</p>}
                    </td>
                    <td>
                      {p.category_name
                        ? <span className="category-chip">{p.category_name}</span>
                        : <span style={{color:'var(--ink-muted)'}}>—</span>}
                    </td>
                    <td>
                      <div className="stock-cell">
                        <span className={`stock-number ${p.stock <= p.min_stock ? 'low' : 'ok'}`}>
                          {p.stock}
                        </span>
                        {p.stock <= p.min_stock && <span className="low-badge">Low</span>}
                      </div>
                    </td>
                    <td className="td-price">{fmt(p.purchase_price)}</td>
                    <td className="td-price">{fmt(p.selling_price)}</td>
                    <td>{p.supplier_name || '—'}</td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn-icon" onClick={() => openEdit(p)} title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button className="btn-icon" onClick={() => setQrProduct(p)} title="QR Code">
                          <QrCode size={14} />
                        </button>
                        <button className="btn-icon danger" onClick={() => openDelete(p)} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile */}
            <div className="products-mobile">
              {products.length === 0 ? (
                <div className="table-empty">
                  <Package size={40} />
                  <p>No products found</p>
                </div>
              ) : products.map(p => (
                <div key={p.id} className="product-card-m">
                  <div className="product-card-m-top">
                    <div>
                      <p className="product-card-m-name">{p.name}</p>
                      <p className="product-card-m-sku">{p.sku}</p>
                    </div>
                    <div className="actions-cell">
                      <button className="btn-icon" onClick={() => openEdit(p)}><Pencil size={14} /></button>
                      <button className="btn-icon" onClick={() => setQrProduct(p)}><QrCode size={14} /></button>
                      <button className="btn-icon danger" onClick={() => openDelete(p)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="product-card-m-row">
                    <span>Stock</span>
                    <span className={`stock-number ${p.stock <= p.min_stock ? 'low' : 'ok'}`}>
                      {p.stock} {p.stock <= p.min_stock && '⚠️'}
                    </span>
                  </div>
                  <div className="product-card-m-row">
                    <span>Selling Price</span>
                    <span className="td-price">{fmt(p.selling_price)}</span>
                  </div>
                  <div className="product-card-m-row">
                    <span>Category</span>
                    <span>{p.category_name || '—'}</span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <p className="modal-title">{editTarget ? 'Edit Product' : 'Add Product'}</p>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">SKU *</label>
                  <input className="form-input" value={form.sku}
                    onChange={e => setForm(f => ({...f, sku: e.target.value}))}
                    disabled={!!editTarget} placeholder="PRD-001" />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <select className="form-select" value={form.unit}
                    onChange={e => setForm(f => ({...f, unit: e.target.value}))}>
                    <option>pcs</option>
                    <option>unit</option>
                    <option>box</option>
                    <option>kg</option>
                    <option>liter</option>
                  </select>
                </div>
                <div className="form-group full">
                  <label className="form-label">Product Name *</label>
                  <input className="form-input" value={form.name}
                    onChange={e => setForm(f => ({...f, name: e.target.value}))}
                    placeholder="Product name" />
                </div>
                <div className="form-group full">
                  <label className="form-label">Description</label>
                  <input className="form-input" value={form.description}
                    onChange={e => setForm(f => ({...f, description: e.target.value}))}
                    placeholder="Optional description" />
                </div>
                <div className="form-group full">
                  <label className="form-label">Barcode</label>
                  <input className="form-input" value={form.barcode}
                    onChange={e => setForm(f => ({...f, barcode: e.target.value}))}
                    placeholder="Scan atau ketik barcode pabrik (opsional)" />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={form.category_id}
                    onChange={e => setForm(f => ({...f, category_id: e.target.value}))}>
                    <option value="">— None —</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Supplier</label>
                  <select className="form-select" value={form.supplier_id}
                    onChange={e => setForm(f => ({...f, supplier_id: e.target.value}))}>
                    <option value="">— None —</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Purchase Price</label>
                  <input className="form-input" type="number" value={form.purchase_price}
                    onChange={e => setForm(f => ({...f, purchase_price: e.target.value}))}
                    placeholder="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Selling Price</label>
                  <input className="form-input" type="number" value={form.selling_price}
                    onChange={e => setForm(f => ({...f, selling_price: e.target.value}))}
                    placeholder="0" />
                </div>
                {!editTarget && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Initial Stock</label>
                      <input className="form-input" type="number" value={form.stock}
                        onChange={e => setForm(f => ({...f, stock: e.target.value}))}
                        placeholder="0" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Min Stock</label>
                      <input className="form-input" type="number" value={form.min_stock}
                        onChange={e => setForm(f => ({...f, min_stock: e.target.value}))}
                        placeholder="5" />
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn-submit" onClick={handleSave}
                  disabled={saving || !form.sku || !form.name}>
                  {saving && <div className="spinner-sm" />}
                  {editTarget ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDelete && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowDelete(false)}>
          <div className="delete-modal">
            <div className="delete-icon"><Trash2 size={22} /></div>
            <p className="delete-title">Delete Product?</p>
            <p className="delete-desc">
              <strong>{deleteTarget?.name}</strong> akan dihapus dari sistem. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="delete-actions">
              <button className="btn-cancel" onClick={() => setShowDelete(false)}>Cancel</button>
              <button className="btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {qrProduct && (
        <QRModal product={qrProduct} onClose={() => setQrProduct(null)} />
      )}
</PageTransition>
    </div>
  )
}