import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const navigate = useNavigate();

  const handleReturnToDashboard = () => {
    // Navigate to dashboard without replacing history
    navigate('/dashboard');
  };

  return (
    <div className="not-found-container">
      <h1>404</h1>
      <h2>Page Not Found</h2>
      <p>The page you're looking for doesn't exist or has been moved.</p>
      <button 
        className="btn-primary"
        onClick={handleReturnToDashboard}
      >
        Return to Dashboard
      </button>
    </div>
  );
};

export default NotFoundPage;