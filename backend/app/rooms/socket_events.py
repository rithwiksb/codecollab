from flask import request, current_app
from flask_socketio import emit, join_room, leave_room
from flask_jwt_extended import decode_token
from app import socketio
from app.db import get_db_connection
import json
from datetime import datetime

# Store mapping between socket IDs and user IDs
socket_to_user = {}

@socketio.on('connect')
def handle_connect():
    """Handle client connection with JWT authentication"""
    token = request.args.get('token')
    if not token:
        return False  # Reject connection if no token
    
    try:
        # Verify token
        decoded_token = decode_token(token)
        user_id = decoded_token['sub']
        
        # Store user_id in the socket_to_user mapping instead of overriding request.sid
        socket_to_user[request.sid] = user_id
        
        # Get user details
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute('SELECT username FROM users WHERE id = ?', (int(user_id),))
            user_row = cursor.fetchone()
            
            if not user_row:
                return False  # Reject if user not found
                
            current_app.logger.info(f"User {user_row['username']} connected with socket ID {request.sid}")
            return True
            
        except Exception as e:
            current_app.logger.error(f"Error during socket connection: {str(e)}")
            return False
        finally:
            cursor.close()
            
    except Exception as e:
        current_app.logger.error(f"Invalid token during socket connection: {str(e)}")
        return False  # Reject connection if token is invalid

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    current_app.logger.info(f"Client disconnected: {request.sid}")
    # Clean up the mapping
    if request.sid in socket_to_user:
        del socket_to_user[request.sid]

@socketio.on('join')
def handle_join(data):
    """Handle client joining a room"""
    room_id = data.get('roomId')
    if not room_id:
        emit('error', {'message': 'Room ID is required'})
        return
    
    # Join the socket.io room
    join_room(str(room_id))
    
    # Get user details
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Get the user_id from our mapping instead of using request.sid
        user_id = socket_to_user.get(request.sid)
        if not user_id:
            emit('error', {'message': 'Not authenticated'})
            return
            
        cursor.execute('SELECT id, username, email FROM users WHERE id = ?', (int(user_id),))
        user_row = cursor.fetchone()
        
        if not user_row:
            emit('error', {'message': 'User not found'})
            return
            
        user = dict(user_row)
        
        # Check if user is a member of this room
        cursor.execute('''
            SELECT * FROM room_members 
            WHERE room_id = ? AND user_id = ?
        ''', (room_id, int(user_id)))
        
        if not cursor.fetchone():
            # Add user to room_members if not already a member
            cursor.execute('''
                INSERT OR IGNORE INTO room_members (room_id, user_id)
                VALUES (?, ?)
            ''', (room_id, int(user_id)))
            conn.commit()
        
        # Get current room code
        cursor.execute('SELECT code, language FROM rooms WHERE id = ?', (room_id,))
        room_row = cursor.fetchone()
        
        if not room_row:
            emit('error', {'message': 'Room not found'})
            return
            
        room = dict(room_row)
        
        # Get all users currently in the room
        cursor.execute('''
            SELECT u.id, u.username, u.email 
            FROM users u
            JOIN room_members rm ON u.id = rm.user_id
            WHERE rm.room_id = ?
        ''', (room_id,))
        
        users_in_room = [dict(row) for row in cursor.fetchall()]
        
        # Notify everyone in the room that a new user joined
        emit('user-joined', {
            'user': user,
            'message': f"{user['username']} joined the room",
            'timestamp': datetime.now().isoformat()
        }, to=str(room_id))
        
        # Send current code and room state to the user who just joined
        emit('sync-code', {
            'code': room['code'],
            'language': room['language'],
            'users': users_in_room
        })
        
        current_app.logger.info(f"User {user['username']} joined room {room_id}")
        
    except Exception as e:
        conn.rollback()
        current_app.logger.error(f"Error joining room: {str(e)}")
        emit('error', {'message': f"Error joining room: {str(e)}"})
    
    finally:
        cursor.close()

@socketio.on('leave')
def handle_leave(data):
    """Handle client leaving a room"""
    room_id = data.get('roomId')
    if not room_id:
        return
    
    # Leave the socket.io room
    leave_room(str(room_id))
    
    # Get user details
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Get the user_id from our mapping instead of using request.sid
        user_id = socket_to_user.get(request.sid)
        if not user_id:
            return
            
        cursor.execute('SELECT username FROM users WHERE id = ?', (int(user_id),))
        user_row = cursor.fetchone()
        
        if user_row:
            user = dict(user_row)
            # Notify everyone in the room that a user left
            emit('user-left', {
                'userId': user_id,
                'username': user['username'],
                'message': f"{user['username']} left the room",
                'timestamp': datetime.now().isoformat()
            }, to=str(room_id))
            
            current_app.logger.info(f"User {user['username']} left room {room_id}")
        
    except Exception as e:
        current_app.logger.error(f"Error leaving room: {str(e)}")
    
    finally:
        cursor.close()

