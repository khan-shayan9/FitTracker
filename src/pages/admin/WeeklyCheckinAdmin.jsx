import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { formatDate } from '../../utils/calculations'
import ConfirmDialog from '../../components/ConfirmDialog'

export default function WeeklyCheckinAdmin() {
  const { user } = useAuth()
  const [clients, setClients] = useState([])
  const [checkins, setCheckins] = useState([])
  
  // Form State
  const [selectedClientId, setSelectedClientId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [rating, setRating] = useState(3)
  const [notes, setNotes] = useState('')
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      // Get all clients for this trainer
      const { data: clientsData, error: clientErr } = await supabase
        .from('clients')
        .select('id, name')
        .eq('trainer_id', user.id)
        .order('name')

      if (clientErr) throw clientErr
      setClients(clientsData || [])

      // Get all checkins
      const { data: checkinData, error: checkinErr } = await supabase
        .from('weekly_checkins')
        .select('*, client:clients(name)')
        .eq('trainer_id', user.id)
        .order('date', { ascending: false })

      if (checkinErr) throw checkinErr
      setCheckins(checkinData || [])
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedClientId) return

    setSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('weekly_checkins')
        .insert({
          client_id: selectedClientId,
          trainer_id: user.id,
          date,
          rating,
          notes: notes.trim()
        })
        .select('*, client:clients(name)')

      if (error) throw error

      if (data && data[0]) {
        setCheckins((prev) => [data[0], ...prev])
        setNotes('')
        setRating(3)
      }
    } catch (err) {
      console.error('Error adding checkin:', err)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      const { error } = await supabase
        .from('weekly_checkins')
        .delete()
        .eq('id', deleteTarget)

      if (error) throw error
      setCheckins((prev) => prev.filter((c) => c.id !== deleteTarget))
      setDeleteTarget(null)
    } catch (err) {
      console.error('Error deleting checkin:', err)
    }
  }

  // Star renderer
  const renderStars = (count) => {
    return '⭐'.repeat(count)
  }

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div></div>
  }

  return (
    <div>
      <div className="page-header">
        <h2>Weekly Check-ins</h2>
        <p>Log and review weekly feedback for your clients</p>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <span className="card-title">Log a New Check-in</span>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="checkin-client">Client *</label>
              <select
                id="checkin-client"
                className="form-select"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                required
                disabled={submitting}
              >
                <option value="" disabled>Select a client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="checkin-date">Date</label>
              <input
                id="checkin-date"
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="checkin-rating">Rating: {renderStars(rating)}</label>
            <input
              id="checkin-rating"
              type="range"
              min="1"
              max="5"
              step="1"
              style={{ width: '100%', accentColor: 'var(--color-yellow)' }}
              value={rating}
              onChange={(e) => setRating(parseInt(e.target.value))}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="checkin-notes">Feedback Notes *</label>
            <textarea
              id="checkin-notes"
              className="form-input"
              rows="4"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              required
              disabled={submitting}
              placeholder="How did the client perform this week? Any adjustments needed?"
            ></textarea>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting || !selectedClientId}>
              {submitting ? 'Logging...' : '📝 Log Check-in'}
            </button>
          </div>
        </form>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-white)', marginBottom: '1rem' }}>
          Check-in History
        </h3>

        {checkins.length === 0 ? (
          <div className="empty-state">
             <div className="empty-icon">⭐</div>
             <p>No check-ins recorded yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {checkins.map((item) => (
              <div className="card" key={item.id} style={{ padding: '1.25rem' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-white)' }}>
                        {item.client?.name || 'Unknown Client'}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {formatDate(item.date)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ background: 'var(--bg-primary)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius)', fontSize: '0.9rem' }}>
                        {renderStars(item.rating)}
                      </div>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setDeleteTarget(item.id)}
                        style={{ color: 'var(--color-red)', padding: '0 0.5rem' }}
                      >
                        🗑️
                      </button>
                    </div>
                 </div>
                 <p style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap', margin: 0, fontSize: '0.95rem' }}>
                   {item.notes}
                 </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Check-in"
        message="Are you sure you want to delete this check-in entry?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
