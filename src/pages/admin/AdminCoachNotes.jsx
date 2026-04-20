import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import ConfirmDialog from '../../components/ConfirmDialog'
import { formatDate } from '../../utils/calculations'

export default function AdminCoachNotes({ clientId, trainerId }) {
  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  
  useEffect(() => {
    fetchNotes()
  }, [clientId])

  async function fetchNotes() {
    try {
      const { data, error } = await supabase
        .from('coach_notes')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setNotes(data || [])
    } catch (err) {
      console.error('Error fetching notes:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddNote(e) {
    e.preventDefault()
    if (!newNote.trim()) return

    setSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('coach_notes')
        .insert({
          client_id: clientId,
          trainer_id: trainerId,
          note_text: newNote.trim()
        })
        .select()

      if (error) throw error

      if (data && data[0]) {
        setNotes((prev) => [data[0], ...prev])
        setNewNote('')
      }
    } catch (err) {
      console.error('Error adding note:', err)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteNote() {
    if (!deleteTarget) return
    try {
      const { error } = await supabase
        .from('coach_notes')
        .delete()
        .eq('id', deleteTarget)

      if (error) throw error
      setNotes((prev) => prev.filter((n) => n.id !== deleteTarget))
      setDeleteTarget(null)
    } catch (err) {
      console.error('Error deleting note:', err)
    }
  }

  if (loading) return <div className="spinner"></div>

  return (
    <div style={{ marginTop: '2.5rem' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-white)', marginBottom: '1rem' }}>
        Coach Notes
      </h3>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={handleAddNote}>
          <div className="form-group">
            <textarea
              className="form-input"
              rows="3"
              placeholder="Add a new note for this client..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              disabled={submitting}
              style={{ resize: 'vertical' }}
            />
          </div>
          <div className="form-actions" style={{ marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={submitting || !newNote.trim()}>
              {submitting ? 'Adding...' : '📝 Add Note'}
            </button>
          </div>
        </form>
      </div>

      {notes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <p>No coach notes yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {notes.map((note) => (
            <div className="card" key={note.id} style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-yellow)' }}>
                  {formatDate(note.created_at)}
                </span>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setDeleteTarget(note.id)}
                  style={{ color: 'var(--color-red)', padding: '0 0.5rem' }}
                >
                  🗑️
                </button>
              </div>
              <p style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap', margin: 0 }}>
                {note.note_text}
              </p>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Note"
        message="Are you sure you want to delete this note?"
        onConfirm={handleDeleteNote}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
