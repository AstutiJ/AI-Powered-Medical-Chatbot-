// LoginPage.js — Login and Signup UI

import { useState } from "react";
import { login, signup } from "./api";

function LoginPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      let data;
      if (isLogin) {
        data = await login(form.email, form.password);
      } else {
        if (!form.username) {
          setError("Username is required");
          setLoading(false);
          return;
        }
        data = await signup(form.username, form.email, form.password);
      }

      if (data.error) {
        setError(data.error);
      } else {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        onLogin(data.user);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoArea}>
          <div style={styles.logoIcon}>M</div>
          <h1 style={styles.logoText}>MedAssist</h1>
          <p style={styles.logoSub}>AI-Powered Medical Knowledge Assistant</p>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(isLogin ? styles.activeTab : {}) }}
            onClick={() => { setIsLogin(true); setError(""); }}
          >
            Login
          </button>
          <button
            style={{ ...styles.tab, ...(!isLogin ? styles.activeTab : {}) }}
            onClick={() => { setIsLogin(false); setError(""); }}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <div style={styles.form}>
          {!isLogin && (
            <input
              style={styles.input}
              type="text"
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              onKeyDown={handleKeyDown}
            />
          )}
          <input
            style={styles.input}
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            onKeyDown={handleKeyDown}
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            onKeyDown={handleKeyDown}
          />

          {error && <p style={styles.error}>{error}</p>}

          <button
            style={{ ...styles.submitBtn, opacity: loading ? 0.6 : 1 }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Please wait..." : isLogin ? "Login" : "Create Account"}
          </button>
        </div>

        <p style={styles.disclaimer}>
          For informational purposes only. Not a substitute for professional medical advice.
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    height: "100vh",
    width: "100vw",
    backgroundColor: "#0f0f0f",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "400px",
    backgroundColor: "#141414",
    border: "1px solid #222",
    borderRadius: "16px",
    padding: "40px",
  },
  logoArea: {
    textAlign: "center",
    marginBottom: "32px",
  },
  logoIcon: {
    width: "48px",
    height: "48px",
    backgroundColor: "#1a1a2e",
    border: "1px solid #2a2a4a",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    color: "#a0a8f0",
    margin: "0 auto 12px",
    fontWeight: "700",
  },
  logoText: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#ffffff",
    margin: "0 0 6px",
  },
  logoSub: {
    fontSize: "12px",
    color: "#555",
    margin: 0,
  },
  tabs: {
    display: "flex",
    backgroundColor: "#1a1a1a",
    borderRadius: "8px",
    padding: "4px",
    marginBottom: "24px",
  },
  tab: {
    flex: 1,
    padding: "8px",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "transparent",
    color: "#666",
    fontSize: "13px",
    cursor: "pointer",
    fontWeight: "500",
  },
  activeTab: {
    backgroundColor: "#2a2a2a",
    color: "#ffffff",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  input: {
    padding: "12px 14px",
    backgroundColor: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "8px",
    color: "#e0e0e0",
    fontSize: "14px",
    outline: "none",
    fontFamily: "inherit",
  },
  error: {
    color: "#f87171",
    fontSize: "12px",
    margin: 0,
    textAlign: "center",
  },
  submitBtn: {
    padding: "12px",
    backgroundColor: "#2a2a5a",
    border: "1px solid #3a3a7a",
    borderRadius: "8px",
    color: "#a0a8f0",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "4px",
  },
  disclaimer: {
    fontSize: "11px",
    color: "#333",
    textAlign: "center",
    marginTop: "24px",
    marginBottom: 0,
  },
};

export default LoginPage;