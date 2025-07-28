import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import Reservation from '../models/Reservation.js';

export default async function adminRoutes(fastify, options) {
    
    // Middleware para verificar que el usuario sea admin
    const verifyAdmin = async (request, reply) => {
        await fastify.authenticate(request, reply);
        
        if (request.user.role !== 'admin') {
            return reply.code(403).send({
                success: false,
                message: 'Acceso denegado. Se requieren permisos de administrador.'
            });
        }
    };

    // Dashboard - Estadísticas generales
    fastify.get('/dashboard', { preHandler: verifyAdmin }, async (request, reply) => {
        try {
            const [
                totalUsers,
                totalVehicles,
                activeReservations,
                pendingDocuments,
                pendingVehicles,
                recentUsers,
                recentReservations
            ] = await Promise.all([
                User.countDocuments(),
                Vehicle.countDocuments(),
                Reservation.countDocuments({ status: { $in: ['confirmed', 'active'] } }),
                User.countDocuments({ verificationStatus: 'pending' }),
                Vehicle.countDocuments({ status: 'pending' }),
                User.find().sort({ createdAt: -1 }).limit(5).select('firstName lastName email createdAt'),
                Reservation.find().sort({ createdAt: -1 }).limit(5)
                    .populate('vehicle', 'make model')
                    .populate('user', 'firstName lastName')
            ]);

            // Calcular ingresos totales
            const reservations = await Reservation.find({ status: 'completed' });
            const totalRevenue = reservations.reduce((sum, reservation) => sum + reservation.totalAmount, 0);

            reply.send({
                success: true,
                data: {
                    stats: {
                        totalUsers,
                        totalVehicles,
                        activeReservations,
                        totalRevenue,
                        pendingDocuments,
                        pendingVehicles
                    },
                    recentActivity: {
                        users: recentUsers,
                        reservations: recentReservations
                    }
                }
            });
        } catch (error) {
            console.error('Error getting dashboard data:', error);
            reply.code(500).send({
                success: false,
                message: 'Error al obtener datos del dashboard'
            });
        }
    });

    // Gestión de Usuarios
    fastify.get('/users', { preHandler: verifyAdmin }, async (request, reply) => {
        try {
            const { 
                page = 1, 
                limit = 10, 
                search = '', 
                status = 'all', 
                role = 'all' 
            } = request.query;
            
            const skip = (page - 1) * limit;
            
            // Construir filtros
            const filters = {};
            
            if (search) {
                filters.$or = [
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ];
            }
            
            if (status !== 'all') {
                if (status === 'active') {
                    filters.verificationStatus = 'approved';
                } else if (status === 'suspended') {
                    filters.verificationStatus = 'rejected';
                }
            }
            
            if (role !== 'all') {
                filters.role = role;
            }
            
            const [users, total] = await Promise.all([
                User.find(filters)
                    .select('-password')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(limit)),
                User.countDocuments(filters)
            ]);
            
            reply.send({
                success: true,
                data: {
                    users,
                    pagination: {
                        current: parseInt(page),
                        total: Math.ceil(total / limit),
                        count: total
                    }
                }
            });
        } catch (error) {
            console.error('Error getting users:', error);
            reply.code(500).send({
                success: false,
                message: 'Error al obtener usuarios'
            });
        }
    });

    // Obtener usuario específico
    fastify.get('/users/:id', { preHandler: verifyAdmin }, async (request, reply) => {
        try {
            const user = await User.findById(request.params.id).select('-password');
            
            if (!user) {
                return reply.code(404).send({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }
            
            // Obtener estadísticas adicionales del usuario
            const userReservations = await Reservation.find({ user: user._id })
                .populate('vehicle', 'make model');
            
            const userVehicles = await Vehicle.find({ owner: user._id });
            
            reply.send({
                success: true,
                data: {
                    user,
                    reservations: userReservations,
                    vehicles: userVehicles
                }
            });
        } catch (error) {
            console.error('Error getting user:', error);
            reply.code(500).send({
                success: false,
                message: 'Error al obtener usuario'
            });
        }
    });

    // Crear nuevo usuario
    fastify.post('/users', { preHandler: verifyAdmin }, async (request, reply) => {
        try {
            const { fullName, email, password, phone, role } = request.body;
            
            console.log('📝 Creando nuevo usuario:', { fullName, email, phone, role });
            
            // Validar datos requeridos
            if (!fullName || !email || !password || !phone) {
                console.log('❌ Datos faltantes');
                return reply.code(400).send({
                    success: false,
                    message: 'Todos los campos son requeridos'
                });
            }

            // Verificar si el email ya existe
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                console.log('❌ Email ya existe:', email);
                return reply.code(400).send({
                    success: false,
                    message: 'Ya existe un usuario con este email'
                });
            }

            // Dividir el nombre completo en firstName y lastName
            const nameParts = fullName.trim().split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ') || '';

            console.log('🔄 Procesando nombres:', { firstName, lastName });

            // Crear el nuevo usuario
            const user = new User({
                firstName,
                lastName,
                email,
                password, // El hash se hace automáticamente en el pre-save
                phone,
                role: role || 'user',
                verificationStatus: 'pending'
            });

            await user.save();
            console.log('✅ Usuario creado exitosamente:', user._id);

            // Retornar el usuario sin la contraseña
            const userResponse = user.toObject();
            delete userResponse.password;
            
            reply.code(201).send({
                success: true,
                data: userResponse,
                message: 'Usuario creado exitosamente'
            });
        } catch (error) {
            console.error('❌ Error creating user:', error);
            reply.code(500).send({
                success: false,
                message: 'Error al crear el usuario: ' + error.message
            });
        }
    });

    // Actualizar estado de usuario
    fastify.patch('/users/:id/status', { preHandler: verifyAdmin }, async (request, reply) => {
        try {
            const { status } = request.body;
            
            console.log('📝 Actualizando estado de usuario:', request.params.id, 'a:', status);
            
            // Mapear status del frontend a verificationStatus del backend
            const statusMap = {
                'active': 'approved',
                'suspended': 'rejected',
                'pending': 'pending'
            };
            
            const verificationStatus = statusMap[status] || status;
            console.log('🔄 Status mapeado:', status, '->', verificationStatus);
            
            const user = await User.findByIdAndUpdate(
                request.params.id,
                { verificationStatus },
                { new: true, runValidators: true }
            ).select('-password');
            
            if (!user) {
                console.log('❌ Usuario no encontrado:', request.params.id);
                return reply.code(404).send({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }
            
            console.log('✅ Usuario actualizado exitosamente:', user._id, 'nuevo status:', user.verificationStatus);
            
            reply.send({
                success: true,
                data: user,
                message: `Usuario ${verificationStatus === 'approved' ? 'activado' : verificationStatus === 'rejected' ? 'suspendido' : 'actualizado'} exitosamente`
            });
        } catch (error) {
            console.error('❌ Error updating user status:', error);
            reply.code(500).send({
                success: false,
                message: 'Error al actualizar estado del usuario: ' + error.message
            });
        }
    });

    // Actualizar rol de usuario
    fastify.patch('/users/:id/role', { preHandler: verifyAdmin }, async (request, reply) => {
        try {
            const { role } = request.body;
            
            if (!['user', 'admin'].includes(role)) {
                return reply.code(400).send({
                    success: false,
                    message: 'Rol inválido'
                });
            }
            
            const user = await User.findByIdAndUpdate(
                request.params.id,
                { role },
                { new: true }
            ).select('-password');
            
            if (!user) {
                return reply.code(404).send({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }
            
            reply.send({
                success: true,
                data: user,
                message: `Rol actualizado a ${role} exitosamente`
            });
        } catch (error) {
            console.error('Error updating user role:', error);
            reply.code(500).send({
                success: false,
                message: 'Error al actualizar rol del usuario'
            });
        }
    });

    // Actualizar usuario completo
    fastify.put('/users/:id', { preHandler: verifyAdmin }, async (request, reply) => {
        try {
            const { id } = request.params;
            const updateData = request.body;
            
            console.log('📝 Actualizando usuario:', id);
            console.log('📋 Datos recibidos:', updateData);
            
            // Validar datos requeridos
            const allowedFields = ['name', 'email', 'phone', 'role', 'status', 'documentsStatus'];
            const filteredData = {};
            
            // Filtrar solo campos permitidos
            for (const field of allowedFields) {
                if (updateData[field] !== undefined) {
                    if (field === 'name') {
                        // Dividir el nombre completo en firstName y lastName
                        const nameParts = updateData[field].split(' ');
                        filteredData.firstName = nameParts[0] || '';
                        filteredData.lastName = nameParts.slice(1).join(' ') || '';
                    } else if (field === 'documentsStatus') {
                        // documentsStatus tiene prioridad sobre status
                        filteredData.verificationStatus = updateData[field];
                    } else if (field === 'status' && !updateData.documentsStatus) {
                        // Solo usar status si no hay documentsStatus
                        const statusMap = {
                            'active': 'approved',
                            'suspended': 'rejected',
                            'pending': 'pending'
                        };
                        filteredData.verificationStatus = statusMap[updateData[field]] || 'pending';
                    } else if (field !== 'status') {
                        filteredData[field] = updateData[field];
                    }
                }
            }
            
            console.log('🔄 Datos procesados para BD:', filteredData);
            
            // Actualizar usuario
            const user = await User.findByIdAndUpdate(
                id,
                filteredData,
                { new: true, runValidators: true }
            ).select('-password');
            
            if (!user) {
                return reply.code(404).send({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }
            
            console.log('✅ Usuario actualizado exitosamente:', user._id);
            
            reply.send({
                success: true,
                data: user,
                message: 'Usuario actualizado exitosamente'
            });
        } catch (error) {
            console.error('❌ Error updating user:', error);
            reply.code(500).send({
                success: false,
                message: 'Error al actualizar el usuario: ' + error.message
            });
        }
    });

    // Eliminar usuario
    fastify.delete('/users/:id', { preHandler: verifyAdmin }, async (request, reply) => {
        try {
            const user = await User.findById(request.params.id);
            
            if (!user) {
                return reply.code(404).send({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }
            
            // Verificar que no sea un administrador
            if (user.role === 'admin') {
                return reply.code(403).send({
                    success: false,
                    message: 'No se puede eliminar un usuario administrador'
                });
            }
            
            await User.findByIdAndDelete(request.params.id);
            
            reply.send({
                success: true,
                message: 'Usuario eliminado exitosamente'
            });
        } catch (error) {
            console.error('Error deleting user:', error);
            reply.code(500).send({
                success: false,
                message: 'Error al eliminar usuario'
            });
        }
    });

    // Gestión de Vehículos
    fastify.get('/vehicles', { preHandler: verifyAdmin }, async (request, reply) => {
        try {
            const { 
                page = 1, 
                limit = 10, 
                search = '', 
                status = 'all' 
            } = request.query;
            
            const skip = (page - 1) * limit;
            
            // Construir filtros
            const filters = {};
            
            if (search) {
                filters.$or = [
                    { make: { $regex: search, $options: 'i' } },
                    { model: { $regex: search, $options: 'i' } }
                ];
            }
            
            if (status !== 'all') {
                filters.status = status;
            }
            
            const [vehicles, total] = await Promise.all([
                Vehicle.find(filters)
                    .populate('owner', 'firstName lastName email')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(limit)),
                Vehicle.countDocuments(filters)
            ]);
            
            reply.send({
                success: true,
                data: {
                    vehicles,
                    pagination: {
                        current: parseInt(page),
                        total: Math.ceil(total / limit),
                        count: total
                    }
                }
            });
        } catch (error) {
            console.error('Error getting vehicles:', error);
            reply.code(500).send({
                success: false,
                message: 'Error al obtener vehículos'
            });
        }
    });

    // Obtener vehículo específico
    fastify.get('/vehicles/:id', { preHandler: verifyAdmin }, async (request, reply) => {
        try {
            const vehicle = await Vehicle.findById(request.params.id)
                .populate('owner', 'firstName lastName email phone');
            
            if (!vehicle) {
                return reply.code(404).send({
                    success: false,
                    message: 'Vehículo no encontrado'
                });
            }
            
            // Obtener reservaciones del vehículo
            const vehicleReservations = await Reservation.find({ vehicle: vehicle._id })
                .populate('user', 'firstName lastName email');
            
            reply.send({
                success: true,
                data: {
                    vehicle,
                    reservations: vehicleReservations
                }
            });
        } catch (error) {
            console.error('Error getting vehicle:', error);
            reply.code(500).send({
                success: false,
                message: 'Error al obtener vehículo'
            });
        }
    });

    // Actualizar estado de vehículo
    fastify.patch('/vehicles/:id/status', { preHandler: verifyAdmin }, async (request, reply) => {
        try {
            const { status } = request.body;
            
            const vehicle = await Vehicle.findByIdAndUpdate(
                request.params.id,
                { status },
                { new: true }
            ).populate('owner', 'firstName lastName email');
            
            if (!vehicle) {
                return reply.code(404).send({
                    success: false,
                    message: 'Vehículo no encontrado'
                });
            }
            
            reply.send({
                success: true,
                data: vehicle,
                message: `Vehículo ${status} exitosamente`
            });
        } catch (error) {
            console.error('Error updating vehicle status:', error);
            reply.code(500).send({
                success: false,
                message: 'Error al actualizar estado del vehículo'
            });
        }
    });

    // Gestión de Reservaciones
    fastify.get('/reservations', { preHandler: verifyAdmin }, async (request, reply) => {
        try {
            const { 
                page = 1, 
                limit = 10, 
                search = '', 
                status = 'all' 
            } = request.query;
            
            const skip = (page - 1) * limit;
            
            // Construir filtros
            const filters = {};
            
            if (status !== 'all') {
                filters.status = status;
            }
            
            const [reservations, total] = await Promise.all([
                Reservation.find(filters)
                    .populate('user', 'firstName lastName email')
                    .populate('vehicle', 'make model year location')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(limit)),
                Reservation.countDocuments(filters)
            ]);
            
            reply.send({
                success: true,
                data: {
                    reservations,
                    pagination: {
                        current: parseInt(page),
                        total: Math.ceil(total / limit),
                        count: total
                    }
                }
            });
        } catch (error) {
            console.error('Error getting reservations:', error);
            reply.code(500).send({
                success: false,
                message: 'Error al obtener reservaciones'
            });
        }
    });

    // Actualizar estado de reservación
    fastify.patch('/reservations/:id/status', { preHandler: verifyAdmin }, async (request, reply) => {
        try {
            const { status } = request.body;
            
            const reservation = await Reservation.findByIdAndUpdate(
                request.params.id,
                { status },
                { new: true }
            ).populate('user', 'firstName lastName email')
             .populate('vehicle', 'make model');
            
            if (!reservation) {
                return reply.code(404).send({
                    success: false,
                    message: 'Reservación no encontrada'
                });
            }
            
            reply.send({
                success: true,
                data: reservation,
                message: `Reservación ${status} exitosamente`
            });
        } catch (error) {
            console.error('Error updating reservation status:', error);
            reply.code(500).send({
                success: false,
                message: 'Error al actualizar estado de la reservación'
            });
        }
    });

    // Analytics - Datos para gráficos
    fastify.get('/analytics', { preHandler: verifyAdmin }, async (request, reply) => {
        try {
            const { timeRange = 'month' } = request.query;
            
            // Calcular fechas según el rango
            let startDate = new Date();
            switch (timeRange) {
                case 'week':
                    startDate.setDate(startDate.getDate() - 7);
                    break;
                case 'month':
                    startDate.setMonth(startDate.getMonth() - 1);
                    break;
                case 'quarter':
                    startDate.setMonth(startDate.getMonth() - 3);
                    break;
                case 'year':
                    startDate.setFullYear(startDate.getFullYear() - 1);
                    break;
            }
            
            // Obtener datos agregados
            const [
                revenueData,
                usersData,
                reservationsData,
                vehiclesData
            ] = await Promise.all([
                Reservation.aggregate([
                    { $match: { createdAt: { $gte: startDate }, status: 'completed' } },
                    { 
                        $group: {
                            _id: { 
                                year: { $year: '$createdAt' },
                                month: { $month: '$createdAt' }
                            },
                            total: { $sum: '$totalAmount' }
                        }
                    },
                    { $sort: { '_id.year': 1, '_id.month': 1 } }
                ]),
                User.aggregate([
                    { $match: { createdAt: { $gte: startDate } } },
                    { 
                        $group: {
                            _id: { 
                                year: { $year: '$createdAt' },
                                month: { $month: '$createdAt' }
                            },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { '_id.year': 1, '_id.month': 1 } }
                ]),
                Reservation.aggregate([
                    { $match: { createdAt: { $gte: startDate } } },
                    { 
                        $group: {
                            _id: { 
                                year: { $year: '$createdAt' },
                                month: { $month: '$createdAt' }
                            },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { '_id.year': 1, '_id.month': 1 } }
                ]),
                Vehicle.aggregate([
                    { $match: { createdAt: { $gte: startDate } } },
                    { 
                        $group: {
                            _id: { 
                                year: { $year: '$createdAt' },
                                month: { $month: '$createdAt' }
                            },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { '_id.year': 1, '_id.month': 1 } }
                ])
            ]);
            
            reply.send({
                success: true,
                data: {
                    revenue: revenueData,
                    users: usersData,
                    reservations: reservationsData,
                    vehicles: vehiclesData
                }
            });
        } catch (error) {
            console.error('Error getting analytics:', error);
            reply.code(500).send({
                success: false,
                message: 'Error al obtener analytics'
            });
        }
    });

    // Documentos pendientes
    fastify.get('/documents/pending', { preHandler: verifyAdmin }, async (request, reply) => {
        try {
            const pendingUsers = await User.find({ 
                verificationStatus: 'pending',
                $or: [
                    { 'documents.idDocument.url': { $exists: true } },
                    { 'documents.driverLicense.url': { $exists: true } }
                ]
            }).select('firstName lastName email documents createdAt');
            
            reply.send({
                success: true,
                data: pendingUsers
            });
        } catch (error) {
            console.error('Error getting pending documents:', error);
            reply.code(500).send({
                success: false,
                message: 'Error al obtener documentos pendientes'
            });
        }
    });

    // Aprobar/Rechazar documentos
    fastify.patch('/documents/:userId/verify', { preHandler: verifyAdmin }, async (request, reply) => {
        try {
            const { action, documentType } = request.body; // action: 'approve' | 'reject'
            
            const updateField = {};
            if (documentType === 'id') {
                updateField['documents.idDocument.verified'] = action === 'approve';
            } else if (documentType === 'license') {
                updateField['documents.driverLicense.verified'] = action === 'approve';
            }
            
            // Si ambos documentos están verificados, aprobar al usuario
            const user = await User.findById(request.params.userId);
            const bothVerified = user.documents.idDocument?.verified && user.documents.driverLicense?.verified;
            
            if (action === 'approve' && bothVerified) {
                updateField.verificationStatus = 'approved';
            } else if (action === 'reject') {
                updateField.verificationStatus = 'rejected';
            }
            
            const updatedUser = await User.findByIdAndUpdate(
                request.params.userId,
                updateField,
                { new: true }
            ).select('-password');
            
            reply.send({
                success: true,
                data: updatedUser,
                message: `Documento ${action === 'approve' ? 'aprobado' : 'rechazado'} exitosamente`
            });
        } catch (error) {
            console.error('Error verifying document:', error);
            reply.code(500).send({
                success: false,
                message: 'Error al verificar documento'
            });
        }
    });

    // Settings - Obtener configuraciones
    fastify.get('/settings', { preHandler: verifyAdmin }, async (request, reply) => {
        try {
            // En una implementación real, las configuraciones se almacenarían en la base de datos
            // Por ahora devolvemos configuraciones por defecto
            const defaultSettings = {
                platform: {
                    name: 'Turo Clone',
                    description: 'Plataforma de alquiler de vehículos peer-to-peer',
                    email: 'admin@turoclone.com',
                    phone: '+34 900 123 456',
                    address: 'Calle Principal 123, Madrid, España'
                },
                business: {
                    commission: 15,
                    currency: 'EUR',
                    minRentalDays: 1,
                    maxRentalDays: 30,
                    cancellationHours: 24,
                    autoApproval: false
                },
                notifications: {
                    emailNotifications: true,
                    smsNotifications: false,
                    pushNotifications: true,
                    newUserWelcome: true,
                    reservationConfirmation: true,
                    paymentAlerts: true
                },
                security: {
                    requireEmailVerification: true,
                    requirePhoneVerification: false,
                    documentVerification: true,
                    twoFactorAuth: false,
                    passwordMinLength: 8
                }
            };

            reply.send({
                success: true,
                settings: defaultSettings
            });
        } catch (error) {
            console.error('Error getting settings:', error);
            reply.code(500).send({
                success: false,
                message: 'Error al obtener configuraciones'
            });
        }
    });

    // Settings - Actualizar configuraciones
    fastify.put('/settings', { preHandler: verifyAdmin }, async (request, reply) => {
        try {
            const { settings } = request.body;
            
            // En una implementación real, aquí se guardarían las configuraciones en la base de datos
            // Por ahora simplemente confirmamos que se recibieron
            
            reply.send({
                success: true,
                message: 'Configuraciones actualizadas exitosamente',
                settings: settings
            });
        } catch (error) {
            console.error('Error updating settings:', error);
            reply.code(500).send({
                success: false,
                message: 'Error al actualizar configuraciones'
            });
        }
    });

    // Settings - Resetear a valores por defecto
    fastify.post('/settings/reset', { preHandler: verifyAdmin }, async (request, reply) => {
        try {
            // En una implementación real, aquí se resetearían las configuraciones en la base de datos
            
            reply.send({
                success: true,
                message: 'Configuraciones reseteadas a valores por defecto'
            });
        } catch (error) {
            console.error('Error resetting settings:', error);
            reply.code(500).send({
                success: false,
                message: 'Error al resetear configuraciones'
            });
        }
    });
}
