import React from 'react';
import { Outlet, Link } from 'react-router-dom'; // Outlet renders child routes
import labFetchLogo from '../../assets/Logo-white.jpeg'; // Use the white logo

const AdminLayout: React.FC = () => {
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
            {/* Add Logout button later */}
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