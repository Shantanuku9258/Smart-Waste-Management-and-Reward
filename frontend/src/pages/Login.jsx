import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { EnvelopeIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Demo credentials for quick login (prototype only)
  const demoCredentials = {
    admin: { email: "admin@system.com", password: "Admin@123", label: "Admin" },
    collector: { email: "collector@system.com", password: "Collector@123", label: "Collector" },
    user: { email: "user@system.com", password: "User@123", label: "User" },
  };

  const fillDemoCredentials = (role) => {
    const creds = demoCredentials[role];
    if (creds) {
      setEmail(creds.email);
      setPassword(creds.password);
      setShowDemoCredentials(false);
    }
  };

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated() && user) {
      const role = user.role;
      if (role === "ADMIN") {
        navigate("/admin/dashboard");
      } else if (role === "COLLECTOR") {
        navigate("/collector/dashboard");
      } else {
        navigate("/user/dashboard");
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      toast.success("Login successful!");
      // Wait a moment for state to update, then navigate
      setTimeout(() => {
        const role = result.user?.role || user?.role;
        if (role === "ADMIN") {
          navigate("/admin/dashboard");
        } else if (role === "COLLECTOR") {
          navigate("/collector/dashboard");
        } else {
          navigate("/user/dashboard");
        }
      }, 300);
    } else {
      toast.error(result.error || "Login failed");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Full-page background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/login-background.png)'
        }}
      ></div>
      
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40"></div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="glass-card rounded-3xl shadow-2xl p-8 border border-white/30 card-enter" style={{ animationDelay: '0.2s' }}>
          {/* Logo/Icon Section - Small, constrained icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl mb-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ maxWidth: "32px", maxHeight: "32px" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Smart Waste Management
            </h1>
            <p className="text-gray-500 text-sm">Welcome back! Sign in to continue</p>
          </div>

          {/* Demo Credentials Helper (Prototype Only) */}
          <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-xl shadow-sm">
            <button
              type="button"
              onClick={() => setShowDemoCredentials(!showDemoCredentials)}
              className="w-full text-left text-sm font-medium text-blue-700 hover:text-blue-800 flex items-center justify-between"
            >
              <span>Demo Credentials (Click to expand)</span>
              <svg
                className={`w-4 h-4 transition-transform ${showDemoCredentials ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showDemoCredentials && (
              <div className="mt-3 space-y-2">
                <div className="text-xs text-blue-600 mb-2 font-semibold">Quick Login (Demo Only):</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials("admin")}
                    className="px-3 py-1.5 text-xs font-semibold bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                  >
                    Login as Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials("collector")}
                    className="px-3 py-1.5 text-xs font-semibold bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition"
                  >
                    Login as Collector
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoCredentials("user")}
                    className="px-3 py-1.5 text-xs font-semibold bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
                  >
                    Login as User
                  </button>
                </div>
                <p className="text-xs text-blue-500 mt-2 italic">* For demonstration purposes only</p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" style={{ maxWidth: "20px", maxHeight: "20px" }} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 outline-none text-sm hover:border-emerald-300"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" style={{ maxWidth: "20px", maxHeight: "20px" }} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 outline-none text-sm hover:border-emerald-300"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3.5 px-4 rounded-xl font-bold hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-2xl hover:scale-[1.02] glow-hover flex items-center justify-center gap-2 text-sm transform"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    style={{ maxWidth: "20px", maxHeight: "20px" }}
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-6 space-y-3">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/register?role=USER")}
                  className="text-emerald-600 hover:text-emerald-700 font-semibold transition"
                >
                  Sign up as User
                </button>
              </p>
            </div>
            <div className="text-center border-t border-gray-200 pt-3">
              <p className="text-sm text-gray-600">
                Are you a collector?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/register?role=COLLECTOR")}
                  className="text-orange-600 hover:text-orange-700 font-semibold transition"
                >
                  Sign up as Collector
                </button>
              </p>
            </div>
            <div className="text-center text-xs text-gray-500 italic">
              Note: Admin accounts cannot be created through registration
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
