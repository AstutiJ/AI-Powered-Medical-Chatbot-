// api.js — All API calls in one place

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// ─── Auth ─────────────────────────────────────────────────────

export const signup = async (username, email, password) => {
  const res = await fetch(`${BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  return res.json();
};

export const login = async (email, password) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
};

// ─── Conversations ────────────────────────────────────────────

export const getConversations = async () => {
  const res = await fetch(`${BASE_URL}/conversations`, {
    headers: getHeaders(),
  });
  return res.json();
};

export const createConversation = async () => {
  const res = await fetch(`${BASE_URL}/conversations`, {
    method: "POST",
    headers: getHeaders(),
  });
  return res.json();
};

export const getMessages = async (convId) => {
  const res = await fetch(`${BASE_URL}/conversations/${convId}`, {
    headers: getHeaders(),
  });
  return res.json();
};

export const deleteConversation = async (convId) => {
  const res = await fetch(`${BASE_URL}/conversations/${convId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return res.json();
};

// ─── Chat ─────────────────────────────────────────────────────

export const sendMessage = async (question, conversationId) => {
  const res = await fetch(`${BASE_URL}/chat`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ question, conversation_id: conversationId }),
  });
  return res.json();
};
