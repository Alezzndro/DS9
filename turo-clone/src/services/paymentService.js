import { apiRequest } from './api.js';

export async function createCheckoutSession({ vehicleId, startDate, endDate, total }) {
    try {
        const response = await apiRequest('/create-checkout-session', {
            method: 'POST',
            body: { vehicleId, startDate, endDate, total }
        });

        return response.url; // URL del checkout de Stripe
    } catch (error) {
        console.error('Error al crear la sesión de Stripe:', error);
        throw error;
    }
}
