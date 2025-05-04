import React from 'react'; // Add React import
import './index.css' // Ensure Tailwind directives are imported
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate // Import Navigate for redirection
} from 'react-router-dom';
import { ToastContainer } from 'react-toastify'; // Import ToastContainer
import 'react-toastify/dist/ReactToastify.css'; // Import toastify CSS

// Import Pages/Components
import PickupFormPage from './pages/PickupFormPage'; // Renamed original App content
import AdminLayout from './pages/admin/AdminLayout';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminPickupDetailPage from './pages/admin/AdminPickupDetailPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage'; // Import the new settings page
import ProtectedRoute from './components/ProtectedRoute'; // Import the protected route component

// Authentication Check Function
/* // Remove unused function
const isAuthenticated = () => {
  const token = localStorage.getItem('adminToken'); // Check for token
  if (!token) {
    return false;
  }
  
  // Optional: Basic check if token is a non-empty string. 
  // More robust check would involve decoding JWT and checking expiration.
  return token.length > 0;
};
*/

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
                    <Route path="settings" element={<AdminSettingsPage />} /> {/* Add settings route */}
                     {/* Redirect /admin to /admin/dashboard */}
                    <Route index element={<Navigate to="dashboard" replace />} /> 
                </Route>
            </Route>
            
            {/* Fallback for unknown routes (optional) */}
            <Route path="*" element={<Navigate to="/" replace />} /> 
        </Routes>
        {/* Add ToastContainer here */}
        <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
        />
    </Router>
  )
}

export default App
