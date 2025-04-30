import React from 'react';
import PickupForm from '../components/PickupForm';
import labFetchLogo from '../assets/Logo-black.jpeg'; // Use the black logo

const PickupFormPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-green-100 py-12 px-4 sm:px-6 lg:px-8">
       {/* Optional Header with Logo */}
      <div className="max-w-md mx-auto mb-8 text-center">
        <img src={labFetchLogo} alt="Dx Laboratorio Veterinario Logo" className="w-40 mx-auto" /> 
      </div>
      
      <PickupForm />
    </div>
  );
};

export default PickupFormPage; 