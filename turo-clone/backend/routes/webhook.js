import Stripe from 'stripe';
import Reservation from '../models/Reservation.js';
import User from '../models/User.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function webhookRoutes(fastify, options) {
    fastify.post('/webhook/stripe', async (request, reply) => {
        const sig = request.headers['stripe-signature'];
        let event;
        try {
            event = stripe.webhooks.constructEvent(request.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
        } catch (err) {
            return reply.code(400).send(`Webhook Error: ${err.message}`);
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const reservationId = session.metadata.reservationId;
            const hostId = session.metadata.hostId;
            const amount = session.amount_total / 100;

            // 1. Actualizar reserva
            const reservation = await Reservation.findById(reservationId);
            if (reservation) {
                reservation.paymentStatus = 'paid';
                await reservation.save();

                // 2. Sumar al balance del dueño
                const owner = await User.findById(hostId);
                if (owner) {
                    owner.balance = (owner.balance || 0) + amount;
                    await owner.save();
                }
            }
        }

        reply.send({ received: true });
    });
}