import fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { connectDB } from './backend/config/database.js';
import authRoutes from './backend/routes/auth.js';

// Cargar variables de entorno
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = fastify({ logger: true });

const start = async () => {
    try {
        // Configurar CORS
        await app.register(cors, {
            origin: ['http://localhost:3000', 'http://localhost:5173'], // Puertos comunes para desarrollo
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization']
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

        // Registrar rutas
        await app.register(authRoutes, { prefix: '/api/auth' });

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
        const port = process.env.PORT || 5000;
        await app.listen({ port, host: '0.0.0.0' });
        console.log(`Servidor corriendo en puerto ${port}`);
        
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
