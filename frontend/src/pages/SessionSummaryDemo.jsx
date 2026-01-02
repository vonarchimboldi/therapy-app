import React, { useState } from 'react'
import './SessionSummary.css'

// Sub-components
import EmotionCard from '../components/session-summary/EmotionCard'
import LifeDomainCard from '../components/session-summary/LifeDomainCard'
import InterventionRow from '../components/session-summary/InterventionRow'
import ClarifyingQuestions from '../components/session-summary/ClarifyingQuestions'
import SummaryTab from '../components/session-summary/SummaryTab'
import TranscriptTab from '../components/session-summary/TranscriptTab'

// Dummy data for demo
const DEMO_DATA = {
  sessionMeta: {
    date: '2025-12-15',
    time: '14:00',
    duration: 50,
    clientInitials: 'JD',
    status: 'completed'
  },
  emotions: [
    {
      id: 'emotion-1',
      name: 'anxiety',
      intensity: 'high',
      quote: 'I just can\'t stop thinking about what might go wrong at the presentation. My mind races every night.',
      timestamp: '12:15'
    },
    {
      id: 'emotion-2',
      name: 'frustration',
      intensity: 'medium',
      quote: 'It feels like no matter what I do, I\'m always behind. There\'s never enough time.',
      timestamp: '18:30'
    },
    {
      id: 'emotion-3',
      name: 'hope',
      intensity: 'low',
      quote: 'Maybe if I can just get through this month, things will settle down a bit.',
      timestamp: '35:45'
    },
    {
      id: 'emotion-4',
      name: 'shame',
      intensity: 'high',
      quote: 'I should be able to handle this. Everyone else seems to manage just fine. What\'s wrong with me?',
      timestamp: '22:10'
    }
  ],
  lifeDomains: [
    {
      id: 'domain-1',
      domain: 'career',
      notes: 'Discussed upcoming work presentation causing significant stress. Client feels unprepared despite extensive preparation.',
      mentionCount: 8,
      isPrimary: true
    },
    {
      id: 'domain-2',
      domain: 'relationships',
      notes: 'Partner has been supportive but client feels guilty about being "a burden" with work stress.',
      mentionCount: 5,
      isPrimary: true
    },
    {
      id: 'domain-3',
      domain: 'self_esteem',
      notes: 'Strong self-critical thoughts. Comparing self to colleagues and feeling inadequate.',
      mentionCount: 6,
      isPrimary: false
    },
    {
      id: 'domain-4',
      domain: 'physical_health',
      notes: 'Sleep disruption due to anxiety. Mentioned difficulty falling asleep 3-4 nights per week.',
      mentionCount: 3,
      isPrimary: false
    },
    {
      id: 'domain-5',
      domain: 'family',
      notes: 'Brief mention of mother calling more frequently, client finding it hard to engage.',
      mentionCount: 1,
      isPrimary: false
    }
  ],
  interventions: [
    {
      id: 'intervention-1',
      type: 'Cognitive Restructuring',
      evidence: 'Worked with client to identify and challenge catastrophic thinking patterns about the presentation. Used evidence-based questioning.',
      confidence: 'high',
      confirmed: true
    },
    {
      id: 'intervention-2',
      type: 'Mindfulness',
      evidence: 'Introduced 5-4-3-2-1 grounding technique when client described racing thoughts at night.',
      confidence: 'high',
      confirmed: true
    },
    {
      id: 'intervention-3',
      type: 'Behavioral Activation',
      evidence: 'Client mentioned "maybe going for walks again" but unclear if this was therapist-suggested or client-initiated.',
      confidence: 'uncertain',
      confirmed: null
    },
    {
      id: 'intervention-4',
      type: 'Psychoeducation',
      evidence: 'Discussed the relationship between anxiety and sleep, normalized the client\'s experience.',
      confidence: 'medium',
      confirmed: true
    },
    {
      id: 'intervention-5',
      type: 'Exposure Therapy',
      evidence: 'Possible reference to "practicing the presentation" but context unclear.',
      confidence: 'uncertain',
      confirmed: null
    }
  ],
  clarifyingQuestions: [
    {
      id: 'question-1',
      question: 'Was the "walking" discussion part of a behavioral activation plan, or just casual conversation?',
      category: 'clinical',
      response: null
    },
    {
      id: 'question-2',
      question: 'Did the client mention a specific presentation date, or was it general work anxiety?',
      category: 'context',
      response: null
    },
    {
      id: 'question-3',
      question: 'Should the shame response be categorized as a primary emotion or as part of self-esteem concerns?',
      category: 'categorization',
      response: null
    }
  ],
  draftSummary: `Client presented with elevated anxiety related to an upcoming work presentation. Primary concerns centered on perfectionism and fear of negative evaluation from colleagues. Despite reporting adequate preparation, client expressed persistent worry and catastrophic thinking about potential failure.

Key themes included self-criticism and feelings of inadequacy when comparing self to peers. Client described feeling like an "imposter" and questioned their competence despite objective evidence of strong job performance.

Sleep disruption was noted, with client reporting difficulty falling asleep 3-4 nights per week due to racing thoughts. Partner has been supportive, though client expressed guilt about "burdening" them with work stress.

Therapeutic interventions focused on cognitive restructuring to challenge all-or-nothing thinking patterns. Introduced grounding techniques for managing anxiety symptoms, particularly nighttime rumination. Provided psychoeducation about the anxiety-sleep connection.

Client demonstrated good insight and engagement with interventions. Homework assigned: practice 5-4-3-2-1 grounding technique nightly before bed, track anxiety levels related to presentation preparation.

Overall progress: Stable. Client continues to struggle with work-related anxiety but shows consistent engagement in treatment and willingness to practice new coping strategies.`,
  therapistNotes: [],
  transcript: `[00:02:15] Therapist: How have things been since we last met?

[00:02:18] Client: Honestly, pretty stressful. I have this big presentation coming up at work, and I just can't stop thinking about it.

[00:02:30] Therapist: Tell me more about that. What's been going through your mind?

[00:02:35] Client: I just can't stop thinking about what might go wrong at the presentation. My mind races every night. Like, what if I freeze up? What if they ask questions I can't answer? What if they realize I don't actually know what I'm doing?

[00:12:15] Therapist: When you say your mind races at night, what does that look like?

[00:12:20] Client: I'll be lying in bed, and I'll just replay the presentation over and over. Or I'll imagine all the ways it could go wrong. Sometimes I'm awake for hours.

[00:18:28] Client: It feels like no matter what I do, I'm always behind. There's never enough time. I look at my colleagues and they all seem so put together, so confident.

[00:22:08] Client: I should be able to handle this. Everyone else seems to manage just fine. What's wrong with me?

[00:22:15] Therapist: I'm hearing a lot of comparison to others, and some really harsh self-criticism. Let's pause and look at that thought: "Everyone else manages just fine."

[00:35:40] Client: Maybe if I can just get through this month, things will settle down a bit.

[00:42:10] Therapist: I want to teach you something that might help when you notice your thoughts racing, especially at night. It's called the 5-4-3-2-1 technique...`,
  isFinalized: false
}

