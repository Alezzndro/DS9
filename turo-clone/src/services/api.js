import { API_BASE_URL } from '../utils/constants.js';
import { getAuthToken, removeAuthToken } from './authService.js';

export async function apiRequest(endpoint, method = 'GET', body = null, requiresAuth = true) {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (requiresAuth) {
        const token = getAuthToken();
        if (!token) {
            throw new Error('No authentication token found');
        }
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method,
        headers
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        
        if (response.status === 401) {
            // Para rutas de login, mostrar mensaje específico
            if (endpoint.includes('/login')) {
                throw new Error('Credenciales inválidas. Verifica tu email y contraseña.');
            }
            // Para otras rutas, token inválido o expirado
            removeAuthToken();
            throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }

        let data;
        try {
            data = await response.json();
        } catch (jsonError) {
            throw new Error('Error al procesar la respuesta del servidor');
        }

        if (!response.ok) {
            // Manejar diferentes tipos de error
            if (response.status === 400) {
                throw new Error(data.message || 'Datos incorrectos');
            } else if (response.status === 404) {
                throw new Error(data.message || 'Recurso no encontrado');
            } else if (response.status === 500) {
                throw new Error('Error interno del servidor. Intenta más tarde.');
            } else {
                throw new Error(data.message || 'Error desconocido');
            }
        }

        return data;
    } catch (error) {
        console.error('API request failed:', error);
        
        // Si es un error de red
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Error de conexión. Verifica tu conexión a internet.');
        }
        
        // Re-lanzar el error para que lo maneje el componente
        throw error;
    }
}

export async function uploadFile(endpoint, file, fieldName = 'file') {
    const token = getAuthToken();
    if (!token) {
        throw new Error('No authentication token found');
    }

    const formData = new FormData();
    formData.append(fieldName, file);

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'File upload failed');
        }

        return data;
    } catch (error) {
        console.error('File upload failed:', error);
        throw error;
    }
}