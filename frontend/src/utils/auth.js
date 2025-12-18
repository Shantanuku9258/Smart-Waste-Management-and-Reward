/**
 * Authentication utilities
 * Handles token storage, validation, and refresh
 */

const TOKEN_KEY = "token";
const USER_KEY = "user";

/**
 * Get stored token
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Store token
 */
export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * Remove token
 */
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/**
 * Get stored user
 */
export const getUser = () => {
  const userStr = localStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * Store user
 */
export const setUser = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!getToken();
};

/**
 * Check if user has specific role
 */
export const hasRole = (role) => {
  const user = getUser();
  return user && user.role === role;
};

/**
 * Check if user is admin
 */
export const isAdmin = () => {
  return hasRole("ADMIN");
};

/**
 * Check if user is collector
 */
export const isCollector = () => {
  return hasRole("COLLECTOR");
};

/**
 * Check if token is expired (basic check)
 */
export const isTokenExpired = () => {
  const token = getToken();
  if (!token) return true;

  try {
    // JWT tokens have 3 parts separated by dots
    const parts = token.split(".");
    if (parts.length !== 3) return true;

    // Decode payload (second part)
    const payload = JSON.parse(atob(parts[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();

    return exp < now;
  } catch (error) {
    console.error("Error checking token expiration:", error);
    return true;
  }
};

/**
 * Logout user
 */
export const logout = () => {
  removeToken();
  window.location.href = "/";
};

