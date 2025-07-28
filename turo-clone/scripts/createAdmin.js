import bcrypt from 'bcrypt';
import User from '../backend/models/User.js';
import mongoose from 'mongoose';

async function createAdminUser() {
    try {
        // Conectar a MongoDB
        await mongoose.connect('mongodb://localhost:27017/turo-clone');
        
        // Verificar si ya existe un admin
        const existingAdmin = await User.findOne({ email: 'admin@turoclone.com' });
        if (existingAdmin) {
            console.log('❌ El usuario administrador ya existe');
            process.exit(0);
        }
        
        // Hashear contraseña
        const password = 'admin123'; // Cambiar por una contraseña segura
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Crear usuario administrador
        const adminUser = new User({
            firstName: 'Admin',
            lastName: 'Sistema',
            email: 'admin@turoclone.com',
            password: hashedPassword,
            role: 'admin',
            verificationStatus: 'approved',
            emailVerified: true,
            phoneVerified: false
        });
        
        await adminUser.save();
        
        console.log('✅ Usuario administrador creado exitosamente');
        console.log('📧 Email: admin@turoclone.com');
        console.log('🔑 Contraseña: admin123');
        console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer login');
        
    } catch (error) {
        console.error('❌ Error creando usuario administrador:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

createAdminUser();
