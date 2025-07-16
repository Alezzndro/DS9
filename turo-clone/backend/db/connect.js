import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/turo-clone', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB conectado');
  } catch (err) {
    console.error('Error conectando a MongoDB:', err);
    process.exit(1);
  }
};
