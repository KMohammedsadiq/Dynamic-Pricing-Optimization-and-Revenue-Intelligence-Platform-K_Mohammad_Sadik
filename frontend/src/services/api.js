import axios from "axios";

// Create a globally configured Axios instance.
// In a real enterprise app, baseURL would come from process.env.VITE_API_URL
const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  // If a request takes longer than 10 seconds, abort it automatically
  timeout: 10000, 
});

import { getToken } from "../utils/auth";

// Axios Request Interceptor
// This runs before EVERY single request sent by Axios.
api.interceptors.request.use(
  (config) => {
    // 1. Get the token from localStorage
    const token = getToken();
    
    // 2. If the token exists, attach it to the HTTP Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    // Do something with request error
    return Promise.reject(error);
  }
);

// Axios Response Interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // If the error is a 401 Unauthorized, the token is likely expired or invalid.
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized! Token may have expired. Redirecting to login...");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Use window.location.href to force a full reload and redirect
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
