import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import ProtectedRoute    from './ProtectedRoute'
import Login             from '../pages/Login'
import Dashboard         from '../pages/Dashboard'
import Products          from '../pages/Products'
import Stock             from '../pages/Stock'
import Categories        from '../pages/Categories'
import Suppliers         from '../pages/Suppliers'
import UsersPage         from '../pages/Users'
import PurchaseOrders    from '../pages/PurchaseOrders'

export default function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode='sync'>
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/products" element={
          <ProtectedRoute><Products /></ProtectedRoute>
        } />
        <Route path="/stock" element={
          <ProtectedRoute><Stock /></ProtectedRoute>
        } />
        <Route path="/categories" element={
          <ProtectedRoute><Categories /></ProtectedRoute>
        } />
        <Route path="/suppliers" element={
          <ProtectedRoute><Suppliers /></ProtectedRoute>
        } />
        <Route path="/purchase-orders" element={
          <ProtectedRoute><PurchaseOrders /></ProtectedRoute>
        } />
        <Route path="/users" element={
          <ProtectedRoute adminOnly><UsersPage /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AnimatePresence>
  )
}