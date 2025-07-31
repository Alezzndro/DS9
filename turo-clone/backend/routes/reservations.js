import mongoose from 'mongoose';
import Reservation from '../models/Reservation.js';
import Vehicle from '../models/Vehicle.js';
import User from '../models/User.js';


export default async function reservationRoutes(fastify, options) {
    // Crear una nueva reserva
    fastify.post('/api/reservations', {
        preValidation: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { vehicleId, startDate, endDate, pickupLocation, returnLocation, notes, completedDirectPay } = request.body;
            const guestId = request.user.id;

            // Verificar que el vehículo existe y está disponible
            const vehicle = await Vehicle.findById(vehicleId).populate('owner');
            if (!vehicle) {
                console.log('Vehículo no encontrado');
                return reply.code(404).send({ error: 'Vehículo no encontrado' });
            }

            if (!vehicle.isAvailable) {
                console.log('Vehículo no disponible');
                return reply.code(400).send({ error: 'Vehículo no disponible' });
            }

            // Verificar que no es el propietario del vehículo
            if (vehicle.owner._id.toString() === guestId) {
                console.log('Intento de reservar su propio vehículo');
                return reply.code(400).send({ error: 'No puedes reservar tu propio vehículo' });
            }

            // Verificar disponibilidad en las fechas solicitadas
            const existingReservations = await Reservation.find({
                vehicle: vehicleId,
                status: { $in: ['confirmed', 'active'] },
                $or: [
                    {
                        $and: [
                            { startDate: { $lte: new Date(startDate) } },
                            { endDate: { $gte: new Date(startDate) } }
                        ]
                    },
                    {
                        $and: [
                            { startDate: { $lte: new Date(endDate) } },
                            { endDate: { $gte: new Date(endDate) } }
                        ]
                    },
                    {
                        $and: [
                            { startDate: { $gte: new Date(startDate) } },
                            { endDate: { $lte: new Date(endDate) } }
                        ]
                    }
                ]
            });

            if (existingReservations.length > 0) {
                console.log('Fechas no disponibles');
                return reply.code(400).send({ error: 'El vehículo no está disponible en esas fechas' });
            }

            // Calcular precio total
            const diffTime = Math.abs(new Date(endDate) - new Date(startDate));
            const calculatedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const days = calculatedDays === 0 ? 1 : calculatedDays; // Mínimo 1 día si es el mismo día
            const totalPrice = days * vehicle.pricePerDay;

            const status = completedDirectPay ? 'completed' : 'pending';
            const paymentStatus = completedDirectPay ? 'paid' : 'pending';

            // Crear la reserva
            const reservation = new Reservation({
                guest: new mongoose.Types.ObjectId(guestId),
                host: new mongoose.Types.ObjectId(vehicle.owner._id),
                vehicle: vehicleId,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                totalPrice,
                pickupLocation: pickupLocation || vehicle.location,
                returnLocation: returnLocation || vehicle.location,
                notes: notes || '',
                status,
                paymentStatus
            });

            await reservation.save();

            // Poblar los datos para la respuesta
            await reservation.populate([
                { path: 'guest', select: 'name email' },
                { path: 'host', select: 'name email' },
                { path: 'vehicle', select: 'make model year pricePerDay location photos' }
            ]);

            console.log({
                guestId,
                hostId: vehicle.owner._id,
                vehicleId,
                startDate,
                endDate,
                totalPrice
            });

            reply.code(201).send(reservation);
        } catch (error) {
            fastify.log.error(error);
            reply.code(500).send({ error: 'Error al crear la reserva' });
        }
    });

    // Obtener reservas del usuario autenticado
    fastify.get('/api/reservations', {
        preValidation: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const { status, type } = request.query;

            let query = {};
            
            // Filtrar por tipo (como huésped o como anfitrión)
            if (type === 'guest') {
                query.guest = new mongoose.Types.ObjectId(userId);
            } else if (type === 'host') {
                query.host = new mongoose.Types.ObjectId(userId);
            } else {
                query.$or = [
                    { guest: new mongoose.Types.ObjectId(userId) },
                    { host: new mongoose.Types.ObjectId(userId) }
                ];
            }

            // Filtrar por estado
            if (status && status !== 'all') {
                query.status = status;
            }

            const reservations = await Reservation.find(query)
                .populate('guest', 'name email')
                .populate('host', 'name email')
                .populate('vehicle', 'make model year pricePerDay location photos')
                .sort({ createdAt: -1 });

            reply.send(reservations);
        } catch (error) {
            fastify.log.error(error);
            reply.code(500).send({ error: 'Error al obtener las reservas' });
        }
    });

    // Obtener una reserva específica
    fastify.get('/api/reservations/:id', {
        preValidation: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const userId = request.user.id;

            const reservation = await Reservation.findById(id)
                .populate('guest', 'name email')
                .populate('host', 'name email')
                .populate('vehicle', 'make model year pricePerDay location photos');

            if (!reservation) {
                return reply.code(404).send({ error: 'Reserva no encontrada' });
            }

            // Verificar que el usuario tiene acceso a esta reserva
            if (reservation.guest._id.toString() !== userId && reservation.host._id.toString() !== userId) {
                return reply.code(403).send({ error: 'No tienes acceso a esta reserva' });
            }

            reply.send(reservation);
        } catch (error) {
            fastify.log.error(error);
            reply.code(500).send({ error: 'Error al obtener la reserva' });
        }
    });

    // Cancelar una reserva
    fastify.patch('/api/reservations/:id/cancel', {
        preValidation: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const userId = request.user.id;

            const reservation = await Reservation.findById(id);
            
            if (!reservation) {
                return reply.code(404).send({ error: 'Reserva no encontrada' });
            }

            // Solo el huésped puede cancelar la reserva
            if (reservation.guest.toString() !== userId) {
                return reply.code(403).send({ error: 'Solo el huésped puede cancelar la reserva' });
            }

            // No se puede cancelar una reserva ya iniciada o completada
            if (['active', 'completed', 'cancelled'].includes(reservation.status)) {
                return reply.code(400).send({ error: 'No se puede cancelar esta reserva' });
            }

            reservation.status = 'cancelled';
            await reservation.save();

            await reservation.populate([
                { path: 'guest', select: 'name email' },
                { path: 'host', select: 'name email' },
                { path: 'vehicle', select: 'make model year pricePerDay location photos' }
            ]);

            reply.send(reservation);
        } catch (error) {
            fastify.log.error(error);
            reply.code(500).send({ error: 'Error al cancelar la reserva' });
        }
    });

    // Confirmar una reserva (solo el anfitrión)
    fastify.patch('/api/reservations/:id/confirm', {
        preValidation: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const userId = request.user.id;

            const reservation = await Reservation.findById(id);
            
            if (!reservation) {
                return reply.code(404).send({ error: 'Reserva no encontrada' });
            }

            // Solo el anfitrión puede confirmar la reserva
            if (reservation.host.toString() !== userId) {
                return reply.code(403).send({ error: 'Solo el anfitrión puede confirmar la reserva' });
            }

            if (reservation.status !== 'pending') {
                return reply.code(400).send({ error: 'Solo se pueden confirmar reservas pendientes' });
            }

            reservation.status = 'confirmed';
            await reservation.save();

            await reservation.populate([
                { path: 'guest', select: 'name email' },
                { path: 'host', select: 'name email' },
                { path: 'vehicle', select: 'make model year pricePerDay location photos' }
            ]);

            reply.send(reservation);
        } catch (error) {
            fastify.log.error(error);
            reply.code(500).send({ error: 'Error al confirmar la reserva' });
        }
    });

    // Iniciar una reserva (pickup)
    fastify.patch('/api/reservations/:id/start', {
        preValidation: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const { code } = request.body;
            const userId = request.user.id;

            const reservation = await Reservation.findById(id);
            
            if (!reservation) {
                return reply.code(404).send({ error: 'Reserva no encontrada' });
            }

            // Solo el huésped puede iniciar la reserva
            if (reservation.guest.toString() !== userId) {
                return reply.code(403).send({ error: 'Solo el huésped puede iniciar la reserva' });
            }

            if (reservation.status !== 'confirmed') {
                return reply.code(400).send({ error: 'La reserva debe estar confirmada para poder iniciarla' });
            }

            if (code !== reservation.pickupCode) {
                return reply.code(400).send({ error: 'Código de recogida incorrecto' });
            }

            reservation.status = 'active';
            await reservation.save();

            await reservation.populate([
                { path: 'guest', select: 'name email' },
                { path: 'host', select: 'name email' },
                { path: 'vehicle', select: 'make model year pricePerDay location photos' }
            ]);

            reply.send(reservation);
        } catch (error) {
            fastify.log.error(error);
            reply.code(500).send({ error: 'Error al iniciar la reserva' });
        }
    });

    // Completar una reserva (return)
    fastify.patch('/api/reservations/:id/complete', {
        preValidation: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const { code } = request.body;
            const userId = request.user.id;

            const reservation = await Reservation.findById(id);
            
            if (!reservation) {
                return reply.code(404).send({ error: 'Reserva no encontrada' });
            }

            // Solo el huésped puede completar la reserva
            if (reservation.guest.toString() !== userId) {
                return reply.code(403).send({ error: 'Solo el huésped puede completar la reserva' });
            }

            if (reservation.status !== 'active') {
                return reply.code(400).send({ error: 'La reserva debe estar activa para poder completarla' });
            }

            if (code !== reservation.returnCode) {
                return reply.code(400).send({ error: 'Código de devolución incorrecto' });
            }

            reservation.status = 'completed';
            await reservation.save();

            await reservation.populate([
                { path: 'guest', select: 'name email' },
                { path: 'host', select: 'name email' },
                { path: 'vehicle', select: 'make model year pricePerDay location photos' }
            ]);

            reply.send(reservation);
        } catch (error) {
            fastify.log.error(error);
            reply.code(500).send({ error: 'Error al completar la reserva' });
        }
    });
}
