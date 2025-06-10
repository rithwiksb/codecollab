import { useState } from 'react';

function RegisterForm({ onRegister }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Simple validation
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    
    // Clear any previous errors
    setError('');
    
    // Call the registration function passed as prop
    onRegister(username, email, password);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Register</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div>
        <label htmlFor="username">Username:</label>
        <input 
          type="text" 
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
      
      <div>
        <label htmlFor="email">Email:</label>
        <input 
          type="email" 
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      
      <div>
        <label htmlFor="password">Password:</label>
        <input 
          type="password" 
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      
      <div>
        <label htmlFor="confirmPassword">Confirm Password:</label>
        <input 
          type="password" 
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>
      
      <button type="submit">Register</button>
    </form>
  );
}

export default RegisterForm;