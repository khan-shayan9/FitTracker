import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

/**
 * Client Dashboard Page
 * Welcome message + quick links to profile and progress
 */
export default function ClientDashboard() {
  const { user } = useAuth()
  const [clientName, setClientName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchClient() {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('name')
          .eq('user_id', user.id)
          .single()

        if (!error && data) {
          setClientName(data.name)
        }
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchClient()
  }, [])

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
        <h2>Welcome, {clientName || user.username}! 👋</h2>
        <p>Track your fitness journey and progress</p>
      </div>

      {/* Quick Links */}
      <div className="quick-links">
        <Link to="/client/profile" className="quick-link-card">
          <div className="quick-link-icon green">👤</div>
          <div className="quick-link-text">
            <h3>My Profile</h3>
            <p>View your profile and weight progress</p>
          </div>
        </Link>

        <Link to="/client/measurements" className="quick-link-card">
          <div className="quick-link-icon orange">📏</div>
          <div className="quick-link-text">
            <h3>My Progress</h3>
            <p>View your measurement history</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
