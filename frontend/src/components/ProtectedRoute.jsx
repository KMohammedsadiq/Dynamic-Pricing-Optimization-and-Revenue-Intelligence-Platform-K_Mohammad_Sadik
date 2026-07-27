import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";

/**
 * A wrapper component that protects its child routes.
 * If the user is not authenticated, they are immediately redirected to the Login page.
 * If they are authenticated, the component renders its children (via Outlet).
 */
export default function ProtectedRoute() {
  // Check if a valid token exists in localStorage
  const isAuth = isAuthenticated();

  // If not authenticated, instantly redirect to /login and replace the history stack
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render whatever nested Route is inside this one
  return <Outlet />;
}
