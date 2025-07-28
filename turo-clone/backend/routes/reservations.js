import Reservation from '../models/Reservation.js';
import Vehicle from '../models/Vehicle.js';
import User from '../models/User.js';

export default async function reservationRoutes(fastify, options) {
    // Crear una nueva reserva
    fastify.post('/api/reservations', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        try {
            const { vehicleId, startDate, endDate, pickupLocation, returnLocation, notes } = request.body;
            const guestId = request.user.id;

            // Verificar que el vehículo existe y está disponible
            const vehicle = await Vehicle.findById(vehicleId).populate('owner');
            if (!vehicle) {
                return reply.code(404).send({ error: 'Vehículo no encontrado' });
            }

            if (!vehicle.isAvailable) {
                return reply.code(400).send({ error: 'Vehículo no disponible' });
            }

            // Verificar que no es el propietario del vehículo
            if (vehicle.owner._id.toString() === guestId) {
                return reply.code(400).send({ error: 'No puedes reservar tu propio vehículo' });
            }

            // Verificar si el usuario ya tiene una reserva para ese vehículo y fechas
            const userExistingReservation = await Reservation.findOne({
                vehicle: vehicleId,
                guest: guestId,
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

            if (userExistingReservation) {
                return reply.code(400).send({ error: 'Ya tienes una reserva para este vehículo en esas fechas' });
            }

            // Verificar disponibilidad general (otros usuarios)
            const existingReservation = await Reservation.findOne({
                vehicle: vehicleId,
                paymentStatus: 'paid', // O status: 'confirmed', según tu lógica
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

            if (existingReservation) {
                return reply.code(400).send({ error: 'El vehículo ya está reservado y pagado en esas fechas.' });
            }

            // Calcula el total
            const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
            const totalPrice = days * vehicle.pricePerDay;

            // Crea la reserva usando el modelo de Mongoose
            const reservation = await Reservation.create({
                guest: guestId,
                host: vehicle.owner._id || vehicle.owner, // asegúrate de que owner sea un ObjectId
                vehicle: vehicle._id,
                startDate,
                endDate,
                totalPrice,
                status: 'pending',
                pickupLocation,
                returnLocation,
                notes: notes || '',
                paymentStatus: 'pending'
            });

            reply.send(reservation);
        } catch (error) {
            console.error(error);
            reply.code(500).send({ message: error.message || 'Error interno del servidor' });
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
                query.guest = userId;
            } else if (type === 'host') {
                query.host = userId;
            } else {
                // Por defecto, mostrar reservas donde el usuario es huésped o anfitrión
                query.$or = [
                    { guest: userId },
                    { host: userId }
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
            console.error(error);
            reply.code(500).send({ error: error.message || 'Error al obtener las reservas' });
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

            if (reservation.guest.toString() !== userId) {
                return reply.code(403).send({ error: 'Solo el huésped puede cancelar la reserva' });
            }

            // Si quieres permitir cancelar cualquier reserva, comenta la siguiente validación:
            // if (['active', 'completed', 'cancelled'].includes(reservation.status)) {
            //     return reply.code(400).send({ error: 'No se puede cancelar esta reserva' });
            // }

            await Reservation.updateOne(
                { _id: id },
                { $set: { status: 'cancelled', updatedAt: Date.now() } }
            );

            const updatedReservation = await Reservation.findById(id)
                .populate([
                    { path: 'guest', select: 'name email' },
                    { path: 'host', select: 'name email' },
                    { path: 'vehicle', select: 'make model year pricePerDay location photos' }
                ]);

            reply.send(updatedReservation);
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

    fastify.post('/api/reservations/:id/cancel', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        const { id } = request.params;
        const reservation = await Reservation.findById(id);
        if (!reservation) return reply.code(404).send({ error: 'Reserva no encontrada' });
        if (reservation.paymentStatus === 'paid') return reply.code(400).send({ error: 'No se puede cancelar una reserva pagada' });

        reservation.status = 'cancelled';
        // Salta validaciones al guardar
        await reservation.save({ validateBeforeSave: false });

        reply.send({ success: true });
    });

    fastify.delete('/api/reservations/:id', {
        preValidation: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const userId = request.user.id;

            const reservation = await Reservation.findById(id);

            if (!reservation) {
                return reply.code(404).send({ error: 'Reserva no encontrada' });
            }

            if (reservation.guest.toString() !== userId) {
                return reply.code(403).send({ error: 'Solo el huésped puede eliminar la reserva' });
            }

            await Reservation.deleteOne({ _id: id });

            reply.send({ success: true });
        } catch (error) {
            fastify.log.error(error);
            reply.code(500).send({ error: 'Error al eliminar la reserva' });
        }
    });
}
