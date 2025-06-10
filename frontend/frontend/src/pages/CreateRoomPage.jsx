import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom } from '../services/roomService';

const CreateRoomPage = () => {
  const [roomName, setRoomName] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }
      
      const roomData = {
        name: roomName,
        description,
        language,
        is_public: isPublic
      };
      
      const result = await createRoom(roomData, token);
      
      if (result.success && result.room && result.room.id) {
        // Navigate to the room with the returned ID
        navigate(`/room/${result.room.id}`);
      } else {
        setError(result.message || 'Failed to create room');
      }
    } catch (err) {
      console.error('Error creating room:', err);
      setError('Failed to create room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-room-container">
      <div className="create-room-card">
        <h2>Create New Collaboration Room</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="roomName">Room Name</label>
            <input
              type="text"
              id="roomName"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              required
              placeholder="Enter room name"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter room description"
              rows="3"
            ></textarea>
          </div>
          
          <div className="form-group">
            <label htmlFor="language">Programming Language</label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="csharp">C#</option>
            </select>
          </div>
          
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              Make room public
            </label>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => navigate('/dashboard')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoomPage;