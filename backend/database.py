# database.py — Database setup and helper functions

import sqlite3
import hashlib
import os
from datetime import datetime

DATABASE_PATH = os.path.join(os.path.dirname(__file__), "medical_chatbot.db")

def get_connection():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row  # Returns dict-like rows
    return conn

def init_db():
    """Initialize database and create tables"""
    conn = get_connection()
    cursor = conn.cursor()

    # Users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Conversations table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT DEFAULT 'New Conversation',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)

    # Messages table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversation_id) REFERENCES conversations (id)
        )
    """)

    conn.commit()
    conn.close()
    print("Database initialized successfully!")

# ─── User Functions ───────────────────────────────────────────

def hash_password(password):
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_user(username, email, password):
    """Create a new user — returns user id or None if already exists"""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
            (username, email, hash_password(password))
        )
        conn.commit()
        return cursor.lastrowid
    except sqlite3.IntegrityError:
        return None  # Username or email already exists
    finally:
        conn.close()

def get_user_by_email(email, password):
    """Get user by email and password — returns user or None"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM users WHERE email = ? AND password_hash = ?",
        (email, hash_password(password))
    )
    user = cursor.fetchone()
    conn.close()
    return user

def get_user_by_id(user_id):
    """Get user by id"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    conn.close()
    return user

# ─── Conversation Functions ───────────────────────────────────

def create_conversation(user_id, title="New Conversation"):
    """Create a new conversation — returns conversation id"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO conversations (user_id, title) VALUES (?, ?)",
        (user_id, title)
    )
    conn.commit()
    conv_id = cursor.lastrowid
    conn.close()
    return conv_id

def get_user_conversations(user_id):
    """Get all conversations for a user — newest first"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """SELECT * FROM conversations 
           WHERE user_id = ? 
           ORDER BY updated_at DESC""",
        (user_id,)
    )
    conversations = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return conversations

def update_conversation_title(conv_id, title):
    """Update conversation title based on first message"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?",
        (title[:50], datetime.now(), conv_id)
    )
    conn.commit()
    conn.close()

def delete_conversation(conv_id, user_id):
    """Delete a conversation and its messages"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM messages WHERE conversation_id = ?", (conv_id,)
    )
    cursor.execute(
        "DELETE FROM conversations WHERE id = ? AND user_id = ?",
        (conv_id, user_id)
    )
    conn.commit()
    conn.close()

# ─── Message Functions ────────────────────────────────────────

def save_message(conversation_id, role, content):
    """Save a message to database"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)",
        (conversation_id, role, content)
    )
    # Update conversation's updated_at
    cursor.execute(
        "UPDATE conversations SET updated_at = ? WHERE id = ?",
        (datetime.now(), conversation_id)
    )
    conn.commit()
    conn.close()

def get_conversation_messages(conversation_id):
    """Get all messages for a conversation"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
        (conversation_id,)
    )
    messages = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return messages

# Test
if __name__ == "__main__":
    init_db()
    
    # Test user creation
    user_id = create_user("testuser", "test@example.com", "password123")
    print(f"Created user with id: {user_id}")
    
    # Test login
    user = get_user_by_email("test@example.com", "password123")
    print(f"Login successful: {dict(user)}")
    
    # Test conversation
    conv_id = create_conversation(user_id, "Test Conversation")
    print(f"Created conversation: {conv_id}")
    
    # Test messages
    save_message(conv_id, "user", "What is diabetes?")
    save_message(conv_id, "bot", "Diabetes is a condition...")
    
    msgs = get_conversation_messages(conv_id)
    print(f"Messages: {msgs}")