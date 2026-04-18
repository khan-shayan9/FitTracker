import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import {
  calcWeightChange,
  calcWeightChangePercent,
  getWeightColor,
  isPositiveProgress,
  calcDaysActive,
  calcMeasurementChange,
  getMeasurementColor,
  formatGoal,
  formatDate,
  generatePassword
} from '../../utils/calculations'
import ConfirmDialog from '../../components/ConfirmDialog'

/**
 * Client Detail Page (Admin)
 * Side-by-side layout: Client Info + Progress Summary
 * Bottom: Add measurements form + measurement history
 */
export default function ClientDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  // Data state
  const [client, setClient] = useState(null)
  const [clientUsername, setClientUsername] = useState('')
  const [measurements, setMeasurements] = useState([])
  const [loading, setLoading] = useState(true)

  // Measurement form state
  const [mDate, setMDate] = useState(new Date().toISOString().split('T')[0])
  const [mChest, setMChest] = useState('')
  const [mWaist, setMWaist] = useState('')
  const [mArms, setMArms] = useState('')
  const [mThigh, setMThigh] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // UI state
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toast, setToast] = useState('')
  const [showResetModal, setShowResetModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [resetting, setResetting] = useState(false)

  // Fetch client and measurements on mount
  useEffect(() => {
    fetchData()
  }, [id])

  async function fetchData() {
    try {
      // Fetch client
      const { data: clientData, error: clientErr } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .eq('trainer_id', user.id)
        .single()

      if (clientErr || !clientData) {
        navigate('/admin/clients')
        return
      }
      setClient(clientData)

      // Fetch username from users table
      if (clientData.user_id) {
        const { data: userData } = await supabase
          .from('users')
          .select('username')
          .eq('id', clientData.user_id)
          .single()
        if (userData) setClientUsername(userData.username)
      }

      // Fetch measurements (newest first)
      const { data: measData, error: measErr } = await supabase
        .from('measurements')
        .select('*')
        .eq('client_id', id)
        .order('date', { ascending: false })

      if (!measErr) setMeasurements(measData || [])
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Add a new measurement
  async function handleAddMeasurement(e) {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { data, error } = await supabase
        .from('measurements')
        .insert({
          client_id: id,
          date: mDate,
          chest: parseFloat(mChest) || null,
          waist: parseFloat(mWaist) || null,
          arms: parseFloat(mArms) || null,
          thigh: parseFloat(mThigh) || null
        })
        .select()

      if (error) throw error

      // Add to list and clear form
      if (data && data[0]) {
        setMeasurements((prev) => [data[0], ...prev])
      }
      clearMeasurementForm()
      showToast('Measurement added successfully')
    } catch (err) {
      console.error('Error adding measurement:', err)
    } finally {
      setSubmitting(false)
    }
  }

  // Delete a measurement entry
  async function handleDeleteMeasurement() {
    if (!deleteTarget) return
    try {
      const { error } = await supabase
        .from('measurements')
        .delete()
        .eq('id', deleteTarget)

      if (error) throw error
      setMeasurements((prev) => prev.filter((m) => m.id !== deleteTarget))
      setDeleteTarget(null)
      showToast('Measurement deleted')
    } catch (err) {
      console.error('Error deleting measurement:', err)
    }
  }

  function clearMeasurementForm() {
    setMDate(new Date().toISOString().split('T')[0])
    setMChest('')
    setMWaist('')
    setMArms('')
    setMThigh('')
  }

  // Reset client password
  async function handleResetPassword() {
    if (!client.user_id) return
    setResetting(true)
    try {
      const pwd = generatePassword(8)
      const { error } = await supabase.rpc('reset_user_password', {
        p_user_id: client.user_id,
        p_new_password: pwd
      })
      if (error) throw error
      setNewPassword(pwd)
      setShowResetModal(true)
    } catch (err) {
      console.error('Error resetting password:', err)
      showToast('Failed to reset password')
    } finally {
      setResetting(false)
    }
  }

  function showToast(message) {
    setToast(message)
    setTimeout(() => setToast(''), 3000)
  }

  if (loading || !client) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  // Calculate progress values
  const weightChange = calcWeightChange(client.current_weight, client.starting_weight)
  const weightPercent = calcWeightChangePercent(client.current_weight, client.starting_weight)
  const weightColor = getWeightColor(weightChange, client.goal)
  const positive = isPositiveProgress(weightChange, client.goal)
  const daysActive = calcDaysActive(client.join_date)
  const latestMeasurement = measurements.length > 0 ? measurements[0] : null
  const progressBarWidth = Math.min(Math.abs(weightPercent), 100)

  return (
    <div>
      {/* Page Header */}
      <div className="page-header page-header-actions">
        <div>
          <h2>{client.name}</h2>
          <p>Client details and progress tracking</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-ghost"
            onClick={() => navigate('/admin/clients')}
          >
            ← Back
          </button>
          <button
            className="btn btn-ghost"
            onClick={handleResetPassword}
            disabled={resetting}
            id="reset-password-btn"
          >
            {resetting ? '...' : '🔑 Reset Password'}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate(`/admin/clients/${id}/edit`)}
            id="edit-client-btn"
          >
            ✏️ Edit
          </button>
        </div>
      </div>

      {/* Side-by-Side: Client Info + Progress */}
      <div className="detail-grid">
        {/* Left - Client Info Card */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Client Information</span>
            <span
              className={`goal-badge ${
                client.goal === 'fat_loss' ? 'fat-loss' : 'muscle-gain'
              }`}
            >
              {client.goal === 'fat_loss' ? '🔥' : '💪'}{' '}
              {formatGoal(client.goal)}
            </span>
          </div>
          <ul className="info-list">
            <li>
              <span className="info-label">Name</span>
              <span className="info-value">{client.name}</span>
            </li>
            <li>
              <span className="info-label">Username</span>
              <span className="info-value" style={{ color: 'var(--color-orange)', fontFamily: 'monospace' }}>
                {clientUsername || '—'}
              </span>
            </li>
            <li>
              <span className="info-label">Age</span>
              <span className="info-value">{client.age || '—'}</span>
            </li>
            <li>
              <span className="info-label">Height</span>
              <span className="info-value">
                {client.height ? `${client.height} cm` : '—'}
              </span>
            </li>
            <li>
              <span className="info-label">Join Date</span>
              <span className="info-value">{formatDate(client.join_date)}</span>
            </li>
            <li>
              <span className="info-label">Starting Weight</span>
              <span className="info-value">
                {client.starting_weight ? `${client.starting_weight} kg` : '—'}
              </span>
            </li>
            <li>
              <span className="info-label">Current Weight</span>
              <span className="info-value">
                {client.current_weight ? `${client.current_weight} kg` : '—'}
              </span>
            </li>
          </ul>
        </div>

        {/* Right - Progress Summary Card */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Progress Summary</span>
          </div>

          {/* Weight Change */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
              Total Weight Change
            </div>
            <div className="weight-change-value" style={{ color: weightColor }}>
              {weightChange > 0 ? '+' : ''}{weightChange} kg
            </div>
            <div style={{ color: weightColor, fontSize: '0.85rem', fontWeight: 600 }}>
              {weightPercent > 0 ? '+' : ''}{weightPercent}%
            </div>

            {/* Progress Bar */}
            <div className="progress-container">
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${progressBarWidth}%`,
                    background: positive
                      ? 'linear-gradient(90deg, var(--color-green), #34d399)'
                      : 'linear-gradient(90deg, var(--color-red), #f87171)'
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Days Active */}
          <ul className="info-list">
            <li>
              <span className="info-label">Days Active</span>
              <span className="info-value">{daysActive} days</span>
            </li>
            <li>
              <span className="info-label">Latest Measurement</span>
              <span className="info-value">
                {latestMeasurement ? formatDate(latestMeasurement.date) : 'No data'}
              </span>
            </li>
            <li>
              <span className="info-label">Total Measurements</span>
              <span className="info-value">{measurements.length}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Section - Add Measurement Form */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <span className="card-title">Add Measurement</span>
        </div>

        <form onSubmit={handleAddMeasurement}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="m-date">
                Date
              </label>
              <input
                id="m-date"
                type="date"
                className="form-input"
                value={mDate}
                onChange={(e) => setMDate(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="m-chest">
                Chest (cm)
              </label>
              <input
                id="m-chest"
                type="number"
                className="form-input"
                placeholder="e.g. 95"
                value={mChest}
                onChange={(e) => setMChest(e.target.value)}
                step="0.1"
                disabled={submitting}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="m-waist">
                Waist (cm)
              </label>
              <input
                id="m-waist"
                type="number"
                className="form-input"
                placeholder="e.g. 80"
                value={mWaist}
                onChange={(e) => setMWaist(e.target.value)}
                step="0.1"
                disabled={submitting}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="m-arms">
                Arms (cm)
              </label>
              <input
                id="m-arms"
                type="number"
                className="form-input"
                placeholder="e.g. 35"
                value={mArms}
                onChange={(e) => setMArms(e.target.value)}
                step="0.1"
                disabled={submitting}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="m-thigh">
                Thigh (cm)
              </label>
              <input
                id="m-thigh"
                type="number"
                className="form-input"
                placeholder="e.g. 55"
                value={mThigh}
                onChange={(e) => setMThigh(e.target.value)}
                step="0.1"
                disabled={submitting}
              />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <div className="form-actions" style={{ margin: 0 }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  id="add-measurement-btn"
                >
                  {submitting ? 'Adding...' : '📏 Add'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={clearMeasurementForm}
                  disabled={submitting}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Measurement History */}
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-white)', marginBottom: '1rem' }}>
          Measurement History
        </h3>

        {measurements.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📏</div>
            <h3>No measurements yet</h3>
            <p>Add the first measurement using the form above</p>
          </div>
        ) : (
          measurements.map((m, index) => {
            // Previous measurement is the next in the array (since sorted newest first)
            const prev = index < measurements.length - 1 ? measurements[index + 1] : null

            return (
              <div className="measurement-card" key={m.id}>
                <div className="measurement-date">
                  <span>📅 {formatDate(m.date)}</span>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setDeleteTarget(m.id)}
                    style={{ color: 'var(--color-red)', padding: '0.25rem 0.5rem' }}
                  >
                    🗑️
                  </button>
                </div>
                <div className="measurement-values">
                  {/* Chest */}
                  <div className="measurement-item">
                    <div className="m-label">Chest</div>
                    <div className="m-value">{m.chest ?? '—'} cm</div>
                    {prev && m.chest != null && prev.chest != null && (
                      <div
                        className="m-change"
                        style={{ color: getMeasurementColor(m.chest, prev.chest) }}
                      >
                        ({calcMeasurementChange(m.chest, prev.chest)} cm)
                      </div>
                    )}
                  </div>
                  {/* Waist */}
                  <div className="measurement-item">
                    <div className="m-label">Waist</div>
                    <div className="m-value">{m.waist ?? '—'} cm</div>
                    {prev && m.waist != null && prev.waist != null && (
                      <div
                        className="m-change"
                        style={{ color: getMeasurementColor(m.waist, prev.waist) }}
                      >
                        ({calcMeasurementChange(m.waist, prev.waist)} cm)
                      </div>
                    )}
                  </div>
                  {/* Arms */}
                  <div className="measurement-item">
                    <div className="m-label">Arms</div>
                    <div className="m-value">{m.arms ?? '—'} cm</div>
                    {prev && m.arms != null && prev.arms != null && (
                      <div
                        className="m-change"
                        style={{ color: getMeasurementColor(m.arms, prev.arms) }}
                      >
                        ({calcMeasurementChange(m.arms, prev.arms)} cm)
                      </div>
                    )}
                  </div>
                  {/* Thigh */}
                  <div className="measurement-item">
                    <div className="m-label">Thigh</div>
                    <div className="m-value">{m.thigh ?? '—'} cm</div>
                    {prev && m.thigh != null && prev.thigh != null && (
                      <div
                        className="m-change"
                        style={{ color: getMeasurementColor(m.thigh, prev.thigh) }}
                      >
                        ({calcMeasurementChange(m.thigh, prev.thigh)} cm)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Delete Measurement Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Measurement"
        message="Are you sure you want to delete this measurement entry? This action cannot be undone."
        onConfirm={handleDeleteMeasurement}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="modal-overlay" onClick={() => setShowResetModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">🔑 Password Reset</h3>
            <p className="modal-message">
              New credentials for <strong>{client.name}</strong>. Save these — the password cannot be retrieved later.
            </p>
            <div className="credentials-box">
              <div className="credentials-row">
                <span className="cred-label">Username:</span>
                <span className="cred-value">{clientUsername}</span>
              </div>
              <div className="credentials-row">
                <span className="cred-label">New Password:</span>
                <span className="cred-value">{newPassword}</span>
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-primary"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Username: ${clientUsername}\nPassword: ${newPassword}`
                  )
                  showToast('Credentials copied!')
                }}
              >
                📋 Copy
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => setShowResetModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="toast">
          ✅ {toast}
        </div>
      )}
    </div>
  )
}
