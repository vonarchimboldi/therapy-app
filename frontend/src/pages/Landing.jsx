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
              <div className="feature-icon">📅</div>
              <h3>Today's Schedule</h3>
              <p>See all appointments for the day in one view. Schedule sessions, mark them complete or cancelled.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📝</div>
              <h3>Structured Session Notes</h3>
              <p>Document life domains discussed, emotional themes present, interventions used, and clinical observations.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Progress Tracking</h3>
              <p>Track overall progress (improving/stable/declining) and view analytics on patterns across sessions.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">👤</div>
              <h3>Client Management</h3>
              <p>Maintain client profiles with contact info, emergency contacts, session history, and status tracking.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Private & Isolated</h3>
              <p>Each therapist account is completely isolated. Your clients and notes are yours alone.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🌿</div>
              <h3>Clean Interface</h3>
              <p>Minimal, focused design that's easy on the eyes. Dark mode available for late sessions.</p>
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
