from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.db import get_db_connection
from flask_socketio import join_room, leave_room as socketio_leave_room, emit
from flask import current_app
from app import socketio

rooms_bp = Blueprint('rooms', __name__)

@rooms_bp.route('/', methods=['GET'])
@jwt_required()
def get_rooms():
    """Get all available rooms or filter by user membership"""
    user_id = get_jwt_identity()
    member_only = request.args.get('member_only', 'false').lower() == 'true'
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        if member_only:
            # Get rooms where the user is a member
            cursor.execute('''
                SELECT r.* FROM rooms r
                JOIN room_members rm ON r.id = rm.room_id
                WHERE rm.user_id = ?
                ORDER BY r.created_at DESC
            ''', (user_id,))
        else:
            # Get all rooms
            cursor.execute('SELECT * FROM rooms ORDER BY created_at DESC')
        
        rooms = [dict(row) for row in cursor.fetchall()]
        return jsonify({'rooms': rooms}), 200
    
    except Exception as e:
        return jsonify({'msg': f'Error: {str(e)}'}), 500
    
    finally:
        cursor.close()

@rooms_bp.route('/', methods=['POST'])
@jwt_required()
def create_room():
    """Create a new room"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Validate input
    if 'name' not in data:
        return jsonify({'msg': 'Room name is required'}), 400
    
    name = data['name']
    language = data.get('language', 'javascript')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if room name already exists
        cursor.execute('SELECT * FROM rooms WHERE name = ?', (name,))
        if cursor.fetchone():
            return jsonify({'msg': 'Room name already exists'}), 409
        
        # Create new room
        cursor.execute('''
            INSERT INTO rooms (name, owner_id, language)
            VALUES (?, ?, ?)
        ''', (name, user_id, language))
        
        room_id = cursor.lastrowid
        
        # Add creator as a member
        cursor.execute('''
            INSERT INTO room_members (room_id, user_id)
            VALUES (?, ?)
        ''', (room_id, user_id))
        
        # Get the newly created room
        cursor.execute('SELECT * FROM rooms WHERE id = ?', (room_id,))
        room = dict(cursor.fetchone())
        
        conn.commit()
        return jsonify({'msg': 'Room created successfully', 'room': room}), 201
    
    except Exception as e:
        conn.rollback()
        return jsonify({'msg': f'Error: {str(e)}'}), 500
    
    finally:
        cursor.close()

@rooms_bp.route('/<int:room_id>', methods=['GET'])
@jwt_required()
def get_room(room_id):
    """Get a specific room by ID"""
    user_id = get_jwt_identity()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Get room details
        cursor.execute('SELECT * FROM rooms WHERE id = ?', (room_id,))
        room_row = cursor.fetchone()
        
        if not room_row:
            return jsonify({'msg': 'Room not found'}), 404
        
        room = dict(room_row)
        
        # Check if user is a member
        cursor.execute('''
            SELECT * FROM room_members
            WHERE room_id = ? AND user_id = ?
        ''', (room_id, user_id))
        is_member = cursor.fetchone() is not None
        
        # Get room members
        cursor.execute('''
            SELECT u.id, u.username, u.email
            FROM users u
            JOIN room_members rm ON u.id = rm.user_id
            WHERE rm.room_id = ?
        ''', (room_id,))
        members = [dict(row) for row in cursor.fetchall()]
        
        room['members'] = members
        room['is_member'] = is_member
        
        return jsonify({'room': room}), 200
    
    except Exception as e:
        return jsonify({'msg': f'Error: {str(e)}'}), 500
    
    finally:
        cursor.close()

@rooms_bp.route('/<int:room_id>/join', methods=['POST'])
@jwt_required()
def join_room(room_id):
    """Join a room"""
    user_id = get_jwt_identity()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if room exists
        cursor.execute('SELECT * FROM rooms WHERE id = ?', (room_id,))
        room = cursor.fetchone()
        
        if not room:
            return jsonify({'msg': 'Room not found'}), 404
        
        # Check if user is already a member
        cursor.execute('''
            SELECT * FROM room_members
            WHERE room_id = ? AND user_id = ?
        ''', (room_id, user_id))
        
        if cursor.fetchone():
            return jsonify({'msg': 'Already a member of this room'}), 409
        
        # Add user as a member
        cursor.execute('''
            INSERT INTO room_members (room_id, user_id)
            VALUES (?, ?)
        ''', (room_id, user_id))
        
        conn.commit()
        return jsonify({'msg': 'Joined room successfully'}), 200
    
    except Exception as e:
        conn.rollback()
        return jsonify({'msg': f'Error: {str(e)}'}), 500
    
    finally:
        cursor.close()

@rooms_bp.route('/<int:room_id>/leave', methods=['POST'])
@jwt_required()
def leave_room(room_id):
    """Leave a room"""
    user_id = get_jwt_identity()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if user is a member
        cursor.execute('''
            SELECT * FROM room_members
            WHERE room_id = ? AND user_id = ?
        ''', (room_id, user_id))
        
        if not cursor.fetchone():
            return jsonify({'msg': 'Not a member of this room'}), 404
        
        # Remove user from room members
        cursor.execute('''
            DELETE FROM room_members
            WHERE room_id = ? AND user_id = ?
        ''', (room_id, user_id))
        
        conn.commit()
        return jsonify({'msg': 'Left room successfully'}), 200
    
    except Exception as e:
        conn.rollback()
        return jsonify({'msg': f'Error: {str(e)}'}), 500
    
    finally:
        cursor.close()

@rooms_bp.route('/<int:room_id>/toggle-video', methods=['POST'])
@jwt_required()
def toggle_video(room_id):
    """Toggle video chat for a room"""
    user_id = get_jwt_identity()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if room exists and user is the owner
        cursor.execute('SELECT * FROM rooms WHERE id = ? AND owner_id = ?', (room_id, user_id))
        room_row = cursor.fetchone()
        
        if not room_row:
            return jsonify({'msg': 'Room not found or not authorized'}), 404
        
        room = dict(room_row)
        
        # Toggle video_enabled flag (0 to 1 or 1 to 0)
        new_video_status = 1 if room['video_enabled'] == 0 else 0
        cursor.execute('''
            UPDATE rooms
            SET video_enabled = ?
            WHERE id = ?
        ''', (new_video_status, room_id))
        
        # Get the updated room
        cursor.execute('SELECT id, name, video_enabled FROM rooms WHERE id = ?', (room_id,))
        updated_room = dict(cursor.fetchone())
        
        conn.commit()
        
        return jsonify({
            'msg': f'Video chat {"enabled" if new_video_status == 1 else "disabled"}',
            'room': updated_room
        }), 200
    
    except Exception as e:
        conn.rollback()
        return jsonify({'msg': f'Error: {str(e)}'}), 500
    
    finally:
        cursor.close()

@rooms_bp.route('/<int:room_id>', methods=['DELETE'])
@jwt_required()
def delete_room(room_id):
    """Delete a room by ID"""
    user_id = get_jwt_identity()
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Check if the user is authorized to delete the room
        cursor.execute("SELECT owner_id FROM rooms WHERE id = ?", (room_id,))
        room = cursor.fetchone()

        if not room:
            return jsonify({"error": "Room not found"}), 404

        if room["owner_id"] != user_id:
            return jsonify({"error": "Unauthorized"}), 403

        # Delete the room
        cursor.execute("DELETE FROM rooms WHERE id = ?", (room_id,))
        conn.commit()

        return jsonify({"message": "Room deleted successfully"}), 200
    except Exception as e:
        current_app.logger.error(f"Error deleting room: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500
    finally:
        cursor.close()
        conn.close()

@socketio.on('leave')
def handle_leave(data):
    """Handle user leaving the room"""
    room_id = data.get('roomId')
    user_id = socket_to_user.get(request.sid)

    if room_id and user_id:
        leave_room(room_id)
        current_app.logger.info(f"User {user_id} left room {room_id}")