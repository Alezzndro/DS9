// routes/payment.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_51RlWswQISO11FEwtxPLoy4sQ89StCuXRHMjEZSPIhpZb5EY8Zo6oS9PaX2BFpfkl9EGrGeVYiwfG0PkIr9jAZ9r600M0ZG9sbW', {
  apiVersion: '2022-11-15',
});

export default async function paymentRoutes(fastify, opts) {
  fastify.post('/create-checkout-session', async (request, reply) => {
    const { vehicleId, startDate, endDate, total } = request.body;

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Reserva vehículo ID ${vehicleId}`,
              },
              unit_amount: total * 100, // Stripe usa centavos
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: 'http://localhost:5000/success', // 🔁 corregido a puerto del frontend
        cancel_url: 'http://localhost:5000/cancel',
      });

      reply.send({ url: session.url });
    } catch (error) {
      console.error('Error creando sesión de Stripe:', error);
      reply.status(500).send({ error: 'Error creando sesión de pago' });
    }
  });
}
