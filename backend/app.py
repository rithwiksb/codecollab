#!/usr/bin/env python3
"""
Production entry point for CodeCollab backend
"""
import os
from working_server import app, socketio, init_db

if __name__ == "__main__":
    # Initialize database
    print("Initializing database...")
    init_db()
    
    # Get port from environment (Render sets this)
    port = int(os.environ.get('PORT', 5000))
    
    print(f"Starting CodeCollab server on port {port}")
    print("Production mode with Socket.IO support")
    
    # Run with eventlet for production
    socketio.run(
        app, 
        host='0.0.0.0', 
        port=port, 
        debug=False,
        allow_unsafe_werkzeug=True,
        async_mode='eventlet'
    )