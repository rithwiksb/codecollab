import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import { useAuth } from '../hooks/useAuth';

function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the page user was trying to visit before being redirected to login
  const from = location.state?.from?.pathname || '/dashboard';

  const handleLogin = async (username, password) => {
    setError('');
    setLoading(true);
    
    try {
      const success = await login(username, password);
      
      if (success) {
        // Redirect to original destination or dashboard
        navigate(from, { replace: true });
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>CodeCollab</h1>
        <p>Collaborate on code in real-time</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <LoginForm onLogin={handleLogin} />
        
        <div className="login-footer">
          <p>
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </div>
        
        {loading && <div className="loading">Logging in...</div>}
      </div>
    </div>
  );
}

export default LoginPage;