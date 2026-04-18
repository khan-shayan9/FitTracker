import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

/**
 * Admin Dashboard Page
 * Shows welcome message and quick stats (total clients, active this month)
 */
export default function AdminDashboard() {
  const { user } = useAuth()
  const [totalClients, setTotalClients] = useState(0)
  const [activeClients, setActiveClients] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  // Fetch dashboard statistics
  async function fetchStats() {
    try {
      // Get all clients for this trainer
      const { data: clients, error } = await supabase
        .from('clients')
        .select('id, join_date')
        .eq('trainer_id', user.id)

      if (error) throw error

      setTotalClients(clients?.length || 0)

      // Active this month = clients who have measurements this month
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split('T')[0]

      const clientIds = clients?.map((c) => c.id) || []

      if (clientIds.length > 0) {
        const { data: measurements, error: mError } = await supabase
          .from('measurements')
          .select('client_id')
          .in('client_id', clientIds)
          .gte('date', startOfMonth)

        if (!mError && measurements) {
          const uniqueClients = new Set(measurements.map((m) => m.client_id))
          setActiveClients(uniqueClients.size)
        }
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h2>Welcome back, {user.username}! 👋</h2>
        <p>Here's an overview of your gym clients</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {/* Total Clients */}
        <div className="stat-card green">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{totalClients}</div>
          <div className="stat-label">Total Clients</div>
          <Link to="/admin/clients" className="stat-link">
            View all clients →
          </Link>
        </div>

        {/* Active This Month */}
        <div className="stat-card orange">
          <div className="stat-icon">🔥</div>
          <div className="stat-value">{activeClients}</div>
          <div className="stat-label">Active This Month</div>
          <Link to="/admin/clients" className="stat-link">
            View details →
          </Link>
        </div>

        {/* Quick Add */}
        <div className="stat-card blue">
          <div className="stat-icon">➕</div>
          <div className="stat-value" style={{ fontSize: '1.2rem' }}>
            Add New Client
          </div>
          <div className="stat-label">Register a new gym client</div>
          <Link to="/admin/clients/add" className="stat-link">
            Add client →
          </Link>
        </div>
      </div>
    </div>
  )
}
