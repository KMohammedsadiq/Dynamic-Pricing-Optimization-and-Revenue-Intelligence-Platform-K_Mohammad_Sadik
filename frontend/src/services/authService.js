import api from "./api";

/**
 * Authentication Service
 * All API calls related to authentication are grouped here.
 * This abstracts the network logic away from our UI components.
 */
export const authService = {
  
  // Registration API Call
  registerUser: async (userData) => {
    // We expect userData to contain: { full_name, email, password }
    // POST request to http://localhost:8000/api/v1/auth/register
    const response = await api.post("/auth/register", userData);
    
    // Axios automatically parses the JSON response and stores it in response.data
    return response.data;
  }
  
};
