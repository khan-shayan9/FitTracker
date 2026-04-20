import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { formatDate } from '../../utils/calculations'
import ProgressPhotos from '../../components/ProgressPhotos'

export default function ClientGoals() {
  const { user } = useAuth()
  const [goals, setGoals] = useState([])
  const [measurements, setMeasurements] = useState([])
  const [clientData, setClientData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: cData, error: clientErr } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (clientErr || !cData) throw clientErr
        setClientData(cData)

        const { data: goalsData, error: goalsErr } = await supabase
          .from('goals')
          .select('*')
          .eq('client_id', cData.id)
          .order('created_at', { ascending: false })

        if (goalsErr) throw goalsErr
        setGoals(goalsData || [])

        const { data: measData, error: measErr } = await supabase
          .from('measurements')
          .select('*')
          .eq('client_id', cData.id)
          .order('date', { ascending: false })
        
        if (!measErr) setMeasurements(measData || [])
      } catch (err) {
        console.error('Error fetching goals:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  function calculateProgress(goal) {
    let currentVal = goal.starting_value
    
    if (goal.target_metric === 'Weight' && clientData?.current_weight) {
      currentVal = clientData.current_weight
    } else {
      const clientMeas = measurements[0] // newest measurement
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

    const isDecreasing = target < start
    
    let progressPercent = 0
    if (isDecreasing) {
      if (current <= target) progressPercent = 100
      else if (current >= start) progressPercent = 0
      else progressPercent = ((start - current) / totalDiff) * 100
    } else {
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
        <h2>My Goals & Progress</h2>
        <p>Track your target metrics and upload progress photos</p>
      </div>

      {goals.length === 0 ? (
        <div className="empty-state">
           <div className="empty-icon">🎯</div>
           <h3>No goals assigned yet</h3>
           <p>Your trainer will set your monthly goals.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
          {goals.map((goal) => {
            const { percent, current, badges } = calculateProgress(goal)
            
            return (
              <div className="card" key={goal.id} style={{ padding: '1.5rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ color: 'var(--color-yellow)', margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>
                    {goal.target_metric} Goal
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
                    {goal.description}
                    {goal.deadline && ` (by ${formatDate(goal.deadline)})`}
                  </p>
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
              </div>
            )
          })}
        </div>
      )}

      {clientData && <ProgressPhotos clientId={clientData.id} />}

    </div>
  )
}
