import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
// Initialize global media stream manager
import './utils/mediaManager';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
