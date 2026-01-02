import React, { useState, useEffect } from 'react'
import './AssessmentViewer.css'
import { getAssessmentById, calculateAssessmentScore } from '../../config/assessments'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const AssessmentViewer = ({ assessmentId, token, onComplete }) => {
  const [assessment, setAssessment] = useState(null)
  const [responses, setResponses] = useState({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const assessmentData = getAssessmentById(assessmentId)
    setAssessment(assessmentData)
  }, [assessmentId])

  if (!assessment) {
    return <div>Loading assessment...</div>
  }

  const handleResponse = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const handleSubmit = async () => {
    // Calculate scores
    const result = calculateAssessmentScore(assessmentId, responses)

    // Submit to backend
    try {
      await fetch(`${API_URL}/api/intake/submit-assessment/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessment_id: assessmentId,
          responses: responses
        })
      })

      setSubmitted(true)

      // Call onComplete after a brief delay
      setTimeout(() => {
        if (onComplete) onComplete()
      }, 1500)
    } catch (err) {
      console.error('Error submitting assessment:', err)
    }
  }

  const progress = (Object.keys(responses).length / assessment.questions.length) * 100
  const allAnswered = Object.keys(responses).length === assessment.questions.length

  if (submitted) {
    return (
      <div className="assessment-submitted">
        <div className="success-icon-small">✓</div>
        <h3>Assessment Complete</h3>
        <p>Thank you for completing the {assessment.name}.</p>
      </div>
    )
  }

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

      {/* Progress */}
      <div className="assessment-progress">
        <div className="progress-bar-small">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="progress-text">
          {Object.keys(responses).length} of {assessment.questions.length} answered
        </span>
      </div>

      {/* Questions */}
      <div className="questions-list">
        {assessment.questions.map((question, index) => (
          <div key={question.id} className="question-item">
            <div className="question-number">
              {index + 1}.
            </div>
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
                      onChange={(e) => handleResponse(question.id, parseInt(e.target.value))}
                    />
                    <span className="option-label">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <div className="assessment-footer">
        {!allAnswered && (
          <p className="incomplete-notice">
            Please answer all questions before submitting
          </p>
        )}
        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={!allAnswered}
        >
          Complete Assessment
        </button>
      </div>
    </div>
  )
}

export default AssessmentViewer
