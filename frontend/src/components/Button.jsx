import React from "react";

/**
 * Reusable Button component for standardized styling.
 */
export default function Button({ children, type = "button", onClick, fullWidth = false, disabled = false }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`relative overflow-hidden group bg-gradient-to-r from-brand-500 to-accent-500 hover:from-brand-400 hover:to-accent-400 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] ${
        fullWidth ? "w-full" : ""
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      disabled={disabled}
    >
      <div className="absolute inset-0 w-full h-full bg-white/20 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 ease-out rounded-xl"></div>
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </button>
  );
}
