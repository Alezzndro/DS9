import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
    // Información básica
    firstName: {
        type: String,
        required: [true, 'El nombre es requerido'],
        trim: true,
        maxlength: [50, 'El nombre no puede exceder 50 caracteres']
    },
    lastName: {
        type: String,
        required: [true, 'El apellido es requerido'],
        trim: true,
        maxlength: [50, 'El apellido no puede exceder 50 caracteres']
    },
    email: {
        type: String,
        required: [true, 'El email es requerido'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
    },
    password: {
        type: String,
        required: [true, 'La contraseña es requerida'],
        minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
        select: false // No incluir en consultas por defecto
    },
    
    // Información de contacto
    phone: {
        type: String,
        trim: true,
        match: [/^[\+]?[1-9][\d]{0,15}$/, 'Número de teléfono inválido']
    },
    
    // Información de perfil
    dateOfBirth: {
        type: Date,
        validate: {
            validator: function(date) {
                // Debe ser mayor de 18 años
                const today = new Date();
                const birth = new Date(date);
                const age = today.getFullYear() - birth.getFullYear();
                return age >= 18;
            },
            message: 'Debes ser mayor de 18 años'
        }
    },
    
    // Ubicación
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: {
            type: String,
            default: 'México'
        }
    },
    
    // Configuraciones de cuenta
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    
    // Tokens para recuperación de contraseña
    passwordResetToken: String,
    passwordResetExpires: Date,
    
    // Estado de verificación de documentos
    verificationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    
    // Información de verificación
    documents: {
        idDocument: {
            url: String,
            verified: { type: Boolean, default: false },
            uploadedAt: Date
        },
        driverLicense: {
            url: String,
            verified: { type: Boolean, default: false },
            uploadedAt: Date,
            expirationDate: Date
        }
    },
    
    // Información de pago (por seguridad, solo referencias)
    paymentMethods: [{
        type: {
            type: String,
            enum: ['credit_card', 'debit_card', 'paypal']
        },
        last4: String, // Últimos 4 dígitos
        brand: String, // Visa, Mastercard, etc.
        isDefault: { type: Boolean, default: false },
        addedAt: { type: Date, default: Date.now }
    }],
    
    // Configuraciones de notificaciones
    notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: true }
    },
    
    // Información de actividad
    lastLogin: Date,
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
    
    // Estadísticas
    stats: {
        totalReservations: { type: Number, default: 0 },
        totalSpent: { type: Number, default: 0 },
        rating: { type: Number, default: 0 },
        reviewCount: { type: Number, default: 0 }
    }
}, {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
    toJSON: { 
        virtuals: true,
        transform: function(doc, ret) {
            delete ret.password;
            delete ret.passwordResetToken;
            delete ret.passwordResetExpires;
            delete ret.emailVerificationToken;
            delete ret.emailVerificationExpires;
            return ret;
        }
    },
    toJSON: {
        virtuals: true,
    }    
});

// Virtual para nombre completo
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual para verificar si la cuenta está bloqueada
userSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Middleware para hashear la contraseña antes de guardar
userSchema.pre('save', async function(next) {
    // Solo hashear la contraseña si ha sido modificada (o es nueva)
    if (!this.isModified('password')) return next();
    
    try {
        // Hashear la contraseña con salt rounds de 12
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Método para incrementar intentos de login fallidos
userSchema.methods.incLoginAttempts = function() {
    // Si tenemos un lock previo y ha expirado, reiniciar los intentos
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $unset: { lockUntil: 1 },
            $set: { loginAttempts: 1 }
        });
    }
    
    const updates = { $inc: { loginAttempts: 1 } };
    
    // Después de 5 intentos, bloquear por 2 horas
    if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
        updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 horas
    }
    
    return this.updateOne(updates);
};

// Método para resetear intentos de login después de login exitoso
userSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $unset: { loginAttempts: 1, lockUntil: 1 }
    });
};

export default mongoose.model('User', userSchema);
