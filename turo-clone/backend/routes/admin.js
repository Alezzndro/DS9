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
            // Obtener todos los vehículos para conteo manual confiable
            const allVehicles = await Vehicle.find().select('status');
            
            const [
                totalUsers,
                totalVehicles,
                activeReservations,
                pendingDocuments,
                recentUsers,
                recentReservations
            ] = await Promise.all([
                User.countDocuments(),
                Vehicle.countDocuments(),
                Reservation.countDocuments({ status: { $in: ['confirmed', 'active'] } }),
                User.countDocuments({ verificationStatus: 'pending' }),
                User.find().sort({ createdAt: -1 }).limit(5).select('firstName lastName email createdAt'),
                Reservation.find().sort({ createdAt: -1 }).limit(5)
                    .populate('vehicle', 'make model')
                    .populate('user', 'firstName lastName')
            ]);

            // Conteo manual confiable de vehículos pendientes
            const pendingVehicles = allVehicles.filter(vehicle => vehicle.status === 'pending').length;

            // Calcular ingresos totales
            const reservations = await Reservation.find({ status: 'completed' });
            const totalRevenue = reservations.reduce((sum, reservation) => sum + reservation.totalAmount, 0);

            console.log('📊 Dashboard data generated:', {
                totalUsers,
                totalVehicles,
                activeReservations,
                totalRevenue,
                pendingDocuments,
                pendingVehicles
            });

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

    // Actualizar vehículo
    fastify.put('/vehicles/:id', { preHandler: verifyAdmin }, async (request, reply) => {
        try {
            const { id } = request.params;
            const updateData = request.body;
            
            console.log('📝 Actualizando vehículo:', id);
            console.log('📋 Datos recibidos:', updateData);
            
            // Validar datos requeridos
            const allowedFields = ['make', 'model', 'year', 'color', 'pricePerDay', 'location', 'status', 'description', 'features', 'category', 'transmission', 'fuelType', 'seats', 'licensePlate'];
            const filteredData = {};
            
            // Filtrar solo campos permitidos
            for (const field of allowedFields) {
                if (updateData[field] !== undefined) {
                    if (field === 'location') {
                        if (typeof updateData[field] === 'string') {
                            // Si location es un string, crear objeto completo con campos requeridos
                            filteredData.location = {
                                address: updateData[field],
                                city: 'Ciudad por defecto',
                                state: 'Estado por defecto',
                                zipCode: '00000',
                                coordinates: {
                                    latitude: 0,
                                    longitude: 0
                                }
                            };
                        } else if (updateData[field] && typeof updateData[field] === 'object') {
                            // Si es un objeto, asegurar que tenga todos los campos requeridos
                            const location = updateData[field];
                            filteredData.location = {
                                address: location.address || '',
                                city: location.city || 'Ciudad por defecto',
                                state: location.state || 'Estado por defecto',
                                zipCode: location.zipCode || '00000',
                                coordinates: location.coordinates || {
                                    latitude: 0,
                                    longitude: 0
                                }
                            };
                        }
                    } else if (field === 'year' && updateData[field]) {
                        filteredData[field] = parseInt(updateData[field]);
                    } else if (field === 'pricePerDay' && updateData[field]) {
                        filteredData[field] = parseFloat(updateData[field]);
                    } else if (field === 'seats' && updateData[field]) {
                        filteredData[field] = parseInt(updateData[field]);
                    } else if (field === 'licensePlate' && updateData[field]) {
                        filteredData[field] = updateData[field].toUpperCase();
                    } else {
                        filteredData[field] = updateData[field];
                    }
                }
            }
            
            console.log('🔄 Datos procesados para BD:', filteredData);
            
            // Actualizar vehículo
            const vehicle = await Vehicle.findByIdAndUpdate(
                id,
                filteredData,
                { new: true, runValidators: true }
            ).populate('owner', 'firstName lastName email');
            
            if (!vehicle) {
                return reply.code(404).send({
                    success: false,
                    message: 'Vehículo no encontrado'
                });
            }
            
            console.log('✅ Vehículo actualizado exitosamente:', vehicle._id);
            
            reply.send({
                success: true,
                data: vehicle,
                message: 'Vehículo actualizado exitosamente'
            });
        } catch (error) {
            console.error('❌ Error updating vehicle:', error);
            
            // Manejar errores de validación de MongoDB
            if (error.name === 'ValidationError') {
                const errorMessages = Object.values(error.errors).map(err => err.message);
                return reply.code(400).send({
                    success: false,
                    message: 'Error de validación: ' + errorMessages.join(', ')
                });
            }
            
            reply.code(500).send({
                success: false,
                message: 'Error al actualizar el vehículo: ' + error.message
            });
        }
    });

    // Eliminar vehículo
    fastify.delete('/vehicles/:id', { preHandler: verifyAdmin }, async (request, reply) => {
        try {
            const { id } = request.params;
            
            console.log('🗑️ Eliminando vehículo:', id);
            
            // Verificar si el vehículo existe
            const vehicle = await Vehicle.findById(id);
            if (!vehicle) {
                return reply.code(404).send({
                    success: false,
                    message: 'Vehículo no encontrado'
                });
            }
            
            // Eliminar el vehículo
            await Vehicle.findByIdAndDelete(id);
            
            console.log('✅ Vehículo eliminado exitosamente:', id);
            
            reply.send({
                success: true,
                message: 'Vehículo eliminado exitosamente'
            });
        } catch (error) {
            console.error('❌ Error deleting vehicle:', error);
            reply.code(500).send({
                success: false,
                message: 'Error al eliminar el vehículo: ' + error.message
            });
        }
    });
}
