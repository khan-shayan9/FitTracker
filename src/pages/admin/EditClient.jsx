import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { formatGoal } from '../../utils/calculations'

/**
 * Edit Client Page (Admin)
 * Edit all client fields except join_date
 */
export default function EditClient() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  // Form state
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [height, setHeight] = useState('')
  const [startingWeight, setStartingWeight] = useState('')
  const [currentWeight, setCurrentWeight] = useState('')
  const [goal, setGoal] = useState('fat_loss')

  // UI state
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  // Fetch existing client data
  useEffect(() => {
    async function fetchClient() {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', id)
          .eq('trainer_id', user.id)
          .single()

        if (error) throw error
        if (!data) {
          navigate('/admin/clients')
          return
        }

        // Populate form
        setName(data.name || '')
        setAge(data.age?.toString() || '')
        setHeight(data.height?.toString() || '')
        setStartingWeight(data.starting_weight?.toString() || '')
        setCurrentWeight(data.current_weight?.toString() || '')
        setGoal(data.goal || 'fat_loss')
      } catch (err) {
        console.error('Error fetching client:', err)
        navigate('/admin/clients')
      } finally {
        setLoading(false)
      }
    }

    fetchClient()
  }, [id])

  // Handle save
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Client name is required')
      return
    }

    setSaving(true)

    try {
      const { error: updateError } = await supabase
        .from('clients')
        .update({
          name: name.trim(),
          age: parseInt(age) || null,
          height: parseFloat(height) || null,
          starting_weight: parseFloat(startingWeight) || null,
          current_weight: parseFloat(currentWeight) || null,
          goal: goal
        })
        .eq('id', id)
        .eq('trainer_id', user.id)

      if (updateError) throw updateError

      setToast('Changes saved successfully!')
      setTimeout(() => setToast(''), 3000)
    } catch (err) {
      console.error('Error updating client:', err)
      setError(err.message || 'Failed to save changes')
    } finally {
      setSaving(false)
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
        <h2>Edit Client</h2>
        <p>Update {name}'s information</p>
      </div>

      {/* Form */}
      <div className="card" style={{ maxWidth: '600px' }}>
        {error && <div className="login-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="edit-name">
              Full Name *
            </label>
            <input
              id="edit-name"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
              required
            />
          </div>

          {/* Age & Height */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="edit-age">
                Age
              </label>
              <input
                id="edit-age"
                type="number"
                className="form-input"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                min="10"
                max="100"
                disabled={saving}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-height">
                Height (in)
              </label>
              <input
                id="edit-height"
                type="number"
                className="form-input"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                step="0.1"
                disabled={saving}
              />
            </div>
          </div>

          {/* Starting Weight & Current Weight */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="edit-starting-weight">
                Starting Weight (kg)
              </label>
              <input
                id="edit-starting-weight"
                type="number"
                className="form-input"
                value={startingWeight}
                onChange={(e) => setStartingWeight(e.target.value)}
                step="0.1"
                disabled={saving}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-current-weight">
                Current Weight (kg)
              </label>
              <input
                id="edit-current-weight"
                type="number"
                className="form-input"
                value={currentWeight}
                onChange={(e) => setCurrentWeight(e.target.value)}
                step="0.1"
                disabled={saving}
              />
            </div>
          </div>

          {/* Goal */}
          <div className="form-group">
            <label className="form-label" htmlFor="edit-goal">
              Goal
            </label>
            <select
              id="edit-goal"
              className="form-select"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              disabled={saving}
            >
              <option value="fat_loss">🔥 Fat Loss</option>
              <option value="muscle_gain">💪 Muscle Gain</option>
            </select>
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-success"
              disabled={saving}
              id="save-client-btn"
            >
              {saving ? 'Saving...' : '💾 Save Changes'}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => navigate(`/admin/clients/${id}`)}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Toast */}
      {toast && (
        <div className="toast">
          ✅ {toast}
        </div>
      )}
    </div>
  )
}
