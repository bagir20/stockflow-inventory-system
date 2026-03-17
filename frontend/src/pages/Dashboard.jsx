import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Package, Layers, DollarSign, AlertTriangle } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import api from '../services/api'
import './Dashboard.css'
import PageTransition from '../components/PageTransition'
import toast from 'react-hot-toast'
import { exportDashboardPDF } from '../utils/exportPDF'
import { Download }           from 'lucide-react'


export default function Dashboard() {
  const [stats, setStats]         = useState(null)
  const [lowStock, setLowStock]   = useState([])
  const [movements, setMovements] = useState([])
  const [chartData, setChartData] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => { fetchAll() }, [])

  const handleExportPDF = () => {
  exportDashboardPDF(stats, lowStock, movements)
  toast.success('Report exported!')
}
const fetchAll = async () => {
  try {
    const [productsRes, lowRes] = await Promise.all([
      api.get('/products'),
      api.get('/stock/low'),
    ])

    const products      = productsRes.data.products
    const totalProducts = products.length
    const totalStock    = products.reduce((s, p) => s + p.stock, 0)
    const totalValue    = products.reduce((s, p) => s + (p.stock * parseFloat(p.purchase_price)), 0)
    const lowStockCount = lowRes.data.total

    setStats({ totalProducts, totalStock, totalValue, lowStockCount })
    setLowStock(lowRes.data.products.slice(0, 5))

    // ambil history semua produk
    const historyResults = await Promise.all(
      products.map(p => api.get(`/stock/history/${p.id}`).catch(() => null))
    )
    const allMovements = historyResults
      .filter(Boolean)
      .flatMap(r => r.data.history.map(h => ({
        ...h,
        product_name: products.find(p => p.id === h.product_id)?.name || '—'
      })))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 8)

    setMovements(allMovements)

    const chart = products.slice(0, 6).map(p => ({
      name: p.name.split(' ').slice(0, 2).join(' '),
      stock: p.stock,
      min: p.min_stock,
    }))
    setChartData(chart)

  } catch (err) {
    console.error(err)
  } finally {
    setLoading(false)
  }
}
  const formatRupiah = (n) => {
  if (n >= 1000000000) return `Rp ${(n / 1000000000).toFixed(1)}M`
  if (n >= 1000000)    return `Rp ${(n / 1000000).toFixed(1)}Jt`
  if (n >= 1000)       return `Rp ${(n / 1000).toFixed(0)}Rb`
  return `Rp ${n}`
}
  const formatDate = (d) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  if (loading) return (
    <>
      <Sidebar />
      <div className="dashboard-loading">
        <div className="spinner-dark" /> LOADING...
      </div>
    </>
  )

  return (
    <div className="dashboard-page">
      <Sidebar />
 <PageTransition>
      <div className="dashboard-main">
        <div className="dashboard-content">

          {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Dashboard</h1>
            <p className="dashboard-subtitle">Welcome back — here's what's happening today.</p>
          </div>
          <button className="btn-export" onClick={handleExportPDF}>
            <Download size={14} /> Export Report
          </button>
        </div>

          {/* Stat Cards */}
          <div className="stat-cards">
            <div className="stat-card blue">
              <div className="stat-icon"><Package size={22} strokeWidth={2} /></div>
              <p className="stat-label">Total Products</p>
              <p className="stat-value">{stats.totalProducts}</p>
              <p className="stat-sub">Active products</p>
            </div>
            <div className="stat-card purple">
              <div className="stat-icon"><Layers size={22} strokeWidth={2} /></div>
              <p className="stat-label">Total Stock</p>
              <p className="stat-value">{stats.totalStock}</p>
              <p className="stat-sub">Units in warehouse</p>
            </div>
            <div className="stat-card green">
            <div className="stat-icon"><DollarSign size={22} strokeWidth={2} /></div>
            <p className="stat-label">Inventory Value</p>
            <p className="stat-value stat-value-rupiah">
              {formatRupiah(stats.totalValue)}
            </p>
            <p className="stat-sub">Purchase price basis</p>
            </div>
            <div className="stat-card orange">
              <div className="stat-icon"><AlertTriangle size={22} strokeWidth={2} /></div>
              <p className="stat-label">Low Stock</p>
              <p className="stat-value">{stats.lowStockCount}</p>
              <p className="stat-sub">Need restock</p>
            </div>
          </div>

          {/* Mid */}
          <div className="dashboard-mid">
            <div className="chart-card">
              <div className="chart-card-header">
                <p className="chart-card-title">Stock Overview</p>
                <div className="chart-legend">
                  <div className="legend-item">
                    <div className="legend-dot" style={{background:'#60a5fa'}} />
                    Current Stock
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{background:'#fb923c'}} />
                    Min Stock
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e7f0" vertical={false} />
                  <XAxis dataKey="name" tick={{fontSize:11, fill:'#9ca3af'}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize:11, fill:'#9ca3af'}} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{background:'#fff', border:'1px solid #e4e7f0', borderRadius:12, fontSize:12}} />
                  <Bar dataKey="stock" fill="#60a5fa" radius={[6,6,0,0]} />
                  <Bar dataKey="min"   fill="#fb923c" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="lowstock-card">
              <p className="lowstock-card-title">
                <AlertTriangle size={16} color="#dc2626" />
                Low Stock Alert
              </p>
              {lowStock.length === 0 ? (
                <div className="lowstock-empty">All stocks sufficient ✓</div>
              ) : (
                lowStock.map(p => (
                  <div key={p.id} className="lowstock-item">
                    <div>
                      <p className="lowstock-name">{p.name}</p>
                      <p className="lowstock-sku">{p.sku}</p>
                    </div>
                    <span className="lowstock-badge">{p.stock} left</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Movements */}
          <div className="recent-card">
            <div className="recent-card-header">
              <p className="recent-card-title">Recent Stock Movements</p>
            </div>
            {movements.length === 0 ? (
              <p className="recent-empty">No movements yet</p>
            ) : (
              <>
                <table className="movements-table">
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
                    {movements.map(m => (
                      <tr key={m.id}>
                       <td className="td-bold">{m.product_name}</td>
                        <td><span className={`type-badge ${m.type}`}>{m.type}</span></td>
                        <td className="td-mono">{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</td>
                        <td className="td-muted">{m.note || '—'}</td>
                        <td>{m.user_name}</td>
                        <td className="td-mono td-sm">{formatDate(m.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="movements-mobile">
                  {movements.map(m => (
                    <div key={m.id} className="movement-card">
                      <div className="movement-card-top">
                      <span className="movement-card-name">{m.product_name}</span>
                        <span className={`type-badge ${m.type}`}>{m.type}</span>
                      </div>
                      <div className="movement-card-bottom">
                        <span className="movement-card-qty">{m.quantity > 0 ? `+${m.quantity}` : m.quantity} units</span>
                        <span className="movement-card-date">{formatDate(m.created_at)}</span>
                      </div>
                      {m.note && <p className="movement-card-note">{m.note}</p>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

        </div>
      </div>
      </PageTransition>
    </div>
  )
}