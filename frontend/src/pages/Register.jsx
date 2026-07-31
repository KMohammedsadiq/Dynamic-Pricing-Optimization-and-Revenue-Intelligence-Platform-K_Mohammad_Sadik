import React, { useState } from "react";
import { Link } from "react-router-dom";
import Input from "../components/Input";
import Button from "../components/Button";
import { authService } from "../services/authService";
import { Hexagon, UserPlus, Target, LineChart } from "lucide-react";

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
    setApiError("");
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
        const payload = {
          full_name: formData.fullName,
          email: formData.email,
          password: formData.password
        };

        const result = await authService.registerUser(payload);

        setSuccessMessage(`Success! User ${result.full_name} registered successfully.`);
        setFormData({ fullName: "", email: "", password: "", confirmPassword: "" });

      } catch (err) {
        if (err.response) {
          if (err.response.status === 400) {
            setApiError(err.response.data.detail);
          } else if (err.response.status === 422) {
            setApiError("Validation error: Please ensure your data is formatted correctly.");
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
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#111827] overflow-hidden relative">

      {/* LEFT SIDE - SHOWCASE */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative border-r border-[#374151] bg-[#1F2937]">
        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <Hexagon className="text-blue-500 w-8 h-8" />
          <span className="text-2xl font-black text-gray-50 tracking-tight">
            PricePilot AI
          </span>
        </div>

        {/* Main Showcase Content */}
        <div className="relative z-10 max-w-lg mt-12">
          <div>
            <h2 className="text-5xl lg:text-6xl font-black text-gray-50 leading-tight mb-6 tracking-tight">
              Intelligent pricing <br /> for modern commerce.
            </h2>
            <p className="text-gray-400 text-lg font-medium leading-relaxed mb-12">
              Join industry leaders who use our advanced machine learning models to predict demand, track competitors, and optimize revenue strategies automatically.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4 ent-panel p-5 w-fit">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-500">
                <Target size={24} />
              </div>
              <div>
                <h4 className="font-bold text-gray-100 text-sm tracking-wide">Dynamic Adjustments</h4>
                <p className="text-gray-400 text-xs font-medium mt-1">Real-time market responses</p>
              </div>
            </div>

            <div className="flex items-center gap-4 ent-panel p-5 w-fit ml-12">
              <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-500">
                <LineChart size={24} />
              </div>
              <div>
                <h4 className="font-bold text-gray-100 text-sm tracking-wide">Predictive Analytics</h4>
                <p className="text-gray-400 text-xs font-medium mt-1">Forecast demand with 99% accuracy</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center gap-2 text-gray-500 text-sm font-bold mt-12">
          <Hexagon className="w-4 h-4" /> PricePilot AI © 2026.
        </div>
      </div>

      {/* RIGHT SIDE - REGISTER FORM */}
      <div className="flex items-center justify-center p-8 relative">
        <div className="ent-panel p-10 max-w-md w-full relative z-10 border border-[#374151]">
          <div className="text-center mb-8">
            {/* Mobile Logo Only */}
            <div className="lg:hidden inline-flex items-center justify-center w-16 h-16 rounded-lg bg-[#111827] border border-[#374151] mb-6 shadow-xl">
              <Hexagon className="text-blue-500" size={32} />
            </div>
            <h1 className="text-3xl font-black text-gray-50 tracking-tight mb-2">Create Account</h1>
            <p className="text-gray-400 font-medium">Join PricePilot AI today</p>
          </div>

          {/* Global Notifications */}
          {apiError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm font-medium flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> {apiError}
            </div>
          )}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg text-sm font-medium flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full Name" name="fullName" placeholder="John Doe" value={formData.fullName} onChange={handleChange} error={errors.fullName} />
            <Input label="Email Address" name="email" type="email" placeholder="john@gmail.com" value={formData.email} onChange={handleChange} error={errors.email} />
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

            <div className="mt-8 pt-2">
              <Button type="submit" fullWidth disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Registering...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">Register <UserPlus size={18} /></span>
                )}
              </Button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-gray-400 font-medium">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-500 font-bold hover:text-blue-400 transition-colors">
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
