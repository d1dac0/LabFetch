import React, { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import DatePicker, { registerLocale } from "react-datepicker";
import { es } from 'date-fns/locale/es';
import "react-datepicker/dist/react-datepicker.css";
import { FaInfoCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';

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
  fechaPreferida: Date | null;
  turnoPreferido: 'mañana' | 'tarde' | null;
}

interface FormErrors {
  nombreMascota?: string;
  tipoMuestra?: string;
  departamento?: string;
  ciudad?: string;
  direccion?: string;
  fechaPreferida?: string;
  turnoPreferido?: string;
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
}

const PickupForm: React.FC = () => {
  const initialNonAddressState = {
    nombreMascota: '',
    tipoMuestra: '',
    fechaPreferida: null,
    turnoPreferido: null,
  };

  const initialFormData: FormData = {
    ...initialNonAddressState,
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
  };

  const [formData, setFormData] = useState<FormData>(initialFormData);

  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [scheduleMessage, setScheduleMessage] = useState<string | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchScheduleMessage = async () => {
      setScheduleLoading(true);
      try {
        const response = await fetch('/api/settings/pickup_schedule_message');
        if (response.ok) {
          const data = await response.json();
          setScheduleMessage(data.value);
        } else {
          console.warn('Could not load schedule message setting.');
          setScheduleMessage(null);
        }
      } catch (err) {
        console.error('Error fetching schedule message:', err);
        setScheduleMessage(null);
      } finally {
        setScheduleLoading(false);
      }
    };
    fetchScheduleMessage();
  }, []);

  useEffect(() => {
    setAvailableCities(citiesByDepartment[formData.departamento] || []);
    if (!citiesByDepartment[formData.departamento]?.includes(formData.ciudad)) {
      setFormData(prev => ({ ...prev, ciudad: '' }));
      if(errors.ciudad) setErrors(prev => ({ ...prev, ciudad: undefined }));
    }
  }, [formData.departamento]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, type } = e.target;
    let value = e.target.value;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    switch (name) {
        case 'numViaP1':
        case 'numVia2':
        case 'num3':
            value = value.replace(/[^0-9]/g, '');
            break;
        case 'letraVia':
        case 'letraBis':
        case 'letraVia2':
            value = value.replace(/[^A-Za-z]/g, '');
            break;
        default:
            break;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
                ? checked 
                : (name === 'turnoPreferido' ? value as 'mañana' | 'tarde' : value)
    }));

    if (errors[name as keyof FormErrors]) {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[name as keyof FormErrors];
            if ([ 'tipoVia', 'numViaP1', 'letraVia', 'bis', 'letraBis', 'sufijoCardinal1', 'numVia2', 'letraVia2', 'sufijoCardinal2', 'num3', 'complemento'].includes(name)) {
                delete newErrors.direccion;
            }
            return newErrors;
        });
    }
  };

  const handleDateChange = (date: Date | null) => {
    setFormData(prev => ({
       ...prev,
       fechaPreferida: date,
       turnoPreferido: date ? prev.turnoPreferido : null 
      }));
    if (errors.fechaPreferida || errors.turnoPreferido) {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.fechaPreferida;
            delete newErrors.turnoPreferido;
            return newErrors;
        });
    }
  };

  const handleTurnoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      setFormData(prev => ({ ...prev, turnoPreferido: value as 'mañana' | 'tarde' }));
      if (errors.turnoPreferido) {
          setErrors(prev => {
              const newErrors = { ...prev };
              delete newErrors.turnoPreferido;
              return newErrors;
          });
      }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      toast.error('Por favor corrige los errores en el formulario.');
      return;
    }

    setLoading(true);

    // Format the date to YYYY-MM-DD string if it exists
    const formattedDate = formData.fechaPreferida
      ? formData.fechaPreferida.toISOString().slice(0, 10)
      : null;

    const pickupData = {
      nombreMascota: formData.nombreMascota,
      tipoMuestra: formData.tipoMuestra,
      departamento: formData.departamento,
      ciudad: formData.ciudad,
      tipoVia: formData.tipoVia,
      numViaP1: formData.numViaP1,
      letraVia: formData.letraVia || null,
      bis: formData.bis,
      letraBis: formData.letraBis || null,
      sufijoCardinal1: formData.sufijoCardinal1 || null,
      numVia2: formData.numVia2,
      letraVia2: formData.letraVia2 || null,
      sufijoCardinal2: formData.sufijoCardinal2 || null,
      num3: formData.num3,
      complemento: formData.complemento || null,
      fechaPreferida: formattedDate, // Use the formatted date string
      turnoPreferido: formData.turnoPreferido,
    };

    try {
      await axios.post('/api/pickups', pickupData);
      toast.success('¡Solicitud de recogida enviada exitosamente!');
      setFormData(prev => ({
        ...prev,
        ...initialNonAddressState,
      }));
      setErrors({});

    } catch (err) {
      console.error('Error submitting pickup request:', err);
      if (axios.isAxiosError(err)) {
          const axiosError = err as AxiosError<{ message?: string; errors?: FormErrors }>;
          const backendMsg = axiosError.response?.data?.message || 'Ocurrió un error al enviar la solicitud.';
          const validationErrs = axiosError.response?.data?.errors;

          toast.error(backendMsg);

          if (validationErrs && typeof validationErrs === 'object') {
              setErrors(validationErrs);
          }
      } else {
          const message = (err instanceof Error) ? err.message : 'Ocurrió un error desconocido.';
          toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };
  
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
    if (formData.numVia2 || formData.letraVia2 || formData.sufijoCardinal2 || formData.num3) {
        preview += `# `;
    }
    if (formData.numVia2) preview += `${formData.numVia2} `;
    if (formData.letraVia2) preview += `${formData.letraVia2} `;
    if (formData.sufijoCardinal2) preview += `${formData.sufijoCardinal2} `;
    if (formData.num3) preview += `- ${formData.num3} `;

    if (formData.complemento) preview += ` (${formData.complemento.trim()}) `;

    if (formData.ciudad) preview += `${formData.ciudad}, `;
    if (formData.departamento) preview += `${formData.departamento}`;

    return preview.trim().replace(/ +/g, ' ');
  };

  const addressPreview = generateAddressPreview();

  const getBorderClass = (fieldName: keyof FormErrors) => {
      return errors[fieldName] ? 'border-red-500' : 'border-gray-300';
  };

  const isWeekday = (date: Date) => {
    const day = date.getDay();
    return day !== 0; // 0 = Sunday
  };

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!formData.nombreMascota.trim()) newErrors.nombreMascota = 'Nombre del solicitante requerido.';
    if (!formData.tipoMuestra.trim()) newErrors.tipoMuestra = 'Número de contacto requerido.';
    if (!formData.departamento) newErrors.departamento = 'El departamento es obligatorio.';
    if (!formData.ciudad) newErrors.ciudad = 'La ciudad es obligatoria.';
    if (!formData.tipoVia) newErrors.tipoVia = 'El tipo de vía es obligatorio.';
    if (!formData.numViaP1.trim()) newErrors.numViaP1 = 'El número de vía principal es obligatorio.';
    if (!formData.numVia2.trim()) newErrors.numVia2 = 'El número de vía generadora es obligatorio.';
    if (!formData.num3.trim()) newErrors.num3 = 'El número de placa es obligatorio.';

    if (formData.fechaPreferida) {
        const selectedDate = formData.fechaPreferida;
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        if (selectedDate < now) {
             newErrors.fechaPreferida = 'La fecha no puede ser pasada.';
        }
        if (!formData.turnoPreferido) {
            newErrors.turnoPreferido = 'Debes seleccionar un turno (Mañana o Tarde).';
        }
    } else if (formData.turnoPreferido) {
        newErrors.fechaPreferida = 'Debes seleccionar una fecha para elegir un turno.';
    }

    return newErrors;
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold mb-6 text-gray-700">Solicitar recolección de muestra</h2>
      
      {!scheduleLoading && scheduleMessage && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md flex items-start space-x-3">
          <FaInfoCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-blue-700">
            {scheduleMessage}
          </p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="nombreMascota" className="block text-sm font-medium text-gray-700 mb-1">Nombre del solicitante (CV, Medico etc.)*</label>
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
            <label htmlFor="tipoMuestra" className="block text-sm font-medium text-gray-700 mb-1">Numero de contacto/emergencia de quien entrega*</label>
            <input
              type="text"
              id="tipoMuestra"
              name="tipoMuestra"
              value={formData.tipoMuestra}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border ${getBorderClass('tipoMuestra')} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
              
            />
             {errors.tipoMuestra && <p className="text-red-500 text-xs mt-1">{errors.tipoMuestra}</p>}
          </div>
        </div>

        <div className="pb-2 border-b border-gray-200">
          <label className="text-lg font-semibold text-gray-800">Dirección de Recogida</label>          
        </div>

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
             <input
              type="text"
              id="letraVia"
              name="letraVia"
              value={formData.letraVia}
              onChange={handleInputChange}
              maxLength={2}
              pattern="[A-Za-z]*"
              className={`w-full px-3 py-2 border ${getBorderClass('letraVia')} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white`}
            />
          </div>
          <div className="flex flex-col justify-end">
             <div className="flex items-center h-[38px]">
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
            <div className="h-[1.125rem]"></div>
          </div>
          <div>
            <label htmlFor="letraBis" className="block text-sm font-medium text-gray-700 mb-1">Letra (Bis)</label>
             <input
              type="text"
              id="letraBis"
              name="letraBis"
              value={formData.letraBis}
              onChange={handleInputChange}
              maxLength={2}
              pattern="[A-Za-z]*"
              disabled={!formData.bis}
              className={`w-full px-3 py-2 border ${getBorderClass('letraBis')} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white disabled:bg-gray-100`}
            />
          </div>

        </div>

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
            <div className="hidden md:block"></div>
            <div className="hidden md:block"></div>
            <div className="hidden md:block"></div>
        </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
           <div className="relative pt-5">
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
             <input
              type="text"
              id="letraVia2"
              name="letraVia2"
              value={formData.letraVia2}
              onChange={handleInputChange}
              maxLength={2}
              pattern="[A-Za-z]*"
              className={`w-full px-3 py-2 border ${getBorderClass('letraVia2')} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white`}
            />
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
           <div className="relative pt-5">
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

        <div>
           <label htmlFor="complemento" className="block text-sm font-medium text-gray-700 mb-1">Datos adicionales (Ej: Apto, Interior, Torre, Casa, Unidad, Casa, otros)</label>
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

         {addressPreview && (
           <div className="mt-4 p-4 bg-indigo-50 rounded border border-indigo-200">
              <p className="text-sm font-medium text-gray-600">Vista Previa Dirección:</p>
              <p className="text-sm text-gray-800 font-mono">{addressPreview}</p>
           </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
           <div className="relative z-10">
             <label htmlFor="fechaPreferida" className="block text-sm font-medium text-gray-700 mb-1">Fecha Preferida</label>
             <DatePicker
               selected={formData.fechaPreferida}
               onChange={handleDateChange}
               minDate={new Date()}
               locale="es"
               dateFormat="dd/MM/yyyy"
               placeholderText="Opcional: Selecciona fecha..."
               className={`w-full px-3 py-2 border ${getBorderClass('fechaPreferida')} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed`}
               wrapperClassName="w-full"
               autoComplete="off"
               filterDate={isWeekday}
             />
              {errors.fechaPreferida && <p className="text-red-500 text-xs mt-1">{errors.fechaPreferida}</p>}
           </div>

           <div>
             <label className={`block text-sm font-medium mb-1 ${!formData.fechaPreferida ? 'text-gray-400' : 'text-gray-700'}`}>
                 Turno Preferido {formData.fechaPreferida ? '*' : ''}
             </label>
             <div className={`flex items-center space-x-6 mt-2 ${!formData.fechaPreferida ? 'opacity-50' : ''}`}>
                <label className="flex items-center">
                 <input
                   type="radio"
                   name="turnoPreferido"
                   value="mañana"
                   checked={formData.turnoPreferido === 'mañana'}
                   onChange={handleTurnoChange}
                   disabled={!formData.fechaPreferida}
                   className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 disabled:cursor-not-allowed"
                 />
                 <span className={`ml-2 text-sm ${!formData.fechaPreferida ? 'text-gray-400' : 'text-gray-700'}`}>Mañana (9 AM - 12 PM aprox.)</span>
               </label>
                <label className="flex items-center">
                 <input
                   type="radio"
                   name="turnoPreferido"
                   value="tarde"
                   checked={formData.turnoPreferido === 'tarde'}
                   onChange={handleTurnoChange}
                   disabled={!formData.fechaPreferida}
                   className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 disabled:cursor-not-allowed"
                 />
                  <span className={`ml-2 text-sm ${!formData.fechaPreferida ? 'text-gray-400' : 'text-gray-700'}`}>Tarde (1 PM - 5 PM aprox.)</span>
               </label>
             </div>
              {errors.turnoPreferido && <p className="text-red-500 text-xs mt-1">{errors.turnoPreferido}</p>}
           </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Enviando...' : 'Enviar Solicitud'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default PickupForm; 