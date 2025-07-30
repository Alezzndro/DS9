import { formatDate, formatCurrency } from '../../utils/helpers.js';
import { cancelReservation } from '../../services/reservationService.js';
import { startStripeCheckout } from '../../services/stripeService.js';
import Notification from '../common/Notification.js';

export default class ReservationCard {
    constructor(reservation, onUpdate = null) {
        this.reservation = reservation;
        this.onUpdate = onUpdate; // Callback para actualizar la lista cuando se modifica una reserva
    }

    getVehicleImage() {
        // Si hay fotos, usar la primera, sino usar placeholder
        if (this.reservation.vehicle.photos && this.reservation.vehicle.photos.length > 0) {
            return this.reservation.vehicle.photos[0];
        }
        return 'https://via.placeholder.com/300x200?text=Sin+Imagen';
    }

    renderStatusBadge() {
        const status = this.reservation.status;
        const statusMap = {
            pending: { class: 'badge-pending', text: 'Pendiente' },
            confirmed: { class: 'badge-confirmed', text: 'Confirmada' },
            active: { class: 'badge-active', text: 'Activa' },
            completed: { class: 'badge-completed', text: 'Completada' },
            cancelled: { class: 'badge-cancelled', text: 'Cancelada' }
        };
        
        const statusInfo = statusMap[status] || { class: 'badge-pending', text: status };
        return `<span class="badge ${statusInfo.class}">${statusInfo.text}</span>`;
    }

    renderUserRole() {
        // Determinar si el usuario actual es el huésped o el anfitrión
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const isGuest = this.reservation.guest._id === currentUser._id;
        const role = isGuest ? 'Huésped' : 'Anfitrión';
        
        return `
            <div class="reservation-role">
                <p><strong>Tu rol:</strong> ${role}</p>
            </div>
        `;
    }

    renderPickupCodes() {
        if (this.reservation.status === 'confirmed' || this.reservation.status === 'active') {
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const isGuest = this.reservation.guest._id === currentUser._id;
            
            return `
                <div class="reservation-codes">
                    ${isGuest ? `<p><strong>Código de recogida:</strong> ${this.reservation.pickupCode}</p>` : ''}
                    ${this.reservation.status === 'active' && isGuest ? `<p><strong>Código de devolución:</strong> ${this.reservation.returnCode}</p>` : ''}
                </div>
            `;
        }
        return '';
    }

    renderActions() {
        let actions = '';
        if (this.reservation.paymentStatus === 'pending') {
            actions += `<button class="btn btn-primary pay-now-btn">Pagar ahora</button>`;
            actions += `<button class="btn btn-danger cancel-btn">Cancelar</button>`;
        } else if (this.reservation.paymentStatus === 'paid') {
            actions += `<span class="paid-label">Pago completado</span>`;
        }
        return actions;
    }

    render() {
        const card = document.createElement('div');
        card.className = 'reservation-card';
        card.innerHTML = `
            <div class="reservation-image">
                <img src="${this.getVehicleImage()}" alt="${this.reservation.vehicle.make} ${this.reservation.vehicle.model}">
            </div>
            <div class="reservation-details">
                <h3>${this.reservation.vehicle.make} ${this.reservation.vehicle.model} ${this.reservation.vehicle.year}</h3>
                ${this.renderStatusBadge()}
                ${this.renderUserRole()}
                <div class="reservation-dates">
                    <p><strong>Desde:</strong> ${formatDate(this.reservation.startDate)}</p>
                    <p><strong>Hasta:</strong> ${formatDate(this.reservation.endDate)}</p>
                </div>
                ${this.renderPickupCodes()}
                <div class="reservation-total">
                    <p><strong>Total:</strong> ${formatCurrency(this.reservation.totalPrice)}</p>
                </div>
                ${this.reservation.notes ? `<div class="reservation-notes"><p><strong>Notas:</strong> ${this.reservation.notes}</p></div>` : ''}
                <div class="reservation-actions">
                    ${this.renderActions()}
                </div>
            </div>
        `;
        
        // Agregar event listeners para los botones de acción
        this.attachEventListeners(card);
        
        return card;
    }

    attachEventListeners(card) {
        const cancelBtn = card.querySelector('.cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.handleCancel());
        }
        
        const reviewBtn = card.querySelector('.review-btn');
        if (reviewBtn) {
            reviewBtn.addEventListener('click', () => this.handleReview());
        }

        const startBtn = card.querySelector('.start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.handleStart());
        }

        const completeBtn = card.querySelector('.complete-btn');
        if (completeBtn) {
            completeBtn.addEventListener('click', () => this.handleComplete());
        }

        const confirmBtn = card.querySelector('.confirm-btn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.handleConfirm());
        }

        const payNowBtn = card.querySelector('.pay-now-btn');
        if (payNowBtn) {
            payNowBtn.addEventListener('click', () => startStripeCheckout(this.reservation._id));
        }
    }

    async handleCancel() {
        if (confirm('¿Estás seguro de que quieres cancelar esta reserva?')) {
            try {
                await cancelReservation(this.reservation._id);
                new Notification('Reserva cancelada exitosamente', 'success');
                if (this.onUpdate) {
                    this.onUpdate();
                }
            } catch (error) {
                console.error('Error al cancelar reserva:', error);
                new Notification('Error al cancelar la reserva', 'error');
            }
        }
    }

    handleReview() {
        // TODO: Implementar modal de reseñas
        console.log('Dejar reseña para reserva', this.reservation._id);
        Notification.show('Función de reseñas en desarrollo', 'info');
    }

    handleStart() {
        // TODO: Implementar inicio de reserva con código
        const code = prompt('Ingresa el código de recogida:');
        if (code) {
            console.log('Iniciar reserva con código:', code);
            Notification.show('Función de inicio de reserva en desarrollo', 'info');
        }
    }

    handleComplete() {
        // TODO: Implementar completar reserva con código
        const code = prompt('Ingresa el código de devolución:');
        if (code) {
            console.log('Completar reserva con código:', code);
            Notification.show('Función de completar reserva en desarrollo', 'info');
        }
    }

    handleConfirm() {
        // TODO: Implementar confirmación de reserva por anfitrión
        console.log('Confirmar reserva', this.reservation._id);
        Notification.show('Función de confirmación en desarrollo', 'info');
    }
}