import React from 'react'
import './EmotionCard.css'

const EmotionCard = ({ emotion, onRemove, disabled }) => {
  const getIntensityClass = (intensity) => {
    switch (intensity) {
      case 'high':
        return 'intensity-high'
      case 'medium':
        return 'intensity-medium'
      case 'low':
        return 'intensity-low'
      default:
        return ''
    }
  }

  const formatEmotionName = (name) => {
    return name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' ')
  }

  return (
    <div className={`emotion-card ${getIntensityClass(emotion.intensity)}`}>
      <div className="emotion-header">
        <h3 className="emotion-name">{formatEmotionName(emotion.name)}</h3>
        <span className={`intensity-badge ${emotion.intensity}`}>
          {emotion.intensity}
        </span>
      </div>

      <blockquote className="emotion-quote">
        "{emotion.quote}"
      </blockquote>

      <div className="emotion-footer">
        <span className="emotion-timestamp">{emotion.timestamp}</span>
        {!disabled && (
          <button
            className="remove-button"
            onClick={onRemove}
            aria-label="Remove emotion"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  )
}

export default EmotionCard
