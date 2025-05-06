import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { EventSourcePolyfill } from 'event-source-polyfill';
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
import { FaFileAlt, FaCamera } from 'react-icons/fa';

interface Pickup {
  id: number;
  nombre_mascota: string;
  tipo_muestra: string;
  ciudad: string;
  departamento: string;
  direccion_completa: string;
  status: string;
  created_at: string;
  fecha_preferida: string | null;
  turno_preferido?: 'mañana' | 'tarde' | null;
  notes: string | null;
  photo_path: string | null;
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

  // Refactored function to fetch initial data using axios
  const fetchInitialPickups = async () => {
    setLoading(true);
    setError(null); // Clear previous errors (especially SSE errors)
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
         toast.error('No authentication token found. Redirecting to login.');
         navigate('/admin/login');
         return; // Stop execution
      }

      const response = await axios.get<Pickup[]>('/api/pickups', {
         headers: { Authorization: `Bearer ${token}` }
      });
      setPickups(response.data);

    } catch (err) {
      console.error("Error fetching initial pickups:", err);
      // Refactored error handling
      if (axios.isAxiosError(err)) {
          const axiosError = err as AxiosError<{ message?: string }>;
          let message = axiosError.response?.data?.message || 'Error al cargar las solicitudes iniciales.';

          // Handle unauthorized specifically
          if (axiosError.response?.status === 401) {
              message = 'No autorizado: Por favor, inicie sesión de nuevo. Redirigiendo...';
              toast.error(message);
              navigate('/admin/login'); 
          } else {
              toast.error(message);
              // Optionally set the error state for display if needed, 
              // but toast might be sufficient for initial load errors.
              // setError(message);
          }
      } else {
           // Handle non-Axios errors
           const message = (err instanceof Error) ? err.message : 'Ocurrió un error desconocido al cargar.';
           toast.error(message);
           // setError(message); // Optional
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialPickups(); // Fetch initial data on mount

    // --- Set up Server-Sent Events (SSE) --- 
    let eventSource: EventSourcePolyfill | null = null;

    const token = localStorage.getItem('adminToken');
    if (!token) {
        // Don't attempt SSE connection if not logged in
        console.warn('Admin token not found, skipping SSE connection.');
        // Optionally set an error state or rely on fetchInitialPickups redirecting
        // setError('Authentication required for real-time updates.'); 
        return; 
    }

    // Use EventSourcePolyfill and pass headers
    eventSource = new EventSourcePolyfill('/api/pickups/stream', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    eventSource.onopen = () => {
      console.log('SSE connection opened.');
      // Clear specific SSE errors when connection is successful
      // if (error?.includes('conexión en tiempo real')) {
      //    setError(null);
      // } // Let's clear any error on successful open
      setError(null);
    };

    // Listener for our custom 'new_pickup' event
    eventSource.addEventListener('new_pickup', (event: Event) => {
      // Cast to MessageEvent to access data property
      const messageEvent = event as MessageEvent;
      console.log('SSE new_pickup event received:', messageEvent.data);
      try {
        const newPickup = JSON.parse(messageEvent.data) as Pickup;

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
    eventSource.onerror = (err: Event | { status?: number }) => {
      console.error('EventSource failed:', err);
      // Check if it's an error object with status
      if (err && typeof err === 'object' && 'status' in err && err.status) {
           if (err.status === 401 || err.status === 403) {
               setError('Error de autenticación con actualizaciones en tiempo real. Por favor, reingrese.');
               toast.error('Error de autenticación con actualizaciones en tiempo real. Por favor, reingrese.');
               eventSource?.close(); // Close the connection on auth errors
               navigate('/admin/login'); // Redirect to login
               return;
           }
           // Handle other potential status codes if needed
           setError(`Error de conexión: Estado ${err.status}`);
      } else {
           // Handle generic Event errors or unknown error types
           setError('Error de conexión en tiempo real. Intentando reconectar...');
      }
    };

    // Cleanup function: close the SSE connection when the component unmounts
    return () => {
      if (eventSource) {
         console.log('Closing SSE connection.');
         eventSource.close();
      }
    };

  }, [navigate]);

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
            SOLICITANTE
            {{ asc: ' ▲', desc: ' ▼' }[column.getIsSorted() as string] ?? null}
          </button>
        ),
        cell: info => info.getValue(),
      },
      {
        accessorKey: 'tipo_muestra',
        header: 'NÚMERO DE CONTACTO',
        cell: info => info.getValue(),
      },
      { // Combine city and department for Ubicacion
        id: 'ubicacion',
        header: 'Ubicación',
        accessorFn: row => `${row.ciudad}, ${row.departamento}`, // Create combined value
        cell: info => info.getValue() as string, // CORRECTED: No date formatting needed here
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
            FECHA CREACIÓN
            {{ asc: ' ▲', desc: ' ▼' }[column.getIsSorted() as string] ?? null}
          </button>
        ),
        cell: info => new Date(info.getValue() as string).toLocaleString('es-CO'),
      },
      {
        accessorKey: 'fecha_preferida',
        header: ({ column }) => (
          <button onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
            FECHA PREFERIDA
            {{ asc: ' ▲', desc: ' ▼' }[column.getIsSorted() as string] ?? null}
          </button>
        ),
        cell: info => {
          const dateValue = info.getValue() as string | null;
          console.log('Dashboard - fecha_preferida dateValue:', dateValue); // DEBUG LOG
          if (!dateValue || dateValue.trim() === '') return 'N/A';
          const date = new Date(dateValue); // SIMPLIFIED: Use dateValue directly
          if (isNaN(date.getTime())) {
            console.error('Dashboard - Invalid date from value (direct parse):', dateValue);
            return 'Fecha Inválida';
          }

          const formattedDate = date.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
          
          // Optionally display turno_preferido if available
          const turno = info.row.original.turno_preferido;
          return turno ? `${formattedDate} (${turno})` : formattedDate;
        },
      },
      {
        id: 'actions',
        header: 'Acciones',
        cell: ({ row }) => {
          return (
            <Link 
              to={`/admin/pickups/${row.original.id}`} 
              className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
            >
              <span>Detalles</span>
            </Link>
          );
        },
      },
      {
        id: 'row-badges',
        header: () => null, // No visible header text for this column
        cell: ({ row }) => {
          const hasNotes = !!row.original.notes;
          const hasPhoto = !!row.original.photo_path;
          if (!hasNotes && !hasPhoto) return null;

          return (
            <div className="relative w-full"> {/* Removed h-full */}
              <div className="absolute top-1 right-1 flex space-x-1"> {/* Adjusted positioning, removed items-center and p-1 */}
                {hasNotes && <FaFileAlt title="Tiene notas" className="text-blue-500 text-xs" />}
                {hasPhoto && <FaCamera title="Tiene foto" className="text-green-500 text-xs" />}
              </div>
            </div>
          );
        },
        size: 30,
      }
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

  // Determine the public URL from the current window location
  const publicFormUrl = window.location.origin; // Get base URL automatically
  const displayUrl = publicFormUrl.endsWith('/') ? publicFormUrl : `${publicFormUrl}/`; // Ensure trailing slash

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Panel de Administrador - Solicitudes de Recolección</h1>
      
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