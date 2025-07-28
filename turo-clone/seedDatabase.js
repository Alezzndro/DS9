import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

// Definir schemas
const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
    password: String,
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    verificationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false }
}, { timestamps: true });

const vehicleSchema = new mongoose.Schema({
    make: String,
    model: String,
    year: Number,
    type: String,
    licensePlate: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'suspended'], default: 'pending' },
    pricePerDay: Number,
    location: {
        address: String,
        city: String,
        country: String
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    images: [String],
    features: [String],
    rating: { type: Number, default: 0 },
    stats: {
        totalBookings: { type: Number, default: 0 },
        totalEarnings: { type: Number, default: 0 }
    }
}, { timestamps: true });

const reservationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
    startDate: Date,
    endDate: Date,
    totalAmount: Number,
    status: { type: String, enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled'], default: 'pending' },
    pickupLocation: String,
    returnLocation: String
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Vehicle = mongoose.model('Vehicle', vehicleSchema);
const Reservation = mongoose.model('Reservation', reservationSchema);

async function seedDatabase() {
    try {
        await mongoose.connect('mongodb://localhost:27017/turo-clone');
        console.log('✅ Conectado a la base de datos');

        // Verificar si ya hay datos
        const userCount = await User.countDocuments();
        if (userCount > 10) {
            console.log('✅ La base de datos ya tiene datos suficientes');
            await mongoose.disconnect();
            return;
        }

        console.log('🌱 Creando datos de ejemplo...');

        // Crear usuarios de ejemplo
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        const users = [];
        for (let i = 1; i <= 50; i++) {
            users.push({
                firstName: `Usuario${i}`,
                lastName: `Apellido${i}`,
                email: `usuario${i}@example.com`,
                password: hashedPassword,
                role: 'user',
                verificationStatus: i <= 40 ? 'approved' : 'pending',
                emailVerified: i <= 35,
                phoneVerified: i <= 25
            });
        }

        const createdUsers = await User.insertMany(users);
        console.log(`✅ Creados ${createdUsers.length} usuarios`);

        // Crear vehículos de ejemplo
        const vehicles = [];
        const makes = ['Toyota', 'BMW', 'Mercedes', 'Audi', 'Volkswagen', 'Ford', 'Chevrolet'];
        const models = ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible'];
        
        for (let i = 1; i <= 30; i++) {
            const randomUser = createdUsers[Math.floor(Math.random() * 40)]; // Solo usuarios aprobados
            vehicles.push({
                make: makes[Math.floor(Math.random() * makes.length)],
                model: models[Math.floor(Math.random() * models.length)],
                year: 2018 + Math.floor(Math.random() * 6),
                type: models[Math.floor(Math.random() * models.length)],
                licensePlate: `ABC${1000 + i}`,
                status: i <= 25 ? 'approved' : 'pending',
                pricePerDay: 35 + Math.floor(Math.random() * 65),
                location: {
                    address: `Calle ${i} #123`,
                    city: 'Madrid',
                    country: 'España'
                },
                owner: randomUser._id,
                images: [`https://via.placeholder.com/400x300?text=Vehicle+${i}`],
                features: ['GPS', 'Aire Acondicionado', 'Bluetooth'],
                rating: 3.5 + Math.random() * 1.5,
                stats: {
                    totalBookings: Math.floor(Math.random() * 20),
                    totalEarnings: Math.floor(Math.random() * 5000)
                }
            });
        }

        const createdVehicles = await Vehicle.insertMany(vehicles);
        console.log(`✅ Creados ${createdVehicles.length} vehículos`);

        // Crear reservaciones de ejemplo
        const reservations = [];
        for (let i = 1; i <= 15; i++) {
            const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
            const randomVehicle = createdVehicles[Math.floor(Math.random() * 25)]; // Solo vehículos aprobados
            
            const startDate = new Date();
            startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30));
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 1 + Math.floor(Math.random() * 7));
            
            reservations.push({
                user: randomUser._id,
                vehicle: randomVehicle._id,
                startDate,
                endDate,
                totalAmount: 200 + Math.floor(Math.random() * 800),
                status: ['confirmed', 'active', 'completed'][Math.floor(Math.random() * 3)],
                pickupLocation: 'Madrid Centro',
                returnLocation: 'Madrid Centro'
            });
        }

        const createdReservations = await Reservation.insertMany(reservations);
        console.log(`✅ Creadas ${createdReservations.length} reservaciones`);

        console.log('🎉 Base de datos poblada exitosamente!');
        console.log(`📊 Estadísticas finales:`);
        console.log(`   - Usuarios totales: ${await User.countDocuments()}`);
        console.log(`   - Vehículos totales: ${await Vehicle.countDocuments()}`);
        console.log(`   - Reservaciones totales: ${await Reservation.countDocuments()}`);

    } catch (error) {
        console.error('❌ Error poblando la base de datos:', error);
    } finally {
        await mongoose.disconnect();
        console.log('📴 Desconectado de la base de datos');
        process.exit(0);
    }
}

seedDatabase();
