import { Link } from "react-router-dom";
import ThemeToggle from "@/components/ThemeToggle";

export default function Landing() {
  return (
    <div className="page-enter">
      <header className="topbar">
        <div className="container topbar-inner">
          <Link to="/" className="logo-text">
            Resume<span>Flow</span>
          </Link>
          <nav style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
            <ThemeToggle />
            <Link to="/login" className="btn btn-ghost">
              Log in
            </Link>
            <Link to="/register" className="btn btn-primary">
              Sign up free
            </Link>
          </nav>
        </div>
      </header>

      <main className="hero container">
        <section className="hero-grid">
          <div>
            <span className="hero-kicker">AI Resume Builder</span>
            <h1 className="hero-title">Build a resume that gets interviews</h1>
            <p className="hero-copy">
              Create a polished, ATS-ready resume in minutes with a modern editor, secure
              login, and instant save to your account.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary">
                Create free resume
              </Link>
              <Link to="/login" className="btn btn-secondary">
                I already have an account
              </Link>
            </div>
            <div className="feature-cards">
              <article className="feature-card">
                <h3>Fast editing</h3>
                <p>Live updates with a clean writing workspace.</p>
              </article>
              <article className="feature-card">
                <h3>Secure auth</h3>
                <p>Reliable signup/login flow using your backend API.</p>
              </article>
              <article className="feature-card">
                <h3>Organized resumes</h3>
                <p>Create, edit, and manage multiple versions easily.</p>
              </article>
            </div>
          </div>

          <aside className="card hero-panel">
            <div className="hero-stat">
              <b>3 steps</b>
              <span>Sign up → create resume → edit and save</span>
            </div>
            <div className="hero-stat">
              <b>Modern templates</b>
              <span>Pick a style and update your content anytime.</span>
            </div>
            <div className="hero-stat">
              <b>Session-safe</b>
              <span>Stay logged in with refresh tokens and cookies.</span>
            </div>
            <Link to="/register" className="btn btn-primary" style={{ width: "100%" }}>
              Create free resume
            </Link>
          </aside>
        </section>
      </main>
      <footer className="container" style={{ paddingBottom: "1.5rem" }}>
        <p className="muted" style={{ fontSize: "0.84rem" }}>
          © {new Date().getFullYear()} ResumeFlow
        </p>
      </footer>
    </div>
  );
}
