const mongoose = require('mongoose');

// Definir el schema del usuario
const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['user', 'admin'], 
        default: 'user' 
    },
    verificationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function fixUserStatuses() {
    try {
        // Conectar a MongoDB
        await mongoose.connect('mongodb://localhost:27017/turo-clone');
        console.log('✅ Conectado a la base de datos');
        
        // Buscar todos los usuarios
        const users = await User.find({});
        console.log(`📊 Total de usuarios encontrados: ${users.length}`);
        
        console.log('\n📋 Lista de usuarios:');
        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email} - Role: ${user.role} - Status: ${user.verificationStatus}`);
        });
        
        // Buscar usuarios con status inválido (esto debería fallar si hay alguno con "active")
        try {
            const invalidUsers = await User.find({ verificationStatus: 'active' });
            if (invalidUsers.length > 0) {
                console.log(`\n⚠️  Encontrados ${invalidUsers.length} usuarios con status 'active'`);
                
                // Corregir usuarios con status "active" a "approved"
                const result = await User.updateMany(
                    { verificationStatus: 'active' },
                    { $set: { verificationStatus: 'approved' } }
                );
                
                console.log(`✅ Corregidos ${result.modifiedCount} usuarios`);
            } else {
                console.log('\n✅ No se encontraron usuarios con status inválido');
            }
        } catch (error) {
            console.log('\n⚠️  Error al buscar usuarios con status "active" - esto es normal si no existen');
        }
        
        // Mostrar usuarios después de la corrección
        const updatedUsers = await User.find({});
        console.log('\n📋 Usuarios después de la corrección:');
        updatedUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email} - Role: ${user.role} - Status: ${user.verificationStatus}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Desconectado de la base de datos');
        process.exit(0);
    }
}

fixUserStatuses();
