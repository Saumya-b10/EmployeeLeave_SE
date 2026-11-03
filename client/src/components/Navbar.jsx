import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import toast from "react-hot-toast";
import { FiSun, FiMoon, FiLogOut, FiMenu, FiX, FiHome, FiGrid } from "react-icons/fi";
import { useState } from "react";
import RoleBadge from "./RoleBadge";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const getDashboardPath = () => {
    if (!user) return "/";
    return `/${user.role}`;
  };

  return (
    <>
      <nav
        className="border-b px-4 py-3 sm:px-6"
        style={{
          backgroundColor: "var(--bg-nav)",
          borderColor: "var(--border-color)",
          boxShadow: "0 1px 3px var(--shadow-color)",
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link
              to={user ? getDashboardPath() : "/"}
              className="text-lg font-bold tracking-tight sm:text-xl"
              style={{ color: "var(--text-primary)" }}
            >
              <span style={{ color: "#6366f1" }}>Swiftly</span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden items-center gap-4 sm:flex">
              <Link
                to="/"
                className="text-sm font-medium transition-colors hover:text-indigo-500"
                style={{ color: "var(--text-secondary)" }}
              >
                Home
              </Link>
              {user && (
                <Link
                  to={getDashboardPath()}
                  className="text-sm font-medium transition-colors hover:text-indigo-500"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            {user && (
              <div className="flex items-center gap-2 pr-2">
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {user.name}
                </span>
                <RoleBadge role={user.role} />
              </div>
            )}

            <button
              onClick={toggleTheme}
              className="inline-flex items-center justify-center rounded-lg p-2 transition-colors cursor-pointer"
              style={{
                color: "var(--text-secondary)",
                backgroundColor: "var(--bg-secondary)",
              }}
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {dark ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>

            {user ? (
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white transition-colors cursor-pointer"
                style={{ backgroundColor: "#6366f1" }}
              >
                <FiLogOut size={14} />
                Logout
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="rounded-lg border px-4 py-2 text-sm font-semibold transition hover:bg-black/5 dark:hover:bg-white/5"
                  style={{
                    borderColor: "var(--border-color)",
                    color: "var(--text-primary)",
                  }}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                  style={{ backgroundColor: "#6366f1" }}
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg border transition-colors sm:hidden cursor-pointer"
            style={{
              color: "var(--text-primary)",
              borderColor: "var(--border-color)",
              backgroundColor: "var(--bg-secondary)",
            }}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation"
          >
            {menuOpen ? <FiX size={18} /> : <FiMenu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 sm:hidden"
            onClick={() => setMenuOpen(false)}
          />
          <aside
            className="fixed inset-y-0 right-0 z-50 w-64 max-w-full border-l p-5 sm:hidden flex flex-col justify-between"
            style={{
              backgroundColor: "var(--bg-nav)",
              borderColor: "var(--border-color)",
            }}
          >
            <div>
              <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "var(--border-color)" }}>
                <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                  <span style={{ color: "#6366f1" }}>Swiftly</span> Menu
                </span>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-1 cursor-pointer"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <FiX size={20} />
                </button>
              </div>

              {user && (
                <div className="mt-4 rounded-lg p-3" style={{ backgroundColor: "var(--bg-secondary)" }}>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {user.name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {user.email}
                  </p>
                  <div className="mt-2">
                    <RoleBadge role={user.role} />
                  </div>
                </div>
              )}

              <div className="mt-4 flex flex-col gap-2">
                <Link
                  to="/"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ color: "var(--text-primary)" }}
                >
                  <FiHome size={16} /> Home
                </Link>
                {user ? (
                  <Link
                    to={getDashboardPath()}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <FiGrid size={16} /> Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMenuOpen(false)}
                      className="rounded-lg border px-3 py-2 text-center text-sm font-medium"
                      style={{
                        borderColor: "var(--border-color)",
                        color: "var(--text-primary)",
                      }}
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMenuOpen(false)}
                      className="rounded-lg px-3 py-2 text-center text-sm font-medium text-white"
                      style={{ backgroundColor: "#6366f1" }}
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="border-t pt-4 flex items-center justify-between" style={{ borderColor: "var(--border-color)" }}>
              <button
                onClick={toggleTheme}
                className="inline-flex items-center gap-2 text-sm font-medium cursor-pointer"
                style={{ color: "var(--text-secondary)" }}
              >
                {dark ? <FiSun size={16} /> : <FiMoon size={16} />}
                <span>{dark ? "Light Mode" : "Dark Mode"}</span>
              </button>

              {user && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    handleLogout();
                  }}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-red-500 cursor-pointer"
                >
                  <FiLogOut size={16} /> Logout
                </button>
              )}
            </div>
          </aside>
        </>
      )}
    </>
  );
};

export default Navbar;
