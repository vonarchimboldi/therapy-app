import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import './IntakePortal.css'
import { getIntakeFormByPracticeType } from '../config/intakeForms'
import AssessmentViewer from '../components/intake/AssessmentViewer'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const IntakePortal = () => {
  const { token } = useParams()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formConfig, setFormConfig] = useState(null)
  const [assessments, setAssessments] = useState([])
  const [clientName, setClientName] = useState('')

  const [currentStep, setCurrentStep] = useState(0)
  const [responses, setResponses] = useState({})
  const [saving, setSaving] = useState(false)
  const [completed, setCompleted] = useState(false)

  // Load form configuration
  useEffect(() => {
    loadFormConfig()
  }, [token])

  const loadFormConfig = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/intake/form/${token}`)

      if (!response.ok) {
        if (response.status === 404) {
          setError('Invalid link. Please check your email for the correct link.')
        } else if (response.status === 410) {
          setError('This link has expired. Please contact your therapist for a new link.')
        } else {
          setError('Unable to load form. Please try again.')
        }
        setLoading(false)
        return
      }

      const data = await response.json()

      setFormConfig(getIntakeFormByPracticeType(data.form_type))
      setAssessments(data.included_assessments || [])
      setClientName(data.client_name || '')
      setResponses(data.existing_responses || {})

      if (data.status === 'completed') {
        setCompleted(true)
      }
    } catch (err) {
      console.error('Error loading form:', err)
      setError('Unable to connect to server. Please check your internet connection.')
    } finally {
      setLoading(false)
    }
  }

  const saveProgress = async (newResponses) => {
    setSaving(true)
    try {
      await fetch(`${API_URL}/api/intake/submit/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newResponses)
      })
    } catch (err) {
      console.error('Error saving:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleFieldChange = (fieldId, value) => {
    const newResponses = { ...responses, [fieldId]: value }
    setResponses(newResponses)

    // Debounced auto-save
    if (window.saveTimeout) clearTimeout(window.saveTimeout)
    window.saveTimeout = setTimeout(() => {
      saveProgress(newResponses)
    }, 1000)
  }

  const getTotalSteps = () => {
    if (!formConfig) return 0
    // Welcome + form sections + assessments + review + thank you
    return 1 + formConfig.sections.length + assessments.length + 1 + 1
  }

  const handleNext = async () => {
    // Save current responses
    await saveProgress(responses)

    // If on final review step, mark as completed
    if (currentStep === getTotalSteps() - 2) {
      await fetch(`${API_URL}/api/intake/complete/${token}`, {
        method: 'POST'
      })
      setCompleted(true)
    }

    setCurrentStep(prev => prev + 1)
    window.scrollTo(0, 0)
  }

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1)
    window.scrollTo(0, 0)
  }

  const renderField = (field) => {
    // Check conditional fields
    if (field.conditional) {
      const conditionValue = responses[field.conditional.field]
      if (conditionValue !== field.conditional.value) {
        return null // Don't show this field
      }
    }

    const value = responses[field.id] || ''

    switch (field.type) {
      case 'text':
        return (
          <div key={field.id} className="form-field">
            <label>
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
            />
          </div>
        )

      case 'textarea':
        return (
          <div key={field.id} className="form-field">
            <label>
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <textarea
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              rows={4}
            />
          </div>
        )

      case 'select':
        return (
          <div key={field.id} className="form-field">
            <label>
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <select
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.required}
            >
              <option value="">Select...</option>
              {field.options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        )

      case 'radio':
        return (
          <div key={field.id} className="form-field">
            <label>
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <div className="radio-group">
              {field.options.map(opt => (
                <label key={opt} className="radio-option">
                  <input
                    type="radio"
                    name={field.id}
                    value={opt}
                    checked={value === opt}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>
        )

      case 'checkbox':
        const checkedValues = Array.isArray(value) ? value : []
        return (
          <div key={field.id} className="form-field">
            <label>
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <div className="checkbox-group">
              {field.options.map(opt => (
                <label key={opt} className="checkbox-option">
                  <input
                    type="checkbox"
                    value={opt}
                    checked={checkedValues.includes(opt)}
                    onChange={(e) => {
                      const newValues = e.target.checked
                        ? [...checkedValues, opt]
                        : checkedValues.filter(v => v !== opt)
                      handleFieldChange(field.id, newValues)
                    }}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const renderStep = () => {
    if (!formConfig) return null

    const totalSteps = getTotalSteps()
    const formSections = formConfig.sections

    // Welcome step
    if (currentStep === 0) {
      return (
        <div className="welcome-step">
          <h1>Welcome{clientName ? `, ${clientName}` : ''}!</h1>
          <p className="welcome-text">
            Thank you for taking the time to complete this intake form. Your responses will help us provide you with the best possible care.
          </p>
          <div className="info-box">
            <h3>What to expect:</h3>
            <ul>
              <li><strong>{formSections.length} sections</strong> of questions about your background and current situation</li>
              {assessments.length > 0 && (
                <li><strong>{assessments.length} brief assessment{assessments.length > 1 ? 's' : ''}</strong> to help understand your needs</li>
              )}
              <li><strong>About {15 + assessments.length * 8} minutes</strong> to complete</li>
              <li><strong>Your progress is saved automatically</strong> - you can close and resume anytime</li>
            </ul>
          </div>
          <p className="privacy-note">
            All information is confidential and will only be shared with your therapist.
          </p>
        </div>
      )
    }

    // Form sections
    if (currentStep <= formSections.length) {
      const sectionIndex = currentStep - 1
      const section = formSections[sectionIndex]

      return (
        <div className="form-section">
          <h2>{section.title}</h2>
          <div className="form-fields">
            {section.fields.map(field => renderField(field))}
          </div>
        </div>
      )
    }

    // Assessment steps
    if (currentStep <= formSections.length + assessments.length) {
      const assessmentIndex = currentStep - formSections.length - 1
      const assessmentId = assessments[assessmentIndex]

      return (
        <AssessmentViewer
          assessmentId={assessmentId}
          token={token}
          onComplete={handleNext}
        />
      )
    }

    // Review step
    if (currentStep === totalSteps - 2) {
      return (
        <div className="review-step">
          <h2>Review Your Responses</h2>
          <p className="review-intro">
            Please review your responses below. You can go back to make changes if needed.
          </p>

          {formSections.map((section, idx) => {
            const sectionResponses = section.fields
              .map(field => ({ field, value: responses[field.id] }))
              .filter(item => item.value)

            if (sectionResponses.length === 0) return null

            return (
              <div key={idx} className="review-section">
                <h3>{section.title}</h3>
                {sectionResponses.map(({ field, value }) => (
                  <div key={field.id} className="review-item">
                    <strong>{field.label}:</strong>
                    <span>{Array.isArray(value) ? value.join(', ') : value}</span>
                  </div>
                ))}
              </div>
            )
          })}

          <div className="review-actions">
            <button className="btn-secondary" onClick={handlePrevious}>
              Make Changes
            </button>
            <button className="btn-primary" onClick={handleNext}>
              Submit
            </button>
          </div>
        </div>
      )
    }

    // Thank you step
    return (
      <div className="thank-you-step">
        <div className="success-icon">✓</div>
        <h1>Thank You!</h1>
        <p className="thank-you-text">
          Your intake form has been submitted successfully. Your therapist will review your responses and reach out shortly.
        </p>
        <p className="next-steps">
          You can now close this window.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="intake-portal">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading form...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="intake-portal">
        <div className="error-state">
          <h1>Unable to Load Form</h1>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (completed && currentStep === getTotalSteps() - 1) {
    return (
      <div className="intake-portal">
        <div className="intake-container">
          {renderStep()}
        </div>
      </div>
    )
  }

  const progress = (currentStep / (getTotalSteps() - 1)) * 100

  return (
    <div className="intake-portal">
      {/* Progress Bar */}
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${progress}%` }} />
      </div>

      <div className="intake-container">
        {/* Step Indicator */}
        <div className="step-indicator">
          Step {currentStep + 1} of {getTotalSteps()}
        </div>

        {/* Form Content */}
        {renderStep()}

        {/* Navigation */}
        {currentStep > 0 && currentStep < getTotalSteps() - 2 && (
          <div className="navigation">
            {currentStep > 1 && (
              <button className="btn-secondary" onClick={handlePrevious}>
                ← Previous
              </button>
            )}
            <div className="nav-spacer" />
            <button className="btn-primary" onClick={handleNext}>
              {currentStep === getTotalSteps() - 3 ? 'Continue to Review' : 'Next →'}
            </button>
          </div>
        )}

        {currentStep === 0 && (
          <div className="navigation">
            <button className="btn-primary btn-large" onClick={handleNext}>
              Get Started
            </button>
          </div>
        )}

        {/* Auto-save indicator */}
        {saving && currentStep > 0 && currentStep < getTotalSteps() - 1 && (
          <div className="save-indicator">Saving...</div>
        )}
      </div>
    </div>
  )
}

export default IntakePortal
