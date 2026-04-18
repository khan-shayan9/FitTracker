import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { formatGoal, formatDate } from '../../utils/calculations'
import ConfirmDialog from '../../components/ConfirmDialog'

/**
 * Client List Page (Admin)
 * Displays all trainer's clients in a table with view/delete actions
 */
export default function ClientList() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    fetchClients()
  }, [])

  // Fetch all clients for this trainer
  async function fetchClients() {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('trainer_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setClients(data || [])
    } catch (err) {
      console.error('Error fetching clients:', err)
    } finally {
      setLoading(false)
    }
  }

  // Delete a client and their related data
  async function handleDelete() {
    if (!deleteTarget) return

    try {
      // Delete measurements first (cascade should handle, but be safe)
      await supabase
        .from('measurements')
        .delete()
        .eq('client_id', deleteTarget.id)

      // Delete client record
      const { error: clientError } = await supabase
        .from('clients')
        .delete()
        .eq('id', deleteTarget.id)

      if (clientError) throw clientError

      // Delete the client's user account
      if (deleteTarget.user_id) {
        await supabase
          .from('users')
          .delete()
          .eq('id', deleteTarget.user_id)
      }

      // Update UI
      setClients((prev) => prev.filter((c) => c.id !== deleteTarget.id))
      setDeleteTarget(null)
      showToast('Client deleted successfully')
    } catch (err) {
      console.error('Error deleting client:', err)
    }
  }

  // Show toast notification
  function showToast(message) {
    setToast(message)
    setTimeout(() => setToast(''), 3000)
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
      <div className="page-header page-header-actions">
        <div>
          <h2>Clients</h2>
          <p>{clients.length} total clients</p>
        </div>
        <Link to="/admin/clients/add" className="btn btn-primary" id="add-client-btn">
          ➕ Add Client
        </Link>
      </div>

      {/* Client List */}
      {clients.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No clients yet</h3>
          <p>Start by adding your first gym client</p>
          <Link to="/admin/clients/add" className="btn btn-primary">
            ➕ Add Your First Client
          </Link>
        </div>
      ) : (
        <table className="client-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Age</th>
              <th>Goal</th>
              <th>Join Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id}>
                <td data-label="Name">
                  <span className="client-name">{client.name}</span>
                </td>
                <td data-label="Age">{client.age}</td>
                <td data-label="Goal">
                  <span
                    className={`goal-badge ${
                      client.goal === 'fat_loss' ? 'fat-loss' : 'muscle-gain'
                    }`}
                  >
                    {client.goal === 'fat_loss' ? '🔥' : '💪'}{' '}
                    {formatGoal(client.goal)}
                  </span>
                </td>
                <td data-label="Joined">{formatDate(client.join_date)}</td>
                <td data-label="">
                  <div className="table-actions">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => navigate(`/admin/clients/${client.id}`)}
                    >
                      👁️ View
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => navigate(`/admin/clients/${client.id}/edit`)}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setDeleteTarget(client)}
                      style={{ color: 'var(--color-red)' }}
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Client"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will also delete all their measurements. This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="toast">
          ✅ {toast}
        </div>
      )}
    </div>
  )
}
