import { formatCurrency } from '../../utils/helpers.js';

export default class VehicleCard {
    constructor(vehicle, isOwner = false, callbacks = {}) {
        this.vehicle = vehicle;
        this.isOwner = isOwner;
        this.callbacks = callbacks; // { onEdit, onDelete, onToggleAvailability }
    }

    renderRatingStars() {
        const rating = this.vehicle.stats?.rating || 0;
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        let stars = '';
        
        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars += '<span class="star full">★</span>';
            } else if (i === fullStars && hasHalfStar) {
                stars += '<span class="star half">★</span>';
            } else {
                stars += '<span class="star empty">★</span>';
            }
        }
        
        return `<div class="vehicle-rating">${stars} (${rating.toFixed(1)})</div>`;
    }

    renderAvailabilityBadge() {
        return this.vehicle.isAvailable 
            ? '<span class="badge available">Disponible</span>'
            : '<span class="badge unavailable">No disponible</span>';
    }

    renderOwnerActions() {
        if (!this.isOwner) return '';
        
        return `
            <div class="vehicle-actions">
                <button class="btn btn-outline edit-btn">Editar</button>
                <button class="btn btn-${this.vehicle.isAvailable ? 'warning' : 'success'} toggle-availability-btn">
                    ${this.vehicle.isAvailable ? 'Deshabilitar' : 'Habilitar'}
                </button>
                <button class="btn btn-danger delete-btn">Eliminar</button>
            </div>
        `;
    }

    renderRenterActions() {
        if (this.isOwner || !this.vehicle.isAvailable) return '';
        
        return `
            <div class="vehicle-actions">
                <button class="btn btn-primary rent-btn">Reservar</button>
                <button class="btn btn-outline details-btn">Detalles</button>
            </div>
        `;
    }

    render() {
        const card = document.createElement('div');
        card.className = 'vehicle-card';
        
        // Usar primaryImage o imagen por defecto
        const imageUrl = this.vehicle.primaryImage || 
                        (this.vehicle.images && this.vehicle.images[0]?.url) || 
                        'https://via.placeholder.com/300';
        
        card.innerHTML = `
            <div class="vehicle-image">
                <img src="${imageUrl}" alt="${this.vehicle.fullName || (this.vehicle.make + ' ' + this.vehicle.model)}">
                ${this.renderAvailabilityBadge()}
            </div>
            <div class="vehicle-info">
                <h3 class="vehicle-title">${this.vehicle.make} ${this.vehicle.model} (${this.vehicle.year})</h3>
                <div class="vehicle-details">
                    <div class="vehicle-specs">
                        <p><strong>Ubicación:</strong> ${this.vehicle.location?.city || 'No especificada'}</p>
                        <p><strong>Asientos:</strong> ${this.vehicle.seats}</p>
                        <p><strong>Categoría:</strong> ${this.vehicle.category}</p>
                        ${this.vehicle.transmission ? `<p><strong>Transmisión:</strong> ${this.vehicle.transmission}</p>` : ''}
                    </div>
                    <div class="vehicle-price">
                        <span class="price">${this.vehicle.pricePerDay}€/día</span>
                    </div>
                </div>
                ${this.renderRatingStars()}
            </div>
            ${this.renderOwnerActions()}
            ${this.renderRenterActions()}
        `;
        
        // Event listeners
        if (this.isOwner) {
            const editBtn = card.querySelector('.edit-btn');
            const deleteBtn = card.querySelector('.delete-btn');
            const toggleBtn = card.querySelector('.toggle-availability-btn');
            
            if (editBtn) editBtn.addEventListener('click', () => this.handleEdit());
            if (deleteBtn) deleteBtn.addEventListener('click', () => this.handleDelete());
            if (toggleBtn) toggleBtn.addEventListener('click', () => this.handleToggleAvailability());
        } else if (this.vehicle.isAvailable) {
            const rentBtn = card.querySelector('.rent-btn');
            const detailsBtn = card.querySelector('.details-btn');
            
            if (rentBtn) rentBtn.addEventListener('click', () => this.handleRent());
            if (detailsBtn) detailsBtn.addEventListener('click', () => this.handleDetails());
        }
        
        return card;
    }

    handleEdit() {
        if (this.callbacks.onEdit) {
            this.callbacks.onEdit(this.vehicle);
        }
    }

    handleDelete() {
        if (this.callbacks.onDelete) {
            this.callbacks.onDelete(this.vehicle._id);
        }
    }

    handleToggleAvailability() {
        if (this.callbacks.onToggleAvailability) {
            this.callbacks.onToggleAvailability(this.vehicle._id, !this.vehicle.isAvailable);
        }
    }

    handleRent() {
        console.log('Reservar vehículo', this.vehicle._id);
    }

    handleDetails() {
        console.log('Ver detalles del vehículo', this.vehicle._id);
    }
}