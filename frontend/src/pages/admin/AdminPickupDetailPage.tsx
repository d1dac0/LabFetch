import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// TODO: Define a more detailed Pickup type if needed (matching DB schema)
interface PickupDetail {
  id: number;
  nombre_mascota: string;
  tipo_muestra: string;
  departamento: string; 
  ciudad: string;
  tipo_via: string;
  num_via_p1: string;
  letra_via: string | null;
  bis: boolean | null;
  letra_bis: string | null;
  sufijo_cardinal1: string | null;
  num_via2: string;
  letra_via2: string | null;
  sufijo_cardinal2: string | null;
  num3: string;
  complemento: string | null;
  direccion_completa: string | null;
  latitude: number | null;
  longitude: number | null;
  fecha_hora_preferida: string | null; // ISO string
  tipo_recogida: string;
  status: string;
  driver_id: number | null;
  created_at: string;
  updated_at: string;
}

const AdminPickupDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pickup, setPickup] = useState<PickupDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for editable fields (e.g., status, driver)
  const [editStatus, setEditStatus] = useState<string>('');
  const [editDriverId, setEditDriverId] = useState<string>(''); // Use string for input
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    const fetchPickupDetail = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('adminToken'); // Get token
        if (!token) {
            throw new Error('No authentication token found. Please log in.');
        }

        // Add authentication headers
        const headers: HeadersInit = {
            'Authorization': `Bearer ${token}`
        };

        // Use the token in the fetch request
        const response = await fetch(`/api/pickups/${id}`, { headers }); // Use relative path and headers
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Unauthorized: Please log in again.');
            }
            if (response.status === 404) {
                throw new Error('Solicitud no encontrada.');
            } else {
                 throw new Error(`HTTP error! status: ${response.status}`);
            }
        }
        const data: PickupDetail = await response.json();
        setPickup(data);
        setEditStatus(data.status);
        setEditDriverId(data.driver_id?.toString() || ''); // Init edit fields
      } catch (err: unknown) {
        console.error("Error fetching pickup detail:", err);
        let message = 'Error al cargar los detalles de la solicitud.';
        if (err instanceof Error) {
            message = err.message;
        }
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    fetchPickupDetail();
  }, [id]);
  
  const handleSaveChanges = async () => {
    if (!id || !pickup) return;
    setIsSaving(true);
    setError(null);

    const updateData: { status?: string, driver_id?: number | null } = {};
    if (editStatus !== pickup.status) {
        updateData.status = editStatus;
    }
    const driverIdNumber = editDriverId ? parseInt(editDriverId, 10) : null;
    if (driverIdNumber !== pickup.driver_id) {
        // Check if parsing failed for non-empty string
        if (editDriverId && isNaN(driverIdNumber as number)) {
            setError('ID de Conductor debe ser un número.');
            setIsSaving(false);
            return;
        }
        updateData.driver_id = driverIdNumber;
    }

    if (Object.keys(updateData).length === 0) {
        setError('No hay cambios para guardar.');
        setIsSaving(false);
        return;
    }

    try {
        const token = localStorage.getItem('adminToken'); // Get token
        if (!token) {
            throw new Error('No authentication token found. Please log in.');
        }

        // Add authentication headers
        const headers: HeadersInit = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        };

        // Use the token in the fetch request
        const response = await fetch(`/api/pickups/${id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(updateData),
        });
        const result = await response.json();
        if (!response.ok) {
             throw new Error(result.message || `HTTP error! status: ${response.status}`);
        }
        setPickup(result.pickup); // Update local state with returned data
        setEditStatus(result.pickup.status);
        setEditDriverId(result.pickup.driver_id?.toString() || '');
        alert('Cambios guardados exitosamente!');
    } catch (err: unknown) {
        console.error("Error saving changes:", err);
        let message = 'Error al guardar los cambios.';
        if (err instanceof Error) {
            message = err.message;
        }
        setError(message);
    } finally {
        setIsSaving(false);
    }
  };

  if (loading) return <p>Cargando detalles...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;
  if (!pickup) return <p>No se encontró la solicitud.</p>; // Should be caught by error usually

  return (
    <div className="bg-white p-6 rounded shadow-md">
      <button onClick={() => navigate('/admin/dashboard')} className="mb-4 text-indigo-600 hover:underline">
        &larr; Volver al Dashboard
      </button>
      <h2 className="text-xl font-semibold mb-4">Detalles Solicitud #{pickup.id}</h2>
      
      {/* Display Pickup Details (Read-only section) */} 
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm">
          <p><strong>Mascota:</strong> {pickup.nombre_mascota}</p>
          <p><strong>Muestra:</strong> {pickup.tipo_muestra}</p>
          <p><strong>Dirección:</strong> {pickup.direccion_completa || 'N/A'}</p>
          <p><strong>Ciudad:</strong> {pickup.ciudad}, {pickup.departamento}</p>
          <p><strong>Fecha Preferida:</strong> {pickup.fecha_hora_preferida ? new Date(pickup.fecha_hora_preferida).toLocaleString('es-CO') : 'Inmediata'}</p>
          <p><strong>Tipo Recogida:</strong> {pickup.tipo_recogida}</p>
          <p><strong>Creada:</strong> {new Date(pickup.created_at).toLocaleString('es-CO')}</p>
          <p><strong>Última Actualización:</strong> {new Date(pickup.updated_at).toLocaleString('es-CO')}</p>
           {/* Optionally display map here */} 
      </div>
      
      {/* Editable Fields */} 
      <div className="border-t pt-4 space-y-4">
        <h3 className="text-lg font-semibold">Actualizar Estado</h3>
         <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
             <select
              id="status"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
               {/* TODO: Populate with actual valid statuses */} 
              <option value="pendiente">Pendiente</option>
              <option value="asignado">Asignado</option>
              <option value="recogido">Recogido</option>
              <option value="cancelado">Cancelado</option>
            </select>
        </div>
         <div>
            <label htmlFor="driver_id" className="block text-sm font-medium text-gray-700 mb-1">ID Conductor Asignado</label>
            <input
                type="number" // Use number type
                id="driver_id"
                value={editDriverId}
                onChange={(e) => setEditDriverId(e.target.value)}
                placeholder="(Vacío para desasignar)"
                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
        </div>
        <div>
          <button
            onClick={handleSaveChanges}
            disabled={isSaving}
            className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isSaving ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:cursor-not-allowed`}
          >
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>} {/* Show save errors here */} 
        </div>
      </div>

    </div>
  );
};

export default AdminPickupDetailPage; 