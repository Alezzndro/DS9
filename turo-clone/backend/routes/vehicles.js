import Vehicle from '../models/Vehicle.js';

export default async function vehicleRoutes(fastify, options) {
    
    // Obtener vehículos del usuario autenticado
    fastify.get('/my-vehicles', { preHandler: fastify.authenticate }, async (request, reply) => {
        try {
            const vehicles = await Vehicle.find({ owner: request.user._id })
                .sort({ createdAt: -1 });
            
            reply.send({
                success: true,
                vehicles
            });
            
        } catch (error) {
            console.error('Error obteniendo vehículos:', error);
            reply.code(500).send({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    });
    
    // Obtener un vehículo específico
    fastify.get('/:id', async (request, reply) => {
        try {
            const vehicle = await Vehicle.findById(request.params.id)
                .populate('owner', 'firstName lastName email');
            
            if (!vehicle) {
                return reply.code(404).send({
                    success: false,
                    message: 'Vehículo no encontrado'
                });
            }
            
            reply.send({
                success: true,
                vehicle
            });
            
        } catch (error) {
            console.error('Error obteniendo vehículo:', error);
            reply.code(500).send({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    });
    
    // Crear nuevo vehículo
    fastify.post('/', { preHandler: fastify.authenticate }, async (request, reply) => {
        try {
            const vehicleData = {
                ...request.body,
                owner: request.user._id
            };
            
            // Validar que la placa no exista
            const existingVehicle = await Vehicle.findOne({ 
                licensePlate: vehicleData.licensePlate?.toUpperCase() 
            });
            
            if (existingVehicle) {
                return reply.code(400).send({
                    success: false,
                    message: 'Ya existe un vehículo con esta placa'
                });
            }
            
            const newVehicle = new Vehicle(vehicleData);
            await newVehicle.save();
            
            reply.code(201).send({
                success: true,
                message: 'Vehículo creado exitosamente',
                vehicle: newVehicle
            });
            
        } catch (error) {
            console.error('Error creando vehículo:', error);
            
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map(err => err.message);
                return reply.code(400).send({
                    success: false,
                    message: 'Error de validación',
                    errors: messages
                });
            }
            
            if (error.code === 11000) {
                return reply.code(400).send({
                    success: false,
                    message: 'Ya existe un vehículo con esta placa'
                });
            }
            
            reply.code(500).send({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    });
    
    // Actualizar vehículo
    fastify.put('/:id', { preHandler: fastify.authenticate }, async (request, reply) => {
        try {
            const vehicle = await Vehicle.findById(request.params.id);
            
            if (!vehicle) {
                return reply.code(404).send({
                    success: false,
                    message: 'Vehículo no encontrado'
                });
            }
            
            // Verificar que el usuario sea el propietario
            if (vehicle.owner.toString() !== request.user._id.toString()) {
                return reply.code(403).send({
                    success: false,
                    message: 'No tienes permisos para editar este vehículo'
                });
            }
            
            // Si se está cambiando la placa, verificar que no exista
            if (request.body.licensePlate && 
                request.body.licensePlate.toUpperCase() !== vehicle.licensePlate) {
                const existingVehicle = await Vehicle.findOne({ 
                    licensePlate: request.body.licensePlate.toUpperCase(),
                    _id: { $ne: vehicle._id }
                });
                
                if (existingVehicle) {
                    return reply.code(400).send({
                        success: false,
                        message: 'Ya existe un vehículo con esta placa'
                    });
                }
            }
            
            const updatedVehicle = await Vehicle.findByIdAndUpdate(
                request.params.id,
                request.body,
                { new: true, runValidators: true }
            );
            
            reply.send({
                success: true,
                message: 'Vehículo actualizado exitosamente',
                vehicle: updatedVehicle
            });
            
        } catch (error) {
            console.error('Error actualizando vehículo:', error);
            
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map(err => err.message);
                return reply.code(400).send({
                    success: false,
                    message: 'Error de validación',
                    errors: messages
                });
            }
            
            reply.code(500).send({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    });
    
    // Eliminar vehículo
    fastify.delete('/:id', { preHandler: fastify.authenticate }, async (request, reply) => {
        try {
            const vehicle = await Vehicle.findById(request.params.id);
            
            if (!vehicle) {
                return reply.code(404).send({
                    success: false,
                    message: 'Vehículo no encontrado'
                });
            }
            
            // Verificar que el usuario sea el propietario
            if (vehicle.owner.toString() !== request.user._id.toString()) {
                return reply.code(403).send({
                    success: false,
                    message: 'No tienes permisos para eliminar este vehículo'
                });
            }
            
            await Vehicle.findByIdAndDelete(request.params.id);
            
            reply.send({
                success: true,
                message: 'Vehículo eliminado exitosamente'
            });
            
        } catch (error) {
            console.error('Error eliminando vehículo:', error);
            reply.code(500).send({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    });
    
    // Cambiar disponibilidad de vehículo
    fastify.patch('/:id/availability', { preHandler: fastify.authenticate }, async (request, reply) => {
        try {
            const { isAvailable } = request.body;
            
            const vehicle = await Vehicle.findById(request.params.id);
            
            if (!vehicle) {
                return reply.code(404).send({
                    success: false,
                    message: 'Vehículo no encontrado'
                });
            }
            
            // Verificar que el usuario sea el propietario
            if (vehicle.owner.toString() !== request.user._id.toString()) {
                return reply.code(403).send({
                    success: false,
                    message: 'No tienes permisos para modificar este vehículo'
                });
            }
            
            vehicle.isAvailable = isAvailable;
            await vehicle.save();
            
            reply.send({
                success: true,
                message: `Vehículo ${isAvailable ? 'habilitado' : 'deshabilitado'} exitosamente`,
                vehicle
            });
            
        } catch (error) {
            console.error('Error cambiando disponibilidad:', error);
            reply.code(500).send({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    });
    
    // Búsqueda pública de vehículos (para el componente Search)
    fastify.get('/search', async (request, reply) => {
        try {
            const {
                city,
                state,
                category,
                minPrice,
                maxPrice,
                seats,
                transmission,
                fuelType,
                features,
                startDate,
                endDate,
                limit = 20,
                page = 1
            } = request.query;
            
            // Construir filtros
            const filters = {
                isAvailable: true,
                isVerified: true
            };
            
            if (city) filters['location.city'] = new RegExp(city, 'i');
            if (state) filters['location.state'] = new RegExp(state, 'i');
            if (category) filters.category = category;
            if (seats) filters.seats = { $gte: parseInt(seats) };
            if (transmission) filters.transmission = transmission;
            if (fuelType) filters.fuelType = fuelType;
            
            if (minPrice || maxPrice) {
                filters.pricePerDay = {};
                if (minPrice) filters.pricePerDay.$gte = parseFloat(minPrice);
                if (maxPrice) filters.pricePerDay.$lte = parseFloat(maxPrice);
            }
            
            if (features) {
                const featuresArray = Array.isArray(features) ? features : [features];
                filters.features = { $in: featuresArray };
            }
            
            const skip = (parseInt(page) - 1) * parseInt(limit);
            
            const vehicles = await Vehicle.find(filters)
                .populate('owner', 'firstName lastName')
                .sort({ createdAt: -1 })
                .limit(parseInt(limit))
                .skip(skip);
            
            const totalCount = await Vehicle.countDocuments(filters);
            
            reply.send({
                success: true,
                vehicles,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalCount,
                    totalPages: Math.ceil(totalCount / parseInt(limit))
                }
            });
            
        } catch (error) {
            console.error('Error en búsqueda de vehículos:', error);
            reply.code(500).send({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    });
}
