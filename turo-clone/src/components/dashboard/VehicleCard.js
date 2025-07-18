
import { formatCurrency } from '../../utils/helpers.js';
import VehicleDetail from '../vehicle/VehicleDetail.js';
import Modal from '../common/Modal.js';



export default class VehicleCard {
    constructor(vehicle, isOwner = false) {
        this.vehicle = vehicle || {
            id: '1',
            make: 'Toyota',
            model: 'Corolla',
            year: '2020',
            pricePerDay: 50,
            seats: 5,
            location: 'Madrid',
            rating: 4.5,
            image: 'https://via.placeholder.com/300',
            images: ['https://via.placeholder.com/300'], // <-- Añadir esto
            available: true
        };
        this.isOwner = isOwner;
    }

    renderRatingStars() {
        const fullStars = Math.floor(this.vehicle.rating);
        const hasHalfStar = this.vehicle.rating % 1 >= 0.5;
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
        
        return `<div class="vehicle-rating">${stars} (${this.vehicle.rating})</div>`;
    }

    renderAvailabilityBadge() {
        return this.vehicle.available 
            ? '<span class="badge available">Disponible</span>'
            : '<span class="badge unavailable">No disponible</span>';
    }

    renderOwnerActions() {
        if (!this.isOwner) return '';
        
        return `
            <div class="vehicle-actions">
                <button class="btn btn-outline edit-btn">Editar</button>
                <button class="btn btn-danger delete-btn">Eliminar</button>
            </div>
        `;
    }

    renderRenterActions() {
        if (this.isOwner || !this.vehicle.available) return '';
        
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
        card.innerHTML = `
            <div class="vehicle-image">
                <img src="${this.vehicle.image}" alt="${this.vehicle.make} ${this.vehicle.model}">
                ${this.renderAvailabilityBadge()}
            </div>
            <div class="vehicle-info">
                <h3>${this.vehicle.make} ${this.vehicle.model} (${this.vehicle.year})</h3>
                <p><strong>Ubicación:</strong> ${this.vehicle.location}</p>
                <p><strong>Asientos:</strong> ${this.vehicle.seats}</p>
                <p><strong>Precio por día:</strong> ${formatCurrency(this.vehicle.pricePerDay)}</p>
                ${this.renderRatingStars()}
            </div>
            ${this.renderOwnerActions()}
            ${this.renderRenterActions()}
        `;
        
        // Event listeners
        if (this.isOwner) {
            card.querySelector('.edit-btn').addEventListener('click', () => this.handleEdit());
            card.querySelector('.delete-btn').addEventListener('click', () => this.handleDelete());
        } else if (this.vehicle.available) {
            card.querySelector('.rent-btn').addEventListener('click', () => this.handleRent());
            card.querySelector('.details-btn').addEventListener('click', () => this.handleDetails());
        }
        
        return card;
    }

    handleEdit() {
        console.log('Editar vehículo', this.vehicle.id);
    }

    handleDelete() {
        console.log('Eliminar vehículo', this.vehicle.id);
    }

    handleRent() {
        console.log('Reservar vehículo', this.vehicle.id);
    }

    handleDetails() {
    const vehicleDetail = new VehicleDetail(this.vehicle);
    const modal = new Modal(
        `${this.vehicle.make} ${this.vehicle.model}`,
        vehicleDetail.render()
    );
    document.body.appendChild(modal.render());
}

}
