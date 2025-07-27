import mongoose from 'mongoose';
const { Schema } = mongoose;

const reservationSchema = new Schema({
    guest: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    host: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled'],
        default: 'pending'
    },
    pickupLocation: {
        type: String,
        required: true
    },
    returnLocation: {
        type: String,
        required: true
    },
    pickupCode: {
        type: String,
        default: () => Math.random().toString(36).substring(2, 8).toUpperCase()
    },
    returnCode: {
        type: String,
        default: () => Math.random().toString(36).substring(2, 8).toUpperCase()
    },
    notes: {
        type: String,
        default: ''
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware para actualizar updatedAt
reservationSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Índices
reservationSchema.index({ guest: 1, status: 1 });
reservationSchema.index({ host: 1, status: 1 });
reservationSchema.index({ vehicle: 1, startDate: 1, endDate: 1 });
reservationSchema.index({ status: 1 });

// Validación personalizada para fechas
reservationSchema.pre('save', function(next) {
    if (this.startDate >= this.endDate) {
        next(new Error('La fecha de inicio debe ser anterior a la fecha de fin'));
    }
    if (this.startDate < new Date()) {
        next(new Error('La fecha de inicio no puede ser en el pasado'));
    }
    next();
});

export default mongoose.model('Reservation', reservationSchema);
