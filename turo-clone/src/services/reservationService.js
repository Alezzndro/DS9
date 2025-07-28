import { apiRequest } from './api.js';

export async function createReservation(vehicleId, startDate, endDate, pickupLocation, returnLocation, notes = '', completedDirectPay = false) {
    const res = await fetch('http://localhost:5000/api/reservations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('turo_clone_token')}`
        },
        body: JSON.stringify({
            vehicleId,
            startDate,
            endDate,
            pickupLocation,
            returnLocation,
            notes,
            completedDirectPay // <-- nuevo campo
        })
    });
    if (!res.ok) throw new Error('Error al crear la reserva');
    return await res.json();
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
    const res = await fetch(`http://localhost:5000/api/reservations/${reservationId}/cancel`, {
        method: 'PATCH',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
    });
    if (!res.ok) throw new Error('No se pudo cancelar la reserva');
    return await res.json();
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