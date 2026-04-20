import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import {
  calcWeightChange,
  calcWeightChangePercent,
  getWeightColor,
  isPositiveProgress,
  calcDaysActive,
  formatGoal,
  formatDate
} from '../../utils/calculations'

/**
 * Client Profile Page (Read-Only)
 * Shows profile info, weight progress, and latest measurements
 */
export default function ClientProfile() {
  const { user } = useAuth()
  const [client, setClient] = useState(null)
  const [latestMeasurement, setLatestMeasurement] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch client data
        const { data: clientData, error: clientErr } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (clientErr) throw clientErr
        setClient(clientData)

        // Fetch latest measurement
        if (clientData) {
          const { data: measData } = await supabase
            .from('measurements')
            .select('*')
            .eq('client_id', clientData.id)
            .order('date', { ascending: false })
            .limit(1)

          if (measData && measData.length > 0) {
            setLatestMeasurement(measData[0])
          }
        }
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading || !client) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  // Calculate progress
  const weightChange = calcWeightChange(client.current_weight, client.starting_weight)
  const weightPercent = calcWeightChangePercent(client.current_weight, client.starting_weight)
  const weightColor = getWeightColor(weightChange, client.goal)
  const positive = isPositiveProgress(weightChange, client.goal)
  const daysActive = calcDaysActive(client.join_date)
  const progressBarWidth = Math.min(Math.abs(weightPercent), 100)

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h2>My Profile</h2>
        <p>Your fitness information and progress overview</p>
      </div>

      <div className="detail-grid">
        {/* Profile Card (Read-Only) */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Personal Information</span>
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
              <span className="info-label">Age</span>
              <span className="info-value">{client.age || '—'}</span>
            </li>
            <li>
              <span className="info-label">Height</span>
              <span className="info-value">
                {client.height ? `${client.height} in` : '—'}
              </span>
            </li>
            <li>
              <span className="info-label">Goal</span>
              <span className="info-value">{formatGoal(client.goal)}</span>
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
          </ul>
        </div>

        {/* Weight Progress Card */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Weight Progress</span>
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

          <ul className="info-list">
            <li>
              <span className="info-label">Days Active</span>
              <span className="info-value">{daysActive} days</span>
            </li>
            <li>
              <span className="info-label">Current Weight</span>
              <span className="info-value">
                {client.current_weight ? `${client.current_weight} kg` : '—'}
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Latest Measurements Card */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header">
          <span className="card-title">Latest Measurements</span>
          {latestMeasurement && (
            <span className="card-subtitle">{formatDate(latestMeasurement.date)}</span>
          )}
        </div>

        {latestMeasurement ? (
          <div className="measurement-values">
            <div className="measurement-item">
              <div className="m-label">Chest</div>
              <div className="m-value">{latestMeasurement.chest ?? '—'} in</div>
            </div>
            <div className="measurement-item">
              <div className="m-label">Waist</div>
              <div className="m-value">{latestMeasurement.waist ?? '—'} in</div>
            </div>
            <div className="measurement-item">
              <div className="m-label">Arms</div>
              <div className="m-value">{latestMeasurement.arms ?? '—'} in</div>
            </div>
            <div className="measurement-item">
              <div className="m-label">Thigh</div>
              <div className="m-value">{latestMeasurement.thigh ?? '—'} in</div>
            </div>
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '1.5rem' }}>
            <p>No measurements recorded yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
