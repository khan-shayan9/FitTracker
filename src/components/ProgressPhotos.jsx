import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import ConfirmDialog from './ConfirmDialog'
import { formatDate } from '../utils/calculations'

export default function ProgressPhotos({ clientId }) {
  const { user } = useAuth()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [fullscreenPhoto, setFullscreenPhoto] = useState(null)

  useEffect(() => {
    fetchPhotos()
  }, [clientId])

  async function fetchPhotos() {
    try {
      const { data, error } = await supabase
        .from('progress_photos')
        .select('*')
        .eq('client_id', clientId)
        .order('date', { ascending: false })

      if (error) throw error
      setPhotos(data || [])
    } catch (err) {
      console.error('Error fetching photos:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    try {
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${clientId}-${Math.random()}.${fileExt}`
      const filePath = `${clientId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 2. Get Public URL
      const { data: publicUrlData } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath)

      const photoUrl = publicUrlData.publicUrl

      // 3. Save to database
      const { data: photoData, error: dbError } = await supabase
        .from('progress_photos')
        .insert({
          client_id: clientId,
          uploader_id: user.id,
          photo_url: photoUrl,
          date: new Date().toISOString().split('T')[0]
        })
        .select()

      if (dbError) throw dbError

      if (photoData && photoData[0]) {
        setPhotos((prev) => [photoData[0], ...prev])
      }
    } catch (err) {
      console.error('Error uploading photo:', err)
      alert('Failed to upload photo. Ensure you have creating the "photos" storage bucket.')
    } finally {
      setUploading(false)
      // Reset input
      e.target.value = null
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      const { error } = await supabase
        .from('progress_photos')
        .delete()
        .eq('id', deleteTarget)

      if (error) throw error
      setPhotos((prev) => prev.filter((p) => p.id !== deleteTarget))
      setDeleteTarget(null)
    } catch (err) {
      console.error('Error deleting photo:', err)
    }
  }

  if (loading) return <div className="spinner"></div>

  return (
    <div style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-white)' }}>
          Progress Photos
        </h3>
        
        <div>
          <input
            type="file"
            id={`photo-upload-${clientId}`}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <label htmlFor={`photo-upload-${clientId}`} className="btn btn-primary" style={{ cursor: 'pointer' }}>
            {uploading ? 'Uploading...' : '📸 Upload Photo'}
          </label>
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📷</div>
          <p>No progress photos uploaded yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
          {photos.map((photo) => (
            <div key={photo.id} className="card" style={{ padding: '0.5rem', position: 'relative' }}>
              <img
                src={photo.photo_url}
                alt={`Progress on ${photo.date}`}
                style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: 'calc(var(--radius) - 2px)', cursor: 'pointer' }}
                onClick={() => setFullscreenPhoto(photo.photo_url)}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', padding: '0 0.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {formatDate(photo.date)}
                </span>
                {(user.role === 'admin' || user.id === photo.uploader_id) && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setDeleteTarget(photo.id)}
                    style={{ color: 'var(--color-red)', padding: '0.1rem 0.3rem', fontSize: '0.8rem' }}
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Photo"
        message="Are you sure you want to delete this photo?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {fullscreenPhoto && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(5, 5, 5, 0.95)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setFullscreenPhoto(null)}
        >
          <img 
            src={fullscreenPhoto} 
            alt="Fullscreen view" 
            style={{
              maxHeight: '90vh',
              maxWidth: '90vw',
              objectFit: 'contain',
              borderRadius: 'var(--radius)',
              boxShadow: '0 0 40px rgba(250, 204, 21, 0.15)',
              animation: 'scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
          />
        </div>
      )}
    </div>
  )
}
