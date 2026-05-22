# app.py — Main Flask server with auth and chat history

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from database import (
    init_db,
    create_conversation,
    get_user_conversations,
    get_conversation_messages,
    save_message,
    update_conversation_title,
    delete_conversation
)
from auth import auth_bp, token_required
from chatbot import initialize_chatbot, get_answer

load_dotenv()

app = Flask(__name__)
CORS(app, origins="*", supports_credentials=True)

# Register auth routes
app.register_blueprint(auth_bp, url_prefix="/auth")

# Initialize database and chatbot on startup
print("Initializing database...")
init_db()

print("Initializing chatbot...")
rag_chain = initialize_chatbot()
print("Server ready!")

# ─── Health Check ─────────────────────────────────────────────

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Medical Chatbot API is running!"})

# ─── Conversation Routes ──────────────────────────────────────

@app.route("/conversations", methods=["GET"])
@token_required
def get_conversations(user_id):
    """Get all conversations for logged in user"""
    conversations = get_user_conversations(user_id)
    return jsonify({"conversations": conversations})

@app.route("/conversations", methods=["POST"])
@token_required
def new_conversation(user_id):
    """Create a new conversation"""
    conv_id = create_conversation(user_id)
    return jsonify({"conversation_id": conv_id}), 201

@app.route("/conversations/<int:conv_id>", methods=["GET"])
@token_required
def get_messages(user_id, conv_id):
    """Get all messages in a conversation"""
    messages = get_conversation_messages(conv_id)
    return jsonify({"messages": messages})

@app.route("/conversations/<int:conv_id>", methods=["DELETE"])
@token_required
def remove_conversation(user_id, conv_id):
    """Delete a conversation"""
    delete_conversation(conv_id, user_id)
    return jsonify({"message": "Conversation deleted"})

# ─── Chat Route ───────────────────────────────────────────────

@app.route("/chat", methods=["POST"])
@token_required
def chat(user_id):
    """Send a message and get AI response"""
    try:
        data = request.get_json()
        question = data.get("question", "").strip()
        conv_id = data.get("conversation_id")

        if not question:
            return jsonify({"error": "Question cannot be empty"}), 400

        # Create new conversation if not provided
        if not conv_id:
            conv_id = create_conversation(user_id)
            # Set title from first message
            update_conversation_title(conv_id, question)

        # Get previous messages for context
        previous_messages = get_conversation_messages(conv_id)
        
        # Build conversation history for context
        history = ""
        if previous_messages:
            for msg in previous_messages[-6:]:  # Last 6 messages for context
                role = "User" if msg["role"] == "user" else "Assistant"
                history += f"{role}: {msg['content']}\n"

        # Add history to question if exists
        full_question = question
        if history:
            full_question = f"""Previous conversation:
{history}
Current question: {question}"""

        # Save user message
        save_message(conv_id, "user", question)

        # Get answer from chatbot
        answer = get_answer(rag_chain, full_question)

        # Save bot response
        save_message(conv_id, "bot", answer)

        return jsonify({
            "answer": answer,
            "conversation_id": conv_id,
            "status": "success"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
