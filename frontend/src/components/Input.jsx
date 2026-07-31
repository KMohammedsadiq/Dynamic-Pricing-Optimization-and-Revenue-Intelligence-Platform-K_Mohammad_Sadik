import React, { useState } from "react";

/**
 * Reusable Input component for forms.
 * Used for standardizing text inputs, passwords, and emails across the app.
 */
export default function Input({ label, type = "text", value, onChange, placeholder, error, name, allowToggle = false }) {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = allowToggle && type === "password" ? (showPassword ? "text" : "password") : type;

  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-white/70 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type={inputType}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:bg-white/10 transition-all duration-300 ${
            error ? "border-red-500/50 focus:ring-red-500/50" : "border-white/10 focus:border-brand-400/50 focus:ring-brand-400/30"
          } ${allowToggle ? 'pr-12' : ''}`}
        />
        {allowToggle && type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-2 my-auto h-8 px-3 flex items-center bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors focus:outline-none z-10"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400 font-medium">{error}</p>}
    </div>
  );
}
