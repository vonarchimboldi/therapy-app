import React, { useState } from 'react'
import './IntakePortal.css'
import { getIntakeFormByPracticeType } from '../config/intakeForms'
import { getAssessmentById } from '../config/assessments'

const IntakePortalDemo = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [responses, setResponses] = useState({})
  const [assessmentResponses, setAssessmentResponses] = useState({})
  const [currentAssessmentIndex, setCurrentAssessmentIndex] = useState(0)
  const [completed, setCompleted] = useState(false)

  // Demo configuration - Use QUICK intake form (not comprehensive)
  const formConfig = getIntakeFormByPracticeType('therapy', 'quick')
  const assessments = [] // No assessments in initial intake
  const clientName = 'Demo User'

  const handleFieldChange = (fieldId, value) => {
    setResponses(prev => ({ ...prev, [fieldId]: value }))
  }

  const getTotalSteps = () => {
    // Welcome + form sections + assessments + review + thank you
    return 1 + formConfig.sections.length + assessments.length + 1 + 1
  }

  const handleNext = () => {
    // If on final review step, mark as completed
    if (currentStep === getTotalSteps() - 2) {
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
        return null
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

  const renderAssessment = (assessmentId) => {
    const assessment = getAssessmentById(assessmentId)
    if (!assessment) return null

    const responses = assessmentResponses[assessmentId] || {}
    const progress = (Object.keys(responses).length / assessment.questions.length) * 100

    return (
      <div className="assessment-viewer">
        <div className="assessment-header">
          <h2>{assessment.name}</h2>
          <p className="assessment-description">{assessment.description}</p>
          <div className="assessment-meta">
            <span>⏱ {assessment.estimatedMinutes} minutes</span>
            <span>• {assessment.questions.length} questions</span>
          </div>
        </div>

        {assessment.instructions && (
          <div className="assessment-instructions">
            {assessment.instructions}
          </div>
        )}

        <div className="assessment-progress">
          <div className="progress-bar-small">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="progress-text">
            {Object.keys(responses).length} of {assessment.questions.length} answered
          </span>
        </div>

        <div className="questions-list">
          {assessment.questions.map((question, index) => (
            <div key={question.id} className="question-item">
              <div className="question-number">{index + 1}.</div>
              <div className="question-content">
                <p className="question-text">{question.text}</p>
                <div className="response-options">
                  {assessment.responseOptions.map(option => (
                    <label
                      key={option.value}
                      className={`response-option ${responses[question.id] === option.value ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={option.value}
                        checked={responses[question.id] === option.value}
                        onChange={(e) => {
                          setAssessmentResponses(prev => ({
                            ...prev,
                            [assessmentId]: {
                              ...prev[assessmentId],
                              [question.id]: parseInt(e.target.value)
                            }
                          }))
                        }}
                      />
                      <span className="option-label">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderStep = () => {
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
              <li><strong>{formSections.length} quick sections</strong> - Basic info, your concerns, and scheduling</li>
              <li><strong>About 10 minutes</strong> to complete</li>
              <li><strong>No lengthy assessments</strong> - Your therapist can send those separately when appropriate</li>
              <li><strong>Demo mode</strong> - your responses won't be saved</li>
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
      return renderAssessment(assessmentId)
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
          This was a demo - no data was actually saved.
        </p>
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
      {/* Demo Banner */}
      <div style={{
        backgroundColor: '#3b82f6',
        color: 'white',
        padding: '0.75rem',
        textAlign: 'center',
        fontWeight: '500',
        fontSize: '0.875rem'
      }}>
        📋 DEMO MODE - This is a preview with interactive forms. No data is saved.
      </div>

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

        {/* Demo save indicator */}
        {currentStep > 0 && currentStep < getTotalSteps() - 1 && (
          <div className="save-indicator">Demo mode - not saving</div>
        )}
      </div>
    </div>
  )
}

export default IntakePortalDemo
