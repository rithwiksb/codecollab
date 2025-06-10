import { createContext, useState, useEffect } from 'react';
import { loginUser, registerUser, logoutUser, getCurrentUser } from '../services/authService';

// Create the context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        if (!localStorage.getItem('token')) {
          setLoading(false);
          setAuthenticated(false);
          return;
        }
        
        const result = await getCurrentUser();
        
        if (result.success) {
          setCurrentUser(result.user);
          setAuthenticated(true);
          
          // If we only have partial data, don't consider this a full success
          if (result.isPartialData) {
            console.warn('Operating with partial user data due to API issues');
          }
        } else {
          localStorage.removeItem('token');
          setCurrentUser(null);
          setAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setCurrentUser(null);
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, [token]);

  // Login function
  const login = async (username, password) => {
    try {
      setError(null);
      const response = await loginUser(username, password);
      
      if (response.success) {
        localStorage.setItem('token', response.token);
        setToken(response.token);
        setAuthenticated(true); // Set authenticated to true!
        
        // Extract basic user info from token if possible
        if (response.user) {
          setCurrentUser(response.user);
          return true;
        }
        
        // Only try to get current user if we don't have user info yet
        try {
          const userResponse = await getCurrentUser();
          if (userResponse.success) {
            setCurrentUser(userResponse.user);
          }
        } catch (error) {
          console.error('Error fetching user data after login:', error);
          // Don't fail login if getCurrentUser fails - we're already authenticated
        }
        return true;
      } else {
        setError(response.message || 'Login failed');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred. Please try again.');
      return false;
    }
  };

  // Register function
  const register = async (username, email, password) => {
    try {
      setError(null);
      const response = await registerUser(username, email, password);
      
      if (response.success) {
        // Set user data immediately from registration response if available
        if (response.token) {
          localStorage.setItem('token', response.token);
          setToken(response.token);
          setAuthenticated(true);
          
          if (response.user) {
            setCurrentUser(response.user);
            return true;
          }
        }
        
        // If no token in registration response, try login
        return await login(username, password);
      } else {
        setError(response.message || 'Registration failed');
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('An unexpected error occurred. Please try again.');
      return false;
    }
  };

  // Logout function
  const logout = () => {
    logoutUser();
    localStorage.removeItem('token');
    setCurrentUser(null);
    setToken(null);
    setAuthenticated(false);
  };

  // The value that will be given to the context
  const value = {
    currentUser,
    authenticated, // Use the authenticated state
    loading,
    error,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};