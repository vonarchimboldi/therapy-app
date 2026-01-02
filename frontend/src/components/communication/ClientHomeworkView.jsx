import React, { useState, useRef } from 'react'
import './ClientHomeworkView.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const ClientHomeworkView = ({ assignment, clientId, onSubmitSuccess }) => {
  const [content, setContent] = useState('')
  const [attachments, setAttachments] = useState([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return

    setUploading(true)
    const newAttachments = []

    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)

        // Note: This endpoint would need to be modified to not require therapist auth
        // For now, we'll handle file uploads differently for clients
        const response = await fetch(`${API_URL}/api/upload`, {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          const data = await response.json()
          newAttachments.push(data)
        } else {
          alert(`Failed to upload ${file.name}`)
        }
      }

      setAttachments([...attachments, ...newAttachments])
    } catch (err) {
      console.error('Error uploading files:', err)
      alert('Failed to upload files')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim() && attachments.length === 0) {
      alert('Please add some content or attachments before submitting')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(
        `${API_URL}/api/homework/${assignment.id}/submit?client_id=${clientId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            assignment_id: assignment.id,
            content,
            attachments
          })
        }
      )

      if (response.ok) {
        if (onSubmitSuccess) onSubmitSuccess()
        // Reset form
        setContent('')
        setAttachments([])
        alert('Homework submitted successfully!')
      } else {
        alert('Failed to submit homework')
      }
    } catch (err) {
      console.error('Error submitting homework:', err)
      alert('Failed to submit homework')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  const isOverdue = (dueDate) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  const renderAttachment = (attachment) => {
    if (attachment.type === 'image') {
      return (
        <a
          key={attachment.url}
          href={`${API_URL}${attachment.url}`}
          target="_blank"
          rel="noopener noreferrer"
          className="assignment-attachment"
        >
          <img src={`${API_URL}${attachment.url}`} alt={attachment.filename} />
        </a>
      )
    }

    return (
      <a
        key={attachment.url}
        href={`${API_URL}${attachment.url}`}
        target="_blank"
        rel="noopener noreferrer"
        className="assignment-attachment file"
      >
        <span className="file-icon">📄</span>
        <span>{attachment.filename}</span>
      </a>
    )
  }

  return (
    <div className="client-homework-view">
      <div className="homework-assignment-card">
        <div className="assignment-header">
          <h2>{assignment.title}</h2>
          {assignment.due_date && (
            <p className={`due-date ${isOverdue(assignment.due_date) ? 'overdue' : ''}`}>
              Due: {formatDate(assignment.due_date)}
              {isOverdue(assignment.due_date) && ' (overdue)'}
            </p>
          )}
        </div>

        <div className="assignment-instructions">
          <h3>Instructions</h3>
          <p>{assignment.instructions}</p>
        </div>

        {assignment.attachments && assignment.attachments.length > 0 && (
          <div className="assignment-attachments">
            <h3>Reference Materials</h3>
            <div className="attachments-grid">
              {assignment.attachments.map(att => renderAttachment(att))}
            </div>
          </div>
        )}

        {assignment.submission ? (
          <div className="existing-submission">
            <h3>Your Submission</h3>
            <div className="submission-box">
              <p className="submission-date">
                Submitted on {formatDate(assignment.submission.submitted_at)}
              </p>
              <p className="submission-content">{assignment.submission.content}</p>

              {assignment.submission.attachments && assignment.submission.attachments.length > 0 && (
                <div className="attachments-grid">
                  {assignment.submission.attachments.map(att => renderAttachment(att))}
                </div>
              )}

              {assignment.submission.therapist_feedback && (
                <div className="therapist-feedback">
                  <h4>Feedback from your therapist</h4>
                  <p>{assignment.submission.therapist_feedback}</p>
                  <p className="feedback-date">
                    {formatDate(assignment.submission.feedback_at)}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <form className="submission-form" onSubmit={handleSubmit}>
            <h3>Your Response</h3>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your response here..."
              rows={8}
              required
            />

            <div className="form-actions">
              <button
                type="button"
                className="btn-attach"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || submitting}
              >
                {uploading ? 'Uploading...' : '📎 Attach Files'}
              </button>

              <button
                type="submit"
                className="btn-submit"
                disabled={submitting || uploading || (!content.trim() && attachments.length === 0)}
              >
                {submitting ? 'Submitting...' : 'Submit Homework'}
              </button>
            </div>

            {attachments.length > 0 && (
              <div className="attachments-preview">
                {attachments.map((att, index) => (
                  <div key={index} className="attachment-preview-item">
                    <span className="attachment-icon">
                      {att.type === 'image' ? '🖼' : '📄'}
                    </span>
                    <span className="attachment-name">{att.filename}</span>
                    <button
                      type="button"
                      className="btn-remove-attachment"
                      onClick={() => handleRemoveAttachment(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => handleFileUpload(Array.from(e.target.files))}
              style={{ display: 'none' }}
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
          </form>
        )}
      </div>
    </div>
  )
}

export default ClientHomeworkView
