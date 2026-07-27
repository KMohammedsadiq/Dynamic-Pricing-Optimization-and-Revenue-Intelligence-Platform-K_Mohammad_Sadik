import axios from "axios";

// Create a globally configured Axios instance.
// In a real enterprise app, baseURL would come from process.env.VITE_API_URL
const api = axios.create({
  baseURL: "http://localhost:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  // If a request takes longer than 10 seconds, abort it automatically
  timeout: 10000, 
});

export default api;
