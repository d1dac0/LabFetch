import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Pickup {
  id: number;
  nombre_mascota: string;
  tipo_muestra: string;
  ciudad: string;
  departamento: string;
  direccion_completa: string;
  status: string;
  created_at: string; 
}

const AdminDashboardPage: React.FC = () => {
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newPickupIds, setNewPickupIds] = useState<Set<number>>(new Set());

  // Function to fetch initial data
  const fetchInitialPickups = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken'); // Get token
      if (!token) {
        throw new Error('No authentication token found.'); // Or redirect to login
      }

      const headers: HeadersInit = { // Define headers
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' // Keep content type if needed, though maybe not for GET
      };

      const response = await fetch('/api/pickups', { headers }); // Use relative path with headers
      if (!response.ok) {
         if (response.status === 401) {
            // Handle unauthorized specifically, e.g., redirect to login
            // navigate('/admin/login'); // Assuming navigate is available
             throw new Error('Unauthorized: Please log in again.');
         }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setPickups(data);
    } catch (err: unknown) {
      console.error("Error fetching initial pickups:", err);
      let message = 'Error al cargar las solicitudes iniciales.';
      if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialPickups(); // Fetch initial data on mount

    // --- Set up Server-Sent Events (SSE) --- 
    const eventSource = new EventSource('/api/pickups/stream');

    eventSource.onopen = () => {
      console.log('SSE connection opened.');
      setError(null); // Clear previous errors on successful connection
    };

    // Listener for our custom 'new_pickup' event
    eventSource.addEventListener('new_pickup', (event) => {
      console.log('SSE new_pickup event received:', event.data);
      try {
        const newPickup = JSON.parse(event.data) as Pickup; // Type assertion

        // Add to main list
        setPickups(prevPickups => [newPickup, ...prevPickups]);

        // Track ID for highlighting
        setNewPickupIds(prevIds => {
          const newSet = new Set(prevIds);
          newSet.add(newPickup.id);
          return newSet;
        });

        // Remove the highlight after animation duration (e.g., 2 seconds)
        setTimeout(() => {
          setNewPickupIds(prevIds => {
            const nextIds = new Set(prevIds);
            nextIds.delete(newPickup.id);
            return nextIds;
          });
        }, 2000); // Match CSS animation duration

      } catch (parseError) {
        console.error('Error parsing SSE data:', parseError);
      }
    });

    // Handle generic errors on the EventSource connection
    eventSource.onerror = (err) => {
      console.error('EventSource failed:', err);
      setError('Error de conexión en tiempo real. Intentando reconectar...'); 
      // EventSource automatically attempts reconnection on error
      // eventSource.close(); // Close manually if reconnection is not desired
    };

    // Cleanup function: close the SSE connection when the component unmounts
    return () => {
      console.log('Closing SSE connection.');
      eventSource.close();
    };

  }, []); // Run only once on component mount

  // --- Render Logic --- 

  if (loading) return <p>Cargando solicitudes...</p>;

  // Determine the public URL from environment variable, fallback for development
  const publicFormUrl = import.meta.env.VITE_PUBLIC_APP_URL || 'http://localhost:8181/';
  const displayUrl = publicFormUrl.endsWith('/') ? publicFormUrl : `${publicFormUrl}/`; // Ensure trailing slash

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Panel de Administrador - Solicitudes de Recogida</h1>
      
      {/* Public Form Link */}
      <p className="mb-4 text-sm text-gray-600">
        Compartir enlace del formulario público: 
        <a href={displayUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 underline ml-1">
            <code>{displayUrl}</code>
        </a>
      </p>

      {/* Display Error if exists */} 
      {error && (
           <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {error}</span>
           </div>
       )}

      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mascota</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Muestra</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Creación</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {pickups.length > 0 ? (
              pickups.map((pickup) => (
                <tr key={pickup.id} className={`hover:bg-gray-50 ${newPickupIds.has(pickup.id) ? 'new-pickup-highlight' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pickup.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{pickup.nombre_mascota}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{pickup.tipo_muestra}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{pickup.ciudad}, {pickup.departamento}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ pickup.status === 'pendiente' ? 'bg-yellow-100 text-yellow-800' : pickup.status === 'asignado' ? 'bg-blue-100 text-blue-800' : pickup.status === 'recogido' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800' }
                    }`}>
                      {pickup.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(pickup.created_at).toLocaleString('es-CO')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link to={`/admin/pickups/${pickup.id}`} className="text-indigo-600 hover:text-indigo-900">
                      Detalles
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">No hay solicitudes pendientes.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboardPage; 