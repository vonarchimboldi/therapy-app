import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import Dashboard from './pages/Dashboard'
import SessionSummary from './pages/SessionSummary'
import SessionSummaryDemo from './pages/SessionSummaryDemo'
import IntakePortal from './pages/IntakePortal'
import IntakePortalDemo from './pages/IntakePortalDemo'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/sign-in/*" element={<SignIn />} />
      <Route path="/sign-up/*" element={<SignUp />} />
      <Route path="/demo/session" element={<SessionSummaryDemo />} />
      <Route path="/demo/intake" element={<IntakePortalDemo />} />
      <Route path="/intake/:token" element={<IntakePortal />} />
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/session/:sessionId"
        element={
          <ProtectedRoute>
            <SessionSummary />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
