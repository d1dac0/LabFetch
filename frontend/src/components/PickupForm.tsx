import React, { useState } from 'react';
import DatePicker, { registerLocale } from "react-datepicker";
import { es } from 'date-fns/locale/es';
import "react-datepicker/dist/react-datepicker.css";

registerLocale('es', es);

// TODO: Populate these with actual Colombian departments and cities later
// Source: DANE (Divipola) or similar official source recommended for production
const departments = [
  'AMAZONAS',
  'ANTIOQUIA',
  'ARAUCA',
  'ATLANTICO',
  'BOGOTA',
  'BOLIVAR',
  'BOYACA',
  'CALDAS',
  'CAQUETA',
  'CASANARE',
  'CAUCA',
  'CESAR',
  'CHOCO',
  'CORDOBA',
  'CUNDINAMARCA',
  'GUAINIA',
  'GUAVIARE',
  'HUILA',
  'LA GUAJIRA',
  'MAGDALENA',
  'META',
  'NARIÑO',
  'NORTE SANTANDER',
  'PUTUMAYO',
  'QUINDIO',
  'RISARALDA',
  'SAN ANDRES',
  'SANTANDER',
  'SUCRE',
  'TOLIMA',
  'VALLE',
  'VAUPES',
  'VICHADA',
];
const citiesByDepartment: { [key: string]: string[] } = {
  AMAZONAS: ['LETICIA', 'PUERTO NARIÑO'],
  ANTIOQUIA: ['MEDELLIN', 'ABEJORRAL', 'ABRIAQUI', 'ALEJANDRIA', 'AMAGA', 'AMALFI', 'ANDES', 'ANGELOPOLIS', 'ANGOSTURA', 'ANORI', 'ANZA', 'APARTADO', 'ARBOLETES', 'ARGELIA', 'ARMENIA', 'BARBOSA', 'BELLO', 'BELMIRA', 'BETANIA', 'BETULIA', 'BRICEÑO', 'BURITICA', 'CACERES', 'CAICEDO', 'CALDAS', 'CAMPAMENTO', 'CARACOLI', 'CARAMANTA', 'CAREPA', 'CAROLINA', 'CAUCASIA', 'CAÑASGORDAS', 'CHIGORODO', 'CISNEROS', 'CIUDAD BOLIVAR', 'COCORNA', 'CONCEPCION', 'CONCORDIA', 'COPACABANA', 'DABEIBA', 'DON MATIAS', 'EBEJICO', 'EL BAGRE', 'EL CARMEN DE VIBORAL', 'EL SANTUARIO', 'ENTRERRIOS', 'ENVIGADO', 'FREDONIA', 'FRONTINO', 'GIRALDO', 'GIRARDOTA', 'GOMEZ PLATA', 'GRANADA', 'GUADALUPE', 'GUARNE', 'GUATAPE', 'HELICONIA', 'HISPANIA', 'ITAGUI', 'ITUANGO', 'JARDIN', 'JERICO', 'LA CEJA', 'LA ESTRELLA', 'LA PINTADA', 'LA UNION', 'LIBORINA', 'MACEO', 'MARINILLA', 'MONTEBELLO', 'MURINDO', 'MUTATA', 'NARIÑO', 'NECHI', 'NECOCLI', 'OLAYA', 'PEQUE', 'PEÑOL', 'PUEBLORRICO', 'PUERTO BERRIO', 'PUERTO NARE', 'PUERTO TRIUNFO', 'REMEDIOS', 'RETIRO', 'RIONEGRO', 'SABANALARGA', 'SABANETA', 'SALGAR', 'SAN ANDRES', 'SAN CARLOS', 'SAN FRANCISCO', 'SAN JERONIMO', 'SAN JOSE DE LA MONTAÑA', 'SAN JUAN DE URABA', 'SAN LUIS', 'SAN PEDRO', 'SAN PEDRO DE URABA', 'SAN RAFAEL', 'SAN ROQUE', 'SAN VICENTE', 'SANTA BARBARA', 'SANTA ROSA DE OSOS', 'SANTAFE DE ANTIOQUIA', 'SANTO DOMINGO', 'SEGOVIA', 'SONSON', 'SOPETRAN', 'TAMESIS', 'TARAZA', 'TARSO', 'TITIRIBI', 'TOLEDO', 'TURBO', 'URAMITA', 'URRAO', 'VALDIVIA', 'VALPARAISO', 'VEGACHI', 'VENECIA', 'VIGIA DEL FUERTE', 'YALI', 'YARUMAL', 'YOLOMBO', 'YONDO', 'ZARAGOZA'],
  ARAUCA: ['ARAUCA', 'ARAUQUITA', 'CRAVO NORTE', 'FORTUL', 'PUERTO RONDON', 'SARAVENA', 'TAME'],
  ATLANTICO: ['BARRANQUILLA', 'BARANOA', 'CAMPO DE LA CRUZ', 'CANDELARIA', 'GALAPA', 'JUAN DE ACOSTA', 'LURUACO', 'MALAMBO', 'MANATI', 'PALMAR DE VARELA', 'PIOJO', 'POLONUEVO', 'PONEDERA', 'PUERTO COLOMBIA', 'REPELON', 'SABANAGRANDE', 'SABANALARGA', 'SANTA LUCIA', 'SANTO TOMAS', 'SOLEDAD', 'SUAN', 'TUBARA', 'USIACURI'],
  BOGOTA: ['BOGOTA D.C.'],
  BOLIVAR: ['CARTAGENA', 'ACHI', 'ALTOS DEL ROSARIO', 'ARENAL', 'ARJONA', 'ARROYOHONDO', 'BARRANCO DE LOBA', 'BRAZUELO DE PAPAYAL', 'CALAMAR', 'CANTAGALLO', 'CICUCO', 'CLEMENCIA', 'CORDOBA', 'EL CARMEN DE BOLIVAR', 'EL GUAMO', 'EL PEÑON', 'HATILLO DE LOBA', 'MAGANGUE', 'MAHATES', 'MARGARITA', 'MARIA LA BAJA', 'MONTECRISTO', 'MORALES', 'MORALES', 'NOROSI', 'PINILLOS', 'REGIDOR', 'RIO VIEJO', 'SAN CRISTOBAL', 'SAN ESTANISLAO', 'SAN FERNANDO', 'SAN JACINTO', 'SAN JACINTO DEL CAUCA', 'SAN JUAN NEPOMUCENO', 'SAN MARTIN DE LOBA', 'SAN PABLO', 'SAN PABLO', 'SANTA CATALINA', 'SANTA CRUZ DE MOMPOX', 'SANTA ROSA', 'SANTA ROSA DEL SUR', 'SIMITI', 'SOPLAVIENTO', 'TALAIGUA NUEVO', 'TIQUISIO', 'TURBACO', 'TURBANA', 'VILLANUEVA', 'ZAMBRANO'],
  BOYACA: ['TUNJA', /* ... adding a few examples ... */ 'DUITAMA', 'SOGAMOSO', 'CHIQUINQUIRA', 'PAIPA'],
  CALDAS: ['MANIZALES', /* ... */ 'LA DORADA', 'CHINCHINA', 'VILLAMARIA', 'RIOSUCIO'],
  CAQUETA: ['FLORENCIA', /* ... */ 'SAN VICENTE DEL CAGUAN', 'CARTAGENA DEL CHAIRA'],
  CASANARE: ['YOPAL', /* ... */ 'AGUAZUL', 'VILLANUEVA', 'PAZ DE ARIPORO'],
  CAUCA: ['POPAYAN', /* ... */ 'SANTANDER DE QUILICHAO', 'PIENDAMO', 'TIMBIO'],
  CESAR: ['VALLEDUPAR', /* ... */ 'AGUACHICA', 'AGUSTIN CODAZZI', 'BOSCONIA'],
  CHOCO: ['QUIBDO', /* ... */ 'ISTMINA', 'TADO', 'CONDOTO'],
  CORDOBA: ['MONTERIA', /* ... */ 'CERETE', 'SAHAGUN', 'LORICA', 'PLANETA RICA'],
  CUNDINAMARCA: ['AGUA DE DIOS', 'ALBAN', 'ANAPOIMA', 'ANOLAIMA', 'APULO', 'ARBELAEZ', 'BELTRAN', 'BITUIMA', 'BOJACA', 'CABRERA', 'CACHIPAY', 'CAJICA', 'CAPARRAPI', 'CAQUEZA', 'CARMEN DE CARUPA', 'CHAGUANI', 'CHIA', 'CHIPAQUE', 'CHOACHI', 'CHOCONTA', 'COGUA', 'COTA', 'CUCUNUBA', 'EL COLEGIO', 'EL PEÑON', 'EL ROSAL', 'FACATATIVA', 'FOMEQUE', 'FOSCA', 'FUNZA', 'FUQUENE', 'FUSAGASUGA', 'GACHALA', 'GACHANCIPA', 'GACHETA', 'GAMA', 'GIRARDOT', 'GRANADA', 'GUACHETA', 'GUADUAS', 'GUASCA', 'GUATAQUI', 'GUATAVITA', 'GUAYABAL DE SIQUIMA', 'GUAYABETAL', 'GUTIERREZ', 'JERUSALEN', 'JUNIN', 'LA CALERA', 'LA MESA', 'LA PALMA', 'LA PEÑA', 'LA VEGA', 'LENGUAZAQUE', 'MACHETA', 'MADRID', 'MANTA', 'MEDINA', 'MOSQUERA', 'NARIÑO', 'NEMOCON', 'NILO', 'NIMAIMA', 'NOCAIMA', 'VENECIA', 'PACHO', 'PAIME', 'PANDI', 'PARATEBUENO', 'PASCA', 'PULI', 'QUEBRADANEGRA', 'QUETAME', 'QUIPILE', 'RAFAEL REYES', 'RICAURTE', 'SAN ANTONIO DEL TEQUENDAMA', 'SAN BERNARDO', 'SAN CAYETANO', 'SAN FRANCISCO', 'SAN JUAN DE RIO SECO', 'SASAIMA', 'SESQUILE', 'SIBATE', 'SILVANIA', 'SIMIJACA', 'SOACHA', 'SOPO', 'SUBACHOQUE', 'SUESCA', 'SUPATA', 'SUSA', 'SUTATAUSA', 'TABIO', 'TAUSA', 'TENA', 'TENJO', 'TIBACUY', 'TIBIRITA', 'TOCAIMA', 'TOCANCIPA', 'TOPAIPI', 'UBALA', 'UBAQUE', 'VILLA DE SAN DIEGO DE UBATE', 'UNE', 'UTICA', 'VERGARA', 'VIANI', 'VILLA GOMEZ', 'VILLAPINZON', 'VILLETA', 'VIOTA', 'YACOPI', 'ZIPACON', 'ZIPAQUIRA'],
  GUAINIA: ['INIRIDA'],
  GUAVIARE: ['SAN JOSE DEL GUAVIARE'],
  HUILA: ['NEIVA', /* ... */ 'PITALITO', 'GARZON', 'LA PLATA'],
  'LA GUAJIRA': ['RIOHACHA', /* ... */ 'MAICAO', 'URIBIA', 'FONSECA'],
  MAGDALENA: ['SANTA MARTA', /* ... */ 'CIENAGA', 'FUNDACION', 'PLATO'],
  META: ['VILLAVICENCIO', /* ... */ 'ACACIAS', 'GRANADA', 'PUERTO LOPEZ'],
  NARIÑO: ['PASTO', /* ... */ 'TUMACO', 'IPIALES', 'LA UNION'],
  'NORTE SANTANDER': ['CUCUTA', /* ... */ 'OCAÑA', 'PAMPLONA', 'VILLA DEL ROSARIO'],
  PUTUMAYO: ['MOCOA', /* ... */ 'PUERTO ASIS', 'ORITO', 'VALLE DEL GUAMUEZ'],
  QUINDIO: ['ARMENIA', /* ... */ 'CALARCA', 'MONTENEGRO', 'QUIMBAYA'],
  RISARALDA: ['PEREIRA', /* ... */ 'DOSQUEBRADAS', 'SANTA ROSA DE CABAL', 'LA VIRGINIA'],
  'SAN ANDRES': ['SAN ANDRES', 'PROVIDENCIA'],
  SANTANDER: ['BUCARAMANGA', /* ... */ 'FLORIDABLANCA', 'GIRON', 'PIEDECUESTA', 'BARRANCABERMEJA'],
  SUCRE: ['SINCELEJO', /* ... */ 'COROZAL', 'OVEJAS', 'SAMPUES'],
  TOLIMA: ['IBAGUE', /* ... */ 'ESPINAL', 'MELGAR', 'HONDA'],
  VALLE: ['CALI', 'ALCALA', 'ANDALUCIA', 'ANSERMANUEVO', 'ARGELIA', 'BOLIVAR', 'BUENAVENTURA', 'BUGA', 'BUGALAGRANDE', 'CAICEDONIA', 'CALIMA', 'CANDELARIA', 'CARTAGO', 'DAGUA', 'EL AGUILA', 'EL CAIRO', 'EL CERRITO', 'EL DOVIO', 'FLORIDA', 'GINEBRA', 'GUACARI', 'GUADALAJARA DE BUGA', 'JAMUNDI', 'LA CUMBRE', 'LA UNION', 'LA VICTORIA', 'OBANDO', 'PALMIRA', 'PRADERA', 'RESTREPO', 'RIO FRIO', 'ROLDANILLO', 'SAN PEDRO', 'SEVILLA', 'TORO', 'TRUJILLO', 'TULUA', 'ULLOA', 'VERSALLES', 'VIJES', 'YOTOCO', 'YUMBO', 'ZARZAL'],
  VAUPES: ['MITU'],
  VICHADA: ['PUERTO CARREÑO'],
};

