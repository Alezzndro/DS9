import { apiRequest, uploadFile } from './api.js';

export async function searchVehicles(filters = {}) {
    try {
        const queryParams = new URLSearchParams();
        
        Object.keys(filters).forEach(key => {
            if (filters[key]) {
                queryParams.append(key, filters[key]);
            }
        });
        
        const response = await apiRequest(`/vehicles/search?${queryParams.toString()}`);
        return response;
    } catch (error) {
        throw error;
    }
}

export async function getVehicleDetails(vehicleId) {
    try {
        const response = await apiRequest(`/vehicles/${vehicleId}`);
        return response;
    } catch (error) {
        throw error;
    }
}

export async function createVehicle(vehicleData) {
    try {
        const response = await apiRequest('/vehicles', 'POST', vehicleData);
        return response;
    } catch (error) {
        throw error;
    }
}

export async function updateVehicle(vehicleId, vehicleData) {
    try {
        const response = await apiRequest(`/vehicles/${vehicleId}`, 'PUT', vehicleData);
        return response;
    } catch (error) {
        throw error;
    }
}

export async function deleteVehicle(vehicleId) {
    try {
        const response = await apiRequest(`/vehicles/${vehicleId}`, 'DELETE');
        return response;
    } catch (error) {
        throw error;
    }
}

export async function uploadVehicleImage(vehicleId, file) {
    try {
        const response = await uploadFile(`/vehicles/${vehicleId}/images`, file);
        return response;
    } catch (error) {
        throw error;
    }
}

export async function getUserVehicles() {
    try {
        const response = await apiRequest('/vehicles/my-vehicles');
        return response.vehicles;
    } catch (error) {
        throw error;
    }
}

// Cambiar disponibilidad de vehículo
export async function toggleVehicleAvailability(vehicleId, isAvailable) {
    try {
        const response = await apiRequest(`/vehicles/${vehicleId}/availability`, 'PATCH', { isAvailable });
        return response.vehicle;
    } catch (error) {
        throw error;
    }
}