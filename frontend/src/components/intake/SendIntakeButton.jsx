import React, { useState } from 'react'
import './SendIntakeButton.css'
import { ASSESSMENTS } from '../../config/assessments'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const SendIntakeButton = ({ practiceType = 'therapy', onSuccess }) => {
  const [showModal, setShowModal] = useState(false)
  const [sendType, setSendType] = useState('intake') // 'intake' or 'assessment'
  const [clientEmail, setClientEmail] = useState('')
  const [clientName, setClientName] = useState('')
  const [selectedAssessments, setSelectedAssessments] = useState([])
  const [expiresIn, setExpiresIn] = useState(7)
  const [creating, setCreating] = useState(false)
  const [linkCreated, setLinkCreated] = useState(null)

  const handleCreate = async () => {
    if (!clientEmail || !clientName) {
      alert('Please enter client name and email')
      return
    }

    if (sendType === 'assessment' && selectedAssessments.length === 0) {
      alert('Please select at least one assessment')
      return
    }

    setCreating(true)
    try {
      const response = await fetch(`${API_URL}/api/intake/create-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          client_email: clientEmail,
          client_name: clientName,
          form_type: sendType === 'intake' ? practiceType : 'assessment_only',
          included_assessments: sendType === 'assessment' ? selectedAssessments : [],
          expires_in_days: expiresIn
        })
      })

      if (response.ok) {
        const data = await response.json()
        setLinkCreated(data)

        if (onSuccess) onSuccess(data)
      } else {
        alert('Error creating link')
      }
    } catch (err) {
      console.error('Error:', err)
      alert('Error creating link')
    } finally {
      setCreating(false)
    }
  }

  const toggleAssessment = (assessmentId) => {
    setSelectedAssessments(prev =>
      prev.includes(assessmentId)
        ? prev.filter(id => id !== assessmentId)
        : [...prev, assessmentId]
    )
  }

  const copyLink = () => {
    const fullUrl = `${window.location.origin}/intake/${linkCreated.link_token}`
    navigator.clipboard.writeText(fullUrl)
    alert('Link copied to clipboard!')
  }

  const resetModal = () => {
    setShowModal(false)
    setSendType('intake')
    setClientEmail('')
    setClientName('')
    setSelectedAssessments([])
    setExpiresIn(7)
    setLinkCreated(null)
  }

  if (!showModal) {
    return (
      <button
        className="send-intake-btn"
        onClick={() => setShowModal(true)}
      >
        📋 Send Form
      </button>
    )
  }

  return (
    <div className="modal-overlay" onClick={() => !creating && resetModal()}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {!linkCreated ? (
          <>
            <h2>Send to Client</h2>

            <div className="form-group">
              <label>Client Name *</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div className="form-group">
              <label>Client Email *</label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="client@example.com"
              />
            </div>

            {/* Send Type Toggle */}
            <div className="form-group">
              <label>What would you like to send?</label>
              <div className="send-type-toggle">
                <button
                  className={`toggle-btn ${sendType === 'intake' ? 'active' : ''}`}
                  onClick={() => setSendType('intake')}
                  type="button"
                >
                  <div className="toggle-icon">📝</div>
                  <div className="toggle-content">
                    <strong>Intake Form</strong>
                    <small>Essential onboarding info (10 min)</small>
                  </div>
                </button>
                <button
                  className={`toggle-btn ${sendType === 'assessment' ? 'active' : ''}`}
                  onClick={() => setSendType('assessment')}
                  type="button"
                >
                  <div className="toggle-icon">📊</div>
                  <div className="toggle-content">
                    <strong>Assessment(s) Only</strong>
                    <small>Clinical screenings or personality tests</small>
                  </div>
                </button>
              </div>
            </div>

            {/* Show assessments ONLY if assessment type is selected */}
            {sendType === 'assessment' && (
              <div className="form-group">
                <label>Select Assessment(s) *</label>
                <div className="assessment-checkboxes">
                  {Object.values(ASSESSMENTS).map(assessment => (
                    <label key={assessment.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedAssessments.includes(assessment.id)}
                        onChange={() => toggleAssessment(assessment.id)}
                      />
                      <div className="assessment-info">
                        <span className="assessment-name">{assessment.name}</span>
                        <small className="assessment-meta">
                          {assessment.estimatedMinutes} min · {assessment.questions.length} questions
                          {assessment.clinicalTool && ' · Clinical tool'}
                        </small>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Info box explaining what will be sent */}
            <div className="info-box">
              {sendType === 'intake' ? (
                <>
                  <strong>📝 Intake Form includes:</strong>
                  <ul>
                    <li>Basic information (name, age, contact)</li>
                    <li>Presenting concerns & goals</li>
                    <li>Scheduling preferences</li>
                    <li>~10 minutes to complete</li>
                  </ul>
                  <p className="info-note">
                    💡 You can send assessments separately later when clinically appropriate
                  </p>
                </>
              ) : (
                <>
                  <strong>📊 Assessment(s) only:</strong>
                  <ul>
                    <li>No intake form questions</li>
                    <li>Just the selected assessment(s)</li>
                    <li>Client sees welcome → assessment(s) → thank you</li>
                    <li>Time varies by selection</li>
                  </ul>
                  <p className="info-note">
                    💡 Use this to track symptoms over time (PHQ-9/GAD-7) or gather additional clinical information
                  </p>
                </>
              )}
            </div>

            <div className="form-group">
              <label>Link Expires In</label>
              <select value={expiresIn} onChange={(e) => setExpiresIn(parseInt(e.target.value))}>
                <option value={3}>3 days</option>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
              </select>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={resetModal} disabled={creating}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleCreate} disabled={creating}>
                {creating ? 'Creating...' : 'Create Link'}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>✓ Link Created!</h2>
            <p className="success-message">
              {sendType === 'intake' ? 'Intake form' : 'Assessment(s)'} link created for <strong>{clientName}</strong>
            </p>

            <div className="link-box">
              <input
                type="text"
                value={`${window.location.origin}/intake/${linkCreated.link_token}`}
                readOnly
              />
              <button onClick={copyLink}>Copy</button>
            </div>

            <p className="link-info">
              Expires: {new Date(linkCreated.expires_at).toLocaleDateString()}
            </p>

            <p className="email-note">
              📧 <strong>Note:</strong> Email integration is pending. Please copy and send this link to your client manually.
            </p>

            <div className="modal-actions">
              <button className="btn-primary" onClick={resetModal}>
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default SendIntakeButton