// Based on form_address_Example.txt and common usage
const viaTypes = [
  'Autopista', // AUT
  'Avenida',   // AV
  'Bulevar',   // BLV
  'Calle',     // CL
  'Carrera',   // CR
  'Carretera', // CRT
  'Circular',  // CIR
  'Circunvalar',// CRV
  'Corregimiento',// CRG
  'Diagonal',  // DG
  'Kilometro', // KM
  'Transversal',// TV
  'Troncal',   // TC
  'Variante',  // VT
  'Vereda',    // VRD
  'Via'        // VI
];

// Based on form_address_Example.txt - extended slightly
const letters = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
  'AA', 'AB', 'AC', 'AD', 'AE', 'AF', 'AG', 'AH',
  'BA', 'BB', 'BC', 'BD', 'BE', 'BF', 'BG', 'BH',
  'CA', 'CB', 'CC', 'CD', 'CE', 'CF', 'CG', 'CH',
  'DA', 'DB', 'DC', 'DD', 'DE', 'DF', 'DG', 'DH',
  'EA', 'EB', 'EC', 'ED', 'EE', 'EF', 'EG', 'EH',
  'FA', 'FB', 'FC', 'FD', 'FE', 'FF', 'FG', 'FH',
  'GA', 'GB', 'GC', 'GD', 'GE', 'GF', 'GG', 'GH',
  'HA', 'HB', 'HC', 'HD', 'HE', 'HF', 'HG', 'HH',
  // Add more if necessary based on observations
];

