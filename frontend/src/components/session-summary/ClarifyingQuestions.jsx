import React, { useState } from 'react'
import './ClarifyingQuestions.css'

const ClarifyingQuestions = ({ questions, onAnswerQuestion, disabled }) => {
  const [expandedQuestionId, setExpandedQuestionId] = useState(null)
  const [responses, setResponses] = useState({})

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'context':
        return '📋'
      case 'clinical':
        return '🏥'
      case 'categorization':
        return '🏷️'
      default:
        return '❓'
    }
  }

  const handleSave = (questionId) => {
    const response = responses[questionId] || ''
    if (response.trim()) {
      onAnswerQuestion(questionId, response.trim())
      setExpandedQuestionId(null)
      setResponses(prev => {
        const updated = { ...prev }
        delete updated[questionId]
        return updated
      })
    }
  }

  const handleSkip = (questionId) => {
    onAnswerQuestion(questionId, '[Skipped]')
    setExpandedQuestionId(null)
    setResponses(prev => {
      const updated = { ...prev }
      delete updated[questionId]
      return updated
    })
  }

  if (questions.length === 0) return null

  return (
    <section className="clarifying-questions-section">
      <div className="questions-header">
        <h2>A few things I wasn't sure about</h2>
        <span className="question-count">{questions.length} question{questions.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="questions-list">
        {questions.map(question => (
          <div
            key={question.id}
            className={`question-row ${expandedQuestionId === question.id ? 'expanded' : ''}`}
          >
            <button
              className="question-toggle"
              onClick={() => setExpandedQuestionId(
                expandedQuestionId === question.id ? null : question.id
              )}
              disabled={disabled}
            >
              <span className="category-icon">{getCategoryIcon(question.category)}</span>
              <span className="question-text">{question.question}</span>
              <span className="chevron">
                {expandedQuestionId === question.id ? '▼' : '▶'}
              </span>
            </button>

            {expandedQuestionId === question.id && !disabled && (
              <div className="question-response">
                <textarea
                  className="response-textarea"
                  placeholder="Your notes..."
                  value={responses[question.id] || ''}
                  onChange={(e) => setResponses(prev => ({
                    ...prev,
                    [question.id]: e.target.value
                  }))}
                  rows={3}
                />
                <div className="response-actions">
                  <button
                    className="skip-button"
                    onClick={() => handleSkip(question.id)}
                  >
                    Skip
                  </button>
                  <button
                    className="save-button"
                    onClick={() => handleSave(question.id)}
                    disabled={!responses[question.id]?.trim()}
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

export default ClarifyingQuestions
