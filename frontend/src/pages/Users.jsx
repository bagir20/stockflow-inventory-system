import { useEffect, useState } from 'react'
import { Search, Plus, Pencil, Trash2, UserX, UserCheck, X, Users } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import api from '../services/api'
import './Users.css'
import PageTransition from '../components/PageTransition'
import toast from 'react-hot-toast'

const AVATAR_COLORS = [
  'linear-gradient(135deg,#60a5fa,#2563eb)',
  'linear-gradient(135deg,#a78bfa,#7c3aed)',
  'linear-gradient(135deg,#34d399,#059669)',
  'linear-gradient(135deg,#fb923c,#ea580c)',
  'linear-gradient(135deg,#f472b6,#db2777)',
]

const emptyForm = { name: '', email: '', password: '', role: 'staff' }

export default function UsersPage() {
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')

  const [showModal,    setShowModal]    = useState(false)
  const [showDelete,   setShowDelete]   = useState(false)
  const [editTarget,   setEditTarget]   = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form,         setForm]         = useState(emptyForm)
  const [saving,       setSaving]       = useState(false)
  const [showPass,     setShowPass]     = useState(false)

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

 
  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users')
      setUsers(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const getInitials = (name) =>
    name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'

  const getColor = (id) => AVATAR_COLORS[id % AVATAR_COLORS.length]

  const openAdd = () => {
    setEditTarget(null)
    setForm(emptyForm)
    setShowPass(false)
    setShowModal(true)
  }

  const openEdit = (u) => {
    setEditTarget(u)
    setForm({ name: u.name, email: u.email, password: '', role: u.role })
    setShowPass(false)
    setShowModal(true)
  }
const handleSave = async () => {
  setSaving(true)
  try {
    if (editTarget) {
      await api.put(`/auth/users/${editTarget.id}`, {
        name: form.name,
        role: form.role,
        ...(form.password ? { password: form.password } : {}),
      })
      toast.success('User updated!')
    } else {
      await api.post('/auth/register', form)
      toast.success('User created!')
    }
    setShowModal(false)
    fetchUsers()
  } catch (err) {
    toast.error(err.response?.data?.error || 'Failed to save')
  } finally {
    setSaving(false)
  }
}

const handleToggleActive = async (u) => {
  try {
    await api.put(`/auth/users/${u.id}`, { is_active: !u.is_active })
    toast.success(`User ${u.is_active ? 'deactivated' : 'activated'}!`)
    fetchUsers()
  } catch (err) {
    toast.error(err.response?.data?.error || 'Failed')
  }
}

const handleDelete = async () => {
  try {
    await api.delete(`/auth/users/${deleteTarget.id}`)
    setShowDelete(false)
    toast.success('User deleted!')
    fetchUsers()
  } catch (err) {
    toast.error(err.response?.data?.error || 'Failed to delete')
  }
}
  const formatDate = (d) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

  if (loading) return (
    <>
      <Sidebar />
      <div className="users-loading"><div className="spinner-sm" /> LOADING...</div>
    </>
  )

  return (
    <div className="users-page">
      <Sidebar />
  <PageTransition>
      <div className="users-main">
        <div className="users-content">

          {/* Header */}
          <div className="users-header">
            <div>
              <h1 className="users-title">Users</h1>
              <p className="users-subtitle">{users.length} registered users</p>
            </div>
            <button className="btn-add" onClick={openAdd}>
              <Plus size={16} strokeWidth={2.5} />
              Add User
            </button>
          </div>

          {/* Toolbar */}
          <div className="users-toolbar">
            <div className="users-search-wrapper">
              <Search size={15} />
              <input className="users-search"
                placeholder="Search by name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          {/* Table */}
          <div className="users-table-card">

            {/* Desktop */}
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="table-empty">
                        <Users size={40} style={{margin:'0 auto 12px', opacity:0.3, display:'block'}} />
                        No users found
                      </div>
                    </td>
                  </tr>
                ) : filtered.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar" style={{background: getColor(u.id)}}>
                          {getInitials(u.name)}
                        </div>
                        <div>
                          <p className="user-name">{u.name}</p>
                          <p className="user-email">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className={`role-badge ${u.role}`}>{u.role}</span></td>
                    <td>
                      <span className={`status-badge ${u.is_active ? 'active' : 'inactive'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{fontFamily:'var(--font-mono)', fontSize:12}}>
                      {formatDate(u.created_at)}
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn-icon" onClick={() => openEdit(u)} title="Edit">
                          <Pencil size={14} />
                        </button>
                        {u.id !== currentUser.id && (
                          <>
                            <button className={`btn-icon warning`}
                              onClick={() => handleToggleActive(u)}
                              title={u.is_active ? 'Deactivate' : 'Activate'}>
                              {u.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                            </button>
                            <button className="btn-icon danger"
                              onClick={() => { setDeleteTarget(u); setShowDelete(true) }}
                              title="Delete">
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile */}
            <div className="users-mobile">
              {filtered.map(u => (
                <div key={u.id} className="user-card-m">
                  <div className="user-card-m-left">
                    <div className="user-avatar" style={{background: getColor(u.id)}}>
                      {getInitials(u.name)}
                    </div>
                    <div className="user-card-m-info">
                      <p className="user-name">{u.name}</p>
                      <p className="user-email">{u.email}</p>
                      <div style={{display:'flex', gap:6, marginTop:4}}>
                        <span className={`role-badge ${u.role}`}>{u.role}</span>
                        <span className={`status-badge ${u.is_active ? 'active' : 'inactive'}`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="actions-cell">
                    <button className="btn-icon" onClick={() => openEdit(u)}>
                      <Pencil size={14} />
                    </button>
                    {u.id !== currentUser.id && (
                      <button className="btn-icon danger"
                        onClick={() => { setDeleteTarget(u); setShowDelete(true) }}>
                        <Trash2 size={14} />
                      </button>
                    )}
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
              <p className="modal-title">{editTarget ? 'Edit User' : 'Add User'}</p>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={form.name}
                  onChange={e => setForm(f => ({...f, name: e.target.value}))}
                  placeholder="John Doe" />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({...f, email: e.target.value}))}
                  placeholder="john@example.com"
                  disabled={!!editTarget} />
              </div>
              <div className="form-group">
                <label className="form-label">
                  {editTarget ? 'New Password' : 'Password *'}
                </label>
                <div style={{position:'relative'}}>
                  <input className="form-input"
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f => ({...f, password: e.target.value}))}
                    placeholder={editTarget ? 'Leave blank to keep current' : 'Min 6 characters'}
                    style={{paddingRight: 40}} />
                  <button type="button"
                    onClick={() => setShowPass(p => !p)}
                    style={{
                      position:'absolute', right:10, top:'50%',
                      transform:'translateY(-50%)',
                      background:'none', border:'none',
                      color:'var(--ink-muted)', fontSize:16
                    }}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
                {editTarget && <p className="form-hint">Kosongkan jika tidak ingin mengubah password</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Role *</label>
                <select className="form-select" value={form.role}
                  onChange={e => setForm(f => ({...f, role: e.target.value}))}>
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn-submit" onClick={handleSave}
                  disabled={saving || !form.name || !form.email || (!editTarget && !form.password)}>
                  {saving && <div className="spinner-sm" />}
                  {editTarget ? 'Save Changes' : 'Add User'}
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
            <p className="delete-title">Delete User?</p>
            <p className="delete-desc">
              <strong>{deleteTarget?.name}</strong> akan dihapus dari sistem secara permanen.
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