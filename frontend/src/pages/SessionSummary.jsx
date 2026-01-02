import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import './SessionSummary.css'

// Sub-components (to be created)
import EmotionCard from '../components/session-summary/EmotionCard'
import LifeDomainCard from '../components/session-summary/LifeDomainCard'
import InterventionRow from '../components/session-summary/InterventionRow'
import ClarifyingQuestions from '../components/session-summary/ClarifyingQuestions'
import SummaryTab from '../components/session-summary/SummaryTab'
import TranscriptTab from '../components/session-summary/TranscriptTab'
import SessionToDos from '../components/communication/SessionToDos'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const SessionSummary = () => {
  const { sessionId } = useParams()
  const navigate = useNavigate()

  // Session metadata
  const [sessionMeta, setSessionMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)

  // Active tab
  const [activeTab, setActiveTab] = useState('review') // review | summary | transcript | todos

  // AI-assisted data
  const [emotions, setEmotions] = useState([])
  const [lifeDomains, setLifeDomains] = useState([])
  const [interventions, setInterventions] = useState([])
  const [clarifyingQuestions, setClarifyingQuestions] = useState([])
  const [draftSummary, setDraftSummary] = useState('')
  const [therapistNotes, setTherapistNotes] = useState([])
  const [transcript, setTranscript] = useState(null)
  const [isFinalized, setIsFinalized] = useState(false)

  // Load session data
  useEffect(() => {
    if (sessionId) {
      loadSessionData()
    }
  }, [sessionId])

  const loadSessionData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/sessions/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()

        // Set session metadata
        setSessionMeta({
          date: data.session_date,
          time: data.session_time,
          duration: data.duration_minutes,
          clientId: data.client_id,
          clientInitials: data.client_name ? getInitials(data.client_name) : 'N/A',
          status: data.status
        })

        // Load AI-assisted data if it exists
        if (data.ai_assisted_data) {
          const aiData = typeof data.ai_assisted_data === 'string'
            ? JSON.parse(data.ai_assisted_data)
            : data.ai_assisted_data

          setEmotions(aiData.emotions || [])
          setLifeDomains(aiData.lifeDomains || [])
          setInterventions(aiData.interventions || [])
          setClarifyingQuestions(aiData.clarifyingQuestions || [])
          setDraftSummary(aiData.draftSummary || '')
          setTherapistNotes(aiData.therapistNotes || [])
          setTranscript(aiData.transcript || null)
          setIsFinalized(aiData.isFinalized || false)
        }
      }
    } catch (error) {
      console.error('Error loading session:', error)
    } finally {
      setLoading(false)
    }
  }

  // Auto-save functionality
  useEffect(() => {
    if (!sessionId || loading) return

    const autoSaveTimer = setTimeout(() => {
      saveSessionData()
    }, 2000) // Auto-save 2 seconds after last change

    return () => clearTimeout(autoSaveTimer)
  }, [emotions, lifeDomains, interventions, clarifyingQuestions, draftSummary, therapistNotes, transcript])

  const saveSessionData = async () => {
    if (isFinalized) return // Don't auto-save finalized sessions

    setSaving(true)
    try {
      const aiAssistedData = {
        emotions,
        lifeDomains,
        interventions,
        clarifyingQuestions,
        draftSummary,
        therapistNotes,
        transcript,
        isFinalized
      }

      const response = await fetch(`${API_URL}/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ai_assisted_data: JSON.stringify(aiAssistedData)
        })
      })

      if (response.ok) {
        setLastSaved(new Date())
      }
    } catch (error) {
      console.error('Error saving session:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleFinalize = async () => {
    const confirmed = window.confirm('Finalize this session summary? You will not be able to make further changes.')
    if (!confirmed) return

    setIsFinalized(true)

    // Save immediately
    const aiAssistedData = {
      emotions,
      lifeDomains,
      interventions,
      clarifyingQuestions,
      draftSummary,
      therapistNotes,
      transcript,
      isFinalized: true
    }

    try {
      await fetch(`${API_URL}/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ai_assisted_data: JSON.stringify(aiAssistedData),
          status: 'completed'
        })
      })

      // Navigate back to dashboard
      navigate('/dashboard')
    } catch (error) {
      console.error('Error finalizing session:', error)
      setIsFinalized(false)
    }
  }

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getUnansweredQuestions = () => {
    return clarifyingQuestions.filter(q => q.response === null)
  }

  const getConfirmedInterventions = () => {
    return interventions.filter(i => i.confidence !== 'uncertain' || i.confirmed === true)
  }

  const getUncertainInterventions = () => {
    return interventions.filter(i => i.confidence === 'uncertain' && i.confirmed === null)
  }

  if (loading) {
    return (
      <div className="session-summary-loading">
        <div className="spinner"></div>
        <p>Loading session...</p>
      </div>
    )
  }

  if (!sessionMeta) {
    return (
      <div className="session-summary-error">
        <p>Session not found</p>
        <button onClick={() => navigate('/dashboard')}>Return to Dashboard</button>
      </div>
    )
  }

  const unansweredQuestions = getUnansweredQuestions()
  const confirmedInterventions = getConfirmedInterventions()
  const uncertainInterventions = getUncertainInterventions()

  return (
    <div className="session-summary-workspace">
      {/* Sticky Header */}
      <header className="session-summary-header">
        <div className="header-content">
          <div className="session-info">
            <button
              className="back-button"
              onClick={() => navigate('/dashboard')}
              aria-label="Back to dashboard"
            >
              ← Back
            </button>
            <div className="session-meta">
              <span className="client-initials">{sessionMeta.clientInitials}</span>
              <span className="session-date">{formatDate(sessionMeta.date)}</span>
              {sessionMeta.time && <span className="session-time">{sessionMeta.time}</span>}
              <span className="session-duration">{sessionMeta.duration} min</span>
            </div>
          </div>

          <div className="header-actions">
            <select
              className="progress-select"
              defaultValue="stable"
              disabled={isFinalized}
            >
              <option value="improving">Improving</option>
              <option value="stable">Stable</option>
              <option value="declining">Declining</option>
            </select>

            <button
              className="finalize-button"
              onClick={handleFinalize}
              disabled={isFinalized}
            >
              {isFinalized ? 'Finalized' : 'Finalize'}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="tab-navigation">
          <button
            className={`tab ${activeTab === 'review' ? 'active' : ''}`}
            onClick={() => setActiveTab('review')}
          >
            Review
            {unansweredQuestions.length > 0 && (
              <span className="badge">{unansweredQuestions.length}</span>
            )}
          </button>
          <button
            className={`tab ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            Summary
          </button>
          <button
            className={`tab ${activeTab === 'todos' ? 'active' : ''}`}
            onClick={() => setActiveTab('todos')}
          >
            To-Dos
          </button>
          <button
            className={`tab ${activeTab === 'transcript' ? 'active' : ''}`}
            onClick={() => setActiveTab('transcript')}
          >
            Transcript
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="session-summary-content">
        <div className="content-container">
          {activeTab === 'review' && (
            <div className="review-tab">
              {/* Clarifying Questions Section */}
              {unansweredQuestions.length > 0 && (
                <ClarifyingQuestions
                  questions={unansweredQuestions}
                  onAnswerQuestion={(questionId, response) => {
                    setClarifyingQuestions(prev =>
                      prev.map(q =>
                        q.id === questionId ? { ...q, response } : q
                      )
                    )
                  }}
                  disabled={isFinalized}
                />
              )}

              {/* Emotions Section */}
              <section className="summary-section">
                <div className="section-header">
                  <h2>Emotions</h2>
                  {!isFinalized && (
                    <button className="add-link">+ Add emotion</button>
                  )}
                </div>

                {emotions.length === 0 ? (
                  <p className="empty-state">No emotions extracted yet</p>
                ) : (
                  <div className="emotions-grid">
                    {emotions.map(emotion => (
                      <EmotionCard
                        key={emotion.id}
                        emotion={emotion}
                        onRemove={() => {
                          if (!isFinalized) {
                            setEmotions(prev => prev.filter(e => e.id !== emotion.id))
                          }
                        }}
                        disabled={isFinalized}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Life Domains Section */}
              <section className="summary-section">
                <div className="section-header">
                  <h2>Life Domains</h2>
                  {!isFinalized && (
                    <button className="add-link">+ Add domain</button>
                  )}
                </div>

                {lifeDomains.length === 0 ? (
                  <p className="empty-state">No life domains identified yet</p>
                ) : (
                  <div className="domains-grid">
                    {lifeDomains.map(domain => (
                      <LifeDomainCard
                        key={domain.id}
                        domain={domain}
                        onTogglePrimary={() => {
                          if (!isFinalized) {
                            setLifeDomains(prev =>
                              prev.map(d =>
                                d.id === domain.id
                                  ? { ...d, isPrimary: !d.isPrimary }
                                  : d
                              )
                            )
                          }
                        }}
                        onRemove={() => {
                          if (!isFinalized) {
                            setLifeDomains(prev => prev.filter(d => d.id !== domain.id))
                          }
                        }}
                        disabled={isFinalized}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Interventions Section */}
              <section className="summary-section">
                <div className="section-header">
                  <h2>Interventions</h2>
                  {!isFinalized && (
                    <button className="add-link">+ Add intervention</button>
                  )}
                </div>

                {interventions.length === 0 ? (
                  <p className="empty-state">No interventions detected yet</p>
                ) : (
                  <div className="interventions-list">
                    {/* Uncertain interventions first */}
                    {uncertainInterventions.length > 0 && (
                      <>
                        <h3 className="subsection-title">Needs Confirmation</h3>
                        {uncertainInterventions.map(intervention => (
                          <InterventionRow
                            key={intervention.id}
                            intervention={intervention}
                            onConfirm={(confirmed) => {
                              if (!isFinalized) {
                                setInterventions(prev =>
                                  prev.map(i =>
                                    i.id === intervention.id
                                      ? { ...i, confirmed }
                                      : i
                                  )
                                )
                              }
                            }}
                            disabled={isFinalized}
                          />
                        ))}
                      </>
                    )}

                    {/* Confirmed interventions */}
                    {confirmedInterventions.length > 0 && (
                      <>
                        {uncertainInterventions.length > 0 && (
                          <h3 className="subsection-title">Confirmed</h3>
                        )}
                        {confirmedInterventions.map(intervention => (
                          <InterventionRow
                            key={intervention.id}
                            intervention={intervention}
                            onConfirm={null}
                            disabled={isFinalized}
                          />
                        ))}
                      </>
                    )}
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === 'summary' && (
            <SummaryTab
              draftSummary={draftSummary}
              therapistNotes={therapistNotes}
              onUpdateSummary={(newSummary) => {
                if (!isFinalized) {
                  setDraftSummary(newSummary)
                }
              }}
              disabled={isFinalized}
            />
          )}

          {activeTab === 'todos' && (
            <div className="todos-tab">
              <SessionToDos
                sessionId={sessionId}
                clientId={sessionMeta.clientId}
              />
            </div>
          )}

          {activeTab === 'transcript' && (
            <TranscriptTab
              transcript={transcript}
              onUploadTranscript={(newTranscript) => {
                if (!isFinalized) {
                  setTranscript(newTranscript)
                }
              }}
              disabled={isFinalized}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="session-summary-footer">
        <div className="footer-content">
          <div className="item-counts">
            <span>{emotions.length} emotions</span>
            <span>•</span>
            <span>{lifeDomains.filter(d => d.isPrimary).length}/{lifeDomains.length} primary domains</span>
            <span>•</span>
            <span>{confirmedInterventions.length} interventions</span>
          </div>

          <div className="save-status">
            {saving ? (
              <span className="saving">Saving...</span>
            ) : lastSaved ? (
              <span className="saved">Saved {formatTimeSince(lastSaved)}</span>
            ) : null}
          </div>
        </div>
      </footer>
    </div>
  )
}

// Helper function to format time since last save
const formatTimeSince = (date) => {
  const seconds = Math.floor((new Date() - date) / 1000)

  if (seconds < 10) return 'just now'
  if (seconds < 60) return `${seconds}s ago`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

export default SessionSummary