const quadrants = ['Este', 'Norte', 'Oeste', 'Sur'];

interface FormData {
  nombreMascota: string;
  tipoMuestra: string;
  departamento: string;
  ciudad: string;
  tipoVia: string;
  numViaP1: string;
  letraVia: string;
  bis: boolean;
  letraBis: string;
  sufijoCardinal1: string;
  numVia2: string;
  letraVia2: string;
  sufijoCardinal2: string;
  num3: string;
  complemento: string;
  fechaHoraPreferida: Date | null;
  tipoRecogida: 'inmediata' | 'programada';
}

// Add type for errors state
interface FormErrors {
  nombreMascota?: string;
  tipoMuestra?: string;
  departamento?: string;
  ciudad?: string;
  tipoVia?: string;
  numViaP1?: string;
  letraVia?: string;
  letraBis?: string;
  sufijoCardinal1?: string;
  numVia2?: string;
  letraVia2?: string;
  sufijoCardinal2?: string;
  num3?: string;
  complemento?: string;
  fechaHoraPreferida?: string;
}

const PickupForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    nombreMascota: '',
    tipoMuestra: '',
    departamento: '',
    ciudad: '',
    tipoVia: '',
    numViaP1: '',
    letraVia: '',
    bis: false,
    letraBis: '',
    sufijoCardinal1: '',
    numVia2: '',
    letraVia2: '',
    sufijoCardinal2: '',
    num3: '',
    complemento: '',
    fechaHoraPreferida: null,
    tipoRecogida: 'programada',
  });

  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});

  // Function to validate the form
  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!formData.nombreMascota.trim()) newErrors.nombreMascota = 'El nombre de la mascota es obligatorio.';
    if (!formData.tipoMuestra.trim()) newErrors.tipoMuestra = 'El tipo de muestra es obligatorio.';
    if (!formData.departamento) newErrors.departamento = 'El departamento es obligatorio.';
    if (!formData.ciudad) newErrors.ciudad = 'La ciudad es obligatoria.';
    if (!formData.tipoVia) newErrors.tipoVia = 'El tipo de vía es obligatorio.';
    if (!formData.numViaP1.trim()) newErrors.numViaP1 = 'El número de vía principal es obligatorio.';
    if (!formData.numVia2.trim()) newErrors.numVia2 = 'El número de vía generadora es obligatorio.';
    if (!formData.num3.trim()) newErrors.num3 = 'El número de placa es obligatorio.';

    if (formData.tipoRecogida === 'programada' && !formData.fechaHoraPreferida) {
      newErrors.fechaHoraPreferida = 'La fecha y hora son obligatorias para recogida programada.';
    }

    // Basic future date validation for scheduled pickup
    if (formData.tipoRecogida === 'programada' && formData.fechaHoraPreferida) {
        const selectedDate = formData.fechaHoraPreferida;
        const now = new Date();
        // Add a small buffer (e.g., 1 minute) to prevent validation errors for selecting "now"
        now.setMinutes(now.getMinutes() - 1);
        if (selectedDate <= now) {
             newErrors.fechaHoraPreferida = 'La fecha y hora deben ser futuras.';
        }
    }

    return newErrors;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, type } = e.target;
    let value = e.target.value;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    // Input Filtering Logic
    switch (name) {
        case 'numViaP1':
        case 'numVia2':
        case 'num3':
            // Allow only numbers
            value = value.replace(/[^0-9]/g, '');
            break;
        case 'letraVia':
        case 'letraBis':
            // Allow only letters (basic A-Z, case-insensitive)
            // Convert to uppercase for consistency if desired
            value = value.replace(/[^A-Za-z]/g, ''); //.toUpperCase();
            break;
        // Add cases for other fields if specific filtering is needed
        // e.g., restricting length, allowing specific characters
        default:
            // No filtering for other fields like nombreMascota, tipoMuestra, selects, complemento
            break;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error for the field being edited
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }

    // Update cities when department changes
    if (name === 'departamento') {
      setAvailableCities(citiesByDepartment[value] || []);
      if (!citiesByDepartment[value]?.includes(formData.ciudad)) {
        setFormData(prev => ({ ...prev, ciudad: '' }));
        // Clear city error if department changes
        if(errors.ciudad) setErrors(prev => ({ ...prev, ciudad: undefined }));
      }
    }

    // Reset Bis letter if Bis checkbox is unchecked
    if (name === 'bis' && !checked) {
      setFormData(prev => ({ ...prev, letraBis: '' }));
       if(errors.letraBis) setErrors(prev => ({ ...prev, letraBis: undefined }));
    }
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value as 'inmediata' | 'programada'
    }));
     // Clear date error if switching to immediate pickup
     if (value === 'inmediata' && errors.fechaHoraPreferida) {
        setErrors(prev => ({ ...prev, fechaHoraPreferida: undefined }));
     }
  };

  const handleDateChange = (date: Date | null) => {
    setFormData(prev => ({ ...prev, fechaHoraPreferida: date }));
    if (errors.fechaHoraPreferida) {
        setErrors(prev => ({ ...prev, fechaHoraPreferida: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      // Prepare data for submission (convert Date to ISO string)
      const submissionData = {
        ...formData,
        fechaHoraPreferida: formData.fechaHoraPreferida ? formData.fechaHoraPreferida.toISOString() : null,
      };
      console.log('Submitting Form Data:', submissionData);

      // --- Send data to backend --- 
      try {
          // Send to relative path, Nginx will proxy
          const response = await fetch('/api/pickups', { 
             method: 'POST',
             headers: {
                'Content-Type': 'application/json',
             },
             body: JSON.stringify(submissionData),
          });

          const result = await response.json(); // Attempt to parse JSON response

          if (!response.ok) {
             // Handle HTTP errors (e.g., 400, 500)
             console.error('Backend Error:', result);
             // Use message from backend response if available, otherwise use default
             alert(`Error al enviar la solicitud: ${result.message || response.statusText}`);
          } else {
            // Success
            console.log('Backend Success:', result);
            alert('Solicitud enviada exitosamente!');
            // Optionally reset form here
            /*
            setFormData({ ...initial state... }); // Need to define initialState constant
            setAvailableCities([]);
            setErrors({});
            */
          }

      } catch (error) {
        // Handle network errors or issues with fetch itself
        console.error('Network/Fetch Error:', error);
        alert('Error de red al enviar la solicitud. Intenta nuevamente.');
      }
      // ---------------------------

    } else {
      console.log('Validation Errors:', validationErrors);
      alert('Por favor corrige los errores en el formulario.');
    }
  };
  
  // Generate address preview string based on OSM wiki standard
  const generateAddressPreview = () => {
    let preview = '';
    if (formData.tipoVia) preview += `${formData.tipoVia} `;
    if (formData.numViaP1) preview += `${formData.numViaP1} `;
    if (formData.letraVia) preview += `${formData.letraVia} `;
    if (formData.bis) {
        preview += `Bis `;
        if (formData.letraBis) preview += `${formData.letraBis} `;
    }
    if (formData.sufijoCardinal1) preview += `${formData.sufijoCardinal1} `;
    // Separator for the plaque number part
    if (formData.numVia2 || formData.letraVia2 || formData.sufijoCardinal2 || formData.num3) {
        preview += `# `;
    }
    if (formData.numVia2) preview += `${formData.numVia2} `;
    if (formData.letraVia2) preview += `${formData.letraVia2} `;
    if (formData.sufijoCardinal2) preview += `${formData.sufijoCardinal2} `;
    if (formData.num3) preview += `- ${formData.num3} `;

    // Add complemento at the end, maybe in parentheses or as specified
    if (formData.complemento) preview += ` (${formData.complemento.trim()}) `;

    // Add City and Department
    if (formData.ciudad) preview += `${formData.ciudad}, `;
    if (formData.departamento) preview += `${formData.departamento}`;

    return preview.trim().replace(/ +/g, ' '); // Clean up extra spaces
  };

  const addressPreview = generateAddressPreview();

  // Helper to get input border class
  const getBorderClass = (fieldName: keyof FormErrors) => {
      return errors[fieldName] ? 'border-red-500' : 'border-gray-300';
  };

  // --- Time constraints for DatePicker ---
  const filterPassedTime = (time: Date) => {
    const currentDate = new Date();
    const selectedDate = new Date(time);
    return currentDate.getTime() < selectedDate.getTime();
  };

  let minTime = new Date();
  minTime.setHours(0, 0, 0, 0); // Default to start of day
  let maxTime = new Date();
  maxTime.setHours(23, 59, 59, 999); // Default to end of day

  if (formData.fechaHoraPreferida) {
      const now = new Date();
      const selectedDay = formData.fechaHoraPreferida;
      // If selected date is today, restrict minimum time to current time
      if (selectedDay.toDateString() === now.toDateString()) {
          minTime.setHours(now.getHours(), now.getMinutes() + 1); // Start from next minute
      }
       // Example: Restrict hours if needed (e.g., 8 AM to 6 PM)
      // minTime = new Date(selectedDay.setHours(8, 0, 0, 0));
      // maxTime = new Date(selectedDay.setHours(18, 0, 0, 0));
  }
  // ----------------------------------------

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold mb-6 text-gray-700">Solicitar Recogida de Muestra</h2>
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Pet Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="nombreMascota" className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Mascota*</label>
            <input
              type="text"
              id="nombreMascota"
              name="nombreMascota"
              value={formData.nombreMascota}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border ${getBorderClass('nombreMascota')} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
            />
            {errors.nombreMascota && <p className="text-red-500 text-xs mt-1">{errors.nombreMascota}</p>}
          </div>
          <div>
            <label htmlFor="tipoMuestra" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Muestra*</label>
            <input
              type="text"
              id="tipoMuestra"
              name="tipoMuestra"
              value={formData.tipoMuestra}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border ${getBorderClass('tipoMuestra')} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
              placeholder="Ej: Sangre, Orina, Heces"
            />
             {errors.tipoMuestra && <p className="text-red-500 text-xs mt-1">{errors.tipoMuestra}</p>}
          </div>
        </div>

        {/* Address Section Header - Refined */}
        <div className="pb-2 border-b border-gray-200"> {/* Added border-b, removed hr below */}
          <label className="text-lg font-semibold text-gray-800">Dirección de Recogida</label>
          <p className="text-xs text-gray-500 mb-1">Basado en nomenclatura estándar. Ver <a href="https://wiki.openstreetmap.org/wiki/ES:Colombia/Gu%C3%ADa_para_mapear/nomenclatura_para_calles" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">guía OSM</a>.</p>
          {/* Removed <hr className="my-2" /> */}
        </div>

        {/* Department and City */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div>
            <label htmlFor="departamento" className="block text-sm font-medium text-gray-700 mb-1">Departamento*</label>
            <select
              id="departamento"
              name="departamento"
              value={formData.departamento}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border ${getBorderClass('departamento')} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white`}
            >
              <option value="">Selecciona...</option>
              {departments.map(dep => <option key={dep} value={dep}>{dep}</option>)}
            </select>
             {errors.departamento && <p className="text-red-500 text-xs mt-1">{errors.departamento}</p>}
          </div>
           <div>
            <label htmlFor="ciudad" className="block text-sm font-medium text-gray-700 mb-1">Ciudad*</label>
            <select
              id="ciudad"
              name="ciudad"
              value={formData.ciudad}
              onChange={handleInputChange}
              disabled={!formData.departamento || availableCities.length === 0}
              className={`w-full px-3 py-2 border ${getBorderClass('ciudad')} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white disabled:bg-gray-100`}
            >
              <option value="">Selecciona...</option>
              {availableCities.map(city => <option key={city} value={city}>{city}</option>)}
            </select>
             {errors.ciudad && <p className="text-red-500 text-xs mt-1">{errors.ciudad}</p>}
          </div>
        </div>

        {/* Address Line 1 (Tipo Via, Num, Letra, Bis, LetraBis, Sufijo) */}
        {/* Adjusted grid layout for Bis checkbox */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 items-end">
          <div className="md:col-span-2">
            <label htmlFor="tipoVia" className="block text-sm font-medium text-gray-700 mb-1">Tipo Vía*</label>
            <select
              id="tipoVia"
              name="tipoVia"
              value={formData.tipoVia}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border ${getBorderClass('tipoVia')} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white`}
            >
              <option value="">Selecciona...</option>
              {viaTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
            {errors.tipoVia && <p className="text-red-500 text-xs mt-1">{errors.tipoVia}</p>}
          </div>
          <div>
            <label htmlFor="numViaP1" className="block text-sm font-medium text-gray-700 mb-1">Número*</label>
            <input
              type="text"
              id="numViaP1"
              name="numViaP1"
              value={formData.numViaP1}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border ${getBorderClass('numViaP1')} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
            />
             {errors.numViaP1 && <p className="text-red-500 text-xs mt-1">{errors.numViaP1}</p>}
          </div>
          <div>
            <label htmlFor="letraVia" className="block text-sm font-medium text-gray-700 mb-1">Letra</label>
             <select
              id="letraVia"
              name="letraVia"
              value={formData.letraVia}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border ${getBorderClass('letraVia')} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white`}
            >
              <option value="">Selecciona...</option>
              {letters.map(letter => <option key={letter} value={letter}>{letter}</option>)}
            </select>
          </div>
          {/* Bis Checkbox and Letter - occupies 2 cols potentially */}
          <div className="flex flex-col justify-end">
             <div className="flex items-center h-[38px]"> {/* Align with input height */} 
               <input
                type="checkbox"
                id="bis"
                name="bis"
                checked={formData.bis}
                onChange={handleInputChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-2"
              />
              <label htmlFor="bis" className="text-sm font-medium text-gray-700">Bis</label>
            </div>
            <div className="h-[1.125rem]"></div> {/* Placeholder for potential error message height */} 
          </div>
          <div>
            <label htmlFor="letraBis" className="block text-sm font-medium text-gray-700 mb-1">Letra (Bis)</label>
             <select
              id="letraBis"
              name="letraBis"
              value={formData.letraBis}
              onChange={handleInputChange}
              disabled={!formData.bis} // Disable if Bis is not checked
              className={`w-full px-3 py-2 border ${getBorderClass('letraBis')} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white disabled:bg-gray-100`}
            >
              <option value="">Selecciona...</option>
              {letters.map(letter => <option key={letter} value={letter}>{letter}</option>)}
            </select>
          </div>

        </div>

        {/* Address Line 1 Continue (Sufijo Cardinal 1) */}
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
                <label htmlFor="sufijoCardinal1" className="block text-sm font-medium text-gray-700 mb-1">Sufijo Cardinal</label>
                <select
                  id="sufijoCardinal1"
                  name="sufijoCardinal1"
                  value={formData.sufijoCardinal1}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border ${getBorderClass('sufijoCardinal1')} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white`}
                >
                  <option value="">Selecciona...</option>
                  {quadrants.map(quad => <option key={quad} value={quad}>{quad}</option>)}
                </select>
            </div>
            {/* Placeholder divs to maintain grid structure if needed */}
            <div className="hidden md:block"></div>
            <div className="hidden md:block"></div>
            <div className="hidden md:block"></div>
        </div>

        {/* Address Line 2 (# Num, Letra, Sufijo Cardinal 2, - NumPlaca ) */}
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
           <div className="relative pt-5"> {/* pt-5 to align label nicely with # */}
            <span className="absolute left-0 bottom-2.5 text-gray-500 text-lg font-semibold px-1">#</span>
            <label htmlFor="numVia2" className="block text-sm font-medium text-gray-700 mb-1 pl-4">Número*</label>
            <input
              type="text"
              id="numVia2"
              name="numVia2"
              value={formData.numVia2}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border ${getBorderClass('numVia2')} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 pl-6`}
            />
             {errors.numVia2 && <p className="text-red-500 text-xs mt-1 pl-4">{errors.numVia2}</p>}
          </div>
          <div>
             <label htmlFor="letraVia2" className="block text-sm font-medium text-gray-700 mb-1">Letra</label>
             <select
              id="letraVia2"
              name="letraVia2"
              value={formData.letraVia2}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border ${getBorderClass('letraVia2')} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white`}
            >
              <option value="">Selecciona...</option>
              {letters.map(letter => <option key={letter} value={letter}>{letter}</option>)}
            </select>
          </div>
          <div>
             <label htmlFor="sufijoCardinal2" className="block text-sm font-medium text-gray-700 mb-1">Sufijo Cardinal</label>
             <select
              id="sufijoCardinal2"
              name="sufijoCardinal2"
              value={formData.sufijoCardinal2}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border ${getBorderClass('sufijoCardinal2')} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white`}
            >
              <option value="">Selecciona...</option>
              {quadrants.map(quad => <option key={quad} value={quad}>{quad}</option>)}
            </select>
          </div>
           <div className="relative pt-5"> {/* pt-5 to align label nicely with - */}
             <span className="absolute left-0 bottom-2.5 text-gray-500 text-lg font-semibold px-1">-</span>
            <label htmlFor="num3" className="block text-sm font-medium text-gray-700 mb-1 pl-4">Número (Placa)*</label>
            <input
              type="text"
              id="num3"
              name="num3"
              value={formData.num3}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border ${getBorderClass('num3')} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 pl-6`}
            />
             {errors.num3 && <p className="text-red-500 text-xs mt-1 pl-4">{errors.num3}</p>}
          </div>
        </div>

        {/* Address Line 3 (Complemento Details) */}
        <div>
           <label htmlFor="complemento" className="block text-sm font-medium text-gray-700 mb-1">Complemento Adicional</label>
            <input
              type="text"
              id="complemento"
              name="complemento"
              value={formData.complemento}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border ${getBorderClass('complemento')} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
              placeholder="Ej: Apto 501, Torre 2, Interior 3, Casa, Finca, Vereda X"
            />
        </div>

         {/* Address Preview - Refined */}
        {addressPreview && (
           <div className="mt-4 p-4 bg-indigo-50 rounded border border-indigo-200"> {/* Changed bg, border, padding */}
              <p className="text-sm font-medium text-gray-600">Vista Previa Dirección:</p>
              <p className="text-sm text-gray-800 font-mono">{addressPreview}</p> {/* Added font-mono for address */}
           </div>
        )}


        {/* Pickup Schedule */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative z-10"> {/* Add z-index for DatePicker overlay */}
            <label htmlFor="fechaHoraPreferida" className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora Preferida{formData.tipoRecogida === 'programada' ? '*' : ''}</label>
            <DatePicker
              selected={formData.fechaHoraPreferida}
              onChange={handleDateChange}
              showTimeSelect
              filterTime={filterPassedTime} // Use filterTime for more dynamic time filtering
              minDate={new Date()} // Prevent selecting past dates
              locale="es" // Use Spanish locale
              dateFormat="dd/MM/yyyy HH:mm" // Format for display
              placeholderText="Selecciona fecha y hora..."
              disabled={formData.tipoRecogida === 'inmediata'}
              className={`w-full px-3 py-2 border ${getBorderClass('fechaHoraPreferida')} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed`}
              wrapperClassName="w-full" // Ensure wrapper takes full width
              autoComplete="off"
            />
             {errors.fechaHoraPreferida && <p className="text-red-500 text-xs mt-1">{errors.fechaHoraPreferida}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de Recogida*</label>
            <div className="flex items-center space-x-6">
               <label className="flex items-center">
                <input
                  type="radio"
                  name="tipoRecogida"
                  value="programada"
                  checked={formData.tipoRecogida === 'programada'}
                  onChange={handleRadioChange}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Programada</span>
              </label>
               <label className="flex items-center">
                <input
                  type="radio"
                  name="tipoRecogida"
                  value="inmediata"
                  checked={formData.tipoRecogida === 'inmediata'}
                  onChange={handleRadioChange}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                />
                 <span className="ml-2 text-sm text-gray-700">Inmediata (Próximo Conductor)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Enviar Solicitud
          </button>
        </div>

      </form>
    </div>
  );
};

export default PickupForm; 