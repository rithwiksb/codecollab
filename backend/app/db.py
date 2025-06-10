import os
import sqlite3
from flask import current_app, g

def get_db_connection():
    """Get a SQLite database connection."""
    if 'db_conn' not in g:
        db_path = os.path.join(os.getcwd(), 'codecollab.db')
        g.db_conn = sqlite3.connect(db_path)
        # Configure SQLite to return dictionaries instead of tuples
        g.db_conn.row_factory = sqlite3.Row
    return g.db_conn

def close_db_connection(e=None):
    """Close the SQLite connection."""
    conn = g.pop('db_conn', None)
    
    if conn is not None:
        conn.close()

def init_db():
    """Initialize the database schema."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create rooms table
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
    
    # Create room_members table for many-to-many relationship
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS room_members (
            room_id INTEGER,
            user_id INTEGER,
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (room_id, user_id),
            FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    ''')
    
    conn.commit()

def init_app(app):
    """Register database functions with the Flask app."""
    app.teardown_appcontext(close_db_connection)