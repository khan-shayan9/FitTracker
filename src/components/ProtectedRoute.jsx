import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * ProtectedRoute Component
 * Guards routes based on authentication and role
 * 
 * @param {string} allowedRole - 'admin' or 'client'
 * @param {ReactNode} children - Child components to render
 */
export default function ProtectedRoute({ allowedRole, children }) {
  const { user, loading } = useAuth()

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  // Not authenticated → go to login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Wrong role → redirect to correct dashboard
  if (allowedRole && user.role !== allowedRole) {
    const redirect = user.role === 'admin' ? '/admin/dashboard' : '/client/dashboard'
    return <Navigate to={redirect} replace />
  }

  return children
}
