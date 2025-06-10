import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRoom, updateRoomCode } from '../services/roomService';
import CodeEditor from '../components/CodeEditor';
import VideoCall from '../components/VideoCall';
import ChatPanel from '../components/ChatPanel';

const RoomPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState({
    name: 'Untitled Room',
    description: 'No description',
    language: 'javascript',
    code: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  
  // For debouncing code updates
  const [saveTimeout, setSaveTimeout] = useState(null);

  useEffect(() => {
    const loadRoom = async () => {
      try {
        console.log(`Loading room with ID: ${roomId}`);
        
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const result = await getRoom(roomId, token);
        console.log('Room API response:', result);
        
        if (result.success && result.room) {
          // Update room state with fetched data
          setRoom(prevRoom => ({
            ...prevRoom,
            ...result.room,
            // Make sure we have these properties
            name: result.room.name || prevRoom.name,
            description: result.room.description || prevRoom.description,
            language: result.room.language || prevRoom.language,
            code: result.room.code || prevRoom.code
          }));
        } else {
          setError(result.message || 'Failed to load room');
        }
      } catch (err) {
        console.error('Error loading room:', err);
        setError('Could not load room data');
      } finally {
        setLoading(false);
      }
    };

    if (roomId) {
      loadRoom();
    } else {
      setError('No room ID provided');
      setLoading(false);
    }
    
    // Clean up any pending timeouts on unmount
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [roomId, navigate, saveTimeout]);

  const handleCodeChange = (newCode) => {
    // Update local state immediately
    setRoom(prevRoom => ({
      ...prevRoom,
      code: newCode
    }));
    
    // Debounce saving to avoid too many API calls
    setSaving(true);
    
    // Clear any existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    // Set a new timeout to save after 1 second of inactivity
    const timeout = setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        // Save code to backend
        const result = await updateRoomCode(roomId, newCode, token);
        if (!result.success) {
          console.error('Failed to save code:', result.message);
        }
      } catch (err) {
        console.error('Error saving code:', err);
      } finally {
        setSaving(false);
      }
    }, 1000);
    
    setSaveTimeout(timeout);
  };

  const handleDeleteRoom = async () => {
    if (!window.confirm("Are you sure you want to delete this room? This action cannot be undone.")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/rooms/${roomId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        navigate('/dashboard');
      } else {
        alert("Failed to delete room.");
      }
    } catch (err) {
      alert("Error deleting room.");
    }
  };

  return (
    <div className="room-container">
      <div className="room-header">
        <h1 style={{ color: "var(--accent-color)" }}>{room.name || "Untitled Room"}</h1>
        <p style={{ color: "var(--background-color)" }}>{room.description || "No description"}</p>
        <div className="room-controls">
          <button 
            className="control-btn"
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </button>
          <button
            className="control-btn delete-btn"
            onClick={handleDeleteRoom}
            style={{ marginLeft: '1rem', backgroundColor: '#DA1818', color: '#fff', border: '1px solid #FFD700' }}
          >
            Delete Room
          </button>
        </div>
      </div>
      
      {/* Main content area with editor, video, and chat */}
      <div className="room-content">
        <div className="video-container">
          <VideoCall roomId={roomId} />
        </div>
        <div className="editor-container">
          {loading ? (
            <div className="loading-container">Loading editor...</div>
          ) : error ? (
            <div className="error-container">
              <p className="error-message">{error}</p>
            </div>
          ) : (
            <CodeEditor 
              roomId={roomId}
              language={room.language || 'javascript'}
              initialCode={room.code}
              onCodeChange={handleCodeChange}
            />
          )}
        </div>
        <div className="chat-container">
          <ChatPanel roomId={roomId} />
        </div>
      </div>
    </div>
  );
};

export default RoomPage;