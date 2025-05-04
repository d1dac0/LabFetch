import React, { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import { toast } from 'react-toastify';

const AdminSettingsPage: React.FC = () => {
    const [settings, setSettings] = useState<{ [key: string]: string }>({});
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            setError(null);
            const token = localStorage.getItem('adminToken');
            if (!token) {
                setError('Authentication required.');
                setIsLoading(false);
                return;
            }

            try {
                const response = await axios.get<{ [key: string]: string }>('/api/settings', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setSettings(response.data);
            } catch (err) {
                console.error("Error fetching settings:", err);
                if (axios.isAxiosError(err)) {
                    const axiosError = err as AxiosError<{ message?: string }>;
                    const message = axiosError.response?.data?.message || 'Failed to fetch settings.';
                    setError(message);
                    toast.error(message);
                } else {
                    const message = (err instanceof Error) ? err.message : 'An unknown error occurred.';
                    setError(message);
                    toast.error(message);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        const { name, value } = event.target;
        setSettings(prevSettings => ({
            ...prevSettings,
            [name]: value,
        }));
    };

    const handleSave = async () => {
        setIsLoading(true);
        setError(null);
        const token = localStorage.getItem('adminToken');
        if (!token) {
            setError('Authentication required.');
            setIsLoading(false);
            toast.error('Authentication required.');
            return;
        }

        try {
            await axios.put('/api/settings', settings, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            toast.success('Settings updated successfully!');
        } catch (err) {
            console.error("Error updating settings:", err);
            if (axios.isAxiosError(err)) {
                const axiosError = err as AxiosError<{ message?: string }>;
                const message = axiosError.response?.data?.message || 'Failed to update settings.';
                setError(message);
                toast.error(message);
            } else {
                const message = (err instanceof Error) ? err.message : 'An unknown error occurred.';
                setError(message);
                toast.error(message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to format setting keys into readable labels
    const formatLabel = (key: string): string => {
        return key
            .replace(/_/g, ' ') // Replace underscores with spaces
            .replace(/\b\w/g, char => char.toUpperCase()); // Capitalize first letter of each word
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Admin Settings</h1>

            {isLoading && <p>Loading settings...</p>}
            {error && <p className="text-red-500">Error: {error}</p>}

            {!isLoading && !error && (
                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
                    {Object.keys(settings).length > 0 ? (
                        Object.entries(settings).map(([key, value]) => (
                            <div key={key}>
                                <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-1">
                                    {formatLabel(key)}
                                </label>
                                {/* Render textarea for now, could add logic for different input types based on key later */}
                                <textarea
                                    id={key}
                                    name={key} // Use the setting key as the name
                                    rows={4}
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                                    value={value} // Bind value to the corresponding setting state
                                    onChange={handleInputChange} // Use the generalized handler
                                />
                            </div>
                        ))
                    ) : (
                        <p>No settings found.</p>
                    )}

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default AdminSettingsPage; 