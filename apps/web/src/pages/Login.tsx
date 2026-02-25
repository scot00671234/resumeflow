import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap page-enter">
      <div className="auth-card card">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.8rem" }}>
          <Link to="/" className="btn btn-ghost">
            Back home
          </Link>
          <ThemeToggle />
        </div>
        <div className="auth-header">
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Log in to continue editing your resumes.</p>
        </div>
      <form onSubmit={handleSubmit} className="form-grid">
        {error && (
          <p className="status-text status-error">
            {error}
          </p>
        )}
        <label className="field">
          <span className="label">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="input"
          />
        </label>
        <label className="field">
          <span className="label">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="input"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
          style={{ width: "100%" }}
        >
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p className="muted" style={{ marginTop: "1rem", fontSize: "0.875rem" }}>
        No account? <Link to="/register">Sign up</Link>
      </p>
    </div>
    </div>
  );
}
