import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiArrowRight } from "react-icons/fi";

const LandingPage = () => {
  const { user } = useAuth();

  const getDashboardPath = () => {
    if (!user) return "/login";
    return `/${user.role}`;
  };





  return (
    <div className="mx-auto flex max-w-5xl flex-col px-4 py-12 sm:px-6 lg:py-16">
      {/* Hero Section */}
      <div className="text-center">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
          style={{
            backgroundColor: "rgba(99, 102, 241, 0.12)",
            color: "#6366f1",
          }}
        >
          Centralized Portal
        </span>

        <h1
          className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl"
          style={{ color: "var(--text-primary)" }}
        >
          Swiftly — Employee Leave & Reimbursement System
        </h1>

        <p
          className="mx-auto mt-4 max-w-2xl text-base leading-relaxed sm:text-lg"
          style={{ color: "var(--text-secondary)" }}
        >
          A centralized web platform to manage employee records, leave balances, reimbursement claims, bill uploads, and managerial approvals with role-based access.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {user ? (
            <Link
              to={getDashboardPath()}
              className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              style={{ backgroundColor: "#6366f1" }}
            >
              Go to Dashboard
              <FiArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                style={{ backgroundColor: "#6366f1" }}
              >
                Sign In
                <FiArrowRight size={16} />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-lg border px-6 py-3 text-sm font-semibold transition hover:bg-black/5 dark:hover:bg-white/5"
                style={{
                  borderColor: "var(--border-color)",
                  color: "var(--text-primary)",
                  backgroundColor: "var(--bg-card)",
                }}
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>




    </div>
  );
};

export default LandingPage;
