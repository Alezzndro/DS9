# Turo Clone - Setup y Uso

## 🚀 Configuración Inicial

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Configurar Variables de Entorno
Copia el archivo `.env.example` a `.env` y ajusta las variables según tu entorno:
```bash
cp .env.example .env
```

### 3. Configurar MongoDB
Asegúrate de tener MongoDB instalado y corriendo en tu sistema:

#### Opción A: MongoDB Local
```bash
# Iniciar MongoDB
mongod
```

#### Opción B: MongoDB Atlas (Nube)
1. Crea una cuenta en MongoDB Atlas
2. Crea un cluster
3. Obtén la cadena de conexión
4. Actualiza `MONGODB_URI` en tu archivo `.env`

### 4. Iniciar el Servidor
```bash
# Modo desarrollo (con recarga automática)
npm run dev

# Modo producción
npm start
```

### 5. Iniciar el Frontend (en otra terminal)
```bash
npm run dev:frontend
```

## 📡 API Endpoints

### Autenticación

#### POST `/api/auth/register`
Registra un nuevo usuario.

**Body:**
```json
{
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan@email.com",
  "password": "123456",
  "phone": "+525551234567",
  "dateOfBirth": "1990-01-01"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "token": "jwt-token",
  "user": { ... }
}
```

#### POST `/api/auth/login`
Inicia sesión de usuario.

**Body:**
```json
{
  "email": "juan@email.com",
  "password": "123456"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "token": "jwt-token",
  "user": { ... }
}
```

#### GET `/api/auth/profile`
Obtiene el perfil del usuario autenticado.

**Headers:**
```
Authorization: Bearer jwt-token
```

#### POST `/api/auth/verify-token`
Verifica si un token es válido.

**Body:**
```json
{
  "token": "jwt-token"
}
```

#### POST `/api/auth/logout`
Cierra sesión (requiere autenticación).

### Salud del Servidor

#### GET `/api/health`
Verifica que el servidor esté funcionando.

## 🗄️ Estructura de la Base de Datos

### Colección: Users
```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String (único),
  password: String (hasheada),
  phone: String,
  dateOfBirth: Date,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  role: String, // 'user' | 'admin'
  isEmailVerified: Boolean,
  verificationStatus: String, // 'pending' | 'approved' | 'rejected'
  documents: {
    idDocument: { url: String, verified: Boolean, uploadedAt: Date },
    driverLicense: { url: String, verified: Boolean, uploadedAt: Date, expirationDate: Date }
  },
  paymentMethods: Array,
  notifications: Object,
  lastLogin: Date,
  loginAttempts: Number,
  lockUntil: Date,
  stats: {
    totalReservations: Number,
    totalSpent: Number,
    rating: Number,
    reviewCount: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

## 🔒 Seguridad Implementada

- **Hashing de contraseñas** con bcrypt
- **JWT para autenticación** con expiración de 7 días
- **Protección contra ataques de fuerza bruta** (bloqueo temporal después de 5 intentos fallidos)
- **Validación de datos** con Mongoose
- **CORS configurado** para desarrollo
- **Variables de entorno** para datos sensibles

## 🧪 Pruebas

### Usando cURL

#### Registrar usuario:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan@email.com",
    "password": "123456"
  }'
```

#### Iniciar sesión:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@email.com",
    "password": "123456"
  }'
```

#### Obtener perfil (requiere token):
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📝 Notas Importantes

1. **Cambiar JWT_SECRET** en producción por una clave más segura
2. **MongoDB debe estar corriendo** antes de iniciar el servidor
3. **El frontend y backend corren en puertos diferentes** (5173 y 5000)
4. **Los tokens expiran en 7 días** - ajustar según necesidades
5. **Las contraseñas se hashean automáticamente** - nunca se almacenan en texto plano

## 🛠️ Desarrollo

### Estructura del Backend
```
backend/
├── config/
│   └── database.js     # Configuración de MongoDB
├── models/
│   └── User.js         # Modelo de usuario
└── routes/
    └── auth.js         # Rutas de autenticación
```

### Próximos Pasos
- [ ] Implementar verificación por email
- [ ] Agregar recuperación de contraseña
- [ ] Crear modelos para vehículos y reservaciones
- [ ] Implementar subida de archivos para documentos
- [ ] Agregar sistema de notificaciones
