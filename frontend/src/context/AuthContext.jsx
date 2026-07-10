
import { createContext, useContext, useState, useEffect, useCallback } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken]   = useState(() => localStorage.getItem("nexmeet_token"));
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true); // verifying token on mount

  // Verify saved token on mount
  useEffect(() => {
    if (!token) { setLoading(false); return; }

    fetch(`${API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("invalid");
        return r.json();
      })
      .then(({ user }) => setUser(user))
      .catch(() => {
        // Token invalid or expired — clear it
        localStorage.removeItem("nexmeet_token");
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);  // run once on mount

  const saveSession = useCallback((token, user) => {
    localStorage.setItem("nexmeet_token", token);
    setToken(token);
    setUser(user);
  }, []);

  const register = useCallback(async ({ name, email, password }) => {
    const res = await fetch(`${API}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registration failed");
    saveSession(data.token, data.user);
    return data.user;
  }, [saveSession]);

  const login = useCallback(async ({ email, password }) => {
    const res = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    saveSession(data.token, data.user);
    return data.user;
  }, [saveSession]);

  const logout = useCallback(() => {
    localStorage.removeItem("nexmeet_token");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
