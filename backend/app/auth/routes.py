from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
import bcrypt
from app.db import get_db_connection

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Validate input
    if not all(k in data for k in ['username', 'email', 'password']):
        return jsonify({'msg': 'Missing required fields'}), 400
    
    username = data['username']
    email = data['email']
    password = data['password']
    
    # Hash the password
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if username or email already exists
        cursor.execute("SELECT * FROM users WHERE username = ? OR email = ?", (username, email))
        if cursor.fetchone():
            return jsonify({'msg': 'Username or email already exists'}), 409
        
        # Insert the new user
        cursor.execute(
            "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
            (username, email, password_hash)
        )
        user_id = cursor.lastrowid
        conn.commit()
        
        # Create access token
        access_token = create_access_token(identity=str(user_id))
        
        return jsonify({
            'msg': 'User registered successfully',
            'user': {
                'id': user_id,
                'username': username,
                'email': email
            },
            'access_token': access_token
        }), 201
    
    except Exception as e:
        conn.rollback()
        return jsonify({'msg': f'Error: {str(e)}'}), 500
    
    finally:
        cursor.close()

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    # Validate input
    if not all(k in data for k in ['username', 'password']):
        return jsonify({'msg': 'Missing username or password'}), 400
    
    username = data['username']
    password = data['password']
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Find user by username
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        user_row = cursor.fetchone()
        
        if not user_row:
            return jsonify({'msg': 'Invalid username or password'}), 401
        
        user = dict(user_row)
        
        # Verify password
        if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            return jsonify({'msg': 'Invalid username or password'}), 401
        
        # Create access token
        access_token = create_access_token(identity=str(user['id']))
        
        return jsonify({
            'msg': 'Login successful',
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email']
            },
            'access_token': access_token
        }), 200
    
    except Exception as e:
        return jsonify({'msg': f'Error: {str(e)}'}), 500
    
    finally:
        cursor.close()

@auth_bp.route('/user', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get the current user's information."""
    try:
        # Get the user's identity from the JWT token
        user_id = get_jwt_identity()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Execute the query with proper parameter binding for SQLite
        cursor.execute("SELECT id, username, email, created_at FROM users WHERE id = ?", (user_id,))
        
        user_row = cursor.fetchone()
        
        if not user_row:
            return jsonify({'msg': 'User not found'}), 404
        
        # Instead of dict(user_row), create the dictionary manually
        # Make sure this matches the order of columns in your SELECT statement
        user = {
            'id': user_row[0],
            'username': user_row[1],
            'email': user_row[2],
            'created_at': user_row[3]
        }
        
        # Convert datetime objects to strings to make them JSON serializable
        if user['created_at']:
            user['created_at'] = str(user['created_at'])
        
        return jsonify(user), 200
        
    except Exception as e:
        current_app.logger.error(f"Error in get_current_user: {str(e)}")
        return jsonify({'msg': f'Error: {str(e)}'}), 500
    
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()