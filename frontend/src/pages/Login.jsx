import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../components/Input";
import Button from "../components/Button";
import { authService } from "../services/authService";
import { setAuthData } from "../utils/auth";
import { motion, AnimatePresence } from "framer-motion";
import { Hexagon, Lock, Target, LineChart, Zap } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";

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
  const [selectedRole, setSelectedRole] = useState("");

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

        // Dynamic Role Verification from Database
        if (selectedRole && result.user.role_name !== selectedRole) {
          setLoading(false);
          setApiError(`Access Denied: The account '${formData.email}' does not have the '${selectedRole}' role.`);
          return;
        }

        setAuthData(result.access_token, result.user);
        setSuccessMessage(`Welcome back, ${result.user.full_name}!`);

        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);

      } catch (err) {
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

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        setApiError("");
        const result = await authService.loginWithGoogle(tokenResponse.access_token);
        setAuthData(result.access_token, result.user);
        setSuccessMessage(`Welcome, ${result.user.full_name}!`);
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      } catch (err) {
        setApiError(err.response?.data?.detail || "Google login failed.");
      } finally {
        setLoading(false);
      }
    },
    onError: () => setApiError("Google Sign-In was cancelled or failed.")
  });

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-black overflow-hidden relative">

      {/* LEFT SIDE - SHOWCASE */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative border-r border-white/5 bg-white/[0.01]">
        {/* Decorative Grid & Orbs */}
        <div className="cyber-grid-bg opacity-30 absolute inset-0 z-0"></div>
        <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-brand-500/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-accent-500/20 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <Hexagon className="text-brand-400 w-8 h-8" />
          <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-accent-400 tracking-tight">
            PricePilot AI
          </span>
        </div>

        {/* Main Showcase Content */}
        <div className="relative z-10 max-w-lg mt-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-5xl lg:text-6xl font-black text-white leading-tight mb-6 tracking-tight">
              Intelligent pricing <br /> for modern commerce.
            </h2>
            <p className="text-white/60 text-lg font-medium leading-relaxed mb-12">
              Join industry leaders who use our advanced machine learning models to predict demand, track competitors, and optimize revenue strategies automatically.
            </p>
          </motion.div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center gap-4 glass-panel p-5 rounded-2xl border border-white/10 w-fit backdrop-blur-xl"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center border border-brand-500/30 text-brand-400 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
                <Target size={24} />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm tracking-wide">Dynamic Adjustments</h4>
                <p className="text-white/50 text-xs font-medium mt-1">Real-time market responses</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex items-center gap-4 glass-panel p-5 rounded-2xl border border-white/10 w-fit ml-12 backdrop-blur-xl"
            >
              <div className="w-12 h-12 rounded-xl bg-accent-500/20 flex items-center justify-center border border-accent-500/30 text-accent-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                <LineChart size={24} />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm tracking-wide">Predictive Analytics</h4>
                <p className="text-white/50 text-xs font-medium mt-1">Forecast demand with 99% accuracy</p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center gap-2 text-white/30 text-sm font-bold mt-12">
          <Hexagon className="w-4 h-4" /> PricePilot AI © 2026.
        </div>
      </div>

      {/* RIGHT SIDE - LOGIN FORM */}
      <div className="flex items-center justify-center p-8 relative">
        {/* Subtle mobile orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-[100px] lg:hidden pointer-events-none"></div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="glass-panel p-10 rounded-[2.5rem] max-w-md w-full relative z-10 border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
        >
          <div className="text-center mb-10">
            {/* Mobile Logo Only */}
            <div className="lg:hidden inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-6 shadow-xl">
              <Hexagon className="text-brand-400" size={32} />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight mb-2">Welcome Back</h1>
            <p className="text-white/50 font-medium">Log in to your command center</p>
          </div>

          {/* Global Notifications */}
          <AnimatePresence>
            {apiError && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div> {apiError}
              </motion.div>
            )}
            {successMessage && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-sm font-medium flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div> {successMessage}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Visual Role Selector (No Autofill) */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-widest">Select Role</label>
              <div className="relative">
                <select
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 appearance-none font-semibold transition-all hover:bg-white/[0.07]"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <option value="" className="bg-slate-900 text-white">Select a role...</option>
                  <option value="Admin" className="bg-slate-900 text-brand-400 font-bold">👑 Master Admin</option>
                  <option value="Pricing Manager" className="bg-slate-900 text-white">Pricing Manager</option>
                  <option value="Business Analyst" className="bg-slate-900 text-white">Business Analyst</option>
                  <option value="Viewer" className="bg-slate-900 text-white">Normal User (Viewer)</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                  <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-8"></div>

            <Input
              label="Email Address"
              name="email"
              type="email"
              placeholder="Enter your gmail"
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
              allowToggle={true}
            />

            <div className="flex justify-end items-center mb-6 mt-2">
              <a href="#" className="text-sm font-bold text-brand-400 hover:text-brand-300 transition-colors">
                Forgot password?
              </a>
            </div>

            <div className="mt-8 space-y-4 pt-2">
              <Button type="submit" fullWidth disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Authenticating...
                  </span>
                ) : (
                  <>Log In <Lock size={18} /></>
                )}
              </Button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink-0 mx-4 text-white/30 text-[10px] font-bold uppercase tracking-widest">Or continue with</span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              <button
                type="button"
                className="w-full bg-white text-gray-900 font-extrabold rounded-[1.25rem] px-6 py-4 flex items-center justify-center gap-3 hover:bg-gray-100 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl disabled:opacity-50"
                onClick={() => handleGoogleLogin()}
                disabled={loading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  <path d="M1 1h22v22H1z" fill="none" />
                </svg>
                Sign in with Google
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-white/50 font-medium">
            Don't have an account?{" "}
            <Link to="/register" className="text-brand-400 font-bold hover:text-brand-300 transition-colors">
              Sign Up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
