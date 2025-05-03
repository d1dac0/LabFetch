import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  // Optional: Add any additional props you might need, like required roles
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = () => {
  console.log('ProtectedRoute rendering...'); // Log when component renders
  // Check for the existence and validity of the auth token
  // Adjust the key if you store it differently
  const token = localStorage.getItem('adminToken');
  console.log('ProtectedRoute: Token read from localStorage:', token);

  // Add more robust token validation here if needed (e.g., check expiration)
  const isAuthenticated = !!token; // Simple check: is the token present?
  console.log('ProtectedRoute: isAuthenticated:', isAuthenticated);

  if (!isAuthenticated) {
    console.log('ProtectedRoute: Not authenticated, redirecting to /admin/login');
    // If not authenticated, redirect to the login page
    // Preserve the intended destination via 'state' for potential redirection after login
    return <Navigate to="/admin/login" replace />;
  }

  // If authenticated, render the child route component
  console.log('ProtectedRoute: Authenticated, rendering Outlet.');
  return <Outlet />; // Renders the nested route (e.g., AdminDashboardPage)
};

export default ProtectedRoute; 