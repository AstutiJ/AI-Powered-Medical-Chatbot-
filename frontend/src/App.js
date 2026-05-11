// App.js — Main chat interface with sidebar and history

import { useState, useRef, useEffect } from "react";
import LoginPage from "./LoginPage";
import {
  getConversations,
  createConversation,
  getMessages,
  deleteConversation,
  sendMessage,
} from "./api";

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load conversations on login
  useEffect(() => {
    if (user) loadConversations();
  }, [user]);

  const loadConversations = async () => {
    const data = await getConversations();
    setConversations(data.conversations || []);
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setConversations([]);
    setMessages([]);
    setActiveConvId(null);
  };

  const handleNewChat = async () => {
    const data = await createConversation();
    setActiveConvId(data.conversation_id);
    setMessages([{
      role: "bot",
      content: "Hello! I am your Medical Assistant. How can I help you today?"
    }]);
    await loadConversations();
  };

  const handleSelectConversation = async (convId) => {
    setActiveConvId(convId);
    const data = await getMessages(convId);
    const msgs = data.messages || [];
    if (msgs.length === 0) {
      setMessages([{
        role: "bot",
        content: "Hello! I am your Medical Assistant. How can I help you today?"
      }]);
    } else {
      setMessages(msgs);
    }
  };

  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();
    await deleteConversation(convId);
    if (activeConvId === convId) {
      setActiveConvId(null);
      setMessages([]);
    }
    await loadConversations();
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const question = input.trim();
    setInput("");

    // If no active conversation, create one
    let convId = activeConvId;

    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);

    try {
      const data = await sendMessage(question, convId);

      if (data.error) {
        setMessages((prev) => [...prev, {
          role: "bot",
          content: "Sorry, something went wrong. Please try again."
        }]);
      } else {
        if (!convId) {
          setActiveConvId(data.conversation_id);
        }
        setMessages((prev) => [...prev, {
          role: "bot",
          content: data.answer
        }]);
        await loadConversations();
      }
    } catch {
      setMessages((prev) => [...prev, {
        role: "bot",
        content: "Unable to connect to server. Please ensure Flask server is running."
      }]);
    }

    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) handleSend();
  };

  // Show login page if not logged in
  if (!user) return <LoginPage onLogin={handleLogin} />;

  return (
    <div style={styles.page}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarTop}>
          <div style={styles.logo}>MedAssist</div>
          <button style={styles.newChatBtn} onClick={handleNewChat}>
            + New Chat
          </button>
        </div>

        <div style={styles.historySection}>
          <p style={styles.historyLabel}>CONVERSATIONS</p>
          {conversations.length === 0 ? (
            <p style={styles.noHistory}>No conversations yet</p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                style={{
                  ...styles.historyItem,
                  ...(activeConvId === conv.id ? styles.activeHistory : {}),
                }}
                onClick={() => handleSelectConversation(conv.id)}
              >
                <span style={styles.historyTitle}>{conv.title}</span>
                <button
                  style={styles.deleteBtn}
                  onClick={(e) => handleDeleteConversation(e, conv.id)}
                  title="Delete"
                >
                  x
                </button>
              </div>
            ))
          )}
        </div>

        <div style={styles.sidebarBottom}>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>
              {user.username[0].toUpperCase()}
            </div>
            <span style={styles.userName}>{user.username}</span>
          </div>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div style={styles.main}>
        <div style={styles.header}>
          <div>
            <div style={styles.headerTitle}>Medical Assistant</div>
            <div style={styles.headerSub}>Powered by RAG + Groq AI</div>
          </div>
          <div style={styles.statusDot} />
        </div>

        {/* Empty state */}
        {messages.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>M</div>
            <h2 style={styles.emptyTitle}>How can I help you today?</h2>
            <p style={styles.emptySub}>
              Ask any medical question based on verified knowledge base.
            </p>
            <button style={styles.startBtn} onClick={handleNewChat}>
              Start New Conversation
            </button>
          </div>
        ) : (
          <div style={styles.chatBox}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  ...styles.messageRow,
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                {msg.role === "bot" && <div style={styles.botIcon}>M</div>}
                <div
                  style={{
                    ...styles.bubble,
                    ...(msg.role === "user" ? styles.userBubble : styles.botBubble),
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ ...styles.messageRow, justifyContent: "flex-start" }}>
                <div style={styles.botIcon}>M</div>
                <div style={{ ...styles.bubble, ...styles.botBubble }}>
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input */}
        <div style={styles.inputArea}>
          <textarea
            style={styles.input}
            placeholder="Ask a medical question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            rows={1}
          />
          <button
            style={{ ...styles.sendBtn, opacity: loading ? 0.5 : 1 }}
            onClick={handleSend}
            disabled={loading}
          >
            Send
          </button>
        </div>
        <p style={styles.disclaimer}>
          For informational purposes only. Always consult a qualified medical professional.
        </p>
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0f0f0f; overflow: hidden; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 4px; }
        @keyframes blink {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
        .dot {
          display: inline-block;
          width: 6px; height: 6px;
          background: #888; border-radius: 50%;
          margin: 0 2px;
          animation: blink 1.4s infinite;
        }
        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    height: "100vh",
    width: "100vw",
    backgroundColor: "#0f0f0f",
    color: "#e0e0e0",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    overflow: "hidden",
  },
  sidebar: {
    width: "260px",
    backgroundColor: "#141414",
    borderRight: "1px solid #1e1e1e",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
  },
  sidebarTop: {
    padding: "20px 16px",
    borderBottom: "1px solid #1e1e1e",
  },
  logo: {
    fontSize: "17px",
    fontWeight: "700",
    color: "#fff",
    marginBottom: "14px",
    letterSpacing: "0.3px",
  },
  newChatBtn: {
    width: "100%",
    padding: "9px 12px",
    backgroundColor: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "8px",
    color: "#aaa",
    fontSize: "13px",
    cursor: "pointer",
    textAlign: "left",
  },
  historySection: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
  },
  historyLabel: {
    fontSize: "10px",
    color: "#444",
    letterSpacing: "1px",
    marginBottom: "10px",
  },
  noHistory: {
    fontSize: "12px",
    color: "#444",
    textAlign: "center",
    marginTop: "20px",
  },
  historyItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 10px",
    borderRadius: "6px",
    fontSize: "13px",
    color: "#777",
    cursor: "pointer",
    marginBottom: "2px",
    border: "1px solid transparent",
  },
  activeHistory: {
    backgroundColor: "#1e1e1e",
    border: "1px solid #2a2a2a",
    color: "#ccc",
  },
  historyTitle: {
    flex: 1,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    marginRight: "8px",
  },
  deleteBtn: {
    background: "none",
    border: "none",
    color: "#444",
    cursor: "pointer",
    fontSize: "12px",
    padding: "2px 4px",
    borderRadius: "4px",
    flexShrink: 0,
  },
  sidebarBottom: {
    padding: "14px 16px",
    borderTop: "1px solid #1e1e1e",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  avatar: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    backgroundColor: "#1a1a2e",
    border: "1px solid #2a2a4a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    color: "#a0a8f0",
    fontWeight: "600",
  },
  userName: {
    fontSize: "13px",
    color: "#888",
  },
  logoutBtn: {
    background: "none",
    border: "1px solid #2a2a2a",
    borderRadius: "6px",
    color: "#555",
    fontSize: "11px",
    padding: "5px 10px",
    cursor: "pointer",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    padding: "14px 28px",
    borderBottom: "1px solid #1a1a1a",
    backgroundColor: "#111",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#fff",
  },
  headerSub: {
    fontSize: "11px",
    color: "#444",
    marginTop: "2px",
  },
  statusDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    backgroundColor: "#22c55e",
  },
  emptyState: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "14px",
    color: "#444",
  },
  emptyIcon: {
    width: "56px",
    height: "56px",
    backgroundColor: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    color: "#555",
    fontWeight: "700",
  },
  emptyTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#666",
  },
  emptySub: {
    fontSize: "13px",
    color: "#444",
    textAlign: "center",
    maxWidth: "300px",
    lineHeight: "1.6",
  },
  startBtn: {
    marginTop: "8px",
    padding: "10px 20px",
    backgroundColor: "#1a1a2e",
    border: "1px solid #2a2a4a",
    borderRadius: "8px",
    color: "#a0a8f0",
    fontSize: "13px",
    cursor: "pointer",
  },
  chatBox: {
    flex: 1,
    overflowY: "auto",
    padding: "24px 28px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  messageRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
  },
  botIcon: {
    width: "26px",
    height: "26px",
    borderRadius: "6px",
    backgroundColor: "#1a1a1a",
    border: "1px solid #2a2a2a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    color: "#666",
    flexShrink: 0,
    marginTop: "2px",
    fontWeight: "700",
  },
  bubble: {
    maxWidth: "68%",
    padding: "11px 15px",
    fontSize: "14px",
    lineHeight: "1.7",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  botBubble: {
    backgroundColor: "#141414",
    border: "1px solid #1e1e1e",
    borderRadius: "4px 12px 12px 12px",
    color: "#c8c8c8",
  },
  userBubble: {
    backgroundColor: "#1a1a2e",
    border: "1px solid #2a2a4a",
    borderRadius: "12px 4px 12px 12px",
    color: "#b8c0e8",
  },
  inputArea: {
    display: "flex",
    padding: "14px 28px",
    gap: "10px",
    borderTop: "1px solid #1a1a1a",
    backgroundColor: "#111",
    alignItems: "flex-end",
    flexShrink: 0,
  },
  input: {
    flex: 1,
    padding: "11px 15px",
    fontSize: "14px",
    borderRadius: "10px",
    border: "1px solid #2a2a2a",
    backgroundColor: "#1a1a1a",
    color: "#e0e0e0",
    outline: "none",
    resize: "none",
    fontFamily: "inherit",
    lineHeight: "1.5",
  },
  sendBtn: {
    padding: "11px 20px",
    backgroundColor: "#1a1a2e",
    color: "#a0a8f0",
    border: "1px solid #2a2a4a",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  disclaimer: {
    textAlign: "center",
    fontSize: "11px",
    color: "#2a2a2a",
    padding: "6px",
    backgroundColor: "#111",
    flexShrink: 0,
  },
};

export default App;