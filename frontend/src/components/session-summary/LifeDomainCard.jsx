import React from 'react'
import './LifeDomainCard.css'

const LifeDomainCard = ({ domain, onTogglePrimary, onRemove, disabled }) => {
  const formatDomainName = (name) => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <div className={`domain-card ${domain.isPrimary ? 'primary' : ''}`}>
      <div className="domain-header">
        <h3 className="domain-name">{formatDomainName(domain.domain)}</h3>
        {domain.isPrimary && (
          <span className="primary-badge">Primary</span>
        )}
      </div>

      <p className="domain-notes">{domain.notes}</p>

      <div className="domain-footer">
        <span className="mention-count">
          mentioned {domain.mentionCount}x
        </span>

        <div className="domain-actions">
          {!disabled && (
            <>
              <button
                className="toggle-primary-button"
                onClick={onTogglePrimary}
                aria-label={domain.isPrimary ? 'Unmark as primary' : 'Mark as primary'}
              >
                {domain.isPrimary ? 'Unmark' : 'Mark primary'}
              </button>
              <button
                className="remove-button"
                onClick={onRemove}
                aria-label="Remove domain"
              >
                Remove
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default LifeDomainCard
