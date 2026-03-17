import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Package, ArrowLeftRight, Tag, Truck, Users, ShoppingCart, LogOut, Menu, X } from 'lucide-react'
import './Sidebar.css'

const baseLinks = [
  { to: '/dashboard',        label: 'Dashboard',        icon: LayoutDashboard },
  { to: '/products',         label: 'Products',         icon: Package },
  { to: '/stock',            label: 'Stock',            icon: ArrowLeftRight },
  { to: '/purchase-orders',  label: 'Purchase Orders',  icon: ShoppingCart },
  { to: '/categories',       label: 'Categories',       icon: Tag },
  { to: '/suppliers',        label: 'Suppliers',        icon: Truck },
]

export default function Sidebar() {
  const navigate        = useNavigate()
  const user            = JSON.parse(localStorage.getItem('user') || '{}')
  const initials        = user.name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || 'SF'
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const allLinks = [
    ...baseLinks,
    ...(user.role === 'admin' ? [{ to: '/users', label: 'Users', icon: Users }] : [])
  ]

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside className="sidebar">
        <NavLink to="/dashboard" className="sidebar-brand">
          <div className="sidebar-logo"><span>SF</span></div>
          <span className="sidebar-name">StockFlow</span>
        </NavLink>

        <nav className="sidebar-nav">
          <span className="sidebar-label">Main Menu</span>
          {allLinks.map((link) => {
            const Icon = link.icon
            return (
              <NavLink key={link.to} to={link.to}
                className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <Icon size={17} strokeWidth={2} />
                {link.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">{user.name}</p>
            <p className="sidebar-user-role">{user.role}</p>
          </div>
          <button className="sidebar-logout" onClick={handleLogout} title="Logout">
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      {/* ── Mobile Topbar ── */}
      <div className="mobile-topbar">
        <NavLink to="/dashboard" className="mobile-topbar-brand">
          <div className="mobile-topbar-logo"><span>SF</span></div>
          <span className="mobile-topbar-name">StockFlow</span>
        </NavLink>
        <button className="hamburger-btn" onClick={() => setOpen(o => !o)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* ── Mobile Dropdown ── */}
      <div className={`mobile-dropdown ${open ? 'open' : ''}`}>
        {allLinks.map((link) => {
          const Icon = link.icon
          return (
            <NavLink key={link.to} to={link.to}
              className={({isActive}) => `mobile-dropdown-link ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}>
              <Icon size={16} strokeWidth={2} />
              {link.label}
            </NavLink>
          )
        })}
        <div className="mobile-dropdown-footer">
          <div className="mobile-dropdown-user">
            <span className="mobile-dropdown-name">{user.name}</span>
            <span className="mobile-dropdown-role">{user.role}</span>
          </div>
          <button className="mobile-logout-btn" onClick={handleLogout}>
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </div>
    </>
  )
}