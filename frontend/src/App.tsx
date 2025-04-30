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

// Protected Route Component
const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
    if (!isAuthenticated()) {
        // Redirect them to the /admin/login page, but save the current location they were
        // trying to go to. This allows us to send them along to that page after they login,
        // which is a nicer user experience than dropping them off on the home page.
        return <Navigate to="/admin/login" replace />;
    }
    return children;
};

function App() {
  return (
    <Router>
        <Routes>
            {/* Public Route */}
            <Route path="/" element={<PickupFormPage />} />
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            
            <Route 
                path="/admin" 
                element={
                    <ProtectedRoute>
                        <AdminLayout />
                    </ProtectedRoute>
                }
            >
                {/* Nested Admin Routes (rendered inside AdminLayout's <Outlet />) */}
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="pickups/:id" element={<AdminPickupDetailPage />} />
                 {/* Redirect /admin to /admin/dashboard */}
                <Route index element={<Navigate to="dashboard" replace />} /> 
            </Route>
            
            {/* Fallback for unknown routes (optional) */}
            <Route path="*" element={<Navigate to="/" replace />} /> 
        </Routes>
    </Router>
  )
}

export default App
