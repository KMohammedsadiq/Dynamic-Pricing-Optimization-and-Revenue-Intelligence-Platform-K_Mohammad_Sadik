import api from "./api";

/**
 * Authentication Service
 * All API calls related to authentication are grouped here.
 * This abstracts the network logic away from our UI components.
 */
export const authService = {
  
  // Registration API Call
  registerUser: async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },
  
  // Login API Call
  loginUser: async (credentials) => {
    // We expect credentials to contain: { email, password }
    // POST request to http://localhost:8000/api/v1/auth/login
    const response = await api.post("/auth/login", credentials);
    return response.data;
  }
  
};
