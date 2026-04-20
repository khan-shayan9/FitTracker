import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Sidebar Component - Persistent left navigation
 * Shows different nav items based on user role (admin/client)
 */
export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth()
  const location = useLocation()

  // Get user initials for avatar
  const initials = user?.username
    ? user.username.charAt(0).toUpperCase()
    : '?'

  // Role display text
  const roleLabel = user?.role === 'admin' ? 'Trainer' : 'Client'

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Logo / Brand */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🏋️</div>
          <div className="sidebar-logo-text">
            <h1>FitTracker</h1>
            <span>Gym Management</span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Menu</span>

        {user?.role === 'admin' ? (
          <>
            {/* Admin Navigation */}
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) =>
                `sidebar-nav-link ${isActive ? 'active' : ''}`
              }
            >
              <span className="nav-icon">📊</span>
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/admin/clients"
              className={({ isActive }) =>
                `sidebar-nav-link ${isActive || location.pathname.startsWith('/admin/clients/') ? 'active' : ''}`
              }
            >
              <span className="nav-icon">👥</span>
              <span>Clients</span>
            </NavLink>

            <NavLink
              to="/admin/clients/add"
              className={({ isActive }) =>
                `sidebar-nav-link ${isActive ? 'active' : ''}`
              }
            >
              <span className="nav-icon">➕</span>
              <span>Add Client</span>
            </NavLink>

            <NavLink
              to="/admin/goals"
              className={({ isActive }) =>
                `sidebar-nav-link ${isActive ? 'active' : ''}`
              }
            >
              <span className="nav-icon">🎯</span>
              <span>Goal Progress</span>
            </NavLink>

            <NavLink
              to="/admin/checkins"
              className={({ isActive }) =>
                `sidebar-nav-link ${isActive ? 'active' : ''}`
              }
            >
              <span className="nav-icon">⭐</span>
              <span>Check-ins</span>
            </NavLink>
          </>
        ) : (
          <>
            {/* Client Navigation */}
            <NavLink
              to="/client/dashboard"
              className={({ isActive }) =>
                `sidebar-nav-link ${isActive ? 'active' : ''}`
              }
            >
              <span className="nav-icon">🏠</span>
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/client/profile"
              className={({ isActive }) =>
                `sidebar-nav-link ${isActive ? 'active' : ''}`
              }
            >
              <span className="nav-icon">👤</span>
              <span>My Profile</span>
            </NavLink>

            <NavLink
              to="/client/goals"
              className={({ isActive }) =>
                `sidebar-nav-link ${isActive ? 'active' : ''}`
              }
            >
              <span className="nav-icon">🎯</span>
              <span>My Goals</span>
            </NavLink>

            <NavLink
              to="/client/measurements"
              className={({ isActive }) =>
                `sidebar-nav-link ${isActive ? 'active' : ''}`
              }
            >
              <span className="nav-icon">📏</span>
              <span>My Progress</span>
            </NavLink>

            <NavLink
              to="/client/notes"
              className={({ isActive }) =>
                `sidebar-nav-link ${isActive ? 'active' : ''}`
              }
            >
              <span className="nav-icon">📝</span>
              <span>Coach Notes</span>
            </NavLink>

            <NavLink
              to="/client/checkins"
              className={({ isActive }) =>
                `sidebar-nav-link ${isActive ? 'active' : ''}`
              }
            >
              <span className="nav-icon">⭐</span>
              <span>Check-ins</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* Footer - User Info & Logout */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.username}</div>
            <div className="sidebar-user-role">{roleLabel}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={logout} id="logout-button">
          <span className="nav-icon">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
