import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  console.log("Is Authenticated:", isAuthenticated); // Add this line for debugging

  if (!isAuthenticated) {
    // If not logged in, redirect to the login page
    return <Navigate to="/AdminLoginPage" />;
  }

  // If logged in, render the requested component
  return children;
};

export default ProtectedRoute;
