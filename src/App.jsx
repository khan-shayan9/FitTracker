import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Components
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import Login from './pages/Login'
import AdminDashboard from './pages/admin/Dashboard'
import ClientList from './pages/admin/ClientList'
import AddClient from './pages/admin/AddClient'
import EditClient from './pages/admin/EditClient'
import ClientDetail from './pages/admin/ClientDetail'
import ClientDashboard from './pages/client/Dashboard'
import ClientProfile from './pages/client/Profile'
import MeasurementHistory from './pages/client/MeasurementHistory'

/**
 * App Component - Main router configuration
 * Defines all routes with role-based access control
 */
export default function App() {
  const { user, loading } = useAuth()

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public Route: Login */}
      <Route path="/login" element={<Login />} />

      {/* Admin Routes */}
      <Route
        element={
          <ProtectedRoute allowedRole="admin">
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/clients" element={<ClientList />} />
        <Route path="/admin/clients/add" element={<AddClient />} />
        <Route path="/admin/clients/:id" element={<ClientDetail />} />
        <Route path="/admin/clients/:id/edit" element={<EditClient />} />
      </Route>

      {/* Client Routes */}
      <Route
        element={
          <ProtectedRoute allowedRole="client">
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/client/dashboard" element={<ClientDashboard />} />
        <Route path="/client/profile" element={<ClientProfile />} />
        <Route path="/client/measurements" element={<MeasurementHistory />} />
      </Route>

      {/* Default redirect */}
      <Route
        path="*"
        element={
          user ? (
            <Navigate
              to={user.role === 'admin' ? '/admin/dashboard' : '/client/dashboard'}
              replace
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  )
}
