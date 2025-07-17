// Configuración de la API
export const API_BASE_URL = 'http://localhost:5000/api';

// Roles de usuario
export const USER_ROLES = {
    USER: 'user',
    ADMIN: 'admin'
};

// Estados de verificación
export const VERIFICATION_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
};

// Estados de reservación
export const RESERVATION_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    ACTIVE: 'active',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
};

// Tipos de documentos
export const DOCUMENT_TYPES = {
    ID: 'id',
    DRIVER_LICENSE: 'driver_license'
};

// Métodos de pago
export const PAYMENT_METHODS = {
    CREDIT_CARD: 'credit_card',
    DEBIT_CARD: 'debit_card',
    PAYPAL: 'paypal'
};

// Tipos de transmisión
export const TRANSMISSION_TYPES = [
    'manual',
    'automatic'
];

// Tipos de combustible
export const FUEL_TYPES = [
    'gasoline',
    'diesel',
    'hybrid',
    'electric'
];

// Ubicaciones disponibles
export const LOCATIONS = [
    'Madrid',
    'Barcelona',
    'Valencia',
    'Sevilla',
    'Bilbao',
    'Málaga',
    'Zaragoza',
    'Murcia',
    'Palma',
    'Las Palmas'
];

// Marcas de vehículos
export const VEHICLE_MAKES = [
    'Toyota',
    'Honda',
    'Ford',
    'Volkswagen',
    'BMW',
    'Mercedes',
    'Audi',
    'Nissan',
    'Hyundai',
    'Kia',
    'Renault',
    'Peugeot',
    'Citroën',
    'Seat',
    'Fiat',
    'Opel',
    'Volvo',
    'Mazda',
    'Tesla',
    'Lexus'
];

// Precios por día
export const PRICE_RANGE = {
    min: 10,
    max: 200,
    step: 5
};

// Número de pasajeros
export const PASSENGER_OPTIONS = [2, 4, 5, 7];