import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const token = localStorage.getItem('token')
  const user  = JSON.parse(localStorage.getItem('user') || '{}')

  // belum login → redirect ke login
  if (!token) return <Navigate to="/login" replace />

  // butuh admin tapi bukan admin → redirect ke dashboard
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />

  return children
}