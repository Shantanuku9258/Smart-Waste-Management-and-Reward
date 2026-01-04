import axios from "axios";
import { getToken, isTokenExpired, logout } from "../utils/auth";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Add token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    
    // Check if token is expired
    if (token && isTokenExpired()) {
      logout();
      return Promise.reject(new Error("Token expired"));
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      logout();
      window.location.href = "/";
      return Promise.reject(new Error("Unauthorized - Please login again"));
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      return Promise.reject(new Error("Access denied - You don't have permission"));
    }

    // Handle 429 Too Many Requests
    if (error.response?.status === 429) {
      return Promise.reject(new Error("Too many requests - Please try again later"));
    }

    // Handle network errors
    if (!error.response) {
      return Promise.reject(new Error("Network error - Please check your connection"));
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
