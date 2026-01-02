import React, { useState } from 'react'
import './TranscriptTab.css'

const TranscriptTab = ({ transcript, onUploadTranscript, disabled }) => {
  const [dragActive, setDragActive] = useState(false)
  const [pasteMode, setPasteMode] = useState(false)
  const [pastedText, setPastedText] = useState('')

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (disabled) return

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      readFile(file)
    }
  }

  const handleFileInput = (e) => {
    if (disabled) return

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      readFile(file)
    }
  }

  const readFile = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      onUploadTranscript(e.target.result)
    }
    reader.readAsText(file)
  }

  const handlePaste = () => {
    if (pastedText.trim()) {
      onUploadTranscript(pastedText.trim())
      setPasteMode(false)
      setPastedText('')
    }
  }

  if (transcript) {
    return (
      <div className="transcript-tab">
        <div className="transcript-header">
          <h2>Session Transcript</h2>
          {!disabled && (
            <button
              className="replace-link"
              onClick={() => onUploadTranscript(null)}
            >
              Replace
            </button>
          )}
        </div>

        <div className="transcript-content">
          <pre className="transcript-text">{transcript}</pre>
        </div>
      </div>
    )
  }

  if (pasteMode) {
    return (
      <div className="transcript-tab">
        <div className="paste-mode">
          <h2>Paste Transcript</h2>
          <textarea
            className="paste-textarea"
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Paste your session transcript here..."
            rows={20}
            autoFocus
          />
          <div className="paste-actions">
            <button
              className="cancel-button"
              onClick={() => {
                setPasteMode(false)
                setPastedText('')
              }}
            >
              Cancel
            </button>
            <button
              className="save-button"
              onClick={handlePaste}
              disabled={!pastedText.trim()}
            >
              Save Transcript
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="transcript-tab">
      <div className="transcript-upload">
        <h2>Add Session Transcript</h2>
        <p className="upload-helper">
          Upload or paste your session transcript to generate AI-assisted observations
        </p>

        <div
          className={`dropzone ${dragActive ? 'active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="dropzone-content">
            <svg
              className="upload-icon"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>

            <p className="dropzone-title">
              Drop transcript file here
            </p>
            <p className="dropzone-subtitle">
              or
            </p>

            <div className="upload-buttons">
              <label className="upload-button">
                <input
                  type="file"
                  onChange={handleFileInput}
                  accept=".txt,.doc,.docx"
                  disabled={disabled}
                />
                Choose File
              </label>

              <button
                className="paste-button"
                onClick={() => setPasteMode(true)}
                disabled={disabled}
              >
                Paste Text
              </button>
            </div>

            <p className="upload-formats">
              Supports .txt, .doc, .docx
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TranscriptTab
