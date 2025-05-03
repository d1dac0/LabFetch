import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { PICKUP_STATUSES, statusValues, getStatusConfig } from '../../config/pickupStatuses'; // Import status config

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

// Define types for sorting
type SortColumn = keyof Pickup | null;
type SortDirection = 'asc' | 'desc';

// Define possible status values using the config
type PickupStatus = typeof statusValues[number] | 'all';

const AdminDashboardPage: React.FC = () => {
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newPickupIds, setNewPickupIds] = useState<Set<number>>(new Set());
  const [sortColumn, setSortColumn] = useState<SortColumn>('created_at'); // Adjusted default sort key
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterStatus, setFilterStatus] = useState<PickupStatus>('all'); // State for status filter
  const [searchTerm, setSearchTerm] = useState<string>(''); // State for search term

  const navigate = useNavigate(); // Hook for navigation

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

  // --- Filtering and Sorting Logic ---
  const filteredAndSortedPickups = useMemo(() => {
    // 1. Filter by Status
    const statusFiltered = filterStatus === 'all' 
      ? pickups 
      : pickups.filter(pickup => pickup.status === filterStatus);
      
    // 2. Filter by Search Term (searches across multiple fields)
    const searchFiltered = !searchTerm
      ? statusFiltered
      : statusFiltered.filter(pickup => {
          const term = searchTerm.toLowerCase();
          const formattedDate = new Date(pickup.created_at).toLocaleString('es-CO').toLowerCase();
          const statusDisplay = getStatusConfig(pickup.status)?.displayName.toLowerCase() ?? pickup.status.toLowerCase();

          return (
            pickup.id.toString().includes(term) ||
            pickup.nombre_mascota.toLowerCase().includes(term) ||
            pickup.tipo_muestra.toLowerCase().includes(term) ||
            pickup.ciudad.toLowerCase().includes(term) ||
            pickup.departamento.toLowerCase().includes(term) ||
            statusDisplay.includes(term) || // Search displayed status name
            formattedDate.includes(term) // Search formatted date
          );
        });

    // 3. Sort
    if (!sortColumn) return searchFiltered; // Return filtered if no sort column

    return [...searchFiltered].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      // Basic comparison, extend for different types (date, number)
      let comparison = 0;
      if (sortColumn === 'created_at') {
          comparison = new Date(aValue).getTime() - new Date(bValue).getTime();
      } else if (aValue < bValue) {
        comparison = -1;
      } else if (aValue > bValue) {
        comparison = 1;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [pickups, filterStatus, searchTerm, sortColumn, sortDirection]); // Add searchTerm dependency

  const handleSort = (column: SortColumn) => {
    if (!column) return;
    const direction = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(column);
    setSortDirection(direction);
  };

  // Helper to get sort indicator
  const getSortIndicator = (column: SortColumn) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? ' ▲' : ' ▼';
  };

  // Handler for filter button clicks
  const handleFilterChange = (status: PickupStatus) => {
      setFilterStatus(status);
  };

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

      {/* Search Input */} 
      <div className="mb-4">
          <label htmlFor="search" className="sr-only">Buscar</label> {/* Screen reader label */} 
          <input 
              type="text"
              id="search"
              placeholder="Buscar en todas las columnas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
      </div>

      {/* Filter Buttons */} 
      <div className="mb-4 flex flex-wrap gap-2 items-center">
         <span className="text-sm font-medium text-gray-600 mr-2">Filtrar por Estado:</span>
          <button 
              onClick={() => handleFilterChange('all')}
              className={`px-3 py-1 text-sm rounded ${filterStatus === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Todos
            </button>
          {PICKUP_STATUSES.map(statusConfig => (
              <button 
                  key={statusConfig.value}
                  onClick={() => handleFilterChange(statusConfig.value as PickupStatus)} // Use config value
                  className={`px-3 py-1 text-sm rounded ${filterStatus === statusConfig.value ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                  {statusConfig.displayName} {/* Use display name */}
              </button>
          ))}
      </div>

      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('id')} // Make ID sortable
              >
                ID {getSortIndicator('id')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('nombre_mascota')} // Make Mascota sortable
              >
                Mascota {getSortIndicator('nombre_mascota')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Muestra</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('created_at')}
              >
                Fecha Creación {getSortIndicator('created_at')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredAndSortedPickups.length > 0 ? (
              filteredAndSortedPickups.map((pickup) => (
                <tr key={pickup.id} className={`hover:bg-gray-50 ${newPickupIds.has(pickup.id) ? 'new-pickup-highlight' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pickup.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{pickup.nombre_mascota}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{pickup.tipo_muestra}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{pickup.ciudad}, {pickup.departamento}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ 
                      getStatusConfig(pickup.status)?.badgeClasses ?? 'bg-gray-100 text-gray-800' // Use config for classes
                    }`}>
                      {getStatusConfig(pickup.status)?.displayName ?? pickup.status} {/* Use config for display name */}
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