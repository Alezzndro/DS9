
import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from './db/connect.js';
import authRoutes from './routes/authRoutes.js';

const fastify = Fastify();
await fastify.register(cors, { origin: true });
await fastify.register(authRoutes);
import profileRoutes from './routes/profileRoutes.js';
await fastify.register(profileRoutes);

await connectDB();

fastify.listen({ port: 5000 }, err => {
  if (err) throw err;
  console.log('Servidor corriendo en http://localhost:5000');
});
