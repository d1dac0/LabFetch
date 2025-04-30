import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import labFetchLogo from '../../assets/Logo-black.jpeg'; // Use the black logo

const AdminLoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null); // For displaying login errors
  const navigate = useNavigate(); // Initialize useNavigate

  const handleLogin = async (event: React.FormEvent) => { // Make function async
    event.preventDefault(); // Prevent default page reload on form submit
    setError(null); // Clear previous errors

    console.log('Attempting login with:', { username, password });

    try {
      const response = await fetch('/api/admin/login', { // Use relative path for API call
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json(); // Always try to parse JSON response

      if (response.ok) { // Check if response status is 2xx
        console.log('Login successful:', data);
        if (data.token) {
          localStorage.setItem('adminToken', data.token); // Store token
          navigate('/admin/dashboard'); // Redirect on success
        } else {
          setError('No se recibió token de autenticación.'); // Handle case where token is missing
        }
      } else {
        // Use error message from API if available, otherwise use default
        const errorMessage = data.message || 'Error en el inicio de sesión.';
        console.error('Login failed:', errorMessage);
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Network or other error during login:', err);
      setError('No se pudo conectar al servidor. Inténtelo de nuevo.'); // Network or parsing error
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-sm">
        {/* Logo */}
        <img src={labFetchLogo} alt="Dx Laboratorio Veterinario Logo" className="w-32 mx-auto mb-6" /> 
        <h2 className="text-2xl font-bold mb-6 text-center">Admin Login</h2>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              Usuario
            </label>
            <input 
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
              id="username" 
              type="text" 
              placeholder="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Contraseña
            </label>
            <input 
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline ${error ? 'border-red-500' : ''}`}
              id="password" 
              type="password"
              placeholder="******************"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && (
              <p className="text-red-500 text-xs italic">{error}</p>
            )}
          </div>
          <div className="flex items-center justify-between">
            <button 
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              type="submit"
            >
              Ingresar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage; 