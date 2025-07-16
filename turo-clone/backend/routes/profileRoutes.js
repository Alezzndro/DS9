import { authenticate } from '../middleware/authMiddleware.js';

export default async function profileRoutes(fastify, options) {
  fastify.get('/profile', { preHandler: [authenticate] }, async (request, reply) => {
    // request.user contiene los datos del usuario autenticado
    reply.send({ message: 'Ruta protegida', user: request.user });
  });
}
