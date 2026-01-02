import React, { useState, useEffect } from 'react'
import './HomeworkAssignment.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const HomeworkAssignmentList = ({ clientId }) => {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [feedbackText, setFeedbackText] = useState({})

  useEffect(() => {
    if (clientId) {
      fetchAssignments()
    }
  }, [clientId])

  const fetchAssignments = async () => {
    try {
      const response = await fetch(`${API_URL}/api/homework/client/${clientId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setAssignments(data)
      }
    } catch (err) {
      console.error('Error fetching homework:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddFeedback = async (submissionId, assignmentId) => {
    const feedback = feedbackText[submissionId]
    if (!feedback?.trim()) return

    try {
      const response = await fetch(`${API_URL}/api/homework/submission/${submissionId}/feedback`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          therapist_feedback: feedback
        })
      })

      if (response.ok) {
        // Refresh assignments
        fetchAssignments()
        setFeedbackText({ ...feedbackText, [submissionId]: '' })
      }
    } catch (err) {
      console.error('Error adding feedback:', err)
      alert('Failed to add feedback')
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      assigned: { label: 'Assigned', className: 'status-assigned' },
      submitted: { label: 'Submitted', className: 'status-submitted' },
      reviewed: { label: 'Reviewed', className: 'status-reviewed' },
      completed: { label: 'Completed', className: 'status-completed' }
    }
    const config = statusConfig[status] || statusConfig.assigned
    return <span className={`status-badge ${config.className}`}>{config.label}</span>
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'completed' || status === 'reviewed') return false
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
          className="attachment-link"
        >
          <img
            src={`${API_URL}${attachment.url}`}
            alt={attachment.filename}
            className="attachment-thumbnail"
          />
        </a>
      )
    }

    return (
      <a
        key={attachment.url}
        href={`${API_URL}${attachment.url}`}
        target="_blank"
        rel="noopener noreferrer"
        className="attachment-link file"
      >
        <span className="file-icon">📄</span>
        <span>{attachment.filename}</span>
      </a>
    )
  }

  if (loading) {
    return <div className="homework-loading">Loading homework...</div>
  }

  if (assignments.length === 0) {
    return (
      <div className="no-homework">
        <p>No homework assignments yet.</p>
      </div>
    )
  }

  return (
    <div className="homework-list">
      {assignments.map((assignment) => {
        const isExpanded = expandedId === assignment.id
        const overdue = isOverdue(assignment.due_date, assignment.status)

        return (
          <div key={assignment.id} className="homework-card">
            <div
              className="homework-header"
              onClick={() => setExpandedId(isExpanded ? null : assignment.id)}
            >
              <div className="homework-title-row">
                <h4 className="homework-title">{assignment.title}</h4>
                {getStatusBadge(assignment.status)}
              </div>

              <div className="homework-meta">
                {assignment.due_date && (
                  <span className={`due-date ${overdue ? 'overdue' : ''}`}>
                    Due: {formatDate(assignment.due_date)}
                    {overdue && ' (overdue)'}
                  </span>
                )}
                <span className="assigned-date">
                  Assigned: {formatDate(assignment.created_at)}
                </span>
              </div>

              <button className="expand-icon" type="button">
                {isExpanded ? '▼' : '▶'}
              </button>
            </div>

            {isExpanded && (
              <div className="homework-details">
                <div className="instructions-section">
                  <h5>Instructions</h5>
                  <p className="instructions-text">{assignment.instructions}</p>
                </div>

                {assignment.attachments && assignment.attachments.length > 0 && (
                  <div className="attachments-section">
                    <h5>Attachments</h5>
                    <div className="attachments-grid">
                      {assignment.attachments.map(att => renderAttachment(att))}
                    </div>
                  </div>
                )}

                {assignment.submission ? (
                  <div className="submission-section">
                    <h5>Client Submission</h5>
                    <div className="submission-content">
                      <p className="submission-date">
                        Submitted: {formatDate(assignment.submission.submitted_at)}
                      </p>
                      <p className="submission-text">{assignment.submission.content}</p>

                      {assignment.submission.attachments && assignment.submission.attachments.length > 0 && (
                        <div className="attachments-grid">
                          {assignment.submission.attachments.map(att => renderAttachment(att))}
                        </div>
                      )}

                      {assignment.submission.therapist_feedback ? (
                        <div className="feedback-section">
                          <h6>Your Feedback</h6>
                          <p className="feedback-text">{assignment.submission.therapist_feedback}</p>
                          <p className="feedback-date">
                            {formatDate(assignment.submission.feedback_at)}
                          </p>
                        </div>
                      ) : (
                        <div className="feedback-form">
                          <h6>Add Feedback</h6>
                          <textarea
                            value={feedbackText[assignment.submission.id] || ''}
                            onChange={(e) =>
                              setFeedbackText({
                                ...feedbackText,
                                [assignment.submission.id]: e.target.value
                              })
                            }
                            placeholder="Provide feedback on this submission..."
                            rows={4}
                          />
                          <button
                            className="btn-primary"
                            onClick={() =>
                              handleAddFeedback(assignment.submission.id, assignment.id)
                            }
                            disabled={!feedbackText[assignment.submission.id]?.trim()}
                          >
                            Submit Feedback
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="no-submission">
                    <p>Awaiting client submission</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default HomeworkAssignmentList
