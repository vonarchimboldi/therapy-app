import { useState } from 'react'
import { useUser, useAuth } from '@clerk/clerk-react'
import { getPracticeTypes } from '../config/tracks'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export default function PracticeTypeModal({ onComplete }) {
  const { user } = useUser()
  const { getToken } = useAuth()
  const [selected, setSelected] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const practiceTypes = getPracticeTypes()

  const handleSubmit = async () => {
    if (!selected) return

    setIsSubmitting(true)
    setError(null)

    try {
      console.log('Updating backend database with practice_type:', selected)

      // Update backend database
      const token = await getToken()
      console.log('Got auth token:', token ? 'Yes' : 'No')

      const url = `${API_BASE}/therapist/practice-type`
      console.log('Calling API:', url)

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ practice_type: selected })
      })

      console.log('API response status:', response.status)

      if (!response.ok) {
        const errorData = await response.text()
        console.error('API error response:', errorData)
        throw new Error('Failed to update practice type')
      }

      console.log('✓ Backend updated successfully')
      console.log('✅ Calling onComplete()')

      // Success! Call completion callback
      onComplete()
    } catch (err) {
      console.error('❌ Error updating practice type:', err)
      console.error('Error details:', err.message, err.stack)
      setError(`Failed to save your selection: ${err.message}`)
      setIsSubmitting(false)
    }
  }

  const practiceDescriptions = {
    therapy: 'Track clients, sessions, and therapeutic interventions',
    training: 'Manage clients, workouts, and fitness progress',
    tutoring: 'Organize students, lessons, and academic progress',
    freelance: 'Track clients, meetings, and project deliverables'
  }

  return (
    <div className="modal-overlay practice-type-modal-overlay">
      <div className="modal-content practice-type-modal">
        <h2>Welcome to Pier88!</h2>
        <p className="practice-type-intro">
          Let's customize your experience. What type of practice do you have?
        </p>

        {error && (
          <div className="error-message" style={{ marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        <div className="practice-type-options">
          {practiceTypes.map((type) => (
            <label
              key={type.value}
              className={`practice-type-option ${selected === type.value ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name="practice_type"
                value={type.value}
                checked={selected === type.value}
                onChange={(e) => setSelected(e.target.value)}
                disabled={isSubmitting}
              />
              <div className="practice-type-content">
                <h3>{type.label}</h3>
                <p>{practiceDescriptions[type.value]}</p>
              </div>
            </label>
          ))}
        </div>

        <div className="modal-actions">
          <button
            onClick={handleSubmit}
            disabled={!selected || isSubmitting}
            className="btn-primary btn-large"
          >
            {isSubmitting ? 'Saving...' : 'Continue'}
          </button>
        </div>

        <p className="practice-type-note">
          Don't worry, you can change this later in settings if needed.
        </p>
      </div>
    </div>
  )
}
