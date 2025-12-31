import { useState, useEffect } from 'react'
import { useAuth, useUser, UserButton } from '@clerk/clerk-react'
import { getTrackConfig } from '../config/tracks'
import PracticeTypeModal from '../components/PracticeTypeModal'
import '../App.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// Loading Skeleton Components
const TodaySessionSkeleton = () => (
  <div className="skeleton-today-card">
    <div className="skeleton-time-block">
      <div className="skeleton skeleton-title" style={{width: '80px', height: '1.25rem'}}></div>
      <div className="skeleton skeleton-subtitle" style={{width: '60px', height: '0.875rem'}}></div>
    </div>
    <div>
      <div className="skeleton skeleton-title" style={{width: '150px', height: '1.25rem', marginBottom: '0.5rem'}}></div>
      <div className="skeleton skeleton-subtitle" style={{width: '80px', height: '1rem'}}></div>
    </div>
    <div className="skeleton skeleton-text" style={{width: '100%', height: '3rem'}}></div>
    <div style={{display: 'flex', gap: '0.5rem'}}>
      <div className="skeleton" style={{width: '60px', height: '32px'}}></div>
      <div className="skeleton" style={{width: '60px', height: '32px'}}></div>
    </div>
  </div>
)

const ClientCardSkeleton = () => (
  <div className="skeleton-client-card">
    <div style={{flex: 1}}>
      <div className="skeleton skeleton-title" style={{width: '120px', height: '1rem', marginBottom: '0.25rem'}}></div>
      <div className="skeleton skeleton-subtitle" style={{width: '80px', height: '0.875rem'}}></div>
    </div>
    <div className="skeleton" style={{width: '50px', height: '20px', borderRadius: '100px'}}></div>
  </div>
)

const SessionCardSkeleton = () => (
  <div className="skeleton-card">
    <div className="skeleton-card-header">
      <div style={{flex: 1}}>
        <div className="skeleton skeleton-title"></div>
        <div className="skeleton skeleton-subtitle"></div>
      </div>
      <div className="skeleton" style={{width: '60px', height: '24px', borderRadius: '100px'}}></div>
    </div>
    <div className="skeleton-body">
      <div className="skeleton skeleton-line"></div>
      <div className="skeleton skeleton-line"></div>
      <div className="skeleton skeleton-line"></div>
    </div>
  </div>
)

