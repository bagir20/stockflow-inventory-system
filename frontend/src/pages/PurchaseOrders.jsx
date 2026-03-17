import { useEffect, useState } from 'react'
import { Plus, Eye, PackageCheck, X, Trash2, ShoppingCart } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import PageTransition from '../components/PageTransition'
import PageLoader from '../components/PageLoader'
import api from '../services/api'
import toast from 'react-hot-toast'
import './PurchaseOrders.css'
import { exportToExcel } from '../utils/exportExcel'
import { exportToPDF }   from '../utils/exportPDF'
import { Download }      from 'lucide-react'
import EmptyState from '../components/EmptyState'
import ilEmptyCart from '../assets/il-empty-cart.svg'

const emptyItem = { product_id: '', quantity: 1, unit_price: 0 }

export default function PurchaseOrders() {
  const [orders,    setOrders]    = useState([])
  const [products,  setProducts]  = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [filter,    setFilter]    = useState('all')

  const [showCreate, setShowCreate] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [detail,     setDetail]     = useState(null)
  const [saving,     setSaving]     = useState(false)

  const [form, setForm] = useState({ supplier_id: '', notes: '' })
  const [items, setItems] = useState([{ ...emptyItem }])

 
  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const [oRes, pRes, sRes] = await Promise.all([
        api.get('/purchase-orders'),
        api.get('/products'),
        api.get('/suppliers'),
      ])
      setOrders(oRes.data)
      setProducts(pRes.data.products)
      setSuppliers(sRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const poColumns = [
  { header: 'PO Number', value: o => o.po_number },
  { header: 'Supplier',  value: o => o.supplier_name },
  { header: 'Items',     value: o => o.total_items },
  { header: 'Total',     value: o => o.total_amount },
  { header: 'Status',    value: o => o.status },
  { header: 'Date',      value: o => new Date(o.created_at).toLocaleDateString('id-ID') },
]

const handleExportExcel = () => {
  exportToExcel(filtered, poColumns, 'StockFlow-PurchaseOrders')
  toast.success('Excel exported!')
}

const handleExportPDF = () => {
  exportToPDF(
    'Purchase Orders Report',
    `${filtered.length} orders`,
    poColumns,
    filtered,
    'StockFlow-PurchaseOrders'
  )
  toast.success('PDF exported!')
}

  const filtered = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter)

  const openDetail = async (id) => {
    try {
      const res = await api.get(`/purchase-orders/${id}`)
      setDetail(res.data)
      setShowDetail(true)
    } catch  {
      toast.error('Failed to load PO detail')
    }
  }

  const handleReceive = async () => {
    try {
      await api.put(`/purchase-orders/${detail.id}/receive`)
      toast.success(`PO ${detail.po_number} received — stock updated!`)
      setShowDetail(false)
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to receive PO')
    }
  }

  const handleCancel = async () => {
    try {
      await api.put(`/purchase-orders/${detail.id}/cancel`)
      toast.success(`PO ${detail.po_number} cancelled`)
      setShowDetail(false)
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel PO')
    }
  }

  const handleAddItem = () => setItems(i => [...i, { ...emptyItem }])

  const handleRemoveItem = (idx) =>
    setItems(i => i.filter((_, index) => index !== idx))

  const handleItemChange = (idx, field, value) => {
    setItems(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }

      // auto-fill harga dari produk
      if (field === 'product_id') {
        const product = products.find(p => String(p.id) === value)
        if (product) next[idx].unit_price = parseFloat(product.purchase_price)
      }
      return next
    })
  }

  const totalAmount = items.reduce((sum, item) =>
    sum + ((parseFloat(item.unit_price) || 0) * (parseInt(item.quantity) || 0)), 0)

  const handleCreate = async () => {
    if (!form.supplier_id) return toast.error('Pilih supplier dulu')
    const validItems = items.filter(i => i.product_id && i.quantity > 0 && i.unit_price >= 0)
    if (validItems.length === 0) return toast.error('Tambah minimal 1 item')

    setSaving(true)
    try {
      await api.post('/purchase-orders', {
        supplier_id: parseInt(form.supplier_id),
        notes: form.notes || null,
        items: validItems.map(i => ({
          product_id: parseInt(i.product_id),
          quantity:   parseInt(i.quantity),
          unit_price: parseFloat(i.unit_price),
        }))
      })
      toast.success('Purchase Order created!')
      setShowCreate(false)
      setForm({ supplier_id: '', notes: '' })
      setItems([{ ...emptyItem }])
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create PO')
    } finally {
      setSaving(false)
    }
  }

  const fmt = (n) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

 if (loading) return (
    <>
      <Sidebar />
      <div className="products-loading">
        <div className="spinner-sm" /> LOADING...
      </div>
    </>
  )

  return (
    <div className="po-page">
      <Sidebar />
      <PageTransition>
        <div className="po-main">
          <div className="po-content">

            {/* Header */}
            <div className="po-header">
            <div>
                <h1 className="po-title">Purchase Orders</h1>
                <p className="po-subtitle">{orders.length} total orders</p>
            </div>
            <div style={{display:'flex', gap:8, alignItems:'center'}}>
                <button className="btn-export" onClick={handleExportExcel}>
                <Download size={14} /> Excel
                </button>
                <button className="btn-export" onClick={handleExportPDF}>
                <Download size={14} /> PDF
                </button>
                <button className="btn-add" onClick={() => setShowCreate(true)}>
                <Plus size={16} strokeWidth={2.5} />
                Create PO
                </button>
            </div>
            </div>

            {/* Filter */}
            <div className="po-toolbar">
              {['all', 'pending', 'received', 'cancelled'].map(s => (
                <button key={s}
                  className={`status-filter-btn ${filter === s ? `active-${s}` : ''}`}
                  onClick={() => setFilter(s)}>
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="po-table-card">

              {/* Desktop */}
              <table className="po-table">
                <thead>
                  <tr>
                    <th>PO Number</th>
                    <th>Supplier</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
               {filtered.length === 0 ? (
  <tr>
    <td colSpan={7}>
      <EmptyState
        image={ilEmptyCart}
        title="No purchase orders yet"
        subtitle="Create your first PO to start ordering from suppliers"
      />
    </td>
  </tr>
) : filtered.map(o => (
                    <tr key={o.id}>
                      <td><span className="po-number">{o.po_number}</span></td>
                      <td className="po-supplier">{o.supplier_name}</td>
                      <td style={{fontFamily:'var(--font-mono)', fontSize:12}}>{o.total_items} items</td>
                      <td className="po-total">{fmt(o.total_amount)}</td>
                      <td><span className={`po-status ${o.status}`}>{o.status}</span></td>
                      <td style={{fontFamily:'var(--font-mono)', fontSize:11}}>{formatDate(o.created_at)}</td>
                      <td>
                        <div className="actions-cell">
                          <button className="btn-icon" onClick={() => openDetail(o.id)} title="Detail">
                            <Eye size={14} />
                          </button>
                          {o.status === 'pending' && (
                            <button className="btn-icon success"
                              onClick={async () => {
                                await openDetail(o.id)
                              }}
                              title="Receive">
                              <PackageCheck size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile */}
              <div className="po-mobile">
             {filtered.length === 0 ? (
  <EmptyState
    image={ilEmptyCart}
    title="No purchase orders yet"
    subtitle="Create your first PO to start ordering from suppliers"
  />
) : filtered.map(o => (
                  <div key={o.id} className="po-card-m" onClick={() => openDetail(o.id)}>
                    <div className="po-card-m-top">
                      <div>
                        <p className="po-number">{o.po_number}</p>
                        <p style={{fontWeight:600, color:'var(--ink)', marginTop:2}}>{o.supplier_name}</p>
                      </div>
                      <span className={`po-status ${o.status}`}>{o.status}</span>
                    </div>
                    <div className="po-card-m-row">
                      <span>Total</span>
                      <span className="po-total">{fmt(o.total_amount)}</span>
                    </div>
                    <div className="po-card-m-row">
                      <span>Date</span>
                      <span>{formatDate(o.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </PageTransition>

      {/* Create PO Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="modal-lg">
            <div className="modal-header">
              <p className="modal-title">Create Purchase Order</p>
              <button className="modal-close" onClick={() => setShowCreate(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">

              <div className="form-group">
                <label className="form-label">Supplier *</label>
                <select className="form-select" value={form.supplier_id}
                  onChange={e => setForm(f => ({...f, supplier_id: e.target.value}))}>
                  <option value="">— Pilih Supplier —</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <input className="form-input" value={form.notes}
                  onChange={e => setForm(f => ({...f, notes: e.target.value}))}
                  placeholder="Catatan tambahan (opsional)" />
              </div>

              {/* Items */}
              <label className="form-label" style={{display:'block', marginBottom:8}}>
                Items *
              </label>
              <div className="po-items-form">
                {items.map((item, idx) => (
                  <div key={idx} className="po-item-row">
                    <select className="form-select" value={item.product_id}
                      onChange={e => handleItemChange(idx, 'product_id', e.target.value)}>
                      <option value="">— Produk —</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input className="form-input" type="number" min="1"
                      placeholder="Qty" value={item.quantity}
                      onChange={e => handleItemChange(idx, 'quantity', e.target.value)} />
                    <input className="form-input" type="number" min="0"
                      placeholder="Harga" value={item.unit_price}
                      onChange={e => handleItemChange(idx, 'unit_price', e.target.value)} />
                    <button className="btn-remove-item" onClick={() => handleRemoveItem(idx)}
                      disabled={items.length === 1}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              <button className="btn-add-item" onClick={handleAddItem}>
                <Plus size={14} /> Tambah Item
              </button>

              <p className="po-subtotal" style={{marginTop:12}}>
                Total: <span>{fmt(totalAmount)}</span>
              </p>

              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowCreate(false)}>Cancel</button>
                <button className="btn-submit" onClick={handleCreate}
                  disabled={saving || !form.supplier_id}>
                  {saving && <div className="spinner-sm" />}
                  Create PO
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && detail && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowDetail(false)}>
          <div className="modal-lg">
            <div className="modal-header">
              <p className="modal-title">{detail.po_number}</p>
              <button className="modal-close" onClick={() => setShowDetail(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">

              <div className="po-detail-info">
                <div className="po-detail-info-item">
                  <span className="po-detail-label">Supplier</span>
                  <span className="po-detail-value">{detail.supplier_name}</span>
                </div>
                <div className="po-detail-info-item">
                  <span className="po-detail-label">Status</span>
                  <span className={`po-status ${detail.status}`}>{detail.status}</span>
                </div>
                <div className="po-detail-info-item">
                  <span className="po-detail-label">Created By</span>
                  <span className="po-detail-value">{detail.created_by}</span>
                </div>
                <div className="po-detail-info-item">
                  <span className="po-detail-label">Date</span>
                  <span className="po-detail-value">{formatDate(detail.created_at)}</span>
                </div>
                {detail.notes && (
                  <div className="po-detail-info-item" style={{gridColumn:'1/-1'}}>
                    <span className="po-detail-label">Notes</span>
                    <span className="po-detail-value">{detail.notes}</span>
                  </div>
                )}
              </div>

              <p className="po-items-title">Items ({detail.items?.length})</p>
              <table className="po-items-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.items?.map(item => (
                    <tr key={item.id}>
                      <td style={{fontWeight:600}}>{item.product_name}</td>
                      <td style={{fontFamily:'var(--font-mono)', fontSize:11, color:'var(--ink-muted)'}}>{item.product_sku}</td>
                      <td style={{fontFamily:'var(--font-mono)'}}>{item.quantity} {item.product_unit}</td>
                      <td style={{fontFamily:'var(--font-mono)'}}>{fmt(item.unit_price)}</td>
                      <td style={{fontFamily:'var(--font-mono)', fontWeight:600}}>{fmt(item.quantity * item.unit_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="po-total-row">
                <span className="po-total-label">Total Amount</span>
                <span className="po-total-value">{fmt(detail.total_amount)}</span>
              </div>

              {detail.status === 'pending' && (
                <div className="po-detail-actions">
                  <button className="btn-receive" onClick={handleReceive}>
                    <PackageCheck size={16} />
                    Receive — Update Stock
                  </button>
                  <button className="btn-cancel-po" onClick={handleCancel}>
                    Cancel PO
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  )
}