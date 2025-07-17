import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export default async function authRoutes(fastify, options) {
    
    // Registro de usuario
    fastify.post('/register', async (request, reply) => {
        try {
            const { firstName, lastName, email, password, phone, dateOfBirth } = request.body;
            
            // Validaciones básicas
            if (!firstName || !lastName || !email || !password) {
                return reply.code(400).send({
                    success: false,
                    message: 'Todos los campos obligatorios deben ser completados'
                });
            }
            
            // Verificar si el usuario ya existe
            const existingUser = await User.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                return reply.code(400).send({
                    success: false,
                    message: 'Ya existe una cuenta con este email'
                });
            }
            
            // Crear nuevo usuario
            const newUser = new User({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.toLowerCase().trim(),
                password,
                phone: phone?.trim(),
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined
            });
            
            await newUser.save();
            
            // Generar token JWT
            const token = jwt.sign(
                { 
                    userId: newUser._id,
                    email: newUser.email,
                    role: newUser.role
                },
                process.env.JWT_SECRET || 'fallback-secret-key',
                { expiresIn: '7d' }
            );
            
            // Respuesta exitosa (sin incluir la contraseña)
            const userResponse = newUser.toJSON();
            
            reply.code(201).send({
                success: true,
                message: 'Usuario registrado exitosamente',
                token,
                user: userResponse
            });
            
        } catch (error) {
            console.error('Error en registro:', error);
            
            // Errores de validación de Mongoose
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map(err => err.message);
                return reply.code(400).send({
                    success: false,
                    message: 'Error de validación',
                    errors: messages
                });
            }
            
            // Error de duplicado (email ya existe)
            if (error.code === 11000) {
                return reply.code(400).send({
                    success: false,
                    message: 'Ya existe una cuenta con este email'
                });
            }
            
            reply.code(500).send({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    });
    
    // Login de usuario
    fastify.post('/login', async (request, reply) => {
        try {
            const { email, password } = request.body;
            
            // Validaciones básicas
            if (!email || !password) {
                return reply.code(400).send({
                    success: false,
                    message: 'Email y contraseña son requeridos'
                });
            }
            
            // Buscar usuario por email (incluir password para comparación)
            const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
            
            if (!user) {
                return reply.code(401).send({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }
            
            // Verificar si la cuenta está bloqueada
            if (user.isLocked) {
                return reply.code(423).send({
                    success: false,
                    message: 'Cuenta temporalmente bloqueada debido a múltiples intentos fallidos'
                });
            }
            
            // Verificar contraseña
            const isPasswordValid = await user.comparePassword(password);
            
            if (!isPasswordValid) {
                // Incrementar intentos fallidos
                await user.incLoginAttempts();
                
                return reply.code(401).send({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }
            
            // Login exitoso - resetear intentos fallidos
            if (user.loginAttempts > 0) {
                await user.resetLoginAttempts();
            }
            
            // Actualizar último login
            user.lastLogin = new Date();
            await user.save();
            
            // Generar token JWT
            const token = jwt.sign(
                { 
                    userId: user._id,
                    email: user.email,
                    role: user.role
                },
                process.env.JWT_SECRET || 'fallback-secret-key',
                { expiresIn: '7d' }
            );
            
            // Respuesta exitosa
            const userResponse = user.toJSON();
            
            reply.send({
                success: true,
                message: 'Login exitoso',
                token,
                user: userResponse
            });
            
        } catch (error) {
            console.error('Error en login:', error);
            reply.code(500).send({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    });
    
    // Middleware para verificar autenticación
    fastify.decorate('authenticate', async (request, reply) => {
        try {
            const authHeader = request.headers.authorization;
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return reply.code(401).send({
                    success: false,
                    message: 'Token de acceso requerido'
                });
            }
            
            const token = authHeader.substring(7);
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
            
            const user = await User.findById(decoded.userId);
            if (!user) {
                return reply.code(401).send({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }
            
            request.user = user;
            
        } catch (error) {
            return reply.code(401).send({
                success: false,
                message: 'Token inválido'
            });
        }
    });
    
    // Obtener perfil del usuario autenticado
    fastify.get('/profile', { preHandler: fastify.authenticate }, async (request, reply) => {
        try {
            reply.send({
                success: true,
                user: request.user.toJSON()
            });
        } catch (error) {
            console.error('Error obteniendo perfil:', error);
            reply.code(500).send({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    });
    
    // Verificar token
    fastify.post('/verify-token', async (request, reply) => {
        try {
            const { token } = request.body;
            
            if (!token) {
                return reply.code(400).send({
                    success: false,
                    message: 'Token requerido'
                });
            }
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
            
            const user = await User.findById(decoded.userId);
            if (!user) {
                return reply.code(401).send({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }
            
            reply.send({
                success: true,
                valid: true,
                user: user.toJSON()
            });
            
        } catch (error) {
            reply.send({
                success: false,
                valid: false,
                message: 'Token inválido o expirado'
            });
        }
    });
    
    // Logout (opcional - principalmente limpia del lado cliente)
    fastify.post('/logout', { preHandler: fastify.authenticate }, async (request, reply) => {
        try {
            // En un sistema más complejo, aquí podrías invalidar el token
            // o mantener una lista negra de tokens
            
            reply.send({
                success: true,
                message: 'Logout exitoso'
            });
            
        } catch (error) {
            console.error('Error en logout:', error);
            reply.code(500).send({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    });
}