function Dashboard() {
  const { isSignedIn, getToken } = useAuth()
  const { user } = useUser()

  // Track configuration based on practice type
  const [practiceType, setPracticeType] = useState(null)
  const trackConfig = getTrackConfig(practiceType)

  // Migration modal state (for existing users without practice_type)
  const [showPracticeTypeModal, setShowPracticeTypeModal] = useState(false)

  // Dark mode state
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme')
    return savedTheme || 'light'
  })

  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showClientForm, setShowClientForm] = useState(false)
  const [showSessionForm, setShowSessionForm] = useState(false)
  const [viewingSession, setViewingSession] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [activeView, setActiveView] = useState('sessions') // 'sessions' or 'dashboard'

  // New state for Today view and scheduling
  const [appView, setAppView] = useState('today') // 'today', 'scheduled', or 'clients'
  const [todaySessions, setTodaySessions] = useState([])
  const [allScheduledSessions, setAllScheduledSessions] = useState([])
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [clientView, setClientView] = useState('summary') // 'summary', 'sessions', or 'analytics'

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const [clientFormData, setClientFormData] = useState({
    first_name: '', last_name: '', date_of_birth: '',
    phone: '', email: '', status: 'active'
  })

  const [scheduleFormData, setScheduleFormData] = useState({
    client_id: '',
    session_date: new Date().toISOString().split('T')[0],
    session_time: '14:00',
    duration_minutes: 50,
    status: 'scheduled'
  })

  const [sessionFormData, setSessionFormData] = useState({
    session_date: new Date().toISOString().split('T')[0],
    session_time: '14:00',
    duration_minutes: 50,
    status: 'completed',
    notes: '',
    summary: '',
    life_domains: {},
    emotional_themes: {},
    interventions: [],
    overall_progress: 'stable',
    session_summary: '',
    client_insights: '',
    homework_assigned: '',
    clinical_observations: '',
    risk_assessment: ''
  })

  // Todo state
  const [clientTodos, setClientTodos] = useState([])
  const [newTodoText, setNewTodoText] = useState('')

  // Session prep state
  const [sessionPrep, setSessionPrep] = useState(null)

  useEffect(() => {
    const initializeUser = async () => {
      try {
        if (!isSignedIn || !user) return

        const token = await getToken()

        // Sync therapist record and get practice_type
        const syncResponse = await fetch(`${API_BASE}/auth/sync`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (!syncResponse.ok) {
          throw new Error('Failed to sync user')
        }

        const therapistData = await syncResponse.json()
        console.log('Therapist data:', therapistData)

        // Set practice type from backend
        if (therapistData.practice_type) {
          setPracticeType(therapistData.practice_type)
        } else {
          // Show migration modal if no practice type
          setShowPracticeTypeModal(true)
          setLoading(false)
          return
        }

        // Load dashboard data
        fetchClients()
        if (appView === 'today') {
          fetchTodaySessions()
        } else if (appView === 'scheduled') {
          fetchAllScheduledSessions()
        }
      } catch (err) {
        setError(err.message)
        setLoading(false)
      }
    }
    initializeUser()
  }, [isSignedIn, user])

  useEffect(() => {
    if (selectedClient) {
      fetchSessions(selectedClient.id)
      fetchTodos(selectedClient.id)
      fetchSessionPrep(selectedClient.id)
      setClientView('summary')
    } else {
      setClientTodos([])
      setSessionPrep(null)
    }
  }, [selectedClient])

  useEffect(() => {
    if (appView === 'today') {
      fetchTodaySessions()
    } else if (appView === 'scheduled') {
      fetchAllScheduledSessions()
    }
  }, [appView])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      const response = await fetch(`${API_BASE}/clients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to fetch clients')
      const data = await response.json()
      setClients(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchSessions = async (clientId) => {
    try {
      const token = await getToken()
      const response = await fetch(`${API_BASE}/sessions?client_id=${clientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to fetch sessions')
      const data = await response.json()
      setSessions(data)
    } catch (err) {
      setError(err.message)
    }
  }

  const fetchTodaySessions = async () => {
    try {
      const token = await getToken()
      const response = await fetch(`${API_BASE}/sessions/today`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to fetch today sessions')
      const data = await response.json()
      setTodaySessions(data)
    } catch (err) {
      setError(err.message)
    }
  }

  const fetchAllScheduledSessions = async () => {
    try {
      const token = await getToken()
      const response = await fetch(`${API_BASE}/sessions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to fetch scheduled sessions')
      const data = await response.json()
      // Filter for scheduled sessions and sort by date/time
      const scheduled = data
        .filter(s => s.status === 'scheduled')
        .sort((a, b) => {
          if (a.session_date === b.session_date) {
            return (a.session_time || '').localeCompare(b.session_time || '')
          }
          return a.session_date.localeCompare(b.session_date)
        })
      setAllScheduledSessions(scheduled)
    } catch (err) {
      setError(err.message)
    }
  }

  // Todo functions
  const fetchTodos = async (clientId) => {
    try {
      const token = await getToken()
      const response = await fetch(`${API_BASE}/todos?client_id=${clientId}&status=open`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to fetch todos')
      const data = await response.json()
      setClientTodos(data)
    } catch (err) {
      setError(err.message)
    }
  }

  const createTodo = async (text, clientId, sourceSessionId = null) => {
    try {
      const token = await getToken()
      const response = await fetch(`${API_BASE}/todos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text,
          client_id: clientId,
          source_session_id: sourceSessionId
        })
      })
      if (!response.ok) throw new Error('Failed to create todo')
      await fetchTodos(clientId)
    } catch (err) {
      setError(err.message)
    }
  }

  const updateTodoStatus = async (todoId, status, completedSessionId = null) => {
    try {
      const token = await getToken()
      const response = await fetch(`${API_BASE}/todos/${todoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status,
          completed_session_id: completedSessionId
        })
      })
      if (!response.ok) throw new Error('Failed to update todo')
      // Refresh todos for the current client
      if (selectedClient) {
        await fetchTodos(selectedClient.id)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const fetchSessionPrep = async (clientId) => {
    try {
      const token = await getToken()
      const response = await fetch(`${API_BASE}/clients/${clientId}/session-prep`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to fetch session prep')
      const data = await response.json()
      setSessionPrep(data)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleClientSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = await getToken()
      const response = await fetch(`${API_BASE}/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(clientFormData)
      })
      if (!response.ok) throw new Error('Failed to create client')
      setClientFormData({
        first_name: '', last_name: '', date_of_birth: '',
        phone: '', email: '', status: 'active'
      })
      setShowClientForm(false)
      fetchClients()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleSessionSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = await getToken()
      const response = await fetch(`${API_BASE}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...sessionFormData, client_id: selectedClient.id })
      })
      if (!response.ok) throw new Error('Failed to create session')
      setSessionFormData({
        session_date: new Date().toISOString().split('T')[0],
        duration_minutes: 50,
        life_domains: {},
        emotional_themes: {},
        interventions: [],
        overall_progress: 'stable',
        session_summary: '',
        client_insights: '',
        homework_assigned: '',
        clinical_observations: '',
        risk_assessment: ''
      })
      setShowSessionForm(false)
      fetchSessions(selectedClient.id)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleSessionUpdate = async (e) => {
    e.preventDefault()
    try {
      const token = await getToken()
      const response = await fetch(`${API_BASE}/sessions/${viewingSession.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(sessionFormData)
      })
      if (!response.ok) throw new Error('Failed to update session')
      setViewingSession(null)
      setEditMode(false)
      if (appView === 'today') {
        fetchTodaySessions()
      } else if (selectedClient) {
        fetchSessions(selectedClient.id)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const handleScheduleSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = await getToken()
      const response = await fetch(`${API_BASE}/sessions/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...scheduleFormData,
          client_id: parseInt(scheduleFormData.client_id)
        })
      })
      if (!response.ok) throw new Error('Failed to schedule session')
      setScheduleFormData({
        client_id: '',
        session_date: new Date().toISOString().split('T')[0],
        session_time: '14:00',
        duration_minutes: 50,
        status: 'scheduled'
      })
      setShowScheduleModal(false)
      fetchTodaySessions()
      fetchAllScheduledSessions()
      if (selectedClient) {
        fetchSessions(selectedClient.id)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const handleCancelSession = async (sessionId) => {
    if (!confirm(`Cancel this ${trackConfig.sessionTerm.toLowerCase()}? It will be marked as cancelled.`)) return

    try {
      const token = await getToken()
      const response = await fetch(`${API_BASE}/sessions/${sessionId}/cancel`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to cancel session')

      // Refresh appropriate view
      if (appView === 'today') {
        fetchTodaySessions()
      }
      if (selectedClient) {
        fetchSessions(selectedClient.id)
      }
      if (viewingSession && viewingSession.id === sessionId) {
        setViewingSession(null)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const openSession = (session) => {
    setViewingSession(session)
    setSessionFormData({
      session_date: session.session_date,
      session_time: session.session_time || '14:00',
      duration_minutes: session.duration_minutes,
      status: session.status || 'completed',
      notes: session.notes || '',
      summary: session.summary || '',
      life_domains: session.life_domains || {},
      emotional_themes: session.emotional_themes || {},
      interventions: session.interventions || [],
      overall_progress: session.overall_progress || 'stable',
      session_summary: session.session_summary || '',
      client_insights: session.client_insights || '',
      homework_assigned: session.homework_assigned || '',
      clinical_observations: session.clinical_observations || '',
      risk_assessment: session.risk_assessment || ''
    })
    setEditMode(false)
  }

  const closeSession = () => {
    setViewingSession(null)
    setEditMode(false)
  }

  const formatLabel = (str) => {
    return str.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const formatTime = (time24) => {
    if (!time24) return 'Time TBD'
    const [hours, minutes] = time24.split(':')
    const h = parseInt(hours)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${minutes} ${ampm}`
  }

  const calculateEndTime = (startTime, durationMinutes) => {
    if (!startTime) return ''
    const [hours, minutes] = startTime.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes + durationMinutes
    const endHours = Math.floor(totalMinutes / 60) % 24
    const endMinutes = totalMinutes % 60
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`
  }

  // Analytics calculations
  const calculateAnalytics = () => {
    if (sessions.length === 0) return null

    const interventionCounts = {}
    const emotionCounts = {}
    const domainCounts = {}

    sessions.forEach(session => {
      // Count interventions
      session.interventions.forEach(intervention => {
        interventionCounts[intervention] = (interventionCounts[intervention] || 0) + 1
      })

      // Count how many times each emotion was discussed (has text notes)
      Object.entries(session.emotional_themes).forEach(([emotion, notes]) => {
        if (notes && typeof notes === 'string' && notes.trim()) {
          emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1
        }
      })

      // Count how many times each domain was discussed (has text notes)
      Object.entries(session.life_domains).forEach(([domain, notes]) => {
        if (notes && typeof notes === 'string' && notes.trim()) {
          domainCounts[domain] = (domainCounts[domain] || 0) + 1
        }
      })
    })

    return {
      interventionCounts,
      emotionCounts,
      domainCounts,
      totalSessions: sessions.length,
      progressCounts: {
        improving: sessions.filter(s => s.overall_progress === 'improving').length,
        stable: sessions.filter(s => s.overall_progress === 'stable').length,
        declining: sessions.filter(s => s.overall_progress === 'declining').length
      }
    }
  }

  const analytics = selectedClient ? calculateAnalytics() : null

  if (loading) return <div className="container loading">Loading...</div>

  return (
    <>
      {/* Migration Modal for existing users without practice_type */}
      {showPracticeTypeModal && (
        <PracticeTypeModal
          onComplete={() => {
            setShowPracticeTypeModal(false)
            // Reload the page to fetch data with new track config
            window.location.reload()
          }}
        />
      )}

      <div className="app">
        <header className="app-header">
        <div>
          <div className="header-content">
            <h1>Pier88</h1>
            <p className="tagline">{trackConfig.label} Dashboard</p>
          </div>
          <div className="app-nav">
            <button
              className={`nav-tab ${appView === 'today' ? 'active' : ''}`}
              onClick={() => setAppView('today')}
            >
              Today
            </button>
            <button
              className={`nav-tab ${appView === 'scheduled' ? 'active' : ''}`}
            onClick={() => setAppView('scheduled')}
          >
            Scheduled
          </button>
          <button
            className={`nav-tab ${appView === 'clients' ? 'active' : ''}`}
            onClick={() => setAppView('clients')}
          >
            {trackConfig.clientTermPlural}
          </button>
        </div>
        </div>
        <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
          <UserButton afterSignOutUrl="/" />
          <button className="theme-toggle" onClick={toggleTheme}>
            <span className="theme-toggle-icon">{theme === 'light' ? '🌙' : '☀️'}</span>
            <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
          </button>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {appView === 'today' ? (
        <div className="today-container view-container">
          <div className="today-header">
            <h2>Today's Schedule - {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h2>
          </div>

          {loading ? (
            <div>
              <TodaySessionSkeleton />
              <TodaySessionSkeleton />
              <TodaySessionSkeleton />
            </div>
          ) : todaySessions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h3>No {trackConfig.sessionTermPlural.toLowerCase()} scheduled for today</h3>
              <p>Click "Schedule Appointment" to add a new {trackConfig.sessionTerm.toLowerCase()}</p>
            </div>
          ) : (
            <div className="today-sessions-list">
              {todaySessions.map(session => (
                <div key={session.id} className={`today-session-card status-${session.status}`} onClick={() => openSession(session)}>
                  <div className="session-time-block">
                    <div className="time-display">
                      {formatTime(session.session_time)} - {formatTime(calculateEndTime(session.session_time, session.duration_minutes))}
                    </div>
                    <div className="duration">{session.duration_minutes} min</div>
                  </div>

                  <div className="session-client-info">
                    <h3
                      className="client-name-link"
                      onClick={(e) => {
                        e.stopPropagation()
                        const client = clients.find(c => c.id === session.client_id)
                        if (client) {
                          setClientView('summary')
                          setAppView('clients')
                          setSelectedClient(client)
                        }
                      }}
                    >
                      {session.first_name} {session.last_name}
                    </h3>
                    <span className={`badge badge-${session.status}`}>{session.status}</span>
                  </div>

                  <div className="session-preview">
                    {session.session_summary ? (
                      <p className="notes-preview">{session.session_summary.substring(0, 100)}{session.session_summary.length > 100 ? '...' : ''}</p>
                    ) : (
                      <p className="no-notes">No notes yet</p>
                    )}
                  </div>

                  <div className="session-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="btn-view" onClick={(e) => {
                      e.stopPropagation()
                      openSession(session)
                    }}>View</button>
                    {session.status === 'scheduled' && (
                      <button className="btn-cancel" onClick={(e) => {
                        e.stopPropagation()
                        handleCancelSession(session.id)
                      }}>Cancel</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : appView === 'scheduled' ? (
        <div className="today-container view-container">
          <div className="today-header">
            <h2>All Scheduled Appointments</h2>
            <button className="btn-primary" onClick={() => setShowScheduleModal(true)}>
              + Schedule Appointment
            </button>
          </div>

          {loading ? (
            <div>
              <TodaySessionSkeleton />
              <TodaySessionSkeleton />
              <TodaySessionSkeleton />
            </div>
          ) : allScheduledSessions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h3>No scheduled appointments</h3>
              <p>Click "Schedule Appointment" to add a new {trackConfig.sessionTerm.toLowerCase()}</p>
            </div>
          ) : (
            <div className="scheduled-list">
              {allScheduledSessions.map(session => {
                // Need to fetch client info for each session
                const client = clients.find(c => c.id === session.client_id)
                if (!client) return null

                return (
                  <div key={session.id} className="scheduled-appointment-card" onClick={() => openSession(session)}>
                    <div className="appointment-date-section">
                      <div className="appointment-date">
                        {new Date(session.session_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                      <div className="appointment-time">
                        {formatTime(session.session_time)}
                      </div>
                    </div>

                    <div className="appointment-info">
                      <h3
                        className="client-name-link"
                        onClick={(e) => {
                          e.stopPropagation()
                          setClientView('summary')
                          setAppView('clients')
                          setSelectedClient(client)
                        }}
                      >
                        {client.first_name} {client.last_name}
                      </h3>
                      <p className="appointment-duration">{session.duration_minutes} minutes</p>
                    </div>

                    <div className="appointment-actions" onClick={(e) => e.stopPropagation()}>
                      <button className="btn-view" onClick={(e) => {
                        e.stopPropagation()
                        openSession(session)
                      }}>View Details</button>
                      <button className="btn-cancel" onClick={(e) => {
                        e.stopPropagation()
                        handleCancelSession(session.id)
                      }}>Cancel</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="app-layout view-container">
          <aside className="sidebar">
          <button
            className="btn-new-client"
            onClick={() => setShowClientForm(!showClientForm)}
          >
            <span className="btn-icon">+</span>
            {showClientForm ? 'Cancel' : `New ${trackConfig.clientTerm}`}
          </button>

          {showClientForm && (
            <form className="client-form" onSubmit={handleClientSubmit}>
              <h3>Add {trackConfig.clientTerm}</h3>
              <input type="text" name="first_name" placeholder="First Name *" value={clientFormData.first_name} onChange={(e) => setClientFormData({...clientFormData, first_name: e.target.value})} required />
              <input type="text" name="last_name" placeholder="Last Name *" value={clientFormData.last_name} onChange={(e) => setClientFormData({...clientFormData, last_name: e.target.value})} required />
              <input type="date" name="date_of_birth" placeholder="Date of Birth *" value={clientFormData.date_of_birth} onChange={(e) => setClientFormData({...clientFormData, date_of_birth: e.target.value})} required />
              <input type="tel" name="phone" placeholder="Phone" value={clientFormData.phone} onChange={(e) => setClientFormData({...clientFormData, phone: e.target.value})} />
              <input type="email" name="email" placeholder="Email" value={clientFormData.email} onChange={(e) => setClientFormData({...clientFormData, email: e.target.value})} />
              <button type="submit" className="btn-submit">Create {trackConfig.clientTerm}</button>
            </form>
          )}

          <div className="client-list-container">
            <h3 className="sidebar-title">{trackConfig.clientTermPlural} ({clients.length})</h3>
            {loading ? (
              <div className="client-list">
                <ClientCardSkeleton />
                <ClientCardSkeleton />
                <ClientCardSkeleton />
                <ClientCardSkeleton />
              </div>
            ) : clients.length === 0 ? (
              <p className="empty-text">No {trackConfig.clientTermPlural.toLowerCase()} yet</p>
            ) : (
              <div className="client-list">
                {clients.map(client => (
                  <div
                    key={client.id}
                    className={`client-card ${selectedClient?.id === client.id ? 'active' : ''}`}
                    onClick={() => setSelectedClient(client)}
                  >
                    <div className="client-info">
                      <div className="client-name">{client.first_name} {client.last_name}</div>
                      <div className="client-meta">{client.date_of_birth}</div>
                    </div>
                    <span className={`badge badge-${client.status}`}>{client.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        <main className="main-content">
          {!selectedClient ? (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <h2>Welcome to Pier88</h2>
              <p>Select a {trackConfig.clientTerm.toLowerCase()} from the sidebar to view {trackConfig.sessionTermPlural.toLowerCase()} and insights</p>
            </div>
          ) : (
            <>
              <div className="client-header">
                <div className="client-header-info">
                  <h2>{selectedClient.first_name} {selectedClient.last_name}</h2>
                  <div className="client-meta-row">
                    <span>DOB: {selectedClient.date_of_birth}</span>
                    <span>•</span>
                    <span>{selectedClient.phone || 'No phone'}</span>
                    <span>•</span>
                    <span>{selectedClient.email || 'No email'}</span>
                  </div>
                </div>
                <div className="header-actions">
                  <button
                    className={`btn-tab ${clientView === 'summary' ? 'active' : ''}`}
                    onClick={() => setClientView('summary')}
                  >
                    Summary
                  </button>
                  <button
                    className={`btn-tab ${clientView === 'sessions' ? 'active' : ''}`}
                    onClick={() => setClientView('sessions')}
                  >
                    {trackConfig.sessionTermPlural} ({sessions.length})
                  </button>
                  <button
                    className={`btn-tab ${clientView === 'analytics' ? 'active' : ''}`}
                    onClick={() => setClientView('analytics')}
                  >
                    Analytics
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setScheduleFormData({
                        ...scheduleFormData,
                        client_id: selectedClient.id
                      })
                      setShowScheduleModal(true)
                    }}
                  >
                    + Schedule Appointment
                  </button>
                </div>
              </div>

              {showSessionForm && (
                <div className="modal-overlay" onClick={() => setShowSessionForm(false)}>
                  <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <form className="session-form" onSubmit={handleSessionSubmit}>
                      <div className="modal-header">
                        <h3>New {trackConfig.sessionTerm}</h3>
                        <button type="button" className="btn-close" onClick={() => setShowSessionForm(false)}>×</button>
                      </div>

                      <div className="form-row">
                        <div className="form-field">
                          <label>Date</label>
                          <input type="date" name="session_date" value={sessionFormData.session_date} onChange={(e) => setSessionFormData({...sessionFormData, session_date: e.target.value})} required />
                        </div>
                        <div className="form-field">
                          <label>Time</label>
                          <input type="time" name="session_time" value={sessionFormData.session_time} onChange={(e) => setSessionFormData({...sessionFormData, session_time: e.target.value})} />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-field">
                          <label>Duration (min)</label>
                          <input type="number" name="duration_minutes" value={sessionFormData.duration_minutes} onChange={(e) => setSessionFormData({...sessionFormData, duration_minutes: e.target.value})} min="1" required />
                        </div>
                        <div className="form-field">
                          <label>Status</label>
                          <select name="status" value={sessionFormData.status} onChange={(e) => setSessionFormData({...sessionFormData, status: e.target.value})}>
                            <option value="scheduled">Scheduled</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="no-show">No-Show</option>
                          </select>
                        </div>
                      </div>

                      {/* Session Notes Section */}
                      <div className="form-section">
                        <h4>{trackConfig.sessionTerm} Notes</h4>
                        <p className="section-hint">Free-text notes from this {trackConfig.sessionTerm.toLowerCase()}</p>
                        <textarea
                          name="notes"
                          value={sessionFormData.notes}
                          onChange={(e) => setSessionFormData({...sessionFormData, notes: e.target.value})}
                          placeholder="Main session notes..."
                          rows="12"
                        />
                      </div>

                      <div className="form-field">
                        <label>Quick Summary</label>
                        <input
                          type="text"
                          name="summary"
                          value={sessionFormData.summary}
                          onChange={(e) => setSessionFormData({...sessionFormData, summary: e.target.value})}
                          placeholder="One-line summary for quick reference..."
                        />
                      </div>

                      {/* To-Dos Section */}
                      {selectedClient && (
                        <div className="form-section">
                          <h4>To-Dos</h4>
                          <p className="section-hint">Open to-dos from previous sessions</p>

                          {clientTodos.length > 0 ? (
                            <div className="todos-list">
                              {clientTodos.map(todo => (
                                <label key={todo.id} className="todo-item">
                                  <input
                                    type="checkbox"
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        // Mark as completed - will be updated on form submit
                                        updateTodoStatus(todo.id, 'completed', null)
                                      }
                                    }}
                                  />
                                  <span>{todo.text}</span>
                                </label>
                              ))}
                            </div>
                          ) : (
                            <p style={{color: 'var(--color-text-secondary)', fontStyle: 'italic'}}>
                              No open to-dos
                            </p>
                          )}

                          <div className="add-todo">
                            <input
                              type="text"
                              value={newTodoText}
                              onChange={(e) => setNewTodoText(e.target.value)}
                              placeholder="Add a new to-do for future sessions..."
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  if (newTodoText.trim()) {
                                    createTodo(newTodoText, selectedClient.id)
                                    setNewTodoText('')
                                  }
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (newTodoText.trim()) {
                                  createTodo(newTodoText, selectedClient.id)
                                  setNewTodoText('')
                                }
                              }}
                              className="btn-secondary"
                            >
                              Add To-Do
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="form-section">
                        <h4>{trackConfig.domainLabel}</h4>
                        <p className="section-hint">Check the areas that came up in this {trackConfig.sessionTerm.toLowerCase()} and add detailed notes</p>
                        {trackConfig.domains.map(domain => (
                          <div key={domain.value} className="domain-field">
                            <label className="domain-checkbox">
                              <input
                                type="checkbox"
                                checked={sessionFormData.life_domains[domain.value] !== undefined && sessionFormData.life_domains[domain.value] !== ''}
                                onChange={(e) => {
                                  const newDomains = {...sessionFormData.life_domains}
                                  if (e.target.checked) {
                                    newDomains[domain.value] = ''
                                  } else {
                                    delete newDomains[domain.value]
                                  }
                                  setSessionFormData({...sessionFormData, life_domains: newDomains})
                                }}
                              />
                              <span className="domain-label">{domain.label}</span>
                            </label>
                            {(sessionFormData.life_domains[domain.value] !== undefined && sessionFormData.life_domains[domain.value] !== null) && (
                              <textarea
                                value={sessionFormData.life_domains[domain.value] || ''}
                                onChange={(e) => setSessionFormData({
                                  ...sessionFormData,
                                  life_domains: {...sessionFormData.life_domains, [domain.value]: e.target.value}
                                })}
                                placeholder={`What was discussed about ${domain.label.toLowerCase()}?`}
                                rows="3"
                              />
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="form-section">
                        <h4>{trackConfig.themesLabel}</h4>
                        <p className="section-hint">Check the themes that were present and describe them</p>
                        {trackConfig.themes.map(theme => (
                          <div key={theme.value} className="domain-field">
                            <label className="domain-checkbox">
                              <input
                                type="checkbox"
                                checked={sessionFormData.emotional_themes[theme.value] !== undefined && sessionFormData.emotional_themes[theme.value] !== ''}
                                onChange={(e) => {
                                  const newThemes = {...sessionFormData.emotional_themes}
                                  if (e.target.checked) {
                                    newThemes[theme.value] = ''
                                  } else {
                                    delete newThemes[theme.value]
                                  }
                                  setSessionFormData({...sessionFormData, emotional_themes: newThemes})
                                }}
                              />
                              <span className="domain-label">{theme.label}</span>
                            </label>
                            {(sessionFormData.emotional_themes[theme.value] !== undefined && sessionFormData.emotional_themes[theme.value] !== null) && (
                              <textarea
                                value={sessionFormData.emotional_themes[theme.value] || ''}
                                onChange={(e) => setSessionFormData({
                                  ...sessionFormData,
                                  emotional_themes: {...sessionFormData.emotional_themes, [theme.value]: e.target.value}
                                })}
                                placeholder={`Describe the ${theme.label.toLowerCase()} that was present...`}
                                rows="3"
                              />
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="form-section">
                        <h4>{trackConfig.interventionsLabel}</h4>
                        <div className="checkbox-grid">
                          {trackConfig.interventions.map(intervention => (
                            <label key={intervention.value} className="checkbox-field">
                              <input type="checkbox" checked={sessionFormData.interventions.includes(intervention.value)} onChange={() => {
                                const current = sessionFormData.interventions
                                setSessionFormData({
                                  ...sessionFormData,
                                  interventions: current.includes(intervention.value) ? current.filter(i => i !== intervention.value) : [...current, intervention.value]
                                })
                              }} />
                              <span>{intervention.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="form-field">
                        <label>Overall Progress</label>
                        <select name="overall_progress" value={sessionFormData.overall_progress} onChange={(e) => setSessionFormData({...sessionFormData, overall_progress: e.target.value})}>
                          <option value="improving">Improving</option>
                          <option value="stable">Stable</option>
                          <option value="declining">Declining</option>
                        </select>
                      </div>

                      <div className="form-field">
                        <label>Session Summary</label>
                        <textarea name="session_summary" value={sessionFormData.session_summary} onChange={(e) => setSessionFormData({...sessionFormData, session_summary: e.target.value})} rows="3" placeholder="Brief overview..." />
                      </div>

                      <div className="form-field">
                        <label>Client Insights</label>
                        <textarea name="client_insights" value={sessionFormData.client_insights} onChange={(e) => setSessionFormData({...sessionFormData, client_insights: e.target.value})} rows="2" placeholder="Key realizations..." />
                      </div>

                      <div className="form-field">
                        <label>Homework</label>
                        <textarea name="homework_assigned" value={sessionFormData.homework_assigned} onChange={(e) => setSessionFormData({...sessionFormData, homework_assigned: e.target.value})} rows="2" placeholder="Tasks assigned..." />
                      </div>

                      <div className="form-field">
                        <label>Clinical Observations</label>
                        <textarea name="clinical_observations" value={sessionFormData.clinical_observations} onChange={(e) => setSessionFormData({...sessionFormData, clinical_observations: e.target.value})} rows="2" placeholder="Professional observations..." />
                      </div>

                      <div className="form-field">
                        <label>Risk Assessment</label>
                        <textarea name="risk_assessment" value={sessionFormData.risk_assessment} onChange={(e) => setSessionFormData({...sessionFormData, risk_assessment: e.target.value})} rows="2" placeholder="Safety concerns..." />
                      </div>

                      <button type="submit" className="btn-submit-modal">Save Session</button>
                    </form>
                  </div>
                </div>
              )}

              {clientView === 'summary' && (
                <div className="client-summary">
                  {/* Session Prep Card */}
                  {sessionPrep && (
                    <div className="session-prep-card">
                      <div className="prep-header">
                        <h3>Prepare for {trackConfig.sessionTerm}</h3>
                        <button
                          className="btn-primary"
                          onClick={() => {
                            // Create a new session and open the form
                            setSessionFormData({
                              ...sessionFormData,
                              session_date: new Date().toISOString().split('T')[0],
                              session_time: new Date().toTimeString().split(':').slice(0, 2).join(':'),
                              status: 'scheduled'
                            })
                            setShowSessionForm(true)
                          }}
                        >
                          Start {trackConfig.sessionTerm}
                        </button>
                      </div>

                      <div className="prep-content">
                        {/* Last Session */}
                        {sessionPrep.last_session && (
                          <div className="prep-section">
                            <h4>Last {trackConfig.sessionTerm}</h4>
                            <div className="last-session-summary">
                              <div className="session-date">
                                {new Date(sessionPrep.last_session.session_date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                                {sessionPrep.last_session.session_time && ` • ${formatTime(sessionPrep.last_session.session_time)}`}
                              </div>
                              {sessionPrep.last_session.summary && (
                                <p className="session-summary-text">{sessionPrep.last_session.summary}</p>
                              )}
                              {sessionPrep.last_session.notes && (
                                <p className="session-notes-preview">
                                  {sessionPrep.last_session.notes.substring(0, 150)}
                                  {sessionPrep.last_session.notes.length > 150 && '...'}
                                </p>
                              )}
                              <button
                                className="btn-link"
                                onClick={() => openSession(sessionPrep.last_session)}
                              >
                                View full notes →
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Open To-Dos */}
                        <div className="prep-section">
                          <h4>Open To-Dos ({sessionPrep.open_todos.length})</h4>
                          {sessionPrep.open_todos.length > 0 ? (
                            <div className="prep-todos-list">
                              {sessionPrep.open_todos.map(todo => (
                                <div key={todo.id} className="prep-todo-item">
                                  <span className="todo-text">{todo.text}</span>
                                  {todo.source_session_date && (
                                    <span className="todo-context">
                                      from {new Date(todo.source_session_date).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                      {todo.sessions_ago !== null && todo.sessions_ago > 0 && (
                                        `, ${todo.sessions_ago} session${todo.sessions_ago > 1 ? 's' : ''} ago`
                                      )}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p style={{color: 'var(--color-text-secondary)', fontStyle: 'italic'}}>
                              No open to-dos
                            </p>
                          )}
                        </div>

                        {/* Quick Stats */}
                        <div className="prep-section prep-stats">
                          <div className="prep-stat">
                            <div className="stat-label">Total {trackConfig.sessionTermPlural}</div>
                            <div className="stat-value">{sessionPrep.stats.total_sessions}</div>
                          </div>
                          {sessionPrep.stats.days_as_client !== null && (
                            <div className="prep-stat">
                              <div className="stat-label">{trackConfig.clientTerm} Since</div>
                              <div className="stat-value">
                                {Math.floor(sessionPrep.stats.days_as_client / 365) > 0
                                  ? `${Math.floor(sessionPrep.stats.days_as_client / 365)}y`
                                  : Math.floor(sessionPrep.stats.days_as_client / 30) > 0
                                  ? `${Math.floor(sessionPrep.stats.days_as_client / 30)}mo`
                                  : `${sessionPrep.stats.days_as_client}d`}
                              </div>
                            </div>
                          )}
                          {sessionPrep.stats.last_session_date && (
                            <div className="prep-stat">
                              <div className="stat-label">Last {trackConfig.sessionTerm}</div>
                              <div className="stat-value">
                                {new Date(sessionPrep.stats.last_session_date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="summary-card">
                    <h3>{trackConfig.clientTerm} Information</h3>
                    <div className="summary-details">
                      <div className="detail-row">
                        <span className="detail-label">Full Name:</span>
                        <span className="detail-value">{selectedClient.first_name} {selectedClient.last_name}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Date of Birth:</span>
                        <span className="detail-value">{selectedClient.date_of_birth}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Phone:</span>
                        <span className="detail-value">{selectedClient.phone || 'Not provided'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">{selectedClient.email || 'Not provided'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Emergency Contact:</span>
                        <span className="detail-value">
                          {selectedClient.emergency_contact_name || 'Not provided'}
                          {selectedClient.emergency_contact_phone && ` (${selectedClient.emergency_contact_phone})`}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Status:</span>
                        <span className={`badge badge-${selectedClient.status}`}>{selectedClient.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="summary-card">
                    <h3>{trackConfig.sessionTerm} Overview</h3>
                    <div className="overview-stats">
                      <div className="overview-stat">
                        <div className="stat-number">{sessions.length}</div>
                        <div className="stat-text">Total {trackConfig.sessionTermPlural}</div>
                      </div>
                      <div className="overview-stat">
                        <div className="stat-number">{sessions.filter(s => s.status === 'scheduled').length}</div>
                        <div className="stat-text">Scheduled</div>
                      </div>
                      <div className="overview-stat">
                        <div className="stat-number">{sessions.filter(s => s.status === 'completed').length}</div>
                        <div className="stat-text">Completed</div>
                      </div>
                    </div>
                  </div>

                  {sessions.length > 0 && (
                    <div className="summary-card">
                      <h3>Recent {trackConfig.sessionTermPlural}</h3>
                      <div className="recent-sessions-list">
                        {sessions.slice(0, 5).map(session => (
                          <div key={session.id} className="recent-session-item" onClick={() => openSession(session)}>
                            <div className="recent-session-date">
                              {new Date(session.session_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              {session.session_time && ` • ${formatTime(session.session_time)}`}
                            </div>
                            <span className={`badge badge-${session.status}`}>{session.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {clientView === 'analytics' && analytics && (
                <div className="dashboard">
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-label">Total {trackConfig.sessionTermPlural}</div>
                      <div className="stat-value">{analytics.totalSessions}</div>
                    </div>
                    <div className="stat-card improving">
                      <div className="stat-label">Improving</div>
                      <div className="stat-value">{analytics.progressCounts.improving}</div>
                    </div>
                    <div className="stat-card stable">
                      <div className="stat-label">Stable</div>
                      <div className="stat-value">{analytics.progressCounts.stable}</div>
                    </div>
                    <div className="stat-card declining">
                      <div className="stat-label">Declining</div>
                      <div className="stat-value">{analytics.progressCounts.declining}</div>
                    </div>
                  </div>

                  <div className="charts-grid">
                    <div className="chart-card">
                      <h3>Most Discussed {trackConfig.themesLabel}</h3>
                      <div className="bar-chart">
                        {Object.entries(analytics.emotionCounts)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 5)
                          .map(([emotion, count]) => (
                            <div key={emotion} className="bar-row">
                              <span className="bar-label">{formatLabel(emotion)}</span>
                              <div className="bar-container">
                                <div className="bar-fill emotion" style={{width: `${(count / analytics.totalSessions) * 100}%`}}></div>
                                <span className="bar-value">{count} {count !== 1 ? trackConfig.sessionTermPlural.toLowerCase() : trackConfig.sessionTerm.toLowerCase()}</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div className="chart-card">
                      <h3>Most Discussed {trackConfig.domainLabel}</h3>
                      <div className="bar-chart">
                        {Object.entries(analytics.domainCounts)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 5)
                          .map(([domain, count]) => (
                            <div key={domain} className="bar-row">
                              <span className="bar-label">{formatLabel(domain)}</span>
                              <div className="bar-container">
                                <div className="bar-fill domain" style={{width: `${(count / analytics.totalSessions) * 100}%`}}></div>
                                <span className="bar-value">{count} {count !== 1 ? trackConfig.sessionTermPlural.toLowerCase() : trackConfig.sessionTerm.toLowerCase()}</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div className="chart-card">
                      <h3>Most Used {trackConfig.interventionsLabel}</h3>
                      <div className="bar-chart">
                        {Object.entries(analytics.interventionCounts)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 5)
                          .map(([intervention, count]) => (
                            <div key={intervention} className="bar-row">
                              <span className="bar-label">{intervention}</span>
                              <div className="bar-container">
                                <div className="bar-fill intervention" style={{width: `${(count / analytics.totalSessions) * 100}%`}}></div>
                                <span className="bar-value">{count} {count !== 1 ? trackConfig.sessionTermPlural.toLowerCase() : trackConfig.sessionTerm.toLowerCase()}</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {clientView === 'sessions' && (
                <div className="sessions-view">
                  {loading ? (
                    <div className="sessions-grid">
                      <SessionCardSkeleton />
                      <SessionCardSkeleton />
                      <SessionCardSkeleton />
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="empty-state-small">
                      <p>No {trackConfig.sessionTermPlural.toLowerCase()} yet. Click "Schedule Appointment" to get started.</p>
                    </div>
                  ) : (
                    <div className="sessions-grid">
                      {sessions.map(session => (
                        <div key={session.id} className="session-card" onClick={() => openSession(session)}>
                          <div className="session-card-header">
                            <div>
                              <div className="session-date">
                                {session.session_date}
                                {session.session_time && ` • ${formatTime(session.session_time)}`}
                              </div>
                              <div className="session-meta">
                                {session.duration_minutes} minutes
                                <span className={`badge badge-${session.status}`} style={{marginLeft: '0.5rem'}}>
                                  {session.status}
                                </span>
                              </div>
                            </div>
                            {session.overall_progress && session.status === 'completed' && (
                              <span className={`badge badge-${session.overall_progress}`}>
                                {session.overall_progress}
                              </span>
                            )}
                          </div>

                          {(Object.keys(session.life_domains).filter(k => session.life_domains[k] && session.life_domains[k].trim && session.life_domains[k].trim()).length > 0 ||
                            Object.keys(session.emotional_themes).filter(k => session.emotional_themes[k] && session.emotional_themes[k].trim && session.emotional_themes[k].trim()).length > 0) && (
                            <div className="session-tags">
                              {Object.entries(session.life_domains)
                                .filter(([_, v]) => v && typeof v === 'string' && v.trim())
                                .map(([k, v]) => (
                                  <span key={k} className="tag tag-domain">{formatLabel(k)}</span>
                                ))}
                              {Object.entries(session.emotional_themes)
                                .filter(([_, v]) => v && typeof v === 'string' && v.trim())
                                .map(([k, v]) => (
                                  <span key={k} className="tag tag-emotion">{formatLabel(k)}</span>
                                ))}
                            </div>
                          )}

                          {session.interventions.length > 0 && (
                            <div className="session-interventions">
                              {session.interventions.map(int => (
                                <span key={int} className="tag tag-intervention">{int}</span>
                              ))}
                            </div>
                          )}

                          {session.session_summary && (
                            <div className="session-text">
                              <strong>Summary:</strong> {session.session_summary}
                            </div>
                          )}

                          {session.client_insights && (
                            <div className="session-text">
                              <strong>Insights:</strong> {session.client_insights}
                            </div>
                          )}

                          {session.homework_assigned && (
                            <div className="session-text">
                              <strong>Homework:</strong> {session.homework_assigned}
                            </div>
                          )}

                          {session.risk_assessment && (
                            <div className="session-risk">
                              <strong>⚠️ Risk:</strong> {session.risk_assessment}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
        </div>
      )}

      {/* Session View/Edit Modal */}
      {viewingSession && (
        <div className="modal-overlay" onClick={closeSession}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {!editMode ? (
              <div className="session-view">
                <div className="modal-header">
                  <h3>{trackConfig.sessionTerm} Details</h3>
                  <div style={{display: 'flex', gap: '0.5rem'}}>
                    <button className="btn-edit" onClick={() => setEditMode(true)}>
                      {viewingSession.status === 'scheduled' ? 'Add Notes' : 'Edit'}
                    </button>
                    <button type="button" className="btn-close" onClick={closeSession}>×</button>
                  </div>
                </div>

                {viewingSession.status === 'scheduled' && (
                  <div className="scheduled-notice">
                    📅 This is a scheduled appointment. Click "Add Notes" to document the {trackConfig.sessionTerm.toLowerCase()} after it's completed.
                  </div>
                )}

                <div className="view-content">
                  <div className="view-row">
                    <div className="view-field">
                      <strong>Date:</strong> {viewingSession.session_date}
                      {viewingSession.session_time && ` • ${formatTime(viewingSession.session_time)}`}
                    </div>
                    <div className="view-field">
                      <strong>Duration:</strong> {viewingSession.duration_minutes} minutes
                    </div>
                    <div className="view-field">
                      <strong>Status:</strong>
                      <span className={`badge badge-${viewingSession.status}`}>
                        {viewingSession.status}
                      </span>
                    </div>
                    {viewingSession.overall_progress && viewingSession.status === 'completed' && (
                      <div className="view-field">
                        <strong>Progress:</strong>
                        <span className={`badge badge-${viewingSession.overall_progress}`}>
                          {viewingSession.overall_progress}
                        </span>
                      </div>
                    )}
                  </div>

                  {viewingSession.summary && (
                    <div className="view-section">
                      <strong>Quick Summary</strong>
                      <p>{viewingSession.summary}</p>
                    </div>
                  )}

                  {viewingSession.notes && (
                    <div className="view-section">
                      <strong>{trackConfig.sessionTerm} Notes</strong>
                      <p style={{whiteSpace: 'pre-wrap'}}>{viewingSession.notes}</p>
                    </div>
                  )}

                  {Object.keys(viewingSession.life_domains || {}).filter(k => viewingSession.life_domains[k] && viewingSession.life_domains[k].trim()).length > 0 && (
                    <div className="view-section">
                      <strong>{trackConfig.domainLabel}</strong>
                      {Object.entries(viewingSession.life_domains)
                        .filter(([_, v]) => v && typeof v === 'string' && v.trim())
                        .map(([k, v]) => (
                          <div key={k} className="view-note">
                            <div className="view-note-label">{formatLabel(k)}</div>
                            <div className="view-note-text">{v}</div>
                          </div>
                        ))}
                    </div>
                  )}

                  {Object.keys(viewingSession.emotional_themes || {}).filter(k => viewingSession.emotional_themes[k] && viewingSession.emotional_themes[k].trim()).length > 0 && (
                    <div className="view-section">
                      <strong>{trackConfig.themesLabel}</strong>
                      {Object.entries(viewingSession.emotional_themes)
                        .filter(([_, v]) => v && typeof v === 'string' && v.trim())
                        .map(([k, v]) => (
                          <div key={k} className="view-note">
                            <div className="view-note-label">{formatLabel(k)}</div>
                            <div className="view-note-text">{v}</div>
                          </div>
                        ))}
                    </div>
                  )}

                  {viewingSession.interventions && viewingSession.interventions.length > 0 && (
                    <div className="view-section">
                      <strong>{trackConfig.interventionsLabel}</strong>
                      <div className="tags">
                        {viewingSession.interventions.map(int => (
                          <span key={int} className="tag tag-intervention">{int}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {viewingSession.session_summary && (
                    <div className="view-section">
                      <strong>Session Summary</strong>
                      <p>{viewingSession.session_summary}</p>
                    </div>
                  )}

                  {viewingSession.client_insights && (
                    <div className="view-section">
                      <strong>Client Insights</strong>
                      <p>{viewingSession.client_insights}</p>
                    </div>
                  )}

                  {viewingSession.homework_assigned && (
                    <div className="view-section">
                      <strong>Homework Assigned</strong>
                      <p>{viewingSession.homework_assigned}</p>
                    </div>
                  )}

                  {viewingSession.clinical_observations && (
                    <div className="view-section">
                      <strong>Clinical Observations</strong>
                      <p>{viewingSession.clinical_observations}</p>
                    </div>
                  )}

                  {viewingSession.risk_assessment && (
                    <div className="view-section risk-section">
                      <strong>⚠️ Risk Assessment</strong>
                      <p>{viewingSession.risk_assessment}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <form className="session-form" onSubmit={handleSessionUpdate}>
                <div className="modal-header">
                  <h3>Edit {trackConfig.sessionTerm}</h3>
                  <button type="button" className="btn-close" onClick={closeSession}>×</button>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Date</label>
                    <input type="date" name="session_date" value={sessionFormData.session_date} onChange={(e) => setSessionFormData({...sessionFormData, session_date: e.target.value})} required />
                  </div>
                  <div className="form-field">
                    <label>Time</label>
                    <input type="time" name="session_time" value={sessionFormData.session_time} onChange={(e) => setSessionFormData({...sessionFormData, session_time: e.target.value})} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Duration (min)</label>
                    <input type="number" name="duration_minutes" value={sessionFormData.duration_minutes} onChange={(e) => setSessionFormData({...sessionFormData, duration_minutes: e.target.value})} min="1" required />
                  </div>
                  <div className="form-field">
                    <label>Status</label>
                    <select name="status" value={sessionFormData.status} onChange={(e) => setSessionFormData({...sessionFormData, status: e.target.value})}>
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="no-show">No-Show</option>
                    </select>
                  </div>
                </div>

                <div className="form-section">
                  <h4>{trackConfig.sessionTerm} Notes</h4>
                  <p className="section-hint">Free-text notes from this {trackConfig.sessionTerm.toLowerCase()}</p>
                  <textarea
                    name="notes"
                    value={sessionFormData.notes}
                    onChange={(e) => setSessionFormData({...sessionFormData, notes: e.target.value})}
                    placeholder="Main session notes..."
                    rows="12"
                  />
                </div>

                <div className="form-field">
                  <label>Quick Summary</label>
                  <input
                    type="text"
                    name="summary"
                    value={sessionFormData.summary}
                    onChange={(e) => setSessionFormData({...sessionFormData, summary: e.target.value})}
                    placeholder="One-line summary for quick reference..."
                  />
                </div>

                <div className="form-section">
                  <h4>{trackConfig.domainLabel}</h4>
                  <p className="section-hint">Check the areas that came up in this {trackConfig.sessionTerm.toLowerCase()} and add detailed notes</p>
                  {trackConfig.domains.map(domain => (
                    <div key={domain.value} className="domain-field">
                      <label className="domain-checkbox">
                        <input
                          type="checkbox"
                          checked={sessionFormData.life_domains[domain.value] !== undefined && sessionFormData.life_domains[domain.value] !== ''}
                          onChange={(e) => {
                            const newDomains = {...sessionFormData.life_domains}
                            if (e.target.checked) {
                              newDomains[domain.value] = ''
                            } else {
                              delete newDomains[domain.value]
                            }
                            setSessionFormData({...sessionFormData, life_domains: newDomains})
                          }}
                        />
                        <span className="domain-label">{domain.label}</span>
                      </label>
                      {(sessionFormData.life_domains[domain.value] !== undefined && sessionFormData.life_domains[domain.value] !== null) && (
                        <textarea
                          value={sessionFormData.life_domains[domain.value] || ''}
                          onChange={(e) => setSessionFormData({
                            ...sessionFormData,
                            life_domains: {...sessionFormData.life_domains, [domain.value]: e.target.value}
                          })}
                          placeholder={`What was discussed about ${domain.label.toLowerCase()}?`}
                          rows="3"
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="form-section">
                  <h4>{trackConfig.themesLabel}</h4>
                  <p className="section-hint">Check the themes that were present and describe them</p>
                  {trackConfig.themes.map(theme => (
                    <div key={theme.value} className="domain-field">
                      <label className="domain-checkbox">
                        <input
                          type="checkbox"
                          checked={sessionFormData.emotional_themes[theme.value] !== undefined && sessionFormData.emotional_themes[theme.value] !== ''}
                          onChange={(e) => {
                            const newThemes = {...sessionFormData.emotional_themes}
                            if (e.target.checked) {
                              newThemes[theme.value] = ''
                            } else {
                              delete newThemes[theme.value]
                            }
                            setSessionFormData({...sessionFormData, emotional_themes: newThemes})
                          }}
                        />
                        <span className="domain-label">{theme.label}</span>
                      </label>
                      {(sessionFormData.emotional_themes[theme.value] !== undefined && sessionFormData.emotional_themes[theme.value] !== null) && (
                        <textarea
                          value={sessionFormData.emotional_themes[theme.value] || ''}
                          onChange={(e) => setSessionFormData({
                            ...sessionFormData,
                            emotional_themes: {...sessionFormData.emotional_themes, [theme.value]: e.target.value}
                          })}
                          placeholder={`Describe the ${theme.label.toLowerCase()} that was present...`}
                          rows="3"
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="form-section">
                  <h4>{trackConfig.interventionsLabel}</h4>
                  <div className="checkbox-grid">
                    {trackConfig.interventions.map(intervention => (
                      <label key={intervention.value} className="checkbox-field">
                        <input type="checkbox" checked={sessionFormData.interventions.includes(intervention.value)} onChange={() => {
                          const current = sessionFormData.interventions
                          setSessionFormData({
                            ...sessionFormData,
                            interventions: current.includes(intervention.value) ? current.filter(i => i !== intervention.value) : [...current, intervention.value]
                          })
                        }} />
                        <span>{intervention.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-field">
                  <label>Overall Progress</label>
                  <select name="overall_progress" value={sessionFormData.overall_progress} onChange={(e) => setSessionFormData({...sessionFormData, overall_progress: e.target.value})}>
                    <option value="improving">Improving</option>
                    <option value="stable">Stable</option>
                    <option value="declining">Declining</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Session Summary</label>
                  <textarea name="session_summary" value={sessionFormData.session_summary} onChange={(e) => setSessionFormData({...sessionFormData, session_summary: e.target.value})} rows="3" placeholder="Brief overview..." />
                </div>

                <div className="form-field">
                  <label>Client Insights</label>
                  <textarea name="client_insights" value={sessionFormData.client_insights} onChange={(e) => setSessionFormData({...sessionFormData, client_insights: e.target.value})} rows="2" placeholder="Key realizations..." />
                </div>

                <div className="form-field">
                  <label>Homework</label>
                  <textarea name="homework_assigned" value={sessionFormData.homework_assigned} onChange={(e) => setSessionFormData({...sessionFormData, homework_assigned: e.target.value})} rows="2" placeholder="Tasks assigned..." />
                </div>

                <div className="form-field">
                  <label>Clinical Observations</label>
                  <textarea name="clinical_observations" value={sessionFormData.clinical_observations} onChange={(e) => setSessionFormData({...sessionFormData, clinical_observations: e.target.value})} rows="2" placeholder="Professional observations..." />
                </div>

                <div className="form-field">
                  <label>Risk Assessment</label>
                  <textarea name="risk_assessment" value={sessionFormData.risk_assessment} onChange={(e) => setSessionFormData({...sessionFormData, risk_assessment: e.target.value})} rows="2" placeholder="Safety concerns..." />
                </div>

                <div style={{display: 'flex', gap: '0.75rem'}}>
                  <button type="button" className="btn-secondary" onClick={() => setEditMode(false)}>Cancel</button>
                  <button type="submit" className="btn-submit-modal">Update Session</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Scheduling Modal */}
      {showScheduleModal && (
        <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
          <div className="modal-content schedule-modal" onClick={(e) => e.stopPropagation()}>
            <form className="schedule-form" onSubmit={handleScheduleSubmit}>
              <div className="modal-header">
                <h3>Schedule Appointment</h3>
                <button type="button" className="btn-close" onClick={() => setShowScheduleModal(false)}>×</button>
              </div>

              <div className="form-field">
                <label>{trackConfig.clientTerm} *</label>
                <select
                  value={scheduleFormData.client_id}
                  onChange={(e) => setScheduleFormData({...scheduleFormData, client_id: e.target.value})}
                  required
                  disabled={selectedClient && appView === 'clients'}
                >
                  <option value="">Select {trackConfig.clientTerm.toLowerCase()}...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name}
                    </option>
                  ))}
                </select>
                {selectedClient && appView === 'clients' && (
                  <p className="field-hint">Scheduling for {selectedClient.first_name} {selectedClient.last_name}</p>
                )}
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={scheduleFormData.session_date}
                    onChange={(e) => setScheduleFormData({...scheduleFormData, session_date: e.target.value})}
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Time *</label>
                  <input
                    type="time"
                    value={scheduleFormData.session_time}
                    onChange={(e) => setScheduleFormData({...scheduleFormData, session_time: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-field">
                <label>Duration (minutes)</label>
                <input
                  type="number"
                  value={scheduleFormData.duration_minutes}
                  onChange={(e) => setScheduleFormData({...scheduleFormData, duration_minutes: parseInt(e.target.value)})}
                  min="15"
                  step="5"
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowScheduleModal(false)}>Cancel</button>
                <button type="submit" className="btn-submit-modal">Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </>
  )
}

export default Dashboard
