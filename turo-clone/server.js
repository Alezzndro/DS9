import fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import multipart from '@fastify/multipart';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
// Cargar variables de entorno
dotenv.config();
console.log('STRIPE_SECRET_KEY desde server.js:', process.env.STRIPE_SECRET_KEY);
import jwt from 'jsonwebtoken';
import { connectDB } from './backend/config/database.js';
import User from './backend/models/User.js';
import authRoutes from './backend/routes/auth.js';
import vehicleRoutes from './backend/routes/vehicles.js';
import paymentRoutes from './backend/routes/payment.js';
import reservationRoutes from './backend/routes/reservations.js';
import stripeRoutes from './backend/routes/stripe.js'; // Importar rutas de Stripe
import webhookRoutes from './backend/routes/webhook.js'; // Importar rutas de webhook
import adminRoutes from './backend/routes/admin.js'; // Importar rutas de admin


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = fastify({ logger: true });

const start = async () => {
    try {
        // Configurar CORS
        await app.register(cors, {
            origin: ['http://localhost:5000', 'http://localhost:5173', 'http://localhost:8080'], // Puertos comunes para desarrollo
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // <-- AGREGA PATCH AQUÍ
            allowedHeaders: ['Content-Type', 'Authorization'],
            credentials: true
        });

        // Configurar multipart para subida de archivos
        await app.register(multipart, {
            limits: {
                fieldNameSize: 100,
                fieldSize: 100,
                fields: 10,
                fileSize: 10 * 1024 * 1024, // 10MB
                files: 5
            }
        });

        // Configurar archivos estáticos para uploads
        await app.register(fastifyStatic, {
            root: path.join(__dirname, 'public', 'uploads'),
            prefix: '/uploads/',
            decorateReply: false
        });

        // Configurar archivos estáticos para assets
        await app.register(fastifyStatic, {
            root: path.join(__dirname, 'public', 'assets'),
            prefix: '/assets/',
            decorateReply: false
        });

        // Configurar archivos estáticos para src (módulos JS)
        await app.register(fastifyStatic, {
            root: path.join(__dirname, 'src'),
            prefix: '/src/',
            decorateReply: false
        });

        // Conectar a la base de datos
        await connectDB();

        // Middleware para verificar autenticación
        app.decorate('authenticate', async (request, reply) => {
            try {
                console.log('🔐 Verificando autenticación para:', request.method, request.url);
                const authHeader = request.headers.authorization;
                console.log('📋 Auth header:', authHeader ? `${authHeader.substring(0, 20)}...` : 'NO HEADER');
                
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    console.log('❌ Token no proporcionado o formato incorrecto');
                    return reply.code(401).send({
                        success: false,
                        message: 'Token de acceso requerido'
                    });
                }
                
                const token = authHeader.substring(7);
                console.log('🔑 Token extraído:', token.substring(0, 20) + '...');
                
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
                console.log('✅ Token decodificado - User ID:', decoded.userId);
                
                const user = await User.findById(decoded.userId);
                if (!user) {
                    console.log('❌ Usuario no encontrado en BD:', decoded.userId);
                    return reply.code(401).send({
                        success: false,
                        message: 'Usuario no encontrado'
                    });
                }
                
                console.log('👤 Usuario autenticado:', user.email);
                request.user = user;
                
            } catch (error) {
                console.log('❌ Error en autenticación:', error.message);
                return reply.code(401).send({
                    success: false,
                    message: 'Token inválido'
                });
            }
        });

        // Registrar rutas
        await app.register(authRoutes, { prefix: '/api/auth' });
        await app.register(vehicleRoutes, { prefix: '/api/vehicles' });
        await app.register(paymentRoutes);
        await app.register(reservationRoutes);
        await app.register(stripeRoutes, { prefix: '/api/stripe' }); // Registrar rutas de Stripe con prefijo
        await app.register(webhookRoutes); // Registrar rutas de webhook
        await app.register(adminRoutes, { prefix: '/api/admin' }); // Registrar rutas de admin

        // Ruta principal
        app.get('/', async (request, reply) => {
            try {
                const htmlPath = path.join(__dirname, 'index.html');
                const htmlContent = fs.readFileSync(htmlPath, 'utf8');
                reply.type('text/html').send(htmlContent);
            } catch (error) {
                reply.send({ message: 'Página principal en construcción', status: 'OK' });
            }
        });

        // Rutas SPA - todas las rutas del frontend deben servir el index.html
        const spaRoutes = ['/login', '/register', '/search', '/dashboard', '/admin'];
        spaRoutes.forEach(route => {
            app.get(route, async (request, reply) => {
                try {
                    const htmlPath = path.join(__dirname, 'index.html');
                    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
                    reply.type('text/html').send(htmlContent);
                } catch (error) {
                    reply.send({ message: 'Página principal en construcción', status: 'OK' });
                }
            });
        });

        // Fallback para cualquier ruta no encontrada (SPA routing)
        app.setNotFoundHandler(async (request, reply) => {
            // Si es una ruta de API, devolver 404 JSON
            if (request.url.startsWith('/api/')) {
                return reply.code(404).send({
                    success: false,
                    message: 'Ruta de API no encontrada'
                });
            }
            
            // Para cualquier otra ruta, servir el index.html (SPA)
            try {
                const htmlPath = path.join(__dirname, 'index.html');
                const htmlContent = fs.readFileSync(htmlPath, 'utf8');
                reply.type('text/html').send(htmlContent);
            } catch (error) {
                reply.code(404).send({ message: 'Página no encontrada' });
            }
        });

        // Ruta de prueba
        app.get('/api/health', async (request, reply) => {
            return { status: 'OK', message: 'Servidor funcionando correctamente' };
        });

        // Iniciar servidor
        const port = process.env.PORT || 3000;
        await app.listen({ port, host: '0.0.0.0' });
        console.log(`Servidor corriendo en puerto ${port}`);
        
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
