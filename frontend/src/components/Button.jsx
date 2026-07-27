import React from "react";

/**
 * Reusable Button component for standardized styling.
 */
export default function Button({ children, type = "button", onClick, fullWidth = false }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors ${
        fullWidth ? "w-full" : ""
      }`}
    >
      {children}
    </button>
  );
}
