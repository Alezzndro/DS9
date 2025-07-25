import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/turo-clone';
        
        console.log('🔄 Intentando conectar a MongoDB...');
        console.log('📍 URI:', mongoURI);
        
        await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 10000, // 10 segundos timeout
            bufferCommands: false,
        });
        
        console.log('✅ Conectado a MongoDB exitosamente');
        console.log('📊 Base de datos: turo-clone');
        
        // Crear índices necesarios
        await createIndexes();
        
    } catch (error) {
        console.error('❌ Error conectando a MongoDB:', error.message);
        console.error('\n🔧 Para solucionar este problema:');
        console.error('1. 📥 Descarga e instala MongoDB Compass: https://www.mongodb.com/try/download/compass');
        console.error('2. 🚀 Abre MongoDB Compass y conecta a: mongodb://localhost:27017');
        console.error('3. 🗄️  Crea una base de datos llamada "turo-clone"');
        console.error('4. ▶️  Asegúrate de que MongoDB está ejecutándose en tu sistema');
        console.error('\n⚠️  El servidor continuará pero las funciones de base de datos no funcionarán');
        
        // No terminar el proceso - permitir que el servidor continúe para desarrollo
        // process.exit(1);
    }
};

// Crear índices para optimizar búsquedas
const createIndexes = async () => {
    try {
        // Verificar que estemos conectados antes de crear índices
        if (mongoose.connection.readyState !== 1) {
            console.log('⚠️  No conectado a MongoDB, saltando creación de índices');
            return;
        }
        
        const User = mongoose.model('User');
        
        // Índice único para email
        await User.collection.createIndex({ email: 1 }, { unique: true });
        
        console.log('✅ Índices creados correctamente');
    } catch (error) {
        // Los índices ya existen o hay un error
        console.log('ℹ️  Índices ya existen o error creándolos:', error.message);
    }
};

// Función helper para verificar conexión a MongoDB
export const isMongoConnected = () => {
    return mongoose.connection.readyState === 1;
};

// Middleware para verificar conexión antes de operaciones de BD
export const requireMongo = (req, res, next) => {
    if (!isMongoConnected()) {
        return res.status(503).json({
            success: false,
            message: 'Servicio de base de datos no disponible. Por favor, asegúrate de que MongoDB esté ejecutándose.',
            error: 'DATABASE_UNAVAILABLE'
        });
    }
    next();
};

// Manejar eventos de conexión
mongoose.connection.on('connected', () => {
    console.log('🔗 Mongoose conectado a MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('Error de conexión MongoDB:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose desconectado de MongoDB');
});

// Cerrar conexión cuando la aplicación termine
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('Conexión MongoDB cerrada por terminación de la aplicación');
    process.exit(0);
});
