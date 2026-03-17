import { useEffect, useState } from 'react'
import { QrCode, ArrowDownCircle, ArrowUpCircle, SlidersHorizontal } from 'lucide-react'
import QRScanner from '../components/QRScanner'
import Sidebar from '../components/Sidebar'
import api from '../services/api'
import './Stock.css'
import PageTransition from '../components/PageTransition'
import toast from 'react-hot-toast'
import { exportToExcel } from '../utils/exportExcel'
import { exportToPDF }   from '../utils/exportPDF'
import { Download }      from 'lucide-react'

const initForm = { product_id: '', quantity: '', note: '' }

export default function Stock() {
  const [products,   setProducts]   = useState([])
  const [history,    setHistory]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')

  const [formIn,  setFormIn]  = useState(initForm)
  const [formOut, setFormOut] = useState(initForm)
  const [formAdj, setFormAdj] = useState({ product_id: '', new_stock: '', note: '' })

  const [savingIn,  setSavingIn]  = useState(false)
  const [savingOut, setSavingOut] = useState(false)
  const [savingAdj, setSavingAdj] = useState(false)

  const [showScanner, setShowScanner] = useState(false)
  const [scanTarget,  setScanTarget]  = useState(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const [pRes] = await Promise.all([api.get('/products')])
      setProducts(pRes.data.products)
      await fetchHistory(pRes.data.products)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async (prods) => {
    try {
      const list = prods || products
      if (list.length === 0) return setHistory([])

      const results = await Promise.all(
        list.map(p => api.get(`/stock/history/${p.id}`).catch(() => null))
      )

      const all = results
        .filter(Boolean)
        .flatMap(r => r.data.history.map(h => ({
          ...h,
          product_name: list.find(p => p.id === h.product_id)?.name || '—'
        })))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 50)

      setHistory(all)
    } catch (err) {
      console.error(err)
    }
  }

  const stockColumns = [
  { header: 'Product',  value: h => h.product_name },
  { header: 'Type',     value: h => h.type },
  { header: 'Qty',      value: h => h.quantity },
  { header: 'Note',     value: h => h.note || '—' },
  { header: 'By',       value: h => h.user_name },
  { header: 'Date',     value: h => new Date(h.created_at).toLocaleDateString('id-ID') },
]

const handleExportExcel = () => {
  exportToExcel(filteredHistory, stockColumns, 'StockFlow-Movements')
  toast.success('Excel exported!')
}

const handleExportPDF = () => {
  exportToPDF(
    'Stock Movements Report',
    `${filteredHistory.length} movements`,
    stockColumns,
    filteredHistory,
    'StockFlow-Movements'
  )
  toast.success('PDF exported!')
}
const handleStockIn = async () => {
  if (!formIn.product_id || !formIn.quantity) return
  setSavingIn(true)
  try {
    await api.post('/stock/in', {
      product_id: parseInt(formIn.product_id),
      quantity:   parseInt(formIn.quantity),
      note:       formIn.note || null,
    })
    toast.success('Stock in recorded!')
    setFormIn(initForm)
    fetchAll()
  } catch (err) {
    toast.error(err.response?.data?.error || 'Failed')
  } finally {
    setSavingIn(false)
  }
}

const handleStockOut = async () => {
  if (!formOut.product_id || !formOut.quantity) return
  setSavingOut(true)
  try {
    await api.post('/stock/out', {
      product_id: parseInt(formOut.product_id),
      quantity:   parseInt(formOut.quantity),
      note:       formOut.note || null,
    })
    toast.success('Stock out recorded!')
    setFormOut(initForm)
    fetchAll()
  } catch (err) {
    toast.error(err.response?.data?.error || 'Failed')
  } finally {
    setSavingOut(false)
  }
}

const handleAdjust = async () => {
  if (!formAdj.product_id || formAdj.new_stock === '') return
  setSavingAdj(true)
  try {
    await api.post('/stock/adjustment', {
      product_id: parseInt(formAdj.product_id),
      new_stock:  parseInt(formAdj.new_stock),
      note:       formAdj.note || null,
    })
    toast.success('Stock adjusted!')
    setFormAdj({ product_id: '', new_stock: '', note: '' })
    fetchAll()
  } catch (err) {
    toast.error(err.response?.data?.error || 'Failed')
  } finally {
    setSavingAdj(false)
  }
}

const handleScanResult = async (code) => {
  setShowScanner(false)
  try {
    
    const res = await api.get(`/products/scan/${code}`)
    if (res.data.found) {
      const pid = String(res.data.product.id)
      if (scanTarget === 'in')     setFormIn(f  => ({...f, product_id: pid}))
      if (scanTarget === 'out')    setFormOut(f => ({...f, product_id: pid}))
      if (scanTarget === 'adjust') setFormAdj(f => ({...f, product_id: pid}))
      toast.success(`Produk ditemukan!`)
    } else {
      toast.error(`Produk "${code}" tidak ditemukan`)
    }
  } catch {
    toast.error(`Produk "${code}" tidak ditemukan`)
  }
}
const openScanner = (target) => {
  setScanTarget(target)
  setShowScanner(true)
}

  const filteredHistory = typeFilter === 'all'
    ? history
    : history.filter(h => h.type === typeFilter)

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })

  if (loading) return (
    <>
      <Sidebar />
      <div className="stock-loading"><div className="spinner-sm" /> LOADING...</div>
    </>
  )

  return (
    <div className="stock-page">
      <Sidebar />
<PageTransition>
      <div className="stock-main">
        <div className="stock-content">

          {/* Header */}
         <div className="stock-header">
         <div>
          <h1 className="stock-title">Stock Movements</h1>
          <p className="stock-subtitle">Manage stock in, out, and adjustments</p>
          </div>
          <div style={{display:'flex', gap:8}}>
            <button className="btn-export" onClick={handleExportExcel}>
              <Download size={14} /> Excel
            </button>
            <button className="btn-export" onClick={handleExportPDF}>
              <Download size={14} /> PDF
            </button>
          </div>
        </div>

          {/* Action Cards */}
          <div className="stock-actions">

            {/* Stock In */}
            <div className="action-card">
              <div className="action-card-header">
                <div className="action-card-icon in">
                  <ArrowDownCircle size={20} strokeWidth={2} />
                </div>
                <div>
                  <p className="action-card-title">Stock In</p>
                  <p className="action-card-desc">Barang masuk dari supplier</p>
                </div>
              </div>
              <div className="action-form">
                <button className="btn-scan" onClick={() => openScanner('in')}>
                  <QrCode size={15} /> Scan QR / Barcode
                </button>
                <select className="action-select" value={formIn.product_id}
                  onChange={e => setFormIn(f => ({...f, product_id: e.target.value}))}>
                  <option value="">— Pilih Produk —</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (stok: {p.stock})</option>
                  ))}
                </select>
                <input className="action-input" type="number" min="1"
                  placeholder="Jumlah" value={formIn.quantity}
                  onChange={e => setFormIn(f => ({...f, quantity: e.target.value}))} />
                <input className="action-input" placeholder="Catatan (opsional)"
                  value={formIn.note}
                  onChange={e => setFormIn(f => ({...f, note: e.target.value}))} />
                <button className="btn-action in" onClick={handleStockIn}
                  disabled={savingIn || !formIn.product_id || !formIn.quantity}>
                  {savingIn ? <div className="spinner-sm" /> : <ArrowDownCircle size={15} />}
                  Stock In
                </button>
              </div>
            </div>

            {/* Stock Out */}
            <div className="action-card">
              <div className="action-card-header">
                <div className="action-card-icon out">
                  <ArrowUpCircle size={20} strokeWidth={2} />
                </div>
                <div>
                  <p className="action-card-title">Stock Out</p>
                  <p className="action-card-desc">Barang keluar / terjual</p>
                </div>
              </div>
              <div className="action-form">
                <button className="btn-scan" onClick={() => openScanner('out')}>
                  <QrCode size={15} /> Scan QR / Barcode
                </button>
                <select className="action-select" value={formOut.product_id}
                  onChange={e => setFormOut(f => ({...f, product_id: e.target.value}))}>
                  <option value="">— Pilih Produk —</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (stok: {p.stock})</option>
                  ))}
                </select>
                <input className="action-input" type="number" min="1"
                  placeholder="Jumlah" value={formOut.quantity}
                  onChange={e => setFormOut(f => ({...f, quantity: e.target.value}))} />
                <input className="action-input" placeholder="Catatan (opsional)"
                  value={formOut.note}
                  onChange={e => setFormOut(f => ({...f, note: e.target.value}))} />
                <button className="btn-action out" onClick={handleStockOut}
                  disabled={savingOut || !formOut.product_id || !formOut.quantity}>
                  {savingOut ? <div className="spinner-sm" /> : <ArrowUpCircle size={15} />}
                  Stock Out
                </button>
              </div>
            </div>

            {/* Adjustment */}
            <div className="action-card">
              <div className="action-card-header">
                <div className="action-card-icon adjust">
                  <SlidersHorizontal size={20} strokeWidth={2} />
                </div>
                <div>
                  <p className="action-card-title">Adjustment</p>
                  <p className="action-card-desc">Koreksi stok opname</p>
                </div>
              </div>
              <div className="action-form">
                <button className="btn-scan" onClick={() => openScanner('adjust')}>
                  <QrCode size={15} /> Scan QR / Barcode
                </button>
                <select className="action-select" value={formAdj.product_id}
                  onChange={e => setFormAdj(f => ({...f, product_id: e.target.value}))}>
                  <option value="">— Pilih Produk —</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (stok: {p.stock})</option>
                  ))}
                </select>
                <input className="action-input" type="number" min="0"
                  placeholder="Stok baru (angka aktual)" value={formAdj.new_stock}
                  onChange={e => setFormAdj(f => ({...f, new_stock: e.target.value}))} />
                <input className="action-input" placeholder="Catatan (opsional)"
                  value={formAdj.note}
                  onChange={e => setFormAdj(f => ({...f, note: e.target.value}))} />
                <button className="btn-action adjust" onClick={handleAdjust}
                  disabled={savingAdj || !formAdj.product_id || formAdj.new_stock === ''}>
                  {savingAdj ? <div className="spinner-sm" /> : <SlidersHorizontal size={15} />}
                  Adjust Stock
                </button>
              </div>
            </div>

          </div>

          {/* History */}
          <div className="history-card">
            <div className="history-card-header">
              <p className="history-card-title">Movement History</p>
              <div className="history-filter">
                {['all','in','out','adjustment'].map(t => (
                  <button key={t}
                    className={`filter-btn ${typeFilter === t ? `active-${t}` : ''}`}
                    onClick={() => setTypeFilter(t)}>
                    {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop table */}
            <table className="history-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>Note</th>
                  <th>By</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="table-empty">No movements found</div>
                    </td>
                  </tr>
                ) : filteredHistory.map(h => (
                  <tr key={h.id}>
                    <td style={{fontWeight:600, color:'var(--ink)'}}>{h.product_name}</td>
                    <td><span className={`type-badge ${h.type}`}>{h.type}</span></td>
                    <td>
                      <span className={
                        h.type === 'in' ? 'qty-positive' :
                        h.type === 'out' ? 'qty-negative' : 'qty-neutral'
                      }>
                        {h.type === 'in' ? '+' : ''}{h.quantity}
                      </span>
                    </td>
                    <td style={{color:'var(--ink-muted)'}}>{h.note || '—'}</td>
                    <td>{h.user_name}</td>
                    <td style={{fontFamily:'var(--font-mono)', fontSize:11}}>
                      {formatDate(h.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile */}
            <div className="history-mobile">
              {filteredHistory.length === 0 ? (
                <div className="table-empty">No movements found</div>
              ) : filteredHistory.map(h => (
                <div key={h.id} className="history-card-m">
                  <div className="history-card-m-top">
                    <span className="history-card-m-name">{h.product_name}</span>
                    <span className={`type-badge ${h.type}`}>{h.type}</span>
                  </div>
                  <div className="history-card-m-row">
                    <span>Qty</span>
                    <span className={
                      h.type === 'in' ? 'qty-positive' :
                      h.type === 'out' ? 'qty-negative' : 'qty-neutral'
                    }>
                      {h.type === 'in' ? '+' : ''}{h.quantity}
                    </span>
                  </div>
                  <div className="history-card-m-row">
                    <span>By</span>
                    <span>{h.user_name}</span>
                  </div>
                  <div className="history-card-m-row">
                    <span>Date</span>
                    <span style={{fontFamily:'var(--font-mono)', fontSize:11}}>
                      {formatDate(h.created_at)}
                    </span>
                  </div>
                  {h.note && (
                    <div className="history-card-m-row">
                      <span>Note</span>
                      <span style={{color:'var(--ink-muted)'}}>{h.note}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* QR Scanner */}
      {showScanner && (
        <QRScanner
          onResult={handleScanResult}
          onClose={() => setShowScanner(false)}
        />
      )}
</PageTransition>
    </div>
  )
}