const API_BASE_URL = 'http://localhost:5000/api';

class AdminApiService {
    constructor() {
        // No guardar el token en el constructor, obtenerlo dinámicamente
    }

    getAuthHeaders() {
        const token = localStorage.getItem('turo_clone_auth_token'); // Obtener token dinámicamente
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    async makeRequest(url, options = {}) {
        try {
            const token = localStorage.getItem('turo_clone_auth_token');
            // Debug solo si hay problemas
            if (!token) {
                console.warn('No auth token found for admin API request');
            }

            const response = await fetch(`${API_BASE_URL}${url}`, {
                ...options,
                headers: {
                    ...this.getAuthHeaders(),
                    ...options.headers
                }
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('❌ API Error Response:', data);
                throw new Error(data.message || 'Error en la petición');
            }

            return data;
        } catch (error) {
            console.error('🚨 API Request Failed:', {
                url,
                error: error.message
            });
            throw error;
        }
    }

    // Dashboard
    async getDashboardData() {
        return this.makeRequest('/admin/dashboard');
    }

    // Usuarios
    async getUsers(filters = {}) {
        const queryParams = new URLSearchParams();
        Object.keys(filters).forEach(key => {
            if (filters[key] !== undefined && filters[key] !== '') {
                queryParams.append(key, filters[key]);
            }
        });
        
        return this.makeRequest(`/admin/users?${queryParams.toString()}`);
    }

    async getUser(userId) {
        return this.makeRequest(`/admin/users/${userId}`);
    }

    async updateUserStatus(userId, status) {
        return this.makeRequest(`/admin/users/${userId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
    }

    async updateUserRole(userId, role) {
        return this.makeRequest(`/admin/users/${userId}/role`, {
            method: 'PATCH',
            body: JSON.stringify({ role })
        });
    }

    async updateUser(userId, userData) {
        console.log('🔄 AdminApiService: Actualizando usuario', userId, userData);
        const response = await this.makeRequest(`/admin/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
        console.log('📡 AdminApiService: Respuesta del servidor', response);
        return response;
    }

    async deleteUser(userId) {
        return this.makeRequest(`/admin/users/${userId}`, {
            method: 'DELETE'
        });
    }

    async createUser(userData) {
        console.log('🔄 AdminApiService: Creando usuario', userData);
        const response = await this.makeRequest('/admin/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        console.log('📡 AdminApiService: Respuesta crear usuario', response);
        return response;
    }

    // Vehículos
    async getVehicles(filters = {}) {
        const queryParams = new URLSearchParams();
        Object.keys(filters).forEach(key => {
            if (filters[key] !== undefined && filters[key] !== '') {
                queryParams.append(key, filters[key]);
            }
        });
        
        return this.makeRequest(`/admin/vehicles?${queryParams.toString()}`);
    }

    async getVehicle(vehicleId) {
        return this.makeRequest(`/admin/vehicles/${vehicleId}`);
    }

    async updateVehicleStatus(vehicleId, status) {
        return this.makeRequest(`/admin/vehicles/${vehicleId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
    }

    async deleteVehicle(vehicleId) {
        return this.makeRequest(`/admin/vehicles/${vehicleId}`, {
            method: 'DELETE'
        });
    }

    // Reservaciones
    async getReservations(filters = {}) {
        const queryParams = new URLSearchParams();
        Object.keys(filters).forEach(key => {
            if (filters[key] !== undefined && filters[key] !== '') {
                queryParams.append(key, filters[key]);
            }
        });
        
        return this.makeRequest(`/admin/reservations?${queryParams.toString()}`);
    }

    async getReservation(reservationId) {
        return this.makeRequest(`/admin/reservations/${reservationId}`);
    }

    async updateReservationStatus(reservationId, status) {
        return this.makeRequest(`/admin/reservations/${reservationId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
    }

    // Documentos
    async getPendingDocuments() {
        return this.makeRequest('/admin/documents/pending');
    }

    async verifyDocument(userId, action, documentType) {
        return this.makeRequest(`/admin/documents/${userId}/verify`, {
            method: 'PATCH',
            body: JSON.stringify({ action, documentType })
        });
    }

    // Analytics
    async getAnalytics(timeRange = 'month') {
        return this.makeRequest(`/admin/analytics?timeRange=${timeRange}`);
    }

    // Configuración
    async getSettings() {
        return this.makeRequest('/admin/settings');
    }

    async updateSettings(settings) {
        return this.makeRequest('/admin/settings', {
            method: 'PUT',
            body: JSON.stringify({ settings })
        });
    }

    async resetSettings() {
        return this.makeRequest('/admin/settings/reset', {
            method: 'POST'
        });
    }
}

// Crear instancia global
const adminApiService = new AdminApiService();

export default adminApiService;
