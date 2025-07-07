import { formatDate, formatCurrency } from '../../utils/helpers.js';

export default class ReservationCard {
    constructor(reservation) {
        this.reservation = reservation || {
            id: '1',
            vehicle: {
                make: 'Toyota',
                model: 'Corolla',
                year: '2020',
                image: 'https://via.placeholder.com/300'
            },
            dates: {
                start: '2023-06-15',
                end: '2023-06-20'
            },
            total: 250,
            status: 'active'
        };
    }

    renderStatusBadge() {
        const status = this.reservation.status;
        const statusMap = {
            active: { class: 'badge-active', text: 'Activa' },
            completed: { class: 'badge-completed', text: 'Completada' },
            cancelled: { class: 'badge-cancelled', text: 'Cancelada' },
            pending: { class: 'badge-pending', text: 'Pendiente' }
        };
        
        return `<span class="badge ${statusMap[status].class}">${statusMap[status].text}</span>`;
    }

    renderActions() {
        if (this.reservation.status === 'active') {
            return `
                <button class="btn btn-outline cancel-btn">Cancelar</button>
                <button class="btn btn-primary contact-btn">Contactar</button>
            `;
        } else if (this.reservation.status === 'completed') {
            return `
                <button class="btn btn-outline review-btn">Dejar reseña</button>
            `;
        }
        return '';
    }

    render() {
        const card = document.createElement('div');
        card.className = 'reservation-card';
        card.innerHTML = `
            <div class="reservation-image">
                <img src="${this.reservation.vehicle.image}" alt="${this.reservation.vehicle.make} ${this.reservation.vehicle.model}">
            </div>
            <div class="reservation-details">
                <h3>${this.reservation.vehicle.make} ${this.reservation.vehicle.model} (${this.reservation.vehicle.year})</h3>
                ${this.renderStatusBadge()}
                <div class="reservation-dates">
                    <p><strong>Desde:</strong> ${formatDate(this.reservation.dates.start)}</p>
                    <p><strong>Hasta:</strong> ${formatDate(this.reservation.dates.end)}</p>
                </div>
                <div class="reservation-total">
                    <p><strong>Total:</strong> ${formatCurrency(this.reservation.total)}</p>
                </div>
                <div class="reservation-actions">
                    ${this.renderActions()}
                </div>
            </div>
        `;
        
        // Agregar event listeners para los botones de acción
        const cancelBtn = card.querySelector('.cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.handleCancel());
        }
        
        const reviewBtn = card.querySelector('.review-btn');
        if (reviewBtn) {
            reviewBtn.addEventListener('click', () => this.handleReview());
        }
        
        return card;
    }

    handleCancel() {
        // Lógica para cancelar reserva
        console.log('Cancelar reserva', this.reservation.id);
    }

    handleReview() {
        // Lógica para dejar reseña
        console.log('Dejar reseña para reserva', this.reservation.id);
    }
}