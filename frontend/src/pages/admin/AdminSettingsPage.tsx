import React, { useState, useEffect } from 'react';

const SETTING_KEY = 'pickup_schedule_message'; // Define the key we are managing

const AdminSettingsPage: React.FC = () => {
  const [message, setMessage] = useState<string>('');
  const [originalMessage, setOriginalMessage] = useState<string>(''); // To track changes
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch the current setting value
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      try {
        const response = await fetch(`/api/settings/${SETTING_KEY}`);
        if (!response.ok) {
            if (response.status === 404) {
                // Handle case where the setting hasn't been created yet (though init script should cover it)
                setMessage(''); 
                setOriginalMessage('');
                throw new Error('Mensaje de horario no encontrado. Puedes crear uno.');
            } else {
                throw new Error(`Error al cargar configuración: ${response.statusText}`);
            }
        }
        const data = await response.json();
        setMessage(data.value || '');
        setOriginalMessage(data.value || '');
      } catch (err: unknown) {
        console.error('Error fetching settings:', err);
        const errMsg = err instanceof Error ? err.message : 'Error desconocido.';
        setError(`Error al cargar: ${errMsg}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Handle saving the changes
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('Autenticación requerida.');
      }

      const response = await fetch(`/api/settings/${SETTING_KEY}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ value: message }), // Send the updated message
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Error al guardar.');
      }

      setMessage(result.setting.setting_value); // Update state with saved value
      setOriginalMessage(result.setting.setting_value); 
      setSuccess('¡Mensaje de horario guardado exitosamente!');

    } catch (err: unknown) {
      console.error('Error saving settings:', err);
      const errMsg = err instanceof Error ? err.message : 'Error desconocido.';
      setError(`Error al guardar: ${errMsg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = message !== originalMessage;

  return (
    <div className="bg-white p-6 rounded shadow-md">
      <h2 className="text-xl font-semibold mb-4">Configuración General</h2>

      {isLoading && <p>Cargando configuración...</p>}

      {/* Display loading error */} 
      {!isLoading && error && !success && (
           <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {error}</span>
           </div>
       )}
       
      {/* Display success message */} 
      {success && (
           <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Éxito!</strong>
              <span className="block sm:inline"> {success}</span>
           </div>
       )}

      {!isLoading && (
          <div className="space-y-4">
              <div>
                  <label htmlFor="scheduleMessage" className="block text-sm font-medium text-gray-700 mb-1">
                      Mensaje de Horario de Recogida (mostrado en formulario público)
                  </label>
                  <textarea
                      id="scheduleMessage"
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Escribe aquí el mensaje sobre los horarios..."
                  />
              </div>
              <div>
                  <button
                      onClick={handleSave}
                      disabled={isSaving || !hasChanges}
                      className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${(!hasChanges || isSaving) ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:cursor-not-allowed`}
                  >
                      {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                  {/* Display save error specifically */} 
                  {error && success === null && <p className="text-red-500 text-xs mt-1">{error}</p>}
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminSettingsPage; 