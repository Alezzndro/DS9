
import { formatCurrency } from '../../utils/helpers.js';
import VehicleDetail from '../vehicle/VehicleDetail.js';
import Modal from '../common/Modal.js';



export default class VehicleCard {
    constructor(vehicle, isOwner = false, callbacks = {}) {
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
        this.callbacks = callbacks; // Almacenar los callbacks
    }

    renderRatingStars() {
        const rating = this.vehicle.rating || 0;
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
        
        const ratingText = rating > 0 ? `(${rating})` : '(Sin calificaciones)';
        return `<div class="vehicle-rating">${stars} ${ratingText}</div>`;
    }

    renderAvailabilityBadge() {
        return this.vehicle.available 
            ? '<span class="badge available">Disponible</span>'
            : '<span class="badge unavailable">No disponible</span>';
    }

    renderOwnerActions() {
        if (!this.isOwner) return '';
        
        const isAvailable = this.vehicle.isAvailable !== undefined ? this.vehicle.isAvailable : this.vehicle.available;
        const availabilityBtnText = isAvailable ? 'Deshabilitar' : 'Habilitar';
        const availabilityBtnClass = isAvailable ? 'btn-warning' : 'btn-success';
        
        return `
            <div class="vehicle-actions">
                <button class="btn btn-outline edit-btn">Editar</button>
                <button class="btn ${availabilityBtnClass} availability-btn">${availabilityBtnText}</button>
                <button class="btn btn-danger delete-btn">Eliminar</button>
            </div>
        `;
    }

    renderRenterActions() {
        if (this.isOwner) return '';
        
        // Manejar disponibilidad correctamente
        const isAvailable = this.vehicle.isAvailable !== undefined ? this.vehicle.isAvailable : this.vehicle.available;
        
        if (!isAvailable) return '';
        
        return `
            <div class="vehicle-actions">
                <button class="btn btn-outline details-btn">Detalles</button>
            </div>
        `;
    }

    render() {
        const card = document.createElement('div');
        card.className = 'vehicle-card';
        
        // Manejar ubicación que puede ser un objeto o string
        let locationText = 'Sin ubicación';
        if (this.vehicle.location) {
            if (typeof this.vehicle.location === 'object') {
                locationText = `${this.vehicle.location.city || ''}, ${this.vehicle.location.state || ''}`.replace(/, $/, '');
            } else {
                locationText = this.vehicle.location;
            }
        }
        
        // Manejar disponibilidad
        const isAvailable = this.vehicle.isAvailable !== undefined ? this.vehicle.isAvailable : this.vehicle.available;
        
        // Carrusel de imágenes
        let images = this.vehicle.images && this.vehicle.images.length > 0
            ? this.vehicle.images.map(img => img.url)
            : [this.vehicle.image || '/assets/css/placeholder-car.svg'];

        // Estado del carrusel
        let currentIndex = 0;
        const updateCarousel = () => {
            const imgEl = card.querySelector('.vehicle-carousel-img');
            if (imgEl) {
                imgEl.style.opacity = 0;
                setTimeout(() => {
                    imgEl.src = images[currentIndex];
                    imgEl.style.opacity = 1;
                }, 150);
            }
            const counter = card.querySelector('.vehicle-carousel-counter');
            if (counter) {
                counter.textContent = `${currentIndex + 1} / ${images.length}`;
            }
            // Actualizar dots
            const dots = card.querySelectorAll('.carousel-dot');
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === currentIndex);
            });
        };

        card.innerHTML = `
            <div class="vehicle-image">
                <button class="carousel-arrow left" style="${images.length > 1 ? '' : 'display:none'}" aria-label="Anterior"><span>&#10094;</span></button>
                <img class="vehicle-carousel-img" src="${images[0]}" alt="${this.vehicle.make} ${this.vehicle.model}" onerror="this.src='/assets/css/placeholder-car.svg'" style="transition: opacity 0.3s; opacity:1;">
                <button class="carousel-arrow right" style="${images.length > 1 ? '' : 'display:none'}" aria-label="Siguiente"><span>&#10095;</span></button>
                <div class="vehicle-carousel-counter" style="${images.length > 1 ? '' : 'display:none'}">1 / ${images.length}</div>
                <div class="carousel-dots" style="${images.length > 1 ? '' : 'display:none'}">
                    ${images.map((_, i) => `<span class="carousel-dot${i === 0 ? ' active' : ''}"></span>`).join('')}
                </div>
                ${isAvailable ? '<span class="badge available">Disponible</span>' : '<span class="badge unavailable">No disponible</span>'}
            </div>
            <div class="vehicle-info">
                <h3>${this.vehicle.make} ${this.vehicle.model} (${this.vehicle.year})</h3>
                <p><strong>Ubicación:</strong> ${locationText}</p>
                <p><strong>Asientos:</strong> ${this.vehicle.seats}</p>
                <p><strong>Precio por día:</strong> ${formatCurrency(this.vehicle.pricePerDay)} €</p>
                ${this.renderRatingStars()}
            </div>
            ${this.renderOwnerActions()}
            ${this.renderRenterActions()}
        `;

        // Agregar listeners para flechas
        setTimeout(() => {
            const leftBtn = card.querySelector('.carousel-arrow.left');
            const rightBtn = card.querySelector('.carousel-arrow.right');
            const dots = card.querySelectorAll('.carousel-dot');
            if (leftBtn) {
                leftBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    currentIndex = (currentIndex - 1 + images.length) % images.length;
                    updateCarousel();
                });
            }
            if (rightBtn) {
                rightBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    currentIndex = (currentIndex + 1) % images.length;
                    updateCarousel();
                });
            }
            // Dots interaction
            dots.forEach((dot, i) => {
                dot.addEventListener('click', (e) => {
                    e.stopPropagation();
                    currentIndex = i;
                    updateCarousel();
                });
            });
        }, 0);
        
        // Event listeners
        if (this.isOwner) {
            const editBtn = card.querySelector('.edit-btn');
            const deleteBtn = card.querySelector('.delete-btn');
            const availabilityBtn = card.querySelector('.availability-btn');
            
            if (editBtn) {
                editBtn.addEventListener('click', () => this.handleEdit());
            }
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => this.handleDelete());
            }
            if (availabilityBtn) {
                availabilityBtn.addEventListener('click', () => this.handleToggleAvailability());
            }
        } else if (isAvailable) {
            const rentBtn = card.querySelector('.rent-btn');
            const detailsBtn = card.querySelector('.details-btn');
            
            if (rentBtn) {
                rentBtn.addEventListener('click', () => this.handleRent());
            }
            if (detailsBtn) {
                detailsBtn.addEventListener('click', () => this.handleDetails());
            }
        }
        
        return card;
    }

    handleEdit() {
        console.log('Editar vehículo', this.vehicle._id || this.vehicle.id);
        if (this.callbacks.onEdit) {
            this.callbacks.onEdit(this.vehicle);
        }
    }

    handleDelete() {
        console.log('Eliminar vehículo', this.vehicle._id || this.vehicle.id);
        if (this.callbacks.onDelete) {
            this.callbacks.onDelete(this.vehicle._id || this.vehicle.id);
        }
    }

    handleToggleAvailability() {
        const currentAvailability = this.vehicle.isAvailable !== undefined ? this.vehicle.isAvailable : this.vehicle.available;
        const newAvailability = !currentAvailability;
        
        console.log('Cambiar disponibilidad:', currentAvailability, '->', newAvailability);
        
        if (this.callbacks.onToggleAvailability) {
            this.callbacks.onToggleAvailability(this.vehicle._id || this.vehicle.id, newAvailability);
        }
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
