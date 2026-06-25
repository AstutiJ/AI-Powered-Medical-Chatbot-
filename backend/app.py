# app.py

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
CORS(app,
     origins=[
         "https://ai-powered-medical-chatbot-seven.vercel.app",
         "http://localhost:3000"
     ],
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "DELETE", "OPTIONS"]
)

app.register_blueprint(auth_bp, url_prefix="/auth")

# Initialize database immediately
print("Initializing database...")
init_db()
print("Database ready!")

# Chatbot loads lazily on first request
rag_chain = None

def get_rag_chain():
    global rag_chain
    if rag_chain is None:
        print("Initializing chatbot...")
        rag_chain = initialize_chatbot()
        print("Chatbot ready!")
    return rag_chain

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Medical Chatbot API is running!"})

@app.route("/conversations", methods=["GET"])
@token_required
def get_conversations(user_id):
    conversations = get_user_conversations(user_id)
    return jsonify({"conversations": conversations})

@app.route("/conversations", methods=["POST"])
@token_required
def new_conversation(user_id):
    conv_id = create_conversation(user_id)
    return jsonify({"conversation_id": conv_id}), 201

@app.route("/conversations/<int:conv_id>", methods=["GET"])
@token_required
def get_messages(user_id, conv_id):
    messages = get_conversation_messages(conv_id)
    return jsonify({"messages": messages})

@app.route("/conversations/<int:conv_id>", methods=["DELETE"])
@token_required
def remove_conversation(user_id, conv_id):
    delete_conversation(conv_id, user_id)
    return jsonify({"message": "Conversation deleted"})

@app.route("/chat", methods=["POST"])
@token_required
def chat(user_id):
    try:
        data = request.get_json()
        question = data.get("question", "").strip()
        conv_id = data.get("conversation_id")

        if not question:
            return jsonify({"error": "Question cannot be empty"}), 400

        if not conv_id:
            conv_id = create_conversation(user_id)
            update_conversation_title(conv_id, question)

        previous_messages = get_conversation_messages(conv_id)
        
        history = ""
        if previous_messages:
            for msg in previous_messages[-6:]:
                role = "User" if msg["role"] == "user" else "Assistant"
                history += f"{role}: {msg['content']}\n"

        full_question = question
        if history:
            full_question = f"""Previous conversation:
{history}
Current question: {question}"""

        save_message(conv_id, "user", question)

        # Chatbot loads here on first request
        chain = get_rag_chain()
        answer = get_answer(chain, full_question)

        save_message(conv_id, "bot", answer)

        return jsonify({
            "answer": answer,
            "conversation_id": conv_id,
            "status": "success"
        })

    except Exception as e:
        import traceback
        traceback.print_exc()  
        return jsonify({"error": str(e)}), 500
    

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
