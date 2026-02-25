import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await register(email, password, name || undefined);
      if (result?.message) {
        setError("");
            setSuccess(result.message);
            setTimeout(() => navigate("/dashboard"), 2000);
          } else {
            navigate("/dashboard");
          }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
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
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Sign up and start building resumes instantly.</p>
        </div>
      <form onSubmit={handleSubmit} className="form-grid">
        {error && <p className="status-text status-error">{error}</p>}
        {success && <p className="status-text status-success">{success}</p>}
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
          <span className="label">Password (min 8 characters)</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="input"
          />
        </label>
        <label className="field">
          <span className="label">Name (optional)</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            className="input"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
          style={{ width: "100%" }}
        >
          {loading ? "Creating account…" : "Sign up"}
        </button>
      </form>
      <p className="muted" style={{ marginTop: "1rem", fontSize: "0.875rem" }}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
    </div>
  );
}
