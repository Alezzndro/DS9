import { register, login, verify } from '../controllers/authController.js';

export default async function authRoutes(fastify, options) {
  fastify.post('/register', register);
  fastify.post('/login', login);
  fastify.get('/verify', verify);
}
