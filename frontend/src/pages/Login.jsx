import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Demo accounts matching DemoDataInitializer
  const demoAccounts = [
    { role: "Admin",     email: "admin@system.com",     password: "Admin@123",     emoji: "👨‍💼" },
    { role: "User",      email: "user@system.com",      password: "User@123",      emoji: "👤" },
    { role: "Collector", email: "collector@system.com", password: "Collector@123", emoji: "🚛" },
  ];

  const fillDemo = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
  };

  useEffect(() => {
    if (isAuthenticated() && user) {
      if      (user.role === "ADMIN")     navigate("/admin/dashboard");
      else if (user.role === "COLLECTOR") navigate("/collector/dashboard");
      else                                navigate("/user/dashboard");
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(email, password);
    if (result.success) {
      toast.success("Login successful!");
      setTimeout(() => {
        const role = result.user?.role || user?.role;
        if      (role === "ADMIN")     navigate("/admin/dashboard");
        else if (role === "COLLECTOR") navigate("/collector/dashboard");
        else                           navigate("/user/dashboard");
      }, 300);
    } else {
      toast.error(result.error || "Invalid credentials");
    }
    setLoading(false);
  };

  return (
    /* ── Full-page purple gradient background ── */
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
    >
      {/* ── Animated floating blobs ── */}
      <div
        className="animate-float absolute rounded-full opacity-10 bg-white pointer-events-none"
        style={{ width: 300, height: 300, top: -50, left: -50 }}
      />
      <div
        className="animate-float-2 absolute rounded-full opacity-10 bg-white pointer-events-none"
        style={{ width: 200, height: 200, bottom: -30, right: "5%" }}
      />
      <div
        className="animate-float-4 absolute rounded-full opacity-10 bg-white pointer-events-none"
        style={{ width: 250, height: 250, top: "50%", right: -50 }}
      />

      {/* ── Centered card ── */}
      <div
        className="animate-slideUp relative z-10 bg-white rounded-2xl shadow-2xl overflow-hidden w-full"
        style={{ maxWidth: 900, display: "grid", gridTemplateColumns: "1fr 1fr" }}
      >
        {/* ────────── LEFT: Form ────────── */}
        <div className="p-10 flex flex-col justify-center">
          {/* Header */}
          <div className="mb-8">
            <h1
              className="text-4xl font-bold text-gray-900 mb-2"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Welcome Back
            </h1>
            <p className="text-gray-500 text-sm">Manage your waste collection efficiently</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm outline-none transition-all duration-300 focus:border-emerald-500"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm outline-none transition-all duration-300 focus:border-emerald-500"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-white font-semibold text-base transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              style={{
                background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                boxShadow: loading ? "none" : "0 10px 25px rgba(16,185,129,0.3)",
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </span>
              ) : "Sign In"}
            </button>
          </form>

          {/* Register links */}
          <div className="mt-6 space-y-2 text-center text-sm text-gray-500">
            <p>
              New here?{" "}
              <button onClick={() => navigate("/register?role=USER")}
                className="text-emerald-600 hover:text-emerald-700 font-semibold transition">
                Register as User
              </button>
              {" "}·{" "}
              <button onClick={() => navigate("/register?role=COLLECTOR")}
                className="text-orange-600 hover:text-orange-700 font-semibold transition">
                Register as Collector
              </button>
            </p>
            <p className="text-xs text-gray-400 italic">Admin accounts are created directly in the database.</p>
          </div>
        </div>

        {/* ────────── RIGHT: Visual panel ────────── */}
        <div
          className="p-10 flex flex-col justify-center items-center text-white"
          style={{ background: "linear-gradient(135deg, #10B981 0%, #3B82F6 100%)" }}
        >
          {/* Bouncing leaf icon */}
          <div className="animate-bounceY text-7xl mb-5 select-none">🌿</div>

          <h3 className="text-2xl font-bold mb-3 text-center">Smart Waste</h3>
          <p className="text-sm text-center opacity-90 leading-relaxed mb-6">
            Transform waste management with intelligent collection, tracking, and a rewards system that makes going green worthwhile.
          </p>

          {/* Demo accounts glass card */}
          <div
            className="w-full rounded-xl p-4 text-sm"
            style={{
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <p className="font-semibold mb-3 text-white/90">Demo Accounts (click to fill):</p>
            <div className="space-y-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => fillDemo(acc)}
                  className="w-full text-left px-3 py-2 rounded-lg transition-all text-xs font-medium text-white/95"
                  style={{ background: "rgba(255,255,255,0.1)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                >
                  <span className="mr-2">{acc.emoji}</span>
                  <span className="font-bold">{acc.role}:</span>{" "}
                  {acc.email}
                </button>
              ))}
              <p className="text-xs text-white/60 mt-1 text-center">Password is role-specific (see above)</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Responsive: hide right panel on small screens ── */}
      <style>{`
        @media (max-width: 640px) {
          .animate-slideUp > div:last-child { display: none; }
          .animate-slideUp { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
