import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode]     = useState("login"); // "login" | "register"
  const [form, setForm]     = useState({ name: "", email: "", password: "" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        await register({ name: form.name, email: form.email, password: form.password });
      } else {
        await login({ email: form.email, password: form.password });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(isRegister ? "login" : "register");
    setError("");
    setForm({ name: "", email: "", password: "" });
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        {/* Brand */}
        <div className="auth-brand">
          <span className="brand-icon">◈</span>
          <h1>NexMeet</h1>
          <p className="brand-sub">Crystal-clear video. Zero compromise.</p>
        </div>

        {/* Tab switcher */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${!isRegister ? "active" : ""}`}
            onClick={() => !isRegister || switchMode()}
            type="button"
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${isRegister ? "active" : ""}`}
            onClick={() => isRegister || switchMode()}
            type="button"
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister && (
            <div className="auth-field">
              <label>Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={set("name")}
                placeholder="Your name"
                autoFocus
                maxLength={64}
                required
              />
            </div>
          )}

          <div className="auth-field">
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={set("email")}
              placeholder="you@example.com"
              autoFocus={!isRegister}
              maxLength={128}
              required
            />
          </div>

          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={set("password")}
              placeholder={isRegister ? "Min 8 chars, include a number" : "Your password"}
              maxLength={128}
              required
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading
              ? "Please wait…"
              : isRegister
              ? "Create Account →"
              : "Sign In →"}
          </button>
        </form>

        {/* Switch link */}
        <p className="auth-switch">
          {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
          <button type="button" className="auth-link" onClick={switchMode}>
            {isRegister ? "Sign In" : "Create one"}
          </button>
        </p>
      </div>
    </div>
  );
}
