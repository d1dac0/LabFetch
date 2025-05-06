import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios, { AxiosError } from 'axios'; // Import axios and AxiosError
import { toast } from 'react-toastify'; // Import toast
import labFetchLogo from '../../assets/Logo-black.jpeg'; // Use the black logo

const AdminLoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Add loading state
  const [error, setError] = useState<string | null>(null); // Keep error state for inline field highlighting, but toast handles main feedback
  const navigate = useNavigate(); // Initialize useNavigate

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null); // Clear previous inline errors
    setIsLoading(true);

    console.log('Attempting login with:', { username }); // Don't log password

    try {
      // Use axios.post
      const response = await axios.post<{ token: string }>('/api/admin/login', { 
          username, 
          password 
      });

      console.log('Login successful:', response.data);
      if (response.data.token) {
        localStorage.setItem('adminToken', response.data.token);
        navigate('/admin/dashboard');
      } else {
        // This case is less likely with axios successful response but good practice
        const msg = 'No se recibió token de autenticación.';
        setError(msg);
        toast.error(msg);
      }
    } catch (err) {
      console.error('Login error:', err);
      // Refactored error handling with AxiosError and toast
      if (axios.isAxiosError(err)) {
          const axiosError = err as AxiosError<{ message?: string }>;
          const message = axiosError.response?.data?.message || 'Error en el inicio de sesión.';
          setError(message); // Set inline error for potential field highlighting
          toast.error(message); 
      } else {
          // Handle non-Axios errors
          const message = 'No se pudo conectar al servidor. Inténtelo de nuevo.';
          setError(message);
          toast.error(message);
      }
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-sm">
        {/* Logo */}
        <img src={labFetchLogo} alt="Dx Laboratorio Veterinario Logo" className="w-32 mx-auto mb-6" /> 
        <h2 className="text-2xl font-bold mb-6 text-center">Inicio de Sesión</h2>
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
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage; 