
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

const JWT_SECRET = process.env.JWT_SECRET;

export const register = async (request, reply) => {
  const { name, email, password, role } = request.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return reply.code(400).send({ message: 'El correo ya está registrado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'user'
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id, role: newUser.role }, JWT_SECRET, {
      expiresIn: '7d'
    });

    reply.send({
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error(error);
    reply.code(500).send({ message: 'Error en el servidor.' });
  }
};

export const login = async (request, reply) => {
  const { email, password } = request.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return reply.code(400).send({ message: 'Correo o contraseña incorrectos.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return reply.code(400).send({ message: 'Correo o contraseña incorrectos.' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: '7d'
    });

    reply.send({
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    reply.code(500).send({ message: 'Error en el servidor.' });
  }
};
export const verify = async (request, reply) => {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return reply.code(401).send({ isValid: false, message: 'No token provided.' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    reply.send({ isValid: true, userId: decoded.id, role: decoded.role });
  } catch (error) {
    reply.code(401).send({ isValid: false, message: 'Token inválido.' });
  }
};
