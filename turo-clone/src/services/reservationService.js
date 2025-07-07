import { apiRequest } from './api.js';

export async function createReservation(vehicleId, startDate, endDate) {
    try {
        const response = await apiRequest('/reservations', 'POST', {
            vehicleId,
            startDate,
            endDate
        });
        return response;
    } catch (error) {
        throw error;
    }
}

export async function getReservations(status = 'all') {
    try {
        const response = await apiRequest(`/reservations?status=${status}`);
        return response;
    } catch (error) {
        throw error;
    }
}

export async function cancelReservation(reservationId) {
    try {
        const response = await apiRequest(`/reservations/${reservationId}/cancel`, 'PATCH');
        return response;
    } catch (error) {
        throw error;
    }
}

export async function completeReservation(reservationId, code) {
    try {
        const response = await apiRequest(`/reservations/${reservationId}/complete`, 'PATCH', { code });
        return response;
    } catch (error) {
        throw error;
    }
}

export async function createReview(reservationId, rating, comment) {
    try {
        const response = await apiRequest(`/reservations/${reservationId}/reviews`, 'POST', {
            rating,
            comment
        });
        return response;
    } catch (error) {
        throw error;
    }
}

export async function getVehicleReviews(vehicleId) {
    try {
        const response = await apiRequest(`/vehicles/${vehicleId}/reviews`);
        return response;
    } catch (error) {
        throw error;
    }
}