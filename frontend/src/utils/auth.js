/**
 * Authentication Utility Functions
 * Handles saving, retrieving, and deleting JWT and User data from localStorage.
 */

// Keys used in localStorage
const TOKEN_KEY = "pricepilot_access_token";
const USER_KEY = "pricepilot_user";

export const setAuthData = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const getUser = () => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const removeAuthData = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const isAuthenticated = () => {
  // If a token exists, we assume the user is authenticated.
  // (In the future, we could also check if the token is expired)
  return !!getToken();
};

export const logout = () => {
  removeAuthData();
  // We use window.location here to force a hard refresh, completely clearing React's memory state
  window.location.href = "/login";
};
