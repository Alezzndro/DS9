import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/turo-clone';
        
        await mongoose.connect(mongoURI);
        
        console.log('✅ Conectado a MongoDB');
        
        // Crear índices necesarios
        await createIndexes();
        
    } catch (error) {
        console.error('❌ Error conectando a MongoDB:', error.message);
        process.exit(1);
    }
};

// Crear índices para optimizar búsquedas
const createIndexes = async () => {
    try {
        const User = mongoose.model('User');
        
        // Índice único para email
        await User.collection.createIndex({ email: 1 }, { unique: true });
        
        console.log('✅ Índices creados correctamente');
    } catch (error) {
        // Los índices ya existen o hay un error
        console.log('ℹ️ Índices ya existen o error creándolos:', error.message);
    }
};

// Manejar eventos de conexión
mongoose.connection.on('connected', () => {
    console.log('🔗 Mongoose conectado a MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Error de conexión MongoDB:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('🔌 Mongoose desconectado de MongoDB');
});

// Cerrar conexión cuando la aplicación termine
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('🔌 Conexión MongoDB cerrada por terminación de la aplicación');
    process.exit(0);
});
