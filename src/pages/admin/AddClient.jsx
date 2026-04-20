import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { generateUsername, generatePassword } from '../../utils/calculations'

/**
 * Add Client Page (Admin)
 * Form to create a new client with auto-generated credentials
 */
export default function AddClient() {
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [credentials, setCredentials] = useState(null) // { username, password }

  // Handle form submission
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    // Validate
    if (!name.trim()) {
      setError('Client name is required')
      return
    }

    setLoading(true)

    try {
      // Generate username and password
      let username = generateUsername(name)
      const password = generatePassword(8)

      // Check if username already exists, add number suffix if so
      const { data: existing } = await supabase
        .from('users')
        .select('username')
        .like('username', `${username}%`)

      if (existing && existing.length > 0) {
        // Find existing usernames that match the base
        const taken = existing.map((u) => u.username)
        if (taken.includes(username)) {
          let counter = 1
          while (taken.includes(`${username}${counter}`)) {
            counter++
          }
          username = `${username}${counter}`
        }
      }

      // Create user account with hashed password (via RPC)
      const { data: userId, error: userError } = await supabase.rpc(
        'create_user_with_password',
        {
          p_username: username,
          p_password: password,
          p_role: 'client',
          p_trainer_id: user.id
        }
      )

      if (userError) throw userError

      // Create client record
      const { error: clientError } = await supabase.from('clients').insert({
        user_id: userId,
        trainer_id: user.id,
        name: name.trim(),
        age: parseInt(age) || null,
        height: parseFloat(height) || null,
        starting_weight: parseFloat(startingWeight) || null,
        current_weight: parseFloat(currentWeight) || parseFloat(startingWeight) || null,
        goal: goal,
        join_date: new Date().toISOString().split('T')[0]
      })

      if (clientError) throw clientError

      // Show generated credentials
      setCredentials({ username, password })
    } catch (err) {
      console.error('Error adding client:', err)
      setError(err.message || 'Failed to add client')
    } finally {
      setLoading(false)
    }
  }

  // If credentials are shown, display success modal
  if (credentials) {
    return (
      <div>
        <div className="page-header">
          <h2>Client Created! ✅</h2>
          <p>Share these login credentials with your client</p>
        </div>

        <div className="card" style={{ maxWidth: '500px' }}>
          <h3 className="card-title">Login Credentials for {name}</h3>
          <p className="card-subtitle">
            Save these — the password cannot be retrieved later
          </p>

          <div className="credentials-box">
            <div className="credentials-row">
              <span className="cred-label">Username:</span>
              <span className="cred-value">{credentials.username}</span>
            </div>
            <div className="credentials-row">
              <span className="cred-label">Password:</span>
              <span className="cred-value">{credentials.password}</span>
            </div>
          </div>

          <div className="form-actions">
            <button
              className="btn btn-primary"
              onClick={() => {
                navigator.clipboard.writeText(
                  `Username: ${credentials.username}\nPassword: ${credentials.password}`
                )
              }}
              id="copy-credentials-btn"
            >
              📋 Copy Credentials
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => navigate('/admin/clients')}
              id="go-to-clients-btn"
            >
              Go to Clients
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h2>Add New Client</h2>
        <p>Register a new gym client and generate their login credentials</p>
      </div>

      {/* Form */}
      <div className="card" style={{ maxWidth: '600px' }}>
        {error && <div className="login-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="client-name">
              Full Name *
            </label>
            <input
              id="client-name"
              type="text"
              className="form-input"
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {/* Age & Height */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="client-age">
                Age
              </label>
              <input
                id="client-age"
                type="number"
                className="form-input"
                placeholder="e.g. 25"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                min="10"
                max="100"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="client-height">
                Height (in)
              </label>
              <input
                id="client-height"
                type="number"
                className="form-input"
                placeholder="e.g. 175"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                step="0.1"
                disabled={loading}
              />
            </div>
          </div>

          {/* Starting Weight & Current Weight */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="client-starting-weight">
                Starting Weight (kg)
              </label>
              <input
                id="client-starting-weight"
                type="number"
                className="form-input"
                placeholder="e.g. 80"
                value={startingWeight}
                onChange={(e) => setStartingWeight(e.target.value)}
                step="0.1"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="client-current-weight">
                Current Weight (kg)
              </label>
              <input
                id="client-current-weight"
                type="number"
                className="form-input"
                placeholder="e.g. 78"
                value={currentWeight}
                onChange={(e) => setCurrentWeight(e.target.value)}
                step="0.1"
                disabled={loading}
              />
            </div>
          </div>

          {/* Goal */}
          <div className="form-group">
            <label className="form-label" htmlFor="client-goal">
              Goal
            </label>
            <select
              id="client-goal"
              className="form-select"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              disabled={loading}
            >
              <option value="fat_loss">🔥 Fat Loss</option>
              <option value="muscle_gain">💪 Muscle Gain</option>
            </select>
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              id="submit-client-btn"
            >
              {loading ? 'Creating...' : '➕ Add Client'}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => navigate('/admin/clients')}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
