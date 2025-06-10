import { Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { authenticated, loading } = useContext(AuthContext);
  
  // Show nothing while checking authentication
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  // Redirect to login if not authenticated
  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render children if authenticated
  return children;
};

export default ProtectedRoute;