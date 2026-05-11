# auth.py — Authentication routes for login and signup

import jwt
import os
from datetime import datetime, timedelta
from functools import wraps
from flask import Blueprint, request, jsonify
from database import create_user, get_user_by_email, get_user_by_id

auth_bp = Blueprint("auth", __name__)

SECRET_KEY = os.getenv("SECRET_KEY", "fallback_secret_key")

# ─── Token Functions ──────────────────────────────────────────

def generate_token(user_id):
    """Generate JWT token for authenticated user"""
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(days=7)  # Token expires in 7 days
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

def verify_token(token):
    """Verify JWT token and return user_id"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload["user_id"]
    except jwt.ExpiredSignatureError:
        return None  # Token expired
    except jwt.InvalidTokenError:
        return None  # Invalid token

def token_required(f):
    """Decorator — protects routes that require login"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        if not token:
            return jsonify({"error": "Token is missing"}), 401
        
        user_id = verify_token(token)
        if not user_id:
            return jsonify({"error": "Token is invalid or expired"}), 401
        
        return f(user_id, *args, **kwargs)
    return decorated

# ─── Auth Routes ──────────────────────────────────────────────

@auth_bp.route("/signup", methods=["POST"])
def signup():
    """Register a new user"""
    data = request.get_json()
    username = data.get("username", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    # Validation
    if not username or not email or not password:
        return jsonify({"error": "All fields are required"}), 400
    
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    
    if "@" not in email:
        return jsonify({"error": "Invalid email address"}), 400

    # Create user
    user_id = create_user(username, email, password)
    if not user_id:
        return jsonify({"error": "Username or email already exists"}), 409

    token = generate_token(user_id)
    return jsonify({
        "message": "Account created successfully",
        "token": token,
        "user": {"id": user_id, "username": username, "email": email}
    }), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    """Login existing user"""
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = get_user_by_email(email, password)
    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    token = generate_token(user["id"])
    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"]
        }
    }), 200

@auth_bp.route("/me", methods=["GET"])
@token_required
def get_me(user_id):
    """Get current logged in user info"""
    user = get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    return jsonify({
        "id": user["id"],
        "username": user["username"],
        "email": user["email"]
    }), 200