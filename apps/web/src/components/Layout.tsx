import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="app-shell page-enter">
      <header className="topbar">
        <div className="container topbar-inner">
          <Link to="/dashboard" className="logo-text">
            Resume<span>Flow</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
            <ThemeToggle />
            <span className="muted" style={{ fontSize: "0.86rem" }}>
              {user?.email}
            </span>
            <Link to="/" className="btn btn-ghost">
              Home
            </Link>
            <button type="button" onClick={handleLogout} className="btn btn-secondary">
            Log out
            </button>
          </div>
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}