@socketio.on('code-change')
def handle_code_change(data):
    """Handle code changes and broadcast to all users in the room"""
    room_id = data.get('roomId')
    code = data.get('code')
    
    if not room_id or code is None:
        return
    
    # Get the user ID from our mapping for the broadcast
    user_id = socket_to_user.get(request.sid)
    
    # Broadcast the code change to everyone in the room except sender
    emit('code-update', {
        'code': code,
        'userId': user_id  # Now sending the actual user ID instead of socket.id
    }, to=str(room_id), skip_sid=request.sid)
    
    # Update code in the database
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('UPDATE rooms SET code = ? WHERE id = ?', (code, room_id))
        conn.commit()
    except Exception as e:
        conn.rollback()
        current_app.logger.error(f"Error updating code: {str(e)}")
    finally:
        cursor.close()

@socketio.on('language-change')
def handle_language_change(data):
    """Handle programming language changes"""
    room_id = data.get('roomId')
    language = data.get('language')
    
    if not room_id or not language:
        return
    
    # Get user details
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Get the user_id from our mapping instead of using request.sid
        user_id = socket_to_user.get(request.sid)
        if not user_id:
            return
            
        cursor.execute('SELECT username FROM users WHERE id = ?', (int(user_id),))
        user_row = cursor.fetchone()
        
        if not user_row:
            return
            
        user = dict(user_row)
        
        # Broadcast the language change to everyone in the room
        emit('language-update', {
            'language': language,
            'username': user['username'],
            'message': f"{user['username']} changed language to {language}",
            'timestamp': datetime.now().isoformat()
        }, to=str(room_id))
        
        # Update language in the database
        cursor.execute('UPDATE rooms SET language = ? WHERE id = ?', (language, room_id))
        conn.commit()
        
        current_app.logger.info(f"Language in room {room_id} changed to {language} by {user['username']}")
        
    except Exception as e:
        conn.rollback()
        current_app.logger.error(f"Error changing language: {str(e)}")
    finally:
        cursor.close()

@socketio.on('chat-message')
def handle_chat_message(data):
    """Handle chat messages within a room"""
    room_id = data.get('roomId')
    message = data.get('message')
    
    if not room_id or not message:
        return
    
    # Get user details
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Get the user_id from our mapping instead of using request.sid
        user_id = socket_to_user.get(request.sid)
        if not user_id:
            return
            
        cursor.execute('SELECT id, username FROM users WHERE id = ?', (int(user_id),))
        user_row = cursor.fetchone()
        
        if not user_row:
            return
            
        user = dict(user_row)
        
        # Broadcast the message to everyone in the room
        emit('chat-message', {
            'userId': user['id'],
            'username': user['username'],
            'message': message,
            'timestamp': datetime.now().isoformat()
        }, to=str(room_id))
        
        current_app.logger.info(f"Chat in room {room_id} from {user['username']}: {message[:20]}...")
        
    except Exception as e:
        current_app.logger.error(f"Error sending chat message: {str(e)}")
    
    finally:
        cursor.close()

@socketio.on('cursor-position')
def handle_cursor_position(data):
    """Handle cursor position updates for collaborative editing"""
    room_id = data.get('roomId')
    position = data.get('position')  # { line, column }
    
    if not room_id or not position:
        return
    
    # Get user details
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Get the user_id from our mapping instead of using request.sid
        user_id = socket_to_user.get(request.sid)
        if not user_id:
            return
            
        cursor.execute('SELECT id, username FROM users WHERE id = ?', (int(user_id),))
        user_row = cursor.fetchone()
        
        if not user_row:
            return
            
        user = dict(user_row)
        
        # Broadcast cursor position to everyone except the sender
        emit('cursor-update', {
            'userId': user['id'],
            'username': user['username'],
            'position': position
        }, to=str(room_id), skip_sid=request.sid)
        
    except Exception as e:
        current_app.logger.error(f"Error updating cursor position: {str(e)}")
    
    finally:
        cursor.close()

