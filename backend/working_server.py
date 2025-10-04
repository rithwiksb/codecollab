#!/usr/bin/env python3

import os
import sys
import sqlite3
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
import bcrypt
from flask_jwt_extended import JWTManager, create_access_token

# Complete working server with Socket.IO
app = Flask(__name__)
app.config['SECRET_KEY'] = 'dev-secret-key'
app.config['JWT_SECRET_KEY'] = 'jwt-secret-key' 

# Enable CORS
CORS(app, origins=["http://localhost:5173"])

# Initialize extensions
jwt = JWTManager(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

def get_db():
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'codecollab.db')
    return sqlite3.connect(db_path)

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

@app.route('/api/health', methods=['GET'])
def health():
    return {'status': 'healthy', 'message': 'Working server is running!'}

@app.route('/api/auth/register', methods=['POST', 'OPTIONS'])
def register():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        
        if not data or not all(k in data for k in ['username', 'email', 'password']):
            return jsonify({'msg': 'Missing required fields'}), 400
        
        username = data['username']
        email = data['email'] 
        password = data['password']
        
        # Hash password
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute("SELECT * FROM users WHERE username = ? OR email = ?", (username, email))
        if cursor.fetchone():
            conn.close()
            return jsonify({'msg': 'Username or email already exists'}), 409
        
        # Insert user
        cursor.execute("INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
                      (username, email, password_hash))
        user_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        # Create token
        access_token = create_access_token(identity=str(user_id))
        
        return jsonify({
            'msg': 'User registered successfully',
            'user': {'id': user_id, 'username': username, 'email': email},
            'access_token': access_token
        }), 201
        
    except Exception as e:
        return jsonify({'msg': f'Error: {str(e)}'}), 500

@app.route('/api/auth/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        
        if not data or not all(k in data for k in ['username', 'password']):
            return jsonify({'msg': 'Missing credentials'}), 400
            
        username = data['username']
        password = data['password']
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        conn.close()
        
        if not user or not bcrypt.checkpw(password.encode('utf-8'), user[3].encode('utf-8')):
            return jsonify({'msg': 'Invalid credentials'}), 401
        
        access_token = create_access_token(identity=str(user[0]))
        
        return jsonify({
            'msg': 'Login successful',
            'user': {'id': user[0], 'username': user[1], 'email': user[2]},
            'access_token': access_token
        }), 200
        
    except Exception as e:
        return jsonify({'msg': f'Error: {str(e)}'}), 500

@app.route('/api/auth/user', methods=['GET', 'OPTIONS'])
def get_current_user():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # For now, return a mock user since we don't have JWT validation set up
        # In a real app, you'd decode the JWT token from the Authorization header
        return jsonify({
            'id': 1,
            'username': 'ricky',
            'email': 'r@r.co'
        }), 200
        
    except Exception as e:
        return jsonify({'msg': f'Error: {str(e)}'}), 500

@app.route('/api/rooms', methods=['GET', 'OPTIONS'])
def get_rooms():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # Initialize rooms table if it doesn't exist
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS rooms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                owner_id INTEGER NOT NULL,
                language TEXT DEFAULT 'javascript',
                code TEXT DEFAULT '',
                video_enabled INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE
            )
        ''')
        
        cursor.execute("SELECT * FROM rooms")
        rooms = cursor.fetchall()
        conn.close()
        
        # Convert to list of dicts
        room_list = []
        for room in rooms:
            room_list.append({
                'id': room[0],
                'name': room[1], 
                'owner_id': room[2],
                'language': room[3],
                'code': room[4],
                'video_enabled': room[5],
                'created_at': room[6]
            })
        
        return jsonify(room_list), 200
        
    except Exception as e:
        return jsonify({'msg': f'Error: {str(e)}'}), 500

@app.route('/api/rooms', methods=['POST'])
def create_room():
    try:
        data = request.get_json()
        
        if not data or 'name' not in data:
            return jsonify({'msg': 'Room name required'}), 400
            
        name = data['name']
        language = data.get('language', 'javascript')
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if room name exists
        cursor.execute("SELECT * FROM rooms WHERE name = ?", (name,))
        if cursor.fetchone():
            conn.close()
            return jsonify({'msg': 'Room name already exists'}), 409
        
        # Insert room (using owner_id = 1 for now)
        cursor.execute("INSERT INTO rooms (name, owner_id, language) VALUES (?, ?, ?)",
                      (name, 1, language))
        room_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'msg': 'Room created successfully',
            'room': {
                'id': room_id,
                'name': name,
                'owner_id': 1,
                'language': language,
                'code': '',
                'video_enabled': 0
            }
        }), 201
        
    except Exception as e:
        return jsonify({'msg': f'Error: {str(e)}'}), 500

@app.route('/api/rooms/<int:room_id>', methods=['GET', 'OPTIONS'])
def get_room(room_id):
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM rooms WHERE id = ?", (room_id,))
        room = cursor.fetchone()
        conn.close()
        
        if not room:
            return jsonify({'msg': 'Room not found'}), 404
            
        return jsonify({
            'id': room[0],
            'name': room[1],
            'owner_id': room[2], 
            'language': room[3],
            'code': room[4],
            'video_enabled': room[5],
            'created_at': room[6]
        }), 200
        
    except Exception as e:
        return jsonify({'msg': f'Error: {str(e)}'}), 500

# Socket.IO Events
@socketio.on('connect')
def handle_connect():
    print(f'Client connected: {request.sid}')
    emit('connected', {'status': 'Connected to server'})

@socketio.on('disconnect') 
def handle_disconnect():
    print(f'Client disconnected: {request.sid}')

@socketio.on('join')
def handle_join(data):
    room_id = data.get('roomId')
    if room_id:
        join_room(str(room_id))
        print(f'Client {request.sid} joined room {room_id}')
        emit('joined', {'roomId': room_id}, room=str(room_id))

@socketio.on('leave')
def handle_leave(data):
    room_id = data.get('roomId')
    if room_id:
        leave_room(str(room_id))
        print(f'Client {request.sid} left room {room_id}')

@socketio.on('code-change')
def handle_code_change(data):
    room_id = data.get('roomId')
    code = data.get('code', '')
    
    if room_id:
        # Update database
        try:
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("UPDATE rooms SET code = ? WHERE id = ?", (code, room_id))
            conn.commit()
            conn.close()
        except:
            pass
        
        # Broadcast to room
        emit('code-update', {'code': code}, room=str(room_id), include_self=False)

@socketio.on('language-change')
def handle_language_change(data):
    room_id = data.get('roomId')
    language = data.get('language', 'javascript')
    
    if room_id:
        # Update database
        try:
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("UPDATE rooms SET language = ? WHERE id = ?", (language, room_id))
            conn.commit()
            conn.close()
        except:
            pass
        
        # Broadcast to room
        emit('language-update', {'language': language}, room=str(room_id), include_self=False)

@socketio.on('chat-message')
def handle_chat_message(data):
    room_id = data.get('roomId')
    message = data.get('message', '')
    username = data.get('username', 'Anonymous')
    
    if room_id and message:
        emit('chat-message', {
            'username': username,
            'message': message,
            'timestamp': data.get('timestamp')
        }, room=str(room_id))

if __name__ == '__main__':
    print("Initializing database...")
    init_db()
    
    # Get port from environment (Render sets PORT env var)
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting COMPLETE server on http://localhost:{port}")
    print("This server includes Socket.IO for real-time features!")
    
    socketio.run(app, host='0.0.0.0', port=port, debug=False, allow_unsafe_werkzeug=True)