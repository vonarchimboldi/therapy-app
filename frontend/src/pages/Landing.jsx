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
            <Link to="/sign-up" className="btn-primary">Get Started</Link>
          </div>
        </div>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <h2 className="landing-title">Clinical Session Management<br />for Mental Health Professionals</h2>
          <p className="landing-subtitle">
            A focused, distraction-free platform for therapists to document sessions,
            track client progress, and maintain comprehensive clinical records.
          </p>
          <div className="landing-cta">
            <Link to="/sign-up" className="btn-primary btn-large">Start Free Trial</Link>
            <Link to="/sign-in" className="btn-secondary btn-large">Sign In</Link>
          </div>
        </section>

        <section className="landing-features">
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h3>Schedule Management</h3>
              <p>View today's appointments at a glance. Schedule, reschedule, and track session status with ease.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📝</div>
              <h3>Structured Notes</h3>
              <p>Document life domains, emotional themes, and interventions with organized, searchable clinical notes.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Progress Analytics</h3>
              <p>Visualize client progress over time. Track patterns in emotional themes, interventions, and outcomes.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Data Privacy</h3>
              <p>Complete data isolation between therapists. Your client data is private, secure, and HIPAA-conscious.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🌙</div>
              <h3>Minimal Design</h3>
              <p>Clean, distraction-free interface following data visualization best practices. Dark mode included.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Fast & Focused</h3>
              <p>Spend less time on documentation, more time with clients. Quick session entry and retrieval.</p>
            </div>
          </div>
        </section>

        <section className="landing-cta-bottom">
          <h2>Ready to streamline your practice?</h2>
          <p>Join therapists who are simplifying their clinical documentation.</p>
          <Link to="/sign-up" className="btn-primary btn-large">Create Your Account</Link>
        </section>
      </main>

      <footer className="landing-footer">
        <p>TherapyTrack &copy; 2025 · Designed for mental health professionals</p>
      </footer>
    </div>
  )
}
