import React, { useState } from "react";
import { Link } from "react-router-dom";
import Input from "../components/Input";
import Button from "../components/Button";
import { authService } from "../services/authService";

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setApiError(""); // Clear API error on typing
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required.";
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = "Email is required.";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long.";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
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
        // Map frontend fields to match FastAPI Pydantic schema
        const payload = {
          full_name: formData.fullName,
          email: formData.email,
          password: formData.password
        };
        
        // Make the HTTP POST Request
        const result = await authService.registerUser(payload);
        
        // Handle Success
        setSuccessMessage(`Success! User ${result.full_name} registered successfully.`);
        setFormData({ fullName: "", email: "", password: "", confirmPassword: "" });
        
      } catch (err) {
        // Handle Backend Errors
        if (err.response) {
          // The server responded with a status code outside the 2xx range
          if (err.response.status === 400) {
            setApiError(err.response.data.detail); // e.g. "Email already registered"
          } else if (err.response.status === 422) {
            setApiError("Validation error: Please ensure your data is formatted correctly.");
          } else {
            setApiError("Server error. Please try again later.");
          }
        } else {
          // The request was made but no response was received (e.g. FastAPI offline)
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
          <h1 className="text-3xl font-bold text-gray-800">Create an Account</h1>
          <p className="text-gray-500 mt-2">Join PricePilot AI today.</p>
        </div>

        {/* Global Notifications */}
        {apiError && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{apiError}</div>}
        {successMessage && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">{successMessage}</div>}

        <form onSubmit={handleSubmit}>
          <Input label="Full Name" name="fullName" placeholder="John Doe" value={formData.fullName} onChange={handleChange} error={errors.fullName} />
          <Input label="Email Address" name="email" type="email" placeholder="john@example.com" value={formData.email} onChange={handleChange} error={errors.email} />
          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            allowToggle={true}
          />
          <Input
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            allowToggle={true}
          />

          <div className="mt-6">
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 font-semibold hover:underline">
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
}
