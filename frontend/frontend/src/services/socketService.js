import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.roomId = null;
    this.listeners = {};
  }
  
  // Connect to the Socket.IO server
  connect(token) {
    if (this.socket) return;
    
    this.socket = io('http://localhost:5000', {
      auth: { token },
      query: { token }
    });
    
    console.log('Socket.IO connecting...');
    
    this.socket.on('connect', () => {
      console.log('Socket.IO connection established');
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
    });
    
    // Re-register all listeners after reconnect
    this.socket.on('reconnect', () => {
      console.log('Socket.IO reconnected');
      
      // Rejoin room if we were in one
      if (this.roomId) {
        this.joinRoom(this.roomId);
      }
    });
    
    return this.socket;
  }
  
  // Disconnect from the Socket.IO server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.roomId = null;
    }
  }
  
  // Join a room
  joinRoom(roomId) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    
    this.roomId = roomId;
    this.socket.emit('join', { roomId });
    console.log(`Joining room ${roomId}`);
  }
  
  // Leave the current room
  leaveRoom() {
    if (!this.socket || !this.roomId) {
      console.error('Not in a room or socket not connected');
      return;
    }
    
    this.socket.emit('leave', { roomId: this.roomId });
    console.log(`Leaving room ${this.roomId}`);
    this.roomId = null;
  }
  
  // Send a code update
  sendCodeUpdate(code) {
    if (!this.socket || !this.roomId) {
      console.error('Not in a room or socket not connected');
      return;
    }
    
    this.socket.emit('code-change', { 
      roomId: this.roomId, 
      code 
    });
  }
  
  // Send a language change
  sendLanguageChange(language) {
    if (!this.socket || !this.roomId) {
      console.error('Not in a room or socket not connected');
      return;
    }
    
    this.socket.emit('language-change', { 
      roomId: this.roomId, 
      language 
    });
  }
  
  // Send a chat message
  sendChatMessage(message) {
    if (!this.socket || !this.roomId) {
      console.error('Not in a room or socket not connected');
      return;
    }
    
    this.socket.emit('chat-message', { 
      roomId: this.roomId, 
      message 
    });
  }
  
  // Listen for events
  on(event, callback) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    
    // Store the callback so we can re-register it on reconnect
    this.listeners[event] = callback;
    
    this.socket.on(event, callback);
  }
  
  // Remove event listener
  off(event) {
    if (!this.socket) return;
    
    this.socket.off(event);
    delete this.listeners[event];
  }
}

// Create a singleton instance
const socketService = new SocketService();

export default socketService;