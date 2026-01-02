import React from 'react'
import './InterventionRow.css'

const InterventionRow = ({ intervention, onConfirm, disabled }) => {
  const getConfidenceClass = (confidence) => {
    switch (confidence) {
      case 'high':
        return 'confidence-high'
      case 'medium':
        return 'confidence-medium'
      case 'uncertain':
        return 'confidence-uncertain'
      default:
        return ''
    }
  }

  const needsConfirmation = intervention.confidence === 'uncertain' && intervention.confirmed === null

  return (
    <div className={`intervention-row ${getConfidenceClass(intervention.confidence)}`}>
      <div className={`confidence-bar ${intervention.confidence}`} />

      <div className="intervention-content">
        <div className="intervention-main">
          <h4 className="intervention-type">{intervention.type}</h4>
          {intervention.confirmed === false && (
            <span className="rejected-badge">Not used</span>
          )}
        </div>

        <p className="intervention-evidence">{intervention.evidence}</p>

        {needsConfirmation && !disabled && (
          <div className="confirmation-actions">
            <button
              className="confirm-button yes"
              onClick={() => onConfirm(true)}
            >
              Yes, used
            </button>
            <button
              className="confirm-button no"
              onClick={() => onConfirm(false)}
            >
              No, not used
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default InterventionRow
