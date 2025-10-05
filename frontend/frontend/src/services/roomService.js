const API_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/rooms`;

// Get all rooms for the user
export const getUserRooms = async (token) => {
  try {
    if (!token) {
      console.error('No token provided');
      return [];
    }
    
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Room fetch response not OK:', response.status);
      return [];
    }
    
    const data = await response.json();
    
    // Check if the response is in the expected format
    if (data && Array.isArray(data)) {
      return data; // API returns array directly
    } else if (data && data.rooms && Array.isArray(data.rooms)) {
      return data.rooms; // API returns {rooms: [...]}
    } else {
      console.error('Unexpected rooms data format:', data);
      return [];
    }
  } catch (error) {
    console.error('Error getting rooms:', error);
    return [];
  }
};

// Get a specific room by ID
export const getRoom = async (roomId, token) => {
  try {
    if (!roomId) {
      console.error('No room ID provided');
      return { success: false, message: 'Room ID is required' };
    }
    
    if (!token) {
      console.error('No token provided');
      return { success: false, message: 'Authentication required' };
    }
    
    console.log(`Fetching room with ID: ${roomId}`);
    
    const response = await fetch(`${API_URL}/${roomId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Response status: ${response.status}`);
    
    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Non-JSON response:', await response.text());
      return {
        success: false,
        message: `Server returned non-JSON response: ${response.status}`
      };
    }

    const data = await response.json();
    console.log('Room data:', data);
    
    if (!response.ok) {
      return {
        success: false,
        message: data.msg || `Error: ${response.status}`,
        statusCode: response.status,
        raw: data
      };
    }
    
    return {
      success: true,
      room: data
    };
  } catch (error) {
    console.error('Error fetching room:', error);
    return {
      success: false, 
      message: 'Failed to connect to server',
      error: error.toString()
    };
  }
};

// Create a new room
export const createRoom = async (roomData, token) => {
  try {
    if (!token) {
      return {
        success: false,
        message: 'No authentication token provided'
      };
    }
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(roomData)
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        message: data.msg || `Error: ${response.status}`
      };
    }
    
    return {
      success: true,
      room: data
    };
  } catch (error) {
    console.error('Error creating room:', error);
    return {
      success: false, 
      message: 'Failed to connect to server'
    };
  }
};

// Join an existing room
export const joinRoom = async (roomId, token) => {
  try {
    const response = await fetch(`${API_URL}/${roomId}/join`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to join room');
    }

    return await response.json();
  } catch (error) {
    console.error(`Error joining room ${roomId}:`, error);
    throw error;
  }
};

// Leave a room
export const leaveRoom = async (roomId, token) => {
  try {
    const response = await fetch(`${API_URL}/${roomId}/leave`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to leave room');
    }

    return await response.json();
  } catch (error) {
    console.error(`Error leaving room ${roomId}:`, error);
    throw error;
  }
};

// Update a room's code
export const updateRoomCode = async (roomId, code, token) => {
  try {
    if (!token) {
      return {
        success: false,
        message: 'No authentication token provided'
      };
    }
    
    const response = await fetch(`${API_URL}/${roomId}/code`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        message: data.msg || `Error: ${response.status}`
      };
    }
    
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error updating room code:', error);
    return {
      success: false,
      message: 'Failed to connect to server'
    };
  }
};