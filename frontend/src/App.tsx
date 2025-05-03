import React from 'react'; // Add React import
import './index.css' // Ensure Tailwind directives are imported
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate // Import Navigate for redirection
} from 'react-router-dom';

// Import Pages/Components
import PickupFormPage from './pages/PickupFormPage'; // Renamed original App content
import AdminLayout from './pages/admin/AdminLayout';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminPickupDetailPage from './pages/admin/AdminPickupDetailPage';
import ProtectedRoute from './components/ProtectedRoute'; // Import the protected route component

// Authentication Check Function
const isAuthenticated = () => {
  const token = localStorage.getItem('adminToken'); // Check for token
  if (!token) {
    return false;
  }
  
  // Optional: Basic check if token is a non-empty string. 
  // More robust check would involve decoding JWT and checking expiration.
  return token.length > 0;
};

function App() {
  return (
    <Router>
        <Routes>
            {/* Public Route */}
            <Route path="/" element={<PickupFormPage />} />
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            
            <Route element={<ProtectedRoute />}>
                <Route 
                    path="/admin" 
                    element={
                        <AdminLayout />
                    }
                >
                    {/* Nested Admin Routes (rendered inside AdminLayout's <Outlet />) */}
                    <Route path="dashboard" element={<AdminDashboardPage />} />
                    <Route path="pickups/:id" element={<AdminPickupDetailPage />} />
                     {/* Redirect /admin to /admin/dashboard */}
                    <Route index element={<Navigate to="dashboard" replace />} /> 
                </Route>
            </Route>
            
            {/* Fallback for unknown routes (optional) */}
            <Route path="*" element={<Navigate to="/" replace />} /> 
        </Routes>
    </Router>
  )
}

export default App
