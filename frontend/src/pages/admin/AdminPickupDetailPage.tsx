import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios, { AxiosError } from 'axios'; // Import axios and AxiosError
import { toast } from 'react-toastify'; // Import toast
import imageCompression from 'browser-image-compression'; // Import the compression library
import { PICKUP_STATUSES, getStatusConfig } from '../../config/pickupStatuses'; // Import status config

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
  notes: string | null;        // Add notes
  photo_path: string | null;   // Add photo_path
}

const AdminPickupDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pickup, setPickup] = useState<PickupDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // State for editable fields
  const [editStatus, setEditStatus] = useState<string>('');
  const [editDriverId, setEditDriverId] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // State for photo upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchPickupDetail = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            toast.error('No authentication token found. Please log in.');
            navigate('/admin/login');
            return;
        }

        // Use axios.get
        const response = await axios.get<PickupDetail>(`/api/pickups/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        }); 
        
        const data = response.data;
        setPickup(data);
        setEditStatus(data.status);
        setEditDriverId(data.driver_id?.toString() || '');
        setEditNotes(data.notes || '');
        setExistingPhotoUrl(data.photo_path);

      } catch (err) {
        console.error("Error fetching pickup detail:", err);
        // Refactored error handling
        if (axios.isAxiosError(err)) {
            const axiosError = err as AxiosError<{ message?: string }>;
            let message = axiosError.response?.data?.message || 'Error al cargar los detalles.';

            if (axiosError.response?.status === 401) {
                message = 'Unauthorized: Please log in again. Redirecting...';
                toast.error(message);
                navigate('/admin/login');
            } else if (axiosError.response?.status === 404) {
                 message = 'Solicitud no encontrada.';
                 toast.error(message);
                 // Optionally navigate back or show a specific UI for not found
                 // navigate('/admin/dashboard');
            } else {
                 toast.error(message);
            }
        } else {
             const message = (err instanceof Error) ? err.message : 'Ocurrió un error desconocido.';
             toast.error(message);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchPickupDetail();
  }, [id, navigate]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // Clear feedback on change - handled by toast

    if (name === 'editStatus') setEditStatus(value);
    else if (name === 'editDriverId') setEditDriverId(value);
    else if (name === 'editNotes') setEditNotes(value); 
  };
  
  const handleSaveChanges = async () => {
    if (!id || !pickup) return;
    setIsSaving(true);

    const updateData: { status?: string; driver_id?: number | null; notes?: string } = {};

    // --- Validation and Data Prep --- 
    if (editStatus !== pickup.status) {
        updateData.status = editStatus;
    }
    const driverIdNumber = editDriverId ? parseInt(editDriverId, 10) : null;
    if (driverIdNumber !== pickup.driver_id) {
        if (editDriverId && isNaN(driverIdNumber as number)) {
            toast.error('ID de Conductor debe ser un número.');
            setIsSaving(false);
            return;
        }
        updateData.driver_id = driverIdNumber;
    }
    if (editNotes !== (pickup.notes || '')) {
      updateData.notes = editNotes;
    }

    if (Object.keys(updateData).length === 0) {
        toast.info("No hay cambios para guardar."); // Use info toast
        setIsSaving(false);
        return;
    }
    // --- End Validation --- 

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
          toast.error('Authentication required.');
          setIsSaving(false);
          return;
      }

      // Use axios.put
      const response = await axios.put<{ pickup: PickupDetail }>(`/api/pickups/${id}`, updateData, {
          headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
          }
      });
      
      const resultPickup = response.data.pickup;
      setPickup(resultPickup);
      setEditStatus(resultPickup.status);
      setEditDriverId(resultPickup.driver_id?.toString() || '');
      setEditNotes(resultPickup.notes || ''); 
      toast.success('Cambios guardados exitosamente!');

    } catch (err) {
      console.error("Error saving changes:", err);
      // Refactored error handling
      if (axios.isAxiosError(err)) {
          const axiosError = err as AxiosError<{ message?: string }>;
          const message = axiosError.response?.data?.message || 'Error al guardar los cambios.';
          toast.error(message);
          if (axiosError.response?.status === 401) navigate('/admin/login');
      } else {
           const message = (err instanceof Error) ? err.message : 'Ocurrió un error desconocido.';
           toast.error(message);
      }
    } finally {
        setIsSaving(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          // --- Image Compression Logic --- 
          console.log(`Original file size: ${(file.size / 1024 / 1024).toFixed(2)} MB`); // Log original size
          setPreviewUrl(null); // Clear previous preview while compressing
          setIsUploading(true); // Show a 'processing' state on the button
          toast.info('Procesando imagen...', { autoClose: false }); // Indicate processing

          const options = {
            maxSizeMB: 2,          // Max size in MB (adjust as needed)
            maxWidthOrHeight: 1920, // Max width or height
            useWebWorker: true,    // Use web worker for better performance
            initialQuality: 0.7    // Initial quality setting (0 to 1)
          };

          try {
            const compressedFileBlob = await imageCompression(file, options); // Get the compressed Blob/File
            console.log(`Compressed file size: ${(compressedFileBlob.size / 1024 / 1024).toFixed(2)} MB`); // Log compressed size

            // Create a new File object with a filename including extension
            const fileName = `compressed_${Date.now()}.jpeg`; // Create a generic filename
            const compressedFile = new File([compressedFileBlob], fileName, {
              type: 'image/jpeg', // Set the MIME type
              lastModified: Date.now(),
            });

            setSelectedFile(compressedFile); // Use the new File object
            const reader = new FileReader();
            reader.onloadend = () => {
                const resultDataUrl = reader.result as string;
                console.log("FileReader result (Data URL):", resultDataUrl); // Log the raw result
                // Check if it looks like a valid Data URL
                if (typeof resultDataUrl === 'string' && resultDataUrl.startsWith('data:image/')) {
                  setPreviewUrl(resultDataUrl);
                } else {
                  console.error("FileReader did not produce a valid Data URL:", resultDataUrl);
                  toast.error("Error al generar la vista previa de la imagen.");
                  setPreviewUrl(null); // Ensure preview is cleared on error
                  // Optionally reset file input too
                  if (fileInputRef.current) fileInputRef.current.value = "";
                  setSelectedFile(null);
                }
            };
            reader.readAsDataURL(compressedFile);
            toast.dismiss(); // Dismiss processing toast
            toast.success('Imagen lista para cargar.');

          } catch (error) {
            console.error('Error during image compression:', error);
            toast.dismiss(); // Dismiss processing toast
            toast.error('Error al procesar la imagen. Intenta de nuevo o con otra imagen.');
            // Reset file input if needed
            if (fileInputRef.current) fileInputRef.current.value = ""; 
            setSelectedFile(null);
            setPreviewUrl(null);
          } finally {
             setIsUploading(false); // Re-enable upload button regardless of success/failure
          }
         // --- End Compression Logic ---
      } else {
          setSelectedFile(null);
          setPreviewUrl(null);
      }
  };

  const handlePhotoUpload = async () => {
      if (!selectedFile || !id) return;

      setIsUploading(true);
      const formData = new FormData();
      formData.append('pickupPhoto', selectedFile);

      try {
          const token = localStorage.getItem('adminToken');
          if (!token) {
              toast.error('Authentication required.');
              setIsUploading(false);
              return;
          }
          
          // Use axios.post for FormData
          const response = await axios.post<{ photoPath: string }>(`/api/pickups/${id}/photo`, formData, {
              headers: {
                  'Authorization': `Bearer ${token}`,
                  // 'Content-Type': 'multipart/form-data' // Axios sets this automatically for FormData
              },
          });

          // Success!
          setExistingPhotoUrl(response.data.photoPath);
          toast.success('Foto cargada exitosamente!');
          setSelectedFile(null);
          setPreviewUrl(null);
          if(fileInputRef.current) fileInputRef.current.value = ""; 

      } catch (err) {
           console.error("Photo upload error:", err);
           // Refactored error handling
           if (axios.isAxiosError(err)) {
               const axiosError = err as AxiosError<{ message?: string }>;
               const message = axiosError.response?.data?.message || 'Error al cargar la foto.';
               toast.error(message);
               if (axiosError.response?.status === 401) navigate('/admin/login');
           } else {
                const message = (err instanceof Error) ? err.message : 'Ocurrió un error inesperado al cargar la foto.';
                toast.error(message);
           }
      } finally {
          setIsUploading(false);
      }
  };

  if (loading) return <p>Cargando detalles...</p>;
  if (!pickup) return <p>No se encontró la solicitud.</p>;

  const statusConfig = getStatusConfig(pickup.status);
  // const displayPhotoUrl = previewUrl || existingPhotoUrl; // REMOVED - Not needed anymore
  // Log the URL being used for the image src
  // console.log('Rendering image with relative/data path:', displayPhotoUrl); // REMOVED

  // --- Construct Correct Image Source URL --- 
  const backendBaseUrl = import.meta.env.VITE_BACKEND_BASE_URL;
  let imageSrcUrl: string | undefined;
  if (previewUrl) {
      // For preview, use the Data URL directly
      imageSrcUrl = previewUrl;
      // console.log('Using preview Data URL for src:', imageSrcUrl); // REMOVED
  } else if (existingPhotoUrl) {
      // For existing photo, construct absolute URL
      imageSrcUrl = `${backendBaseUrl}${existingPhotoUrl}`;
      // console.log('Constructed existing image URL for src:', imageSrcUrl); // REMOVED
  } else {
      // No image
      imageSrcUrl = undefined;
  }
  // ----------------------------------------

  const hasChanges = editStatus !== pickup.status || 
                     (editDriverId === '' ? pickup.driver_id !== null : parseInt(editDriverId, 10) !== pickup.driver_id) ||
                     editNotes !== (pickup.notes || '');

  return (
    <div className="bg-white p-6 rounded shadow-md">
      <button onClick={() => navigate('/admin/dashboard')} className="mb-4 text-indigo-600 hover:underline">
        &larr; Volver al Dashboard
      </button>
      <h2 className="text-xl font-semibold mb-4">Detalles Solicitud #{pickup.id}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm">
          <p><strong>Solicitante:</strong> {pickup.nombre_mascota}</p>
          <p><strong>Número de contacto:</strong> {pickup.tipo_muestra}</p>
          <p><strong>Dirección:</strong> {pickup.direccion_completa || 'N/A'}</p>
          <p><strong>Ciudad:</strong> {pickup.ciudad}, {pickup.departamento}</p>
          <p><strong>Fecha Preferida:</strong> {pickup.fecha_hora_preferida ? new Date(pickup.fecha_hora_preferida).toLocaleString('es-CO') : 'Inmediata'}</p>
          <p><strong>Tipo Recogida:</strong> {pickup.tipo_recogida}</p>
          <p><strong>Creada:</strong> {new Date(pickup.created_at).toLocaleString('es-CO')}</p>
          <p><strong>Última Actualización:</strong> {new Date(pickup.updated_at).toLocaleString('es-CO')}</p>
          <p className="md:col-span-2"><strong>Estado Actual:</strong> 
            <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ statusConfig?.badgeClasses ?? 'bg-gray-100 text-gray-800' }`}>
                {statusConfig?.displayName ?? pickup.status}
            </span>
          </p>
          {pickup.notes && (
                <div className="md:col-span-2 border-t pt-4 mt-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Notas Adicionales:</h4>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{pickup.notes}</p>
                </div>
           )}
           {existingPhotoUrl && !previewUrl && (
                <div className="md:col-span-2 border-t pt-4 mt-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Foto Adjunta:</h4>
                    <img src={imageSrcUrl} alt="Foto de recogida" className="max-w-xs max-h-60 rounded border object-contain"/>
                </div>
           )} 
      </div>
      
      <div className="border-t pt-4 space-y-6">
        <h3 className="text-lg font-semibold">Actualizar Información</h3>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <label htmlFor="editStatus" className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                 <select
                  id="editStatus" name="editStatus"
                  value={editStatus}
                  onChange={handleInputChange}
                  className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                   {PICKUP_STATUSES.map(statusConfig => (
                     <option key={statusConfig.value} value={statusConfig.value}>
                       {statusConfig.displayName}
                     </option>
                   ))}
                </select>
            </div>
             <div>
                <label htmlFor="editDriverId" className="block text-sm font-medium text-gray-700 mb-1">ID Conductor Asignado</label>
                <input
                    type="number"
                    id="editDriverId" name="editDriverId"
                    value={editDriverId}
                    onChange={handleInputChange}
                    placeholder="(Vacío para desasignar)"
                    className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>
         </div>

          <div>
            <label htmlFor="editNotes" className="block text-sm font-medium text-gray-700 mb-1">Notas (Uso interno)</label>
            <textarea
              id="editNotes" name="editNotes"
              rows={4}
              value={editNotes}
              onChange={handleInputChange}
              placeholder="Añadir notas relevantes sobre la recogida..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

        <div>
          <button
            onClick={handleSaveChanges}
            disabled={isSaving || !hasChanges}
            className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isSaving || !hasChanges ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSaving ? 'Guardando...' : 'Guardar Cambios (Estado/Conductor/Notas)'}
          </button>
        </div>
      </div>

       <div className="border-t pt-6 mt-6 space-y-4">
          <h3 className="text-lg font-semibold">Adjuntar Foto</h3>

           {previewUrl && (
                <div className="mb-4">
                    <p className="text-sm font-medium text-gray-600 mb-1">
                        {previewUrl ? 'Vista Previa:' : 'Foto Actual:'}
                    </p>
                    <img 
                        src={imageSrcUrl ?? undefined}
                        alt={previewUrl ? 'Previsualización' : 'Foto de recogida'}
                        className="max-w-xs max-h-60 rounded border object-contain" 
                    />
                </div>
           )} 

          <div>
            <label htmlFor="pickupPhoto" className="block text-sm font-medium text-gray-700 mb-1">
                {existingPhotoUrl ? 'Reemplazar Foto' : 'Seleccionar Foto'}
            </label>
            <input 
                type="file"
                id="pickupPhoto"
                name="pickupPhoto"
                accept="image/*"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>

          {selectedFile && (
              <div>
                  <button
                      onClick={handlePhotoUpload}
                      disabled={isUploading}
                      className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isUploading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                      {isUploading ? 'Cargando Foto...' : 'Confirmar y Cargar Foto'}
                  </button>
              </div>
          )}
       </div>

      <div className="mt-8 border-t pt-4">
          <Link to="/admin/dashboard" className="text-indigo-600 hover:text-indigo-800">&larr; Volver al Dashboard</Link>
      </div>
    </div>
  );
};

export default AdminPickupDetailPage; 