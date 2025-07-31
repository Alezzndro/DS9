import Stripe from 'stripe';
import Reservation from '../models/Reservation.js';
import Vehicle from '../models/Vehicle.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function stripeRoutes(fastify, options) {
    fastify.post('/checkout', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        try {
            console.log('🔄 Procesando checkout de Stripe');
            const { reservationId } = request.body;
            
            if (!reservationId) {
                return reply.code(400).send({ error: 'ID de reserva requerido' });
            }

            console.log('📋 Buscando reserva:', reservationId);
            const reservation = await Reservation.findById(reservationId).populate('vehicle');
            
            if (!reservation) {
                console.log('❌ Reserva no encontrada');
                return reply.code(404).send({ error: 'Reserva no encontrada' });
            }

            console.log('✅ Reserva encontrada:', reservation._id);
            console.log('💰 Precio total:', reservation.totalPrice);

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [{
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `${reservation.vehicle.make} ${reservation.vehicle.model}`,
                        },
                        unit_amount: Math.round(reservation.totalPrice * 100),
                    },
                    quantity: 1,
                }],
                mode: 'payment',
                success_url: `${process.env.FRONTEND_URL}/dashboard?success=1`,
                cancel_url: `${process.env.FRONTEND_URL}/dashboard?cancel=1`,
                metadata: {
                    reservationId: reservation._id.toString(),
                    hostId: reservation.host.toString()
                }
            });

            console.log('🚀 Sesión de Stripe creada:', session.url);
            reply.send({ url: session.url });
        } catch (error) {
            console.error('🚨 Error en checkout de Stripe:', error);
            reply.code(500).send({ error: 'Error al crear sesión de pago' });
        }
    });
}
