import { useState } from 'react';

function LoginForm({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault(); // This is crucial to prevent page reload
    onLogin(username, password);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      
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
        <label htmlFor="password">Password:</label>
        <input 
          type="password" 
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      
      <button type="submit">Login</button>
    </form>
  );
}

export default LoginForm;