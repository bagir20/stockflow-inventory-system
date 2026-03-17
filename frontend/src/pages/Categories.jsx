import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import PageTransition from '../components/PageTransition'
import api from '../services/api'
import './Categories.css'
import toast from 'react-hot-toast'

export default function Categories() {
  const [categories,   setCategories]   = useState([])
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
      const res = await api.get('/categories')
      setCategories(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const openAdd = () => {
    setEditTarget(null)
    setForm({ name: '', description: '' })
    setShowModal(true)
  }

  const openEdit = (item) => {
    setEditTarget(item)
    setForm({ name: item.name, description: item.description || '' })
    setShowModal(true)
  }
const handleSave = async () => {
  setSaving(true)
  try {
    editTarget
      ? await api.put(`/categories/${editTarget.id}`, form)
      : await api.post('/categories', form)
    toast.success(editTarget ? 'Category updated!' : 'Category created!')
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
    await api.delete(`/categories/${deleteTarget.id}`)
    setShowDelete(false)
    toast.success('Category deleted!')
    fetchAll()
  } catch {
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
                <h1 className="cat-title">Categories</h1>
                <p className="cat-subtitle">{categories.length} categories</p>
              </div>
            </div>

            {/* Toolbar */}
            <div className="cat-toolbar">
              <div className="cat-search-wrapper">
                <Search size={15} />
                <input className="cat-search"
                  placeholder="Search categories..."
                  value={search}
                  onChange={e => setSearch(e.target.value)} />
              </div>
              <button className="btn-add" onClick={openAdd}>
                <Plus size={16} strokeWidth={2.5} />
                Add Category
              </button>
            </div>

            {/* Table */}
            <div className="cat-table-card">

              {/* Desktop */}
              <table className="cat-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Products</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={4}><div className="table-empty">No categories found</div></td></tr>
                  ) : filtered.map(c => (
                    <tr key={c.id}>
                      <td className="td-name">{c.name}</td>
                      <td style={{color:'var(--ink-muted)'}}>{c.description || '—'}</td>
                      <td><span className="count-badge">{c.total_products} products</span></td>
                      <td>
                        <div className="actions-cell">
                          <button className="btn-icon" onClick={() => openEdit(c)}><Pencil size={14} /></button>
                          <button className="btn-icon danger" onClick={() => { setDeleteTarget(c); setShowDelete(true) }}>
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
                {filtered.map(c => (
                  <div key={c.id} className="cat-card-m">
                    <div className="cat-card-m-left">
                      <p className="cat-card-m-name">{c.name}</p>
                      <p className="cat-card-m-sub">{c.total_products} products · {c.description || 'No description'}</p>
                    </div>
                    <div className="actions-cell">
                      <button className="btn-icon" onClick={() => openEdit(c)}><Pencil size={14} /></button>
                      <button className="btn-icon danger" onClick={() => { setDeleteTarget(c); setShowDelete(true) }}>
                        <Trash2 size={14} />
                      </button>
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
              <p className="modal-title">{editTarget ? 'Edit Category' : 'Add Category'}</p>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-input" value={form.name || ''}
                  onChange={e => setForm(f => ({...f, name: e.target.value}))}
                  placeholder="Electronics" />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" value={form.description || ''}
                  onChange={e => setForm(f => ({...f, description: e.target.value}))}
                  placeholder="Optional description" />
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn-submit" onClick={handleSave}
                  disabled={saving || !form.name}>
                  {saving && <div className="spinner-sm" />}
                  {editTarget ? 'Save Changes' : 'Add Category'}
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
            <p className="delete-title">Delete Category?</p>
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
 </PageTransition>
    </div>
  )
}