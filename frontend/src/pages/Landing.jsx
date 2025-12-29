import { Link } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const { isSignedIn } = useAuth()
  const navigate = useNavigate()

  // If already signed in, redirect to dashboard
  useEffect(() => {
    if (isSignedIn) {
      navigate('/dashboard')
    }
  }, [isSignedIn, navigate])

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-header-content">
          <h1 className="landing-logo">TherapyTrack</h1>
          <div className="landing-header-actions">
            <Link to="/sign-in" className="btn-secondary">Sign In</Link>
            <Link to="/sign-up" className="btn-primary">Sign Up</Link>
          </div>
        </div>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <h2 className="landing-title">Simple Clinical Session Notes<br />for Therapists</h2>
          <p className="landing-subtitle">
            An organized way of tracking your clients and sessions.
          </p>
          <div className="landing-cta">
            <Link to="/sign-up" className="btn-primary btn-large">Create Account</Link>
          </div>
        </section>

        <section className="landing-features">
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">🎥</div>
              <h3>Video Sessions</h3>
              <p>Conduct therapy sessions directly in the app with built-in video calls.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">✍️</div>
              <h3>Auto-Transcription</h3>
              <p>Sessions are automatically transcribed so you can focus on your client, not note-taking.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>AI-Powered Search</h3>
              <p>Search across all your session notes using natural language. Find patterns and themes across clients.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">✅</div>
              <h3>Session To-Dos</h3>
              <p>Track follow-ups between sessions. To-dos carry forward automatically until resolved.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">👤</div>
              <h3>Client Management</h3>
              <p>Maintain client profiles with contact info, session history, and progress tracking.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Private & Secure</h3>
              <p>Your data is encrypted and isolated. HIPAA-conscious design.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <p>TherapyTrack &copy; 2025 · Designed for mental health professionals</p>
      </footer>
    </div>
  )
}
