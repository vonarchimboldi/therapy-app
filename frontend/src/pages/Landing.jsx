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
          <h1 className="landing-logo">Pier88</h1>
          <div className="landing-header-actions">
            <Link to="/sign-in" className="btn-secondary">Sign In</Link>
            <Link to="/sign-up" className="btn-primary">Sign Up</Link>
          </div>
        </div>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-hero-content">
            <h2 className="landing-title">Client Management<br />for Solo Practitioners</h2>
            <p className="landing-subtitle">
              Track your clients, sessions, and progress in one organized place. Built for therapists, trainers, tutors, and freelancers who value simplicity and security.
            </p>
            <div className="landing-cta">
              <Link to="/sign-up" className="btn-primary btn-large">Get Started</Link>
            </div>
          </div>

          <div className="landing-hero-image">
            <img
              src="/images/hero-journal.png"
              alt="Leather therapy journal on cream linen with plant"
            />
          </div>
        </section>

        <section className="landing-features">
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">🎥</div>
              <h3>Video Sessions</h3>
              <p>Conduct client sessions directly in the app with built-in video calls.</p>
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
        <p>Pier88 &copy; 2025 · Designed for solo practitioners</p>
      </footer>
    </div>
  )
}
