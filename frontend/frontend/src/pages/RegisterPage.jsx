import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import RegisterForm from '../components/RegisterForm';
import { useAuth } from '../hooks/useAuth';

function RegisterPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (username, email, password) => {
    setError('');
    setLoading(true);
    
    try {
      const success = await register(username, email, password);
      
      if (success) {
        // Redirect to dashboard after successful registration
        navigate('/dashboard');
      } else {
        setError('Registration failed. Please try a different username or email.');
      }
    } catch (err) {
      setError('An error occurred during registration. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <h1>Join CodeCollab</h1>
        <p>Create an account to start collaborating</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <RegisterForm onRegister={handleRegister} />
        
        <div className="register-footer">
          <p>
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
        
        {loading && <div className="loading">Creating your account...</div>}
      </div>
    </div>
  );
}

export default RegisterPage;