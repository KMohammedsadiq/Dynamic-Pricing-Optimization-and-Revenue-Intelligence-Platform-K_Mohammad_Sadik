import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { isAuthenticated, getUser } from "../utils/auth";

/**
 * A wrapper component that protects its child routes based on Authentication and Authorization.
 */
export default function ProtectedRoute({ allowedRoles }) {
  // Check if a valid token exists in localStorage
  const isAuth = isAuthenticated();
  const user = getUser();

  // If not authenticated, instantly redirect to /login
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  // If roles are specified, check if the user's role is in the allowed list
  if (allowedRoles && user) {
    if (!allowedRoles.includes(user.role_name)) {
      // Unauthorized role -> redirect to a safe page (Dashboard)
      return <Navigate to="/dashboard" replace />;
    }
  }

  // If authenticated and authorized, render the page
  return <Outlet />;
}
