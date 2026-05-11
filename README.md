# MedAssist: AI-Powered Medical Chatbot

An intelligent medical assistant built with RAG (Retrieval-Augmented Generation) 
that answers questions based on verified medical documents.

## Tech Stack
Python, LangChain, Pinecone, Groq, Flask, SQLite, React

## Architecture
User → React Frontend → Flask API → LangChain RAG → Pinecone + Groq LLM

## Features
- Context-aware medical Q&A using RAG pipeline
- Semantic search with Pinecone vector database
- JWT-based user authentication
- Per-user chat history
- Evidence-based responses with medical disclaimers

## Local Setup

1. Clone repo and create virtual environment
2. Run `pip install -r requirements.txt`
3. Copy `.env.example` to `.env` and fill in API keys
4. Add medical PDFs to `data/medical_pdfs/`
5. Run `python backend/ingest.py`
6. Run `python backend/app.py`
7. Run `cd frontend && npm install && npm start`

## Disclaimer
For informational purposes only. Always consult a qualified doctor.