@socketio.on('video-offer')
def handle_video_offer(data):
    """Handle WebRTC video call offer"""
    current_app.logger.info(f"Video offer received: {data}")
    room_id = data.get('roomId')
    target_user_id = data.get('targetUserId')
    offer = data.get('offer')
    
    if not room_id or not target_user_id or not offer:
        return
    
    # Get the user ID of the caller
    user_id = socket_to_user.get(request.sid)
    if not user_id:
        return
    
    # Find the socket ID for the target user
    target_socket_id = None
    for socket_id, uid in socket_to_user.items():
        if uid == str(target_user_id):
            target_socket_id = socket_id
            break
    
    if not target_socket_id:
        emit('error', {'message': 'Target user not connected'})
        return
    
    # Get user details
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('SELECT id, username FROM users WHERE id = ?', (int(user_id),))
        user_row = cursor.fetchone()
        
        if not user_row:
            return
            
        user = dict(user_row)
        
        # Forward the offer to the target user
        emit('video-offer', {
            'userId': user['id'],
            'username': user['username'],
            'offer': offer
        }, room=target_socket_id)
        
        current_app.logger.info(f"Video offer sent from {user['username']} to user {target_user_id}")
        
    except Exception as e:
        current_app.logger.error(f"Error handling video offer: {str(e)}")
    
    finally:
        cursor.close()

@socketio.on('video-answer')
def handle_video_answer(data):
    """Handle WebRTC video call answer"""
    current_app.logger.info(f"Video answer received: {data}")
    room_id = data.get('roomId')
    target_user_id = data.get('targetUserId')
    answer = data.get('answer')
    
    if not room_id or not target_user_id or not answer:
        return
    
    # Get the user ID of the answerer
    user_id = socket_to_user.get(request.sid)
    if not user_id:
        return
    
    # Find the socket ID for the target user
    target_socket_id = None
    for socket_id, uid in socket_to_user.items():
        if uid == str(target_user_id):
            target_socket_id = socket_id
            break
    
    if not target_socket_id:
        emit('error', {'message': 'Target user not connected'})
        return
    
    # Get user details
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('SELECT id, username FROM users WHERE id = ?', (int(user_id),))
        user_row = cursor.fetchone()
        
        if not user_row:
            return
            
        user = dict(user_row)
        
        # Forward the answer to the target user
        emit('video-answer', {
            'userId': user['id'],
            'username': user['username'],
            'answer': answer
        }, room=target_socket_id)
        
        current_app.logger.info(f"Video answer sent from {user['username']} to user {target_user_id}")
        
    except Exception as e:
        current_app.logger.error(f"Error handling video answer: {str(e)}")
    
    finally:
        cursor.close()

@socketio.on('ice-candidate')
def handle_ice_candidate(data):
    """Handle ICE candidate exchange for WebRTC"""
    current_app.logger.info(f"ICE candidate received: {data}")
    room_id = data.get('roomId')
    target_user_id = data.get('targetUserId')
    candidate = data.get('candidate')
    
    if not room_id or not target_user_id or not candidate:
        return
    
    # Get the user ID of the sender
    user_id = socket_to_user.get(request.sid)
    if not user_id:
        return
    
    # Find the socket ID for the target user
    target_socket_id = None
    for socket_id, uid in socket_to_user.items():
        if uid == str(target_user_id):
            target_socket_id = socket_id
            break
    
    if not target_socket_id:
        return
    
    # Forward the ICE candidate to the target user
    emit('ice-candidate', {
        'userId': user_id,
        'candidate': candidate
    }, room=target_socket_id)
    
    current_app.logger.debug(f"ICE candidate forwarded from user {user_id} to user {target_user_id}")

@socketio.on('get-my-user-id')
def handle_get_my_user_id():
    """Send the user their own user ID"""
    user_id = socket_to_user.get(request.sid)
    if user_id:
        emit('your-user-id', {'userId': user_id})

@socketio.on('get-users')
def handle_get_users(data):
    """Get all users in a room"""
    room_id = data.get('roomId')
    
    if not room_id:
        return
    
    # Get user ID from socket mapping
    user_id = socket_to_user.get(request.sid)
    if not user_id:
        emit('error', {'message': 'Not authenticated'})
        return
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Get all users in the room
        cursor.execute('''
            SELECT u.id, u.username
            FROM users u
            JOIN room_members rm ON u.id = rm.user_id
            WHERE rm.room_id = ?
        ''', (room_id,))
        
        users = [dict(row) for row in cursor.fetchall()]
        
        emit('room-users', {
            'users': users
        })
        
    except Exception as e:
        current_app.logger.error(f"Error getting room users: {str(e)}")
    finally:
        cursor.close()

@socketio.on('get-username')
def handle_get_username(data):
    """Get username for a user ID"""
    user_id = data.get('userId')
    
    if not user_id:
        return
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('SELECT username FROM users WHERE id = ?', (int(user_id),))
        user_row = cursor.fetchone()
        
        if user_row:
            emit('user-info', {
                'userId': user_id,
                'username': user_row['username']
            })
    except Exception as e:
        current_app.logger.error(f"Error getting username: {str(e)}")
    finally:
        cursor.close()

# Register the socket events with the Flask app
def init_socket_events(app):
    """Initialize socket events with the Flask app"""
    app.logger.info("Socket events initialized")
    # Nothing to do here since we're using the socketio instance directly
    pass