import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { formatDate } from '../../utils/calculations'

export default function WeeklyCheckinClient() {
  const { user } = useAuth()
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: clientData, error: clientErr } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (clientErr || !clientData) throw clientErr

        const { data: checkinData, error: checkinErr } = await supabase
          .from('weekly_checkins')
          .select('*')
          .eq('client_id', clientData.id)
          .order('date', { ascending: false })

        if (!checkinErr) setCheckins(checkinData || [])
      } catch (err) {
        console.error('Error fetching checkins:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

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
        <p>Review your trainer's weekly feedback and ratings</p>
      </div>

      {checkins.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⭐</div>
          <h3>No Check-ins yet</h3>
          <p>Your trainer will log your weekly feedback here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {checkins.map((item) => (
            <div className="card" key={item.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--color-yellow)', fontWeight: 600 }}>
                  📅 {formatDate(item.date)}
                </span>
                <span style={{ background: 'var(--bg-primary)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius)' }}>
                  {renderStars(item.rating)}
                </span>
              </div>
              <p style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap', margin: 0 }}>
                {item.notes}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
