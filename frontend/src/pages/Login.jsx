import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../components/Input";
import Button from "../components/Button";
import { authService } from "../services/authService";
import { setAuthData } from "../utils/auth";

export default function Login() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setApiError("");
  };

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!formData.email) {
      newErrors.email = "Email is required.";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    setSuccessMessage("");
    
    if (validateForm()) {
      setLoading(true);
      try {
        const result = await authService.loginUser({
          email: formData.email,
          password: formData.password
        });
        
        // --- NEW: Save the token and user to localStorage! ---
        setAuthData(result.access_token, result.user);
        
        // Handle Success
        setSuccessMessage(`Welcome back, ${result.user.full_name}!`);
        
        // Wait 1 second so the user sees the success message, then redirect
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
        
      } catch (err) {
        // Handle Errors
        if (err.response) {
          if (err.response.status === 401) {
            setApiError("Invalid email or password.");
          } else if (err.response.status === 403) {
            setApiError("Account is inactive. Please contact support.");
          } else if (err.response.status === 422) {
            setApiError("Validation error. Please check your inputs.");
          } else {
            setApiError("Server error. Please try again later.");
          }
        } else {
          setApiError("Network error. Could not reach the server.");
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Welcome Back</h1>
          <p className="text-gray-500 mt-2">Log in to PricePilot AI.</p>
        </div>

        {/* Global Notifications */}
        {apiError && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{apiError}</div>}
        {successMessage && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">{successMessage}</div>}

        <form onSubmit={handleSubmit}>
          
          <Input
            label="Email Address"
            name="email"
            type="email"
            placeholder="john@example.com"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
          />

          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            allowToggle={true} /* Custom property we just added for Show/Hide Password! */
          />
          
          <div className="flex justify-end mb-6 mt-[-10px]">
            <a href="#" className="text-sm text-blue-600 hover:underline">
              Forgot password?
            </a>
          </div>

          <div className="mt-2">
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? "Logging in..." : "Log In"}
            </Button>
          </div>
          
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-600 font-semibold hover:underline">
            Register here
          </Link>
        </p>
        
      </div>
    </div>
  );
}
