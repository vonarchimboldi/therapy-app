import { useAuth } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const { isLoaded, isSignedIn } = useAuth();

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '1.2rem',
        color: 'var(--text-color)'
      }}>
        Loading...
      </div>
    );
  }

  // Redirect to landing page if not authenticated
  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  // User is authenticated, render the protected content
  return children;
}
