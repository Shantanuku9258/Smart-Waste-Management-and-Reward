import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "../services/axiosInstance";
import toast from "react-hot-toast";

const ROLE_INFO = {
  USER: {
    title: "Create Account",
    subtitle: "Join our eco-community",
    emoji: "🌱",
    panelTitle: "Earn While You Care",
    panelDesc: "Submit waste pickup requests, earn reward points for each collection, and redeem them for exciting eco-friendly rewards.",
    bullets: [
      "📦 Create waste pickup requests",
      "🎁 Earn reward points on collection",
      "🌿 Track your eco score",
      "💳 Redeem points for rewards",
    ],
    gradient: "linear-gradient(135deg, #10B981 0%, #3B82F6 100%)",
    btnGradient: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
    shadow: "0 10px 25px rgba(16,185,129,0.3)",
    focusColor: "#10B981",
  },
  COLLECTOR: {
    title: "Collector Registration",
    subtitle: "Join as a waste collector",
    emoji: "🚛",
    panelTitle: "Serve Your Community",
    panelDesc: "Manage assigned pickup requests, update collection status, upload proof, and earn ₹5 for every kg of waste you collect.",
    bullets: [
      "📋 View assigned pickup requests",
      "✓  Update status in real-time",
      "📸 Upload proof photos",
      "💰 Earn ₹5 per kg collected",
    ],
    gradient: "linear-gradient(135deg, #F97316 0%, #EF4444 100%)",
    btnGradient: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
    shadow: "0 10px 25px rgba(249,115,22,0.3)",
    focusColor: "#F97316",
  },
};

export default function Register() {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get("role");
  const userRole = roleParam === "COLLECTOR" ? "COLLECTOR" : "USER";
  const info = ROLE_INFO[userRole];

  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.post("/auth/register", {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: userRole,
      });
      toast.success(`Account created as ${userRole}! Please login.`);
      navigate("/login");
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    /* ── Full-page purple gradient background (same as login) ── */
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
    >
      {/* ── Animated blobs ── */}
      <div className="animate-float absolute rounded-full opacity-10 bg-white pointer-events-none"
        style={{ width: 300, height: 300, top: -50, left: -50 }} />
      <div className="animate-float-2 absolute rounded-full opacity-10 bg-white pointer-events-none"
        style={{ width: 200, height: 200, bottom: -30, right: "5%" }} />
      <div className="animate-float-4 absolute rounded-full opacity-10 bg-white pointer-events-none"
        style={{ width: 250, height: 250, top: "50%", right: -50 }} />

      {/* ── Card ── */}
      <div
        className="animate-slideUp relative z-10 bg-white rounded-2xl shadow-2xl overflow-hidden w-full"
        style={{ maxWidth: 900, display: "grid", gridTemplateColumns: "1fr 1fr" }}
      >
        {/* ────────── LEFT: Form ────────── */}
        <div className="p-10 flex flex-col justify-center">
          <div className="mb-8">
            <h1
              className="text-4xl font-bold text-gray-900 mb-2"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {info.title}
            </h1>
            <p className="text-gray-500 text-sm">{info.subtitle}</p>
          </div>

          {/* Role switcher */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
            {["USER", "COLLECTOR"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => navigate(`/register?role=${r}`)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                style={{
                  background: userRole === r
                    ? "linear-gradient(135deg, #10B981 0%, #059669 100%)"
                    : "transparent",
                  color: userRole === r ? "white" : "#6B7280",
                  boxShadow: userRole === r ? "0 2px 8px rgba(16,185,129,0.3)" : "none",
                }}
              >
                {r === "USER" ? "👤 User" : "🚛 Collector"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                minLength={2}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm outline-none transition-all duration-300"
                style={{ fontFamily: "'Poppins', sans-serif" }}
                onFocus={(e) => (e.target.style.borderColor = info.focusColor)}
                onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm outline-none transition-all duration-300"
                style={{ fontFamily: "'Poppins', sans-serif" }}
                onFocus={(e) => (e.target.style.borderColor = info.focusColor)}
                onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                placeholder="Min 6 characters"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm outline-none transition-all duration-300"
                style={{ fontFamily: "'Poppins', sans-serif" }}
                onFocus={(e) => (e.target.style.borderColor = info.focusColor)}
                onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-white font-semibold text-base transition-all duration-200 disabled:opacity-60 mt-2"
              style={{ background: info.btnGradient, boxShadow: loading ? "none" : info.shadow }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account…
                </span>
              ) : `Create ${userRole === "COLLECTOR" ? "Collector" : ""} Account`}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <button onClick={() => navigate("/login")}
              className="font-semibold transition"
              style={{ color: info.focusColor }}>
              Sign in
            </button>
          </div>

          {userRole === "COLLECTOR" && (
            <div className="mt-4 p-3 rounded-xl text-xs text-orange-700 bg-orange-50 border border-orange-200">
              ℹ After registration, an admin must assign you a zone and requests before you can start collecting.
            </div>
          )}
        </div>

        {/* ────────── RIGHT: Visual panel ────────── */}
        <div
          className="p-10 flex flex-col justify-center items-center text-white"
          style={{ background: info.gradient }}
        >
          <div className="animate-bounceY text-7xl mb-5 select-none">{info.emoji}</div>

          <h3 className="text-2xl font-bold mb-3 text-center">{info.panelTitle}</h3>
          <p className="text-sm text-center opacity-90 leading-relaxed mb-6">{info.panelDesc}</p>

          {/* Benefits list */}
          <div
            className="w-full rounded-xl p-5 space-y-2"
            style={{
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <p className="font-semibold text-white/90 text-sm mb-3">What you can do:</p>
            {info.bullets.map((b) => (
              <p key={b} className="text-sm text-white/90">{b}</p>
            ))}
          </div>

          <p className="text-xs text-white/60 mt-5 text-center italic">
            Admin accounts cannot be self-registered.
          </p>
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
