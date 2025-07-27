import Stripe from 'stripe';
import Reservation from '../models/Reservation.js';
import Vehicle from '../models/Vehicle.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function stripeRoutes(fastify, options) {
    fastify.post('/api/stripe/checkout', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        const { reservationId } = request.body;
        const reservation = await Reservation.findById(reservationId).populate('vehicle');
        if (!reservation) return reply.code(404).send({ error: 'Reserva no encontrada' });

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: `${reservation.vehicle.make} ${reservation.vehicle.model}`,
                    },
                    unit_amount: Math.round(reservation.totalPrice * 100),
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/reservas?success=1`,
            cancel_url: `${process.env.FRONTEND_URL}/reservas?cancel=1`,
            metadata: {
                reservationId: reservation._id.toString(),
                hostId: reservation.host.toString()
            }
        });

        reply.send({ url: session.url });
    });
}