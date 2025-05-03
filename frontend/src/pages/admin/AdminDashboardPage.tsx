import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { PICKUP_STATUSES, getStatusConfig } from '../../config/pickupStatuses';

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

  // --- TanStack Table State ---
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'created_at', desc: true }, // Initial sort
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState(''); // For the main search box

  const navigate = useNavigate();

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
            navigate('/admin/login'); // Assuming navigate is available
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

  }, [navigate]); // Run only once on component mount

  // --- TanStack Table Column Definitions ---
  const columns = useMemo<ColumnDef<Pickup>[]>(() => [
      {
        accessorKey: 'id',
        header: ({ column }) => (
          <button onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
            ID
            {{ asc: ' ▲', desc: ' ▼' }[column.getIsSorted() as string] ?? null}
          </button>
        ),
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'nombre_mascota',
        header: ({ column }) => (
          <button onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
            Mascota
            {{ asc: ' ▲', desc: ' ▼' }[column.getIsSorted() as string] ?? null}
          </button>
        ),
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'tipo_muestra',
        header: 'Muestra',
        cell: info => info.getValue(),
      },
      { // Combine city and department for Ubicacion
        id: 'ubicacion',
        header: 'Ubicación',
        accessorFn: row => `${row.ciudad}, ${row.departamento}`, // Create combined value
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        cell: info => {
            const statusValue = info.getValue() as string;
            const config = getStatusConfig(statusValue);
            return (
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ 
                config?.badgeClasses ?? 'bg-gray-100 text-gray-800'
               }`}>
                 {config?.displayName ?? statusValue}
              </span>
            );
        },
        filterFn: 'equalsString', // Use built-in equals filter for status column
      },
      {
        accessorKey: 'created_at',
        header: ({ column }) => (
          <button onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
            Fecha Creación
            {{ asc: ' ▲', desc: ' ▼' }[column.getIsSorted() as string] ?? null}
          </button>
        ),
        cell: info => new Date(info.getValue() as string).toLocaleString('es-CO'),
      },
      {
        id: 'actions',
        header: 'Acciones',
        cell: ({ row }) => (
          <Link to={`/admin/pickups/${row.original.id}`} className="text-indigo-600 hover:text-indigo-900">
            Detalles
          </Link>
        ),
      },
    ], []); // Empty dependency array, columns definition doesn't change

  // --- TanStack Table Instance ---
  const table = useReactTable({
    data: pickups,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    debugTable: process.env.NODE_ENV !== 'production', // Enable debug logs in dev
  });

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
          <input 
              type="text"
              value={globalFilter ?? ''}
              onChange={e => setGlobalFilter(String(e.target.value))}
              placeholder="Buscar en todas las columnas..."
              className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
      </div>

      {/* Filter Buttons */} 
      <div className="mb-4 flex flex-wrap gap-2 items-center">
         <span className="text-sm font-medium text-gray-600 mr-2">Filtrar por Estado:</span>
          <button 
              onClick={() => table.getColumn('status')?.setFilterValue(undefined)} // Clear filter
              className={`px-3 py-1 text-sm rounded ${!table.getColumn('status')?.getFilterValue() ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Todos
            </button>
          {PICKUP_STATUSES.map(statusConfig => (
              <button 
                  key={statusConfig.value}
                  onClick={() => table.getColumn('status')?.setFilterValue(statusConfig.value)} 
                  className={`px-3 py-1 text-sm rounded ${table.getColumn('status')?.getFilterValue() === statusConfig.value ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                  {statusConfig.displayName}
              </button>
          ))}
      </div>

      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th 
                    key={header.id}
                    colSpan={header.colSpan}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map(row => (
                <tr key={row.id} className={`hover:bg-gray-50 ${newPickupIds.has(row.original.id) ? 'new-pickup-highlight' : ''}`}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-4 text-center text-sm text-gray-500">
                  No se encontraron resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */} 
      <div className="flex items-center justify-between gap-2 mt-4 flex-wrap">
        <span className="text-sm text-gray-700">
          Página{' '}
          <strong>
            {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
          </strong>
        </span>
        <div className="flex items-center gap-2">
            <button
              className="border rounded px-2 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              {'<<'}
            </button>
            <button
               className="border rounded px-2 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              {'<'}
            </button>
            <button
               className="border rounded px-2 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              {'>'}
            </button>
            <button
               className="border rounded px-2 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              {'>>'}
            </button>
        </div>
        <span className="flex items-center gap-1 text-sm">
          <div>Ir a página:</div>
          <input
            type="number"
            defaultValue={table.getState().pagination.pageIndex + 1}
            onChange={e => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              table.setPageIndex(page);
            }}
            className="border p-1 rounded w-16 text-sm"
          />
        </span>
        <select
          value={table.getState().pagination.pageSize}
          onChange={e => {
            table.setPageSize(Number(e.target.value));
          }}
           className="border p-1 rounded text-sm"
        >
          {[10, 20, 30, 40, 50].map(pageSize => (
            <option key={pageSize} value={pageSize}>
              Mostrar {pageSize}
            </option>
          ))}
        </select>
      </div>

    </div>
  );
};

export default AdminDashboardPage; 