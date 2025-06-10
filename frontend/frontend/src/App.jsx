import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import CreateRoomPage from './pages/CreateRoomPage';
import RoomPage from './pages/RoomPage';

import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/create-room" 
              element={
                <ProtectedRoute>
                  <CreateRoomPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/room/:roomId" 
              element={
                <ProtectedRoute>
                  <RoomPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Default route */}
            <Route 
              path="/" 
              element={<Navigate to="/dashboard" />} 
            />
            
            {/* 404 - Not Found */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
