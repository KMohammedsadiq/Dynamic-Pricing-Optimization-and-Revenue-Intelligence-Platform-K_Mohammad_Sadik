import React, { useState } from "react";
import { Link } from "react-router-dom";
import Input from "../components/Input";
import Button from "../components/Button";

export default function Login() {
  // 1. Controlled Component State
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false); // For future API integration

  // 2. Form State Management (Input Binding)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" })); // Clear error when typing
  };

  // 3. Client-Side Validation
  const validateForm = () => {
    const newErrors = {};
    
    // Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = "Email is required.";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    // Password Validation
    if (!formData.password) {
      newErrors.password = "Password is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 4. Handle Submission
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent page reload
    
    if (validateForm()) {
      // SUCCESS! DO NOT CALL BACKEND YET!
      console.log("SUCCESS! Login form is valid.");
      console.log("Login Credentials:", {
        email: formData.email,
        password: formData.password,
      });
      // In Day 12, we will call Axios here.
    } else {
      console.log("Login form has validation errors.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Welcome Back</h1>
          <p className="text-gray-500 mt-2">Log in to PricePilot AI.</p>
        </div>

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
