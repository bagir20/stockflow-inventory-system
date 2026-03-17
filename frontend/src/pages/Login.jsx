import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import './Login.css'
import PageTransition from '../components/PageTransition'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return setError('Email and password are required')

    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">

        {/* Header */}
        <div className="login-header">
          <div className="login-logo">
            <span className="logo-mark">SF</span>
          </div>
          <h1 className="login-title">StockFlow</h1>
          <p className="login-subtitle">Inventory Management System</p>
        </div>

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit}>

          <div className="form-group">
            <label className="form-label">EMAIL</label>
            <input
              className="form-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">PASSWORD</label>
            <div className="input-wrapper">
              <input
                className="form-input"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPass(p => !p)}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && <p className="login-error">{error}</p>}

          <button className="login-btn" disabled={loading || !email || !password}>
            {loading ? <><div className="spinner" /> SIGNING IN...</> : 'Sign In'}
          </button>

        </form>

        {/* Footer */}
        <div className="login-footer">
          <span className="login-footer-text">StockFlow v1.0 · © 2026</span>
        </div>

      </div>
    </div>
  )
}