const SessionSummaryDemo = () => {
  // State management
  const [activeTab, setActiveTab] = useState('review')
  const [emotions, setEmotions] = useState(DEMO_DATA.emotions)
  const [lifeDomains, setLifeDomains] = useState(DEMO_DATA.lifeDomains)
  const [interventions, setInterventions] = useState(DEMO_DATA.interventions)
  const [clarifyingQuestions, setClarifyingQuestions] = useState(DEMO_DATA.clarifyingQuestions)
  const [draftSummary, setDraftSummary] = useState(DEMO_DATA.draftSummary)
  const [therapistNotes, setTherapistNotes] = useState(DEMO_DATA.therapistNotes)
  const [transcript, setTranscript] = useState(DEMO_DATA.transcript)
  const [isFinalized, setIsFinalized] = useState(DEMO_DATA.isFinalized)

  const sessionMeta = DEMO_DATA.sessionMeta

  const handleFinalize = () => {
    const confirmed = window.confirm('Finalize this session summary? You will not be able to make further changes.')
    if (confirmed) {
      setIsFinalized(true)
      alert('Session finalized! (In production, this would save and redirect to dashboard)')
    }
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

  const unansweredQuestions = getUnansweredQuestions()
  const confirmedInterventions = getConfirmedInterventions()
  const uncertainInterventions = getUncertainInterventions()

  return (
    <div className="session-summary-workspace">
      {/* Demo Banner */}
      <div style={{
        backgroundColor: '#3b82f6',
        color: 'white',
        padding: '0.75rem',
        textAlign: 'center',
        fontWeight: '500',
        fontSize: '0.875rem'
      }}>
        📋 DEMO MODE - This is a preview with sample data. No authentication required.
      </div>

      {/* Sticky Header */}
      <header className="session-summary-header">
        <div className="header-content">
          <div className="session-info">
            <button
              className="back-button"
              onClick={() => window.location.href = '/'}
              aria-label="Back to landing"
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
                    <button className="add-link" onClick={() => alert('Add emotion functionality would go here')}>
                      + Add emotion
                    </button>
                  )}
                </div>

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
              </section>

              {/* Life Domains Section */}
              <section className="summary-section">
                <div className="section-header">
                  <h2>Life Domains</h2>
                  {!isFinalized && (
                    <button className="add-link" onClick={() => alert('Add domain functionality would go here')}>
                      + Add domain
                    </button>
                  )}
                </div>

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
              </section>

              {/* Interventions Section */}
              <section className="summary-section">
                <div className="section-header">
                  <h2>Interventions</h2>
                  {!isFinalized && (
                    <button className="add-link" onClick={() => alert('Add intervention functionality would go here')}>
                      + Add intervention
                    </button>
                  )}
                </div>

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
            <span className="saved">Demo mode - changes not saved</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default SessionSummaryDemo
