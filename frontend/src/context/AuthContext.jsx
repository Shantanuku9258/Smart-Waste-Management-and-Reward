import { createContext, useContext, useState, useEffect } from "react";
import { setToken, getToken, removeToken, setUser, getUser, isTokenExpired } from "../utils/auth";
import axiosInstance from "../services/axiosInstance";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = getToken();
    const savedUser = getUser();

    if (token && savedUser && !isTokenExpired()) {
      setUserState(savedUser);
      // Verify token by fetching user profile
      fetchUserProfile();
    } else {
      if (token) {
        // Token expired, clear it
        removeToken();
      }
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await axiosInstance.get("/users/me");
      const userData = {
        userId: response.data.userId,
        name: response.data.name,
        email: response.data.email,
        role: response.data.role,
        points: response.data.points || 0,
      };
      setUser(userData);
      setUserState(userData);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      // Token is invalid, logout
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axiosInstance.post("/auth/login", {
        email,
        password,
      });

      const { token: newToken, role, userId, name, email: userEmail } = response.data;

      if (!newToken) {
        throw new Error("No token received");
      }

      setToken(newToken);

      const userData = {
        userId,
        name,
        email: userEmail,
        role,
        points: 0, // Will be updated from profile
      };

      setUser(userData);
      setUserState(userData);

      // Fetch full profile
      await fetchUserProfile();

      return { success: true, user: userData };
    } catch (error) {
      console.error("Login error:", error);
      const message =
        error.response?.data?.message ||
        error.message ||
        "Login failed. Please check your credentials.";
      return { success: false, error: message };
    }
  };

  const logout = () => {
    removeToken();
    setUserState(null);
    window.location.href = "/login";
  };

  const isAuthenticated = () => {
    return !!user && !!getToken() && !isTokenExpired();
  };

  const hasRole = (role) => {
    return user?.role === role;
  };

  const isAdmin = () => hasRole("ADMIN");
  const isCollector = () => hasRole("COLLECTOR");
  const isUser = () => hasRole("USER");

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    hasRole,
    isAdmin,
    isCollector,
    isUser,
    fetchUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

