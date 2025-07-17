import fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { connectDB } from './backend/config/database.js';
import authRoutes from './backend/routes/auth.js';

// Cargar variables de entorno
dotenv.config();

const app = fastify({ logger: true });

const start = async () => {
    try {
        // Configurar CORS
        await app.register(cors, {
            origin: ['http://localhost:3000', 'http://localhost:5173'], // Puertos comunes para desarrollo
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization']
        });

        // Conectar a la base de datos
        await connectDB();

        // Registrar rutas
        await app.register(authRoutes, { prefix: '/api/auth' });

        // Ruta de prueba
        app.get('/api/health', async (request, reply) => {
            return { status: 'OK', message: 'Servidor funcionando correctamente' };
        });

        // Iniciar servidor
        const port = process.env.PORT || 5000;
        await app.listen({ port, host: '0.0.0.0' });
        console.log(`🚀 Servidor corriendo en puerto ${port}`);
        
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
