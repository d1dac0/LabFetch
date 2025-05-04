export interface StatusConfig {
  value: string;        // Internal value (e.g., 'pendiente')
  displayName: string; // How it appears in UI (e.g., 'Pendiente')
  badgeClasses: string; // Tailwind classes for the badge
}

export const PICKUP_STATUSES: StatusConfig[] = [
  {
    value: 'pendiente',
    displayName: 'Pendiente',
    badgeClasses: 'bg-yellow-100 text-yellow-800',
  },
  {
    value: 'asignado',
    displayName: 'Asignado',
    badgeClasses: 'bg-blue-100 text-blue-800',
  },
  {
    value: 'en_camino',
    displayName: 'En Camino',
    badgeClasses: 'bg-orange-100 text-orange-800',
  },
  {
    value: 'recolectado',
    displayName: 'Recolectado',
    badgeClasses: 'bg-green-100 text-green-800',
  },
  {
    value: 'en_laboratorio',
    displayName: 'En Laboratorio',
    badgeClasses: 'bg-purple-100 text-purple-800',
  },
  {
    value: 'completado',
    displayName: 'Completado',
    badgeClasses: 'bg-gray-200 text-gray-800',
  },
  {
    value: 'cancelado',
    displayName: 'Cancelado',
    badgeClasses: 'bg-red-100 text-red-800',
  },
  // Add other statuses here if needed
  // {
  //   value: 'otro_estado',
  //   displayName: 'Otro Estado',
  //   badgeClasses: 'bg-gray-100 text-gray-800',
  // },
];

// Helper to get config by value
export const getStatusConfig = (statusValue: string): StatusConfig | undefined => {
  return PICKUP_STATUSES.find(s => s.value === statusValue);
};

// Extract just the status values for type generation or simple iteration
export const statusValues = PICKUP_STATUSES.map(s => s.value); 