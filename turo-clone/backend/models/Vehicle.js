import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
    // Información del propietario
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El propietario es requerido']
    },
    
    // Información básica del vehículo
    make: {
        type: String,
        required: [true, 'La marca es requerida'],
        trim: true,
        maxlength: [50, 'La marca no puede exceder 50 caracteres']
    },
    model: {
        type: String,
        required: [true, 'El modelo es requerido'],
        trim: true,
        maxlength: [50, 'El modelo no puede exceder 50 caracteres']
    },
    year: {
        type: Number,
        required: [true, 'El año es requerido'],
        min: [1950, 'El año debe ser mayor a 1950'],
        max: [new Date().getFullYear() + 1, 'El año no puede ser futuro']
    },
    color: {
        type: String,
        required: [true, 'El color es requerido'],
        trim: true,
        maxlength: [30, 'El color no puede exceder 30 caracteres']
    },
    
    // Características del vehículo
    category: {
        type: String,
        required: [true, 'La categoría es requerida'],
        enum: ['Economy', 'Compact', 'Midsize', 'Fullsize', 'SUV', 'Pickup', 'Luxury', 'Sports'],
        default: 'Economy'
    },
    transmission: {
        type: String,
        required: [true, 'El tipo de transmisión es requerido'],
        enum: ['Manual', 'Automatic'],
        default: 'Automatic'
    },
    fuelType: {
        type: String,
        required: [true, 'El tipo de combustible es requerido'],
        enum: ['Gasoline', 'Diesel', 'Electric', 'Hybrid'],
        default: 'Gasoline'
    },
    seats: {
        type: Number,
        required: [true, 'El número de asientos es requerido'],
        min: [2, 'Debe tener al menos 2 asientos'],
        max: [8, 'No puede tener más de 8 asientos']
    },
    
    // Información de identificación
    licensePlate: {
        type: String,
        required: [true, 'La placa es requerida'],
        unique: true,
        trim: true,
        uppercase: true,
        maxlength: [10, 'La placa no puede exceder 10 caracteres']
    },
    vin: {
        type: String,
        trim: true,
        maxlength: [17, 'El VIN no puede exceder 17 caracteres']
    },
    
    // Información de precios
    pricePerDay: {
        type: Number,
        required: [true, 'El precio por día es requerido'],
        min: [1, 'El precio debe ser mayor a 0']
    },
    pricePerWeek: {
        type: Number,
        min: [1, 'El precio por semana debe ser mayor a 0']
    },
    pricePerMonth: {
        type: Number,
        min: [1, 'El precio por mes debe ser mayor a 0']
    },
    
    // Ubicación
    location: {
        address: {
            type: String,
            required: [true, 'La dirección es requerida'],
            trim: true
        },
        city: {
            type: String,
            required: [true, 'La ciudad es requerida'],
            trim: true
        },
        state: {
            type: String,
            required: [true, 'El estado es requerido'],
            trim: true
        },
        zipCode: {
            type: String,
            required: [true, 'El código postal es requerido'],
            trim: true
        },
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    },
    
    // Imágenes
    images: [{
        url: {
            type: String,
            required: true
        },
        isPrimary: {
            type: Boolean,
            default: false
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Características adicionales
    features: [{
        type: String,
        enum: [
            'Air Conditioning', 'GPS Navigation', 'Bluetooth', 'USB Ports',
            'Backup Camera', 'Sunroof', 'Leather Seats', 'Heated Seats',
            'WiFi Hotspot', 'Premium Audio', 'Keyless Entry', 'Cruise Control'
        ]
    }],
    
    // Descripción
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'La descripción no puede exceder 1000 caracteres']
    },
    
    // Estado y disponibilidad
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'suspended'],
        default: 'pending'
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    
    // Estadísticas
    stats: {
        totalReservations: {
            type: Number,
            default: 0
        },
        totalEarnings: {
            type: Number,
            default: 0
        },
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        reviewCount: {
            type: Number,
            default: 0
        }
    },
    
    // Información del seguro
    insurance: {
        provider: String,
        policyNumber: String,
        expirationDate: Date
    },
    
    // Mantenimiento
    lastMaintenanceDate: Date,
    nextMaintenanceDate: Date,
    mileage: {
        type: Number,
        min: [0, 'El kilometraje no puede ser negativo']
    }
    
}, {
    timestamps: true,
    toJSON: { virtuals: true }
});

// Virtual para la imagen principal
vehicleSchema.virtual('primaryImage').get(function() {
    if (!Array.isArray(this.images) || this.images.length === 0) return null;
    const primary = this.images.find(img => img.isPrimary);
    return primary ? primary.url : this.images[0].url;
});

// Virtual para el nombre completo del vehículo
vehicleSchema.virtual('fullName').get(function() {
    return `${this.make} ${this.model} (${this.year})`;
});

// Índice para búsquedas por ubicación
vehicleSchema.index({ 
    'location.city': 1, 
    'location.state': 1,
    isAvailable: 1,
    isVerified: 1
});

// Índice para búsquedas por propietario
vehicleSchema.index({ owner: 1 });

// Índice para búsquedas por categoría y precio
vehicleSchema.index({ 
    category: 1, 
    pricePerDay: 1,
    isAvailable: 1,
    isVerified: 1
});

export default mongoose.model('Vehicle', vehicleSchema);
