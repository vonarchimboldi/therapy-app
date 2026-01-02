import React from 'react'
import './SummaryTab.css'

const SummaryTab = ({ draftSummary, therapistNotes, onUpdateSummary, disabled }) => {
  return (
    <div className="summary-tab">
      <div className="summary-header">
        <h2>Session Summary</h2>
        {!disabled && (
          <button className="regenerate-link">Regenerate</button>
        )}
      </div>

      <p className="summary-helper">
        Draft generated from transcript · edit freely
      </p>

      <textarea
        className="summary-editor"
        value={draftSummary}
        onChange={(e) => onUpdateSummary(e.target.value)}
        placeholder="AI-generated summary will appear here..."
        disabled={disabled}
        rows={20}
      />

      {therapistNotes && therapistNotes.length > 0 && (
        <div className="therapist-notes-section">
          <h3>Your Notes</h3>
          <p className="notes-helper">From clarifying questions</p>

          <div className="notes-list">
            {therapistNotes.map(note => (
              <div key={note.id} className="note-item">
                <p className="note-content">{note.note}</p>
                <span className="note-timestamp">
                  {new Date(note.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default SummaryTab
