import Vehicle from '../models/Vehicle.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
            
            console.log('🔍 Búsqueda de vehículos con parámetros:', request.query);
            
            // Construir filtros - Solo mostrar vehículos aprobados y disponibles
            const filters = {
                status: 'approved',  // Solo vehículos aprobados por el admin
                isAvailable: true    // Solo vehículos disponibles
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
            
            console.log('📊 Filtros aplicados:', filters);
            
            const skip = (parseInt(page) - 1) * parseInt(limit);
            
            const vehicles = await Vehicle.find(filters)
                .populate('owner', 'firstName lastName')
                .sort({ createdAt: -1 })
                .limit(parseInt(limit))
                .skip(skip);
            
            const totalCount = await Vehicle.countDocuments(filters);
            
            console.log(`✅ Encontrados ${vehicles.length} vehículos de ${totalCount} total`);
            
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

    // Ruta de debug para ver todos los vehículos (temporal)
    fastify.get('/debug/all', async (request, reply) => {
        try {
            const allVehicles = await Vehicle.find({})
                .populate('owner', 'firstName lastName email')
                .sort({ createdAt: -1 });
            
            console.log(`📊 Total de vehículos en BD: ${allVehicles.length}`);
            allVehicles.forEach((v, i) => {
                console.log(`${i + 1}. ${v.make} ${v.model} - Disponible: ${v.isAvailable}, Verificado: ${v.isVerified}`);
            });
            
            reply.send({
                success: true,
                totalVehicles: allVehicles.length,
                vehicles: allVehicles
            });
            
        } catch (error) {
            console.error('Error obteniendo todos los vehículos:', error);
            reply.code(500).send({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    });

    // Subir imágenes de vehículo
    fastify.post('/:id/images', { preHandler: fastify.authenticate }, async (request, reply) => {
        try {
            console.log('🔄 Iniciando subida de imagen...');
            const vehicleId = request.params.id;
            console.log('🆔 Vehicle ID:', vehicleId);
            console.log('👤 User ID:', request.user._id);
            
            // Verificar que el vehículo existe y pertenece al usuario
            const vehicle = await Vehicle.findOne({
                _id: vehicleId,
                owner: request.user._id
            });
            
            console.log('🚗 Vehículo encontrado:', !!vehicle);
            
            if (!vehicle) {
                console.log('❌ Vehículo no encontrado');
                return reply.code(404).send({
                    success: false,
                    message: 'Vehículo no encontrado'
                });
            }
            
            console.log('📁 Obteniendo archivo...');
            const data = await request.file();
            console.log('📄 Archivo recibido:', !!data, data?.filename, data?.mimetype);
            
            if (!data) {
                console.log('❌ No se proporcionó archivo');
                return reply.code(400).send({
                    success: false,
                    message: 'No se proporcionó ningún archivo'
                });
            }
            
            // Validar tipo de archivo
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            console.log('🔍 Validando tipo de archivo:', data.mimetype);
            if (!allowedTypes.includes(data.mimetype)) {
                console.log('❌ Tipo de archivo no permitido');
                return reply.code(400).send({
                    success: false,
                    message: 'Tipo de archivo no permitido. Solo se aceptan: JPG, PNG, WEBP'
                });
            }
            
            // Crear nombre único para el archivo
            const timestamp = Date.now();
            const extension = path.extname(data.filename);
            const filename = `vehicle_${vehicleId}_${timestamp}${extension}`;
            const uploadPath = path.join(__dirname, '../../public/uploads/vehicles', filename);
            
            console.log('💾 Guardando archivo en:', uploadPath);
            
            // Asegurar que el directorio existe
            const uploadDir = path.dirname(uploadPath);
            if (!fs.existsSync(uploadDir)) {
                console.log('📁 Creando directorio:', uploadDir);
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            
            // Guardar archivo
            console.log('📤 Convirtiendo a buffer...');
            const buffer = await data.toBuffer();
            console.log('💾 Escribiendo archivo...');
            fs.writeFileSync(uploadPath, buffer);
            console.log('✅ Archivo guardado exitosamente');
            
            // Crear URL de acceso
            const imageUrl = `/uploads/vehicles/${filename}`;
            
            // Determinar si es la imagen principal
            const isPrimary = vehicle.images.length === 0;
            
            // Agregar imagen al vehículo
            vehicle.images.push({
                url: imageUrl,
                isPrimary: isPrimary
            });
            
            await vehicle.save();
            
            reply.send({
                success: true,
                message: 'Imagen subida exitosamente',
                imageUrl: imageUrl,
                isPrimary: isPrimary
            });
            
        } catch (error) {
            console.error('Error subiendo imagen:', error);
            reply.code(500).send({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    });

    // Eliminar imagen de vehículo
    fastify.delete('/:id/images/:imageIndex', { preHandler: fastify.authenticate }, async (request, reply) => {
        try {
            const vehicleId = request.params.id;
            const imageIndex = parseInt(request.params.imageIndex);
            
            // Verificar que el vehículo existe y pertenece al usuario
            const vehicle = await Vehicle.findOne({
                _id: vehicleId,
                owner: request.user._id
            });
            
            if (!vehicle) {
                return reply.code(404).send({
                    success: false,
                    message: 'Vehículo no encontrado'
                });
            }
            
            if (imageIndex < 0 || imageIndex >= vehicle.images.length) {
                return reply.code(400).send({
                    success: false,
                    message: 'Índice de imagen inválido'
                });
            }
            
            const imageToDelete = vehicle.images[imageIndex];
            
            // Eliminar archivo físico
            const imagePath = path.join(__dirname, '../../public', imageToDelete.url);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
            
            // Eliminar de la base de datos
            vehicle.images.splice(imageIndex, 1);
            
            // Si era la imagen principal y quedan imágenes, hacer la primera como principal
            if (imageToDelete.isPrimary && vehicle.images.length > 0) {
                vehicle.images[0].isPrimary = true;
            }
            
            await vehicle.save();
            
            reply.send({
                success: true,
                message: 'Imagen eliminada exitosamente'
            });
            
        } catch (error) {
            console.error('Error eliminando imagen:', error);
            reply.code(500).send({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    });

    // Establecer imagen principal
    fastify.patch('/:id/images/:imageIndex/primary', { preHandler: fastify.authenticate }, async (request, reply) => {
        try {
            const vehicleId = request.params.id;
            const imageIndex = parseInt(request.params.imageIndex);
            
            // Verificar que el vehículo existe y pertenece al usuario
            const vehicle = await Vehicle.findOne({
                _id: vehicleId,
                owner: request.user._id
            });
            
            if (!vehicle) {
                return reply.code(404).send({
                    success: false,
                    message: 'Vehículo no encontrado'
                });
            }
            
            if (imageIndex < 0 || imageIndex >= vehicle.images.length) {
                return reply.code(400).send({
                    success: false,
                    message: 'Índice de imagen inválido'
                });
            }
            
            // Quitar el flag de principal de todas las imágenes
            vehicle.images.forEach(img => {
                img.isPrimary = false;
            });
            
            // Establecer la nueva imagen principal
            vehicle.images[imageIndex].isPrimary = true;
            
            await vehicle.save();
            
            reply.send({
                success: true,
                message: 'Imagen principal actualizada'
            });
            
        } catch (error) {
            console.error('Error actualizando imagen principal:', error);
            reply.code(500).send({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    });
}
