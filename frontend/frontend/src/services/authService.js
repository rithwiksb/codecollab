const API_URL = 'http://localhost:5000/api/auth';

// Login user
export const loginUser = async (username, password) => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, message: data.msg || 'Login failed' };
    }
    
    // Store token in localStorage
    localStorage.setItem('token', data.access_token);
    
    return { 
      success: true, 
      user: data.user,
      token: data.access_token
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'An error occurred during login' };
  }
};

// Register user
export const registerUser = async (username, email, password) => {
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, email, password })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, message: data.msg || 'Registration failed' };
    }
    
    // Store token and return user data for immediate login
    localStorage.setItem('token', data.access_token);
    
    return { 
      success: true, 
      user: data.user,
      token: data.access_token
    };
    
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, message: 'Network error occurred' };
  }
};

// Logout user
export const logoutUser = () => {
  localStorage.removeItem('token');
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.log("No token found");
      return { success: false };
    }
    
    const response = await fetch(`${API_URL}/user`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 500) {
      console.error("Server error when fetching user data");
      // Instead of failing completely, we'll return a partial success
      // This allows the app to continue working with limited functionality
      return { 
        success: true, 
        user: { 
          // Provide minimal user info from token if possible
          id: extractUserIdFromToken(token),
          username: 'User' // Fallback username
        },
        isPartialData: true // Flag that this is incomplete data
      };
    }
    
    if (!response.ok) {
      console.error(`Error fetching user: ${response.status}`);
      if (response.status === 401) {
        localStorage.removeItem('token'); // Clear invalid token
      }
      return { success: false };
    }
    
    const data = await response.json();
    return { success: true, user: data };
  } catch (error) {
    console.error('Get user error:', error);
    return { success: false };
  }
};

// Helper function to extract user ID from token
function extractUserIdFromToken(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));
    return payload.sub || null; // 'sub' is typically where user ID is stored
  } catch (e) {
    console.error('Error parsing token:', e);
    return null;
  }
}