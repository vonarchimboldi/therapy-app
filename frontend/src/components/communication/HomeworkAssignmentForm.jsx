import React, { useState, useRef } from 'react'
import './HomeworkAssignment.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const HomeworkAssignmentForm = ({ clientId, sessionId, onSuccess, onCancel }) => {
  const [title, setTitle] = useState('')
  const [instructions, setInstructions] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [attachments, setAttachments] = useState([])
  const [uploading, setUploading] = useState(false)
  const [creating, setCreating] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return

    setUploading(true)
    const newAttachments = []

    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch(`${API_URL}/api/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
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
    if (!title.trim() || !instructions.trim()) {
      alert('Please fill in title and instructions')
      return
    }

    setCreating(true)
    try {
      const response = await fetch(`${API_URL}/api/homework`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          client_id: clientId,
          session_id: sessionId,
          title,
          instructions,
          due_date: dueDate || null,
          attachments
        })
      })

      if (response.ok) {
        const assignment = await response.json()
        if (onSuccess) onSuccess(assignment)
        // Reset form
        setTitle('')
        setInstructions('')
        setDueDate('')
        setAttachments([])
      } else {
        alert('Failed to create homework assignment')
      }
    } catch (err) {
      console.error('Error creating homework:', err)
      alert('Failed to create homework assignment')
    } finally {
      setCreating(false)
    }
  }

  return (
    <form className="homework-form" onSubmit={handleSubmit}>
      <h3>Assign Homework</h3>

      <div className="form-field">
        <label>Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Thought Record Exercise"
          required
        />
      </div>

      <div className="form-field">
        <label>Instructions *</label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Describe what the client needs to do..."
          rows={6}
          required
        />
      </div>

      <div className="form-field">
        <label>Due Date (optional)</label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      <div className="form-field">
        <label>Attachments (optional)</label>
        <button
          type="button"
          className="btn-attach"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : '📎 Attach Files'}
        </button>

        {attachments.length > 0 && (
          <div className="attachments-list">
            {attachments.map((att, index) => (
              <div key={index} className="attachment-item">
                <span className="attachment-icon">
                  {att.type === 'image' ? '🖼' : '📄'}
                </span>
                <span className="attachment-name">{att.filename}</span>
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => handleRemoveAttachment(index)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn-primary" disabled={creating || uploading}>
          {creating ? 'Creating...' : 'Assign Homework'}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        onChange={(e) => handleFileUpload(Array.from(e.target.files))}
        style={{ display: 'none' }}
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt"
      />
    </form>
  )
}

export default HomeworkAssignmentForm
