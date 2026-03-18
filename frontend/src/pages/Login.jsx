import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, BarChart3, ShoppingCart } from 'lucide-react'
import api from '../services/api'
import ilLogistics from '../assets/il-logistics.svg'
import './Login.css'
import { Eye, EyeOff } from 'lucide-react'
// tambah import di atas
import toast from 'react-hot-toast'

export default function Login() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    console.log('submit triggered, default prevented')

    if (!email || !password) return setError('Email and password are required')
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      navigate('/dashboard')
    } catch (err) {
    toast.error(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">

        {/* Left — Form */}
        <div className="login-left">
          <div className="login-brand">
            <div className="login-logo">
              <span className="logo-mark">SF</span>
            </div>
            <span className="login-brand-name">StockFlow</span>
          </div>

          <h1 className="login-heading">Welcome back</h1>
          <p className="login-subheading">Sign in to your inventory dashboard</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <input className="form-input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }} />
             <button type="button" className="toggle-password"
                onClick={() => setShowPass(p => !p)}>
                {showPass ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
              </button>
              </div>
            </div>

            {error && <p className="login-error">{error}</p>}

            <button 
              type="submit"   // ← tambahkan ini
              className="login-btn"
              disabled={loading || !email || !password}>
              {loading
                ? <><div className="spinner" /> Signing in...</>
                : 'Sign In →'}
            </button>
          </form>

          <div className="login-footer">
            <span className="login-footer-text">StockFlow v1.0 · © 2026</span>
          </div>
        </div>

        {/* Right — Illustration */}
        <div className="login-right">
          <div className="login-right-inner">
            <img src={ilLogistics} alt="Logistics"
              className="login-illustration" />
            <p className="login-right-title">
              Smarter Inventory<br />Management
            </p>
            <p className="login-right-sub">
              Track stock, manage suppliers, and streamline your purchase orders in real-time.
            </p>
            <div className="login-features">
              <div className="login-feature-item">
                <div className="login-feature-icon"><Package size={14} /></div>
                <span className="login-feature-text">Real-time stock tracking</span>
              </div>
              <div className="login-feature-item">
                <div className="login-feature-icon"><BarChart3 size={14} /></div>
                <span className="login-feature-text">Analytics & export reports</span>
              </div>
              <div className="login-feature-item">
                <div className="login-feature-icon"><ShoppingCart size={14} /></div>
                <span className="login-feature-text">Purchase order management</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}