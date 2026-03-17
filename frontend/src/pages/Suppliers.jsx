import { useEffect, useState } from 'react'
import { Truck, Plus, Pencil, Trash2, Search, X } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import PageTransition from '../components/PageTransition'
import api from '../services/api'
import './Categories.css'
import toast from 'react-hot-toast'
import EmptyState from '../components/EmptyState'
import ilEmpty from '../assets/il-empty.svg'

export default function Suppliers() {
  const [suppliers,    setSuppliers]    = useState([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [showModal,    setShowModal]    = useState(false)
  const [showDelete,   setShowDelete]   = useState(false)
  const [editTarget,   setEditTarget]   = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form,         setForm]         = useState({})
  const [saving,       setSaving]       = useState(false)

 
  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const res = await api.get('/suppliers')
      setSuppliers(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.contact_name?.toLowerCase().includes(search.toLowerCase())
  )

  const openAdd = () => {
    setEditTarget(null)
    setForm({ name: '', contact_name: '', email: '', phone: '', address: '' })
    setShowModal(true)
  }

  const openEdit = (item) => {
    setEditTarget(item)
    setForm({
      name:         item.name,
      contact_name: item.contact_name || '',
      email:        item.email || '',
      phone:        item.phone || '',
      address:      item.address || '',
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      editTarget
        ? await api.put(`/suppliers/${editTarget.id}`, form)
        : await api.post('/suppliers', form)
      setShowModal(false)
      fetchAll()
    } catch (err) {
    // handleSave sukses:
toast.success(editTarget ? 'Supplier updated!' : 'Supplier created!')

// handleSave error:
toast.error(err.response?.data?.error || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/suppliers/${deleteTarget.id}`)
      setShowDelete(false)
      fetchAll()
    } catch  {
     // handleDelete sukses:
toast.success('Supplier deleted!')

// handleDelete error:
toast.error('Cannot delete — still in use')
    }
  }

  if (loading) return (
    <>
      <Sidebar />
      <div className="cat-loading"><div className="spinner-sm" /> LOADING...</div>
    </>
  )

  return (
    <div className="cat-page">
      <Sidebar />
      <PageTransition>
        <div className="cat-main">
          <div className="cat-content">

            {/* Header */}
            <div className="cat-header">
              <div>
                <h1 className="cat-title">Suppliers</h1>
                <p className="cat-subtitle">{suppliers.length} suppliers</p>
              </div>
            </div>

            {/* Toolbar */}
            <div className="cat-toolbar">
              <div className="cat-search-wrapper">
                <Search size={15} />
                <input className="cat-search"
                  placeholder="Search suppliers..."
                  value={search}
                  onChange={e => setSearch(e.target.value)} />
              </div>
              <button className="btn-add" onClick={openAdd}>
                <Plus size={16} strokeWidth={2.5} />
                Add Supplier
              </button>
            </div>

            {/* Table */}
            <div className="cat-table-card">
              <table className="cat-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Products</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState
                        image={ilEmpty}
                        title="No suppliers yet"
                        subtitle="Add your first supplier to get started"
                      />
                    </td>
                  </tr>
                ) : filtered.map(s => (
                    <tr key={s.id}>
                      <td className="td-name">{s.name}</td>
                      <td>{s.contact_name || '—'}</td>
                      <td style={{fontFamily:'var(--font-mono)', fontSize:12}}>{s.email || '—'}</td>
                      <td style={{fontFamily:'var(--font-mono)', fontSize:12}}>{s.phone || '—'}</td>
                      <td><span className="count-badge">{s.total_products} products</span></td>
                      <td>
                        <div className="actions-cell">
                          <button className="btn-icon" onClick={() => openEdit(s)}><Pencil size={14} /></button>
                          <button className="btn-icon danger" onClick={() => { setDeleteTarget(s); setShowDelete(true) }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile */}
              <div className="cat-mobile">
                {filtered.length === 0 && (
                <EmptyState
                  image={ilEmpty}
                  title="No suppliers yet"
                  subtitle="Add your first supplier to get started"
                />
              )}
                {filtered.map(s => (
                  <div key={s.id} className="cat-card-m">
                    <div className="cat-card-m-left">
                      <p className="cat-card-m-name">{s.name}</p>
                      <p className="cat-card-m-sub">{s.contact_name || '—'} · {s.phone || '—'}</p>
                    </div>
                    <div className="actions-cell">
                      <button className="btn-icon" onClick={() => openEdit(s)}><Pencil size={14} /></button>
                      <button className="btn-icon danger" onClick={() => { setDeleteTarget(s); setShowDelete(true) }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </PageTransition>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <p className="modal-title">{editTarget ? 'Edit Supplier' : 'Add Supplier'}</p>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-input" value={form.name || ''}
                  onChange={e => setForm(f => ({...f, name: e.target.value}))}
                  placeholder="PT Maju Jaya" />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Person</label>
                <input className="form-input" value={form.contact_name || ''}
                  onChange={e => setForm(f => ({...f, contact_name: e.target.value}))}
                  placeholder="Budi Santoso" />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={form.email || ''}
                  onChange={e => setForm(f => ({...f, email: e.target.value}))}
                  placeholder="contact@supplier.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.phone || ''}
                  onChange={e => setForm(f => ({...f, phone: e.target.value}))}
                  placeholder="08123456789" />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input className="form-input" value={form.address || ''}
                  onChange={e => setForm(f => ({...f, address: e.target.value}))}
                  placeholder="Jl. Sudirman No. 10, Jakarta" />
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn-submit" onClick={handleSave}
                  disabled={saving || !form.name}>
                  {saving && <div className="spinner-sm" />}
                  {editTarget ? 'Save Changes' : 'Add Supplier'}
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
            <div className="delete-icon"><Trash2 size={20} /></div>
            <p className="delete-title">Delete Supplier?</p>
            <p className="delete-desc">
              <strong>{deleteTarget?.name}</strong> akan dihapus. Tidak bisa dihapus jika masih digunakan oleh produk.
            </p>
            <div className="delete-actions">
              <button className="btn-cancel" onClick={() => setShowDelete(false)}>Cancel</button>
              <button className="btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}