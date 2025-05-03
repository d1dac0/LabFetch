import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom'; // Outlet renders child routes, useNavigate for navigation
import labFetchLogo from '../../assets/Logo-white.jpeg'; // Use the white logo

const AdminLayout: React.FC = () => {
  const navigate = useNavigate(); // Hook for navigation

  const handleLogout = () => {
    localStorage.removeItem('adminToken'); // Remove token from storage
    navigate('/admin/login'); // Redirect to login page
  };

  return (
    <div className="min-h-screen bg-gray-200">
      <nav className="bg-gray-800 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/admin/dashboard"> 
            <img src={labFetchLogo} alt="Dx Laboratorio Veterinario Logo" className="h-8 w-auto" /> 
          </Link>
          <div>
            {/* Add navigation links later */}
            <Link to="/admin/dashboard" className="px-3 hover:text-gray-300">Dashboard</Link>
            <Link to="/admin/settings" className="px-3 hover:text-gray-300">Configuración</Link>
            <button 
              onClick={handleLogout}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-sm"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>
      <main className="container mx-auto p-4">
        <Outlet /> {/* Child routes will render here */}
      </main>
    </div>
  );
};

export default AdminLayout; 