import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getUserRooms } from '../services/roomService';

const DashboardPage = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Fetch rooms when component mounts
  useEffect(() => {
    const getRooms = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          setError('You need to log in first.');
          return;
        }
        
        setLoading(true);
        setError(null);
        
        const data = await getUserRooms(token);
        
        // data should be an array at this point due to our fix in getUserRooms
        setRooms(data);
        
      } catch (err) {
        console.error('Error fetching rooms:', err);
        setError('Could not load your rooms. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    getRooms();
  }, []);

  const handleCreateRoom = () => {
    navigate('/create-room');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      {/* Navbar with CodeCollab on left and logout on right */}
      <nav className="navbar">
        <div className="logo">CodeCollab</div>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </nav>

      {/* Create Room button above rooms section */}
      <div className="dashboard-header">
        <h1>Your Coding Workspace</h1>
        <button className="create-room-btn" onClick={handleCreateRoom}>
          CREATE NEW ROOM
        </button>
      </div>

      {/* Rooms in the middle */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2>Your Collaboration Rooms</h2>
        </div>

        <div className="rooms-container">
          {loading ? (
            <div className="room-card">
              <p>Loading your rooms...</p>
            </div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : rooms && rooms.length > 0 ? (
            rooms.map(room => (
              <div key={room.id} className="room-card">
                <h3>{room.name}</h3>
                <p>{room.description}</p>
                <button 
                  onClick={() => navigate(`/room/${room.id}`)}
                  className="create-room-btn"
                >
                  Join Room
                </button>
              </div>
            ))
          ) : (
            <div className="empty-state">
              You don't have any rooms yet. Create one to get started!
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;