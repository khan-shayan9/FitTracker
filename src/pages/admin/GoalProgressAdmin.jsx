import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { formatDate } from '../../utils/calculations'
import ConfirmDialog from '../../components/ConfirmDialog'
import ProgressPhotos from '../../components/ProgressPhotos'

export default function GoalProgressAdmin() {
  const { user } = useAuth()
  const [clients, setClients] = useState([])
  const [goals, setGoals] = useState([])
  const [measurements, setMeasurements] = useState([])
  
  // Form State
  const [selectedClientId, setSelectedClientId] = useState('')
  const [description, setDescription] = useState('')
  const [targetMetric, setTargetMetric] = useState('Weight')
  const [targetValue, setTargetValue] = useState('')
  const [startingValue, setStartingValue] = useState('')
  const [deadline, setDeadline] = useState('')
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      // Get all clients
      const { data: clientsData, error: clientErr } = await supabase
        .from('clients')
        .select('id, name, current_weight')
        .eq('trainer_id', user.id)
        .order('name')

      if (clientErr) throw clientErr
      setClients(clientsData || [])

      // Get all goals
      const { data: goalsData, error: goalsErr } = await supabase
        .from('goals')
        .select('*, client:clients(name, current_weight)')
        .eq('trainer_id', user.id)
        .order('created_at', { ascending: false })

      if (goalsErr) throw goalsErr
      setGoals(goalsData || [])

      // Get all newest measurements for these clients
      const { data: measData, error: measErr } = await supabase
        .from('measurements')
        .select('*')
        .order('date', { ascending: false })
      
      if (!measErr) setMeasurements(measData || [])
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
        .from('goals')
        .insert({
          client_id: selectedClientId,
          trainer_id: user.id,
          description: description.trim(),
          target_metric: targetMetric,
          target_value: parseFloat(targetValue),
          starting_value: parseFloat(startingValue),
          deadline: deadline || null
        })
        .select('*, client:clients(name, current_weight)')

      if (error) throw error

      if (data && data[0]) {
        setGoals((prev) => [data[0], ...prev])
        setDescription('')
        setTargetValue('')
        setStartingValue('')
        setDeadline('')
      }
    } catch (err) {
      console.error('Error adding goal:', err)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', deleteTarget)

      if (error) throw error
      setGoals((prev) => prev.filter((g) => g.id !== deleteTarget))
      setDeleteTarget(null)
    } catch (err) {
      console.error('Error deleting goal:', err)
    }
  }

  // Pre-fill starting value when client/metric changes
  useEffect(() => {
    if (!selectedClientId) return

    const client = clients.find(c => c.id === selectedClientId)
    const clientMeas = measurements.find(m => m.client_id === selectedClientId)

    if (targetMetric === 'Weight' && client?.current_weight) {
      setStartingValue(client.current_weight.toString())
    } else if (clientMeas) {
      if (targetMetric === 'Chest' && clientMeas.chest) setStartingValue(clientMeas.chest.toString())
      if (targetMetric === 'Waist' && clientMeas.waist) setStartingValue(clientMeas.waist.toString())
      if (targetMetric === 'Arms' && clientMeas.arms) setStartingValue(clientMeas.arms.toString())
      if (targetMetric === 'Thigh' && clientMeas.thigh) setStartingValue(clientMeas.thigh.toString())
    } else {
      setStartingValue('')
    }
  }, [selectedClientId, targetMetric, clients, measurements])

  function calculateProgress(goal) {
    let currentVal = goal.starting_value
    
    // Find current measured value
    if (goal.target_metric === 'Weight' && goal.client?.current_weight) {
      currentVal = goal.client.current_weight
    } else {
      const clientMeas = measurements.find(m => m.client_id === goal.client_id)
      if (clientMeas) {
        if (goal.target_metric === 'Chest' && clientMeas.chest) currentVal = clientMeas.chest
        if (goal.target_metric === 'Waist' && clientMeas.waist) currentVal = clientMeas.waist
        if (goal.target_metric === 'Arms' && clientMeas.arms) currentVal = clientMeas.arms
        if (goal.target_metric === 'Thigh' && clientMeas.thigh) currentVal = clientMeas.thigh
      }
    }

    const start = parseFloat(goal.starting_value)
    const target = parseFloat(goal.target_value)
    const current = parseFloat(currentVal)
    
    if (isNaN(start) || isNaN(target) || isNaN(current)) return { percent: 0, current, badges: [] }

    const totalDiff = Math.abs(start - target)
    if (totalDiff === 0) return { percent: 100, current, badges: ['100% Goal Hit 🏆'] }

    // Depending on if target is higher or lower than start
    const isDecreasing = target < start
    
    let progressPercent = 0
    if (isDecreasing) {
      if (current <= target) progressPercent = 100
      else if (current >= start) progressPercent = 0
      else progressPercent = ((start - current) / totalDiff) * 100
    } else {
      // Increasing (e.g. Muscle gain)
      if (current >= target) progressPercent = 100
      else if (current <= start) progressPercent = 0
      else progressPercent = ((current - start) / totalDiff) * 100
    }

    progressPercent = Math.max(0, Math.min(100, Math.round(progressPercent)))

    const badges = []
    if (progressPercent >= 25 && progressPercent < 50) badges.push('Started Strong 🥉')
    if (progressPercent >= 50 && progressPercent < 100) badges.push('Halfway There 🥈')
    if (progressPercent === 100) badges.push('Target Reached 🏆')

    return { percent: progressPercent, current, badges }
  }

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>

  return (
    <div>
      <div className="page-header">
        <h2>Goal Progress</h2>
        <p>Set and track specific metric goals for your clients</p>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <span className="card-title">Set New Goal</span>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="goal-client">Client *</label>
              <select
                id="goal-client"
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
              <label className="form-label" htmlFor="goal-metric">Target Metric *</label>
              <select
                id="goal-metric"
                className="form-select"
                value={targetMetric}
                onChange={(e) => setTargetMetric(e.target.value)}
                required
                disabled={submitting}
              >
                <option value="Weight">Weight (kg)</option>
                <option value="Chest">Chest (in)</option>
                <option value="Waist">Waist (in)</option>
                <option value="Arms">Arms (in)</option>
                <option value="Thigh">Thigh (in)</option>
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="goal-start">Starting Value *</label>
              <input
                id="goal-start"
                type="number"
                step="0.1"
                className="form-input"
                value={startingValue}
                onChange={(e) => setStartingValue(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="goal-target">Target Value *</label>
              <input
                id="goal-target"
                type="number"
                step="0.1"
                className="form-input"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="goal-deadline">Deadline</label>
              <input
                id="goal-deadline"
                type="date"
                className="form-input"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="goal-desc">Description *</label>
              <input
                id="goal-desc"
                type="text"
                className="form-input"
                placeholder="e.g. Lose fat for the summer"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting || !selectedClientId}>
              {submitting ? 'Setting Goal...' : '🎯 Set Goal'}
            </button>
          </div>
        </form>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-white)', marginBottom: '1rem' }}>
          Active Goals
        </h3>

        {goals.length === 0 ? (
          <div className="empty-state">
             <div className="empty-icon">🎯</div>
             <p>No goals set yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
            {goals.map((goal) => {
              const { percent, current, badges } = calculateProgress(goal)
              
              return (
                <div className="card" key={goal.id} style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div>
                      <h4 style={{ color: 'var(--color-yellow)', margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>
                        {goal.client?.name || 'Unknown Client'} - {goal.target_metric}
                      </h4>
                      <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
                        {goal.description}
                        {goal.deadline && ` (by ${formatDate(goal.deadline)})`}
                      </p>
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setDeleteTarget(goal.id)}
                      style={{ color: 'var(--color-red)' }}
                    >
                      🗑️
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                    <span>Start: <strong>{goal.starting_value}</strong></span>
                    <span>Current: <strong>{current}</strong></span>
                    <span>Target: <strong>{goal.target_value}</strong></span>
                  </div>

                  <div className="progress-container">
                    <div className="progress-bar-bg" style={{ height: '14px' }}>
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${percent}%`,
                          background: percent === 100 
                            ? 'linear-gradient(90deg, var(--color-green), #84cc16)' 
                            : 'linear-gradient(90deg, var(--color-orange), var(--color-yellow))'
                        }}
                      ></div>
                    </div>
                    <div style={{ textAlign: 'right', marginTop: '0.25rem', fontSize: '0.8rem', fontWeight: 600 }}>
                      {percent}% Completed
                    </div>
                  </div>

                  {badges.length > 0 && (
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                      {badges.map((badge, idx) => (
                        <span key={idx} style={{ 
                          background: 'rgba(250, 204, 21, 0.15)', 
                          color: 'var(--color-yellow)', 
                          padding: '0.25rem 0.75rem', 
                          borderRadius: '999px',
                          fontSize: '0.8rem',
                          fontWeight: 600
                        }}>
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Progress Photos integration! Add below goal */}
                  <ProgressPhotos clientId={goal.client_id} />
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Goal"
        message="Are you sure you want to remove this goal?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
