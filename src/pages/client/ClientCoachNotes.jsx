import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { formatDate } from '../../utils/calculations'

export default function ClientCoachNotes() {
  const { user } = useAuth()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchNotes() {
      try {
        const { data: clientData, error: clientErr } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (clientErr || !clientData) throw clientErr

        const { data: notesData, error: notesErr } = await supabase
          .from('coach_notes')
          .select('*')
          .eq('client_id', clientData.id)
          .order('created_at', { ascending: false })

        if (!notesErr) setNotes(notesData || [])
      } catch (err) {
        console.error('Error fetching coach notes:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchNotes()
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
      <div className="page-header">
        <h2>Coach Notes</h2>
        <p>Feedback and notes from your trainer</p>
      </div>

      {notes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No notes yet</h3>
          <p>Your trainer hasn't added any notes here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {notes.map((note) => (
            <div className="card" key={note.id}>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-yellow)', fontWeight: 600 }}>
                  {formatDate(note.created_at)}
                </span>
              </div>
              <p style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap', margin: 0 }}>
                {note.note_text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
