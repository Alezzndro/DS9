import { formatCurrency, formatDate } from '../../utils/helpers.js';
import { getUserData } from '../../services/authService.js';
import { createReservation } from '../../services/reservationService.js';
import Notification from '../common/Notification.js';

export default class VehicleDetail {
    constructor(vehicle) {
        this.vehicle = vehicle || {
            id: '1',
            make: 'Toyota',
            model: 'Corolla',
            year: '2020',
            pricePerDay: 50,
            seats: 5,
            doors: 4,
            transmission: 'Automática',
            fuelType: 'Gasolina',
            mileage: 25000,
            location: 'Madrid',
            rating: 4.5,
            reviews: [],
            images: [],
            owner: {
                name: 'Carlos Martínez',
                joinDate: '2021-03-10',
                rating: 4.8
            },
            features: []
        };

        // Normalizar datos para compatibilidad con MongoDB
        this.normalizeVehicleData();

        this.state = {
            currentImageIndex: 0,
            startDate: '',
            endDate: '',
            totalPrice: 0
        };
    }

    normalizeVehicleData() {
        // Manejar ubicación (puede ser objeto o string)
        if (typeof this.vehicle.location === 'object' && this.vehicle.location) {
            const location = this.vehicle.location;
            this.vehicle.locationText = `${location.city || ''}, ${location.state || ''}`.replace(/, $/, '');
        } else {
            this.vehicle.locationText = this.vehicle.location || 'Ubicación no especificada';
        }

        // Manejar owner (puede tener estructura diferente)
        if (this.vehicle.owner && typeof this.vehicle.owner === 'object') {
            const owner = this.vehicle.owner;
            this.vehicle.ownerName = owner.fullName || `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || owner.name || 'Propietario';
            this.vehicle.ownerEmail = owner.email || '';
        } else {
            this.vehicle.ownerName = 'Propietario';
            this.vehicle.ownerEmail = '';
        }

        // Manejar imágenes
        if (!this.vehicle.images || this.vehicle.images.length === 0) {
            this.vehicle.images = [this.vehicle.image || 'https://via.placeholder.com/600x400?text=Sin+imagen'];
        }

        // Manejar disponibilidad
        if (this.vehicle.isAvailable !== undefined) {
            this.vehicle.available = this.vehicle.isAvailable;
        }

        // Asegurar que rating sea número
        this.vehicle.rating = this.vehicle.rating || 0;
        
        // Asegurar que features sea array
        this.vehicle.features = this.vehicle.features || [];
    }

    calculateTotalPrice() {
        if (!this.state.startDate || !this.state.endDate) return 0;
        const start = new Date(this.state.startDate);
        const end = new Date(this.state.endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        return days * this.vehicle.pricePerDay;
    }

    handleDateChange(e) {
        this.state[e.target.name] = e.target.value;

        if (this.state.startDate && this.state.endDate) {
            this.state.totalPrice = this.calculateTotalPrice();
            this.updatePriceDisplay();
        }
    }

    updatePriceDisplay() {
        const priceElement = this.detailElement.querySelector('.total-price');
        if (priceElement) {
            priceElement.textContent = formatCurrency(this.state.totalPrice);
        }
    }

    async handleBookNow() {
        if (!this.state.startDate || !this.state.endDate) {
            alert('Por favor selecciona las fechas de alquiler');
            return;
        }

        // Validar fechas en frontend
        const today = new Date();
        const start = new Date(this.state.startDate);
        if (start < today.setHours(0,0,0,0)) {
            alert('La fecha de inicio no puede ser en el pasado');
            return;
        }

        try {
            const reservation = await createReservation(
                this.vehicle._id || this.vehicle.id,
                this.state.startDate,
                this.state.endDate,
                this.vehicle.locationText, // pickupLocation
                this.vehicle.locationText  // returnLocation (puedes cambiarlo si tienes otra lógica)
            );

            if (reservation && reservation._id) {
                alert('Reserva creada. Ahora puedes pagar.');
                // Aquí puedes mostrar el botón "Pagar ahora"
            } else {
                alert('No se pudo crear la reserva');
            }
        } catch (err) {
            alert('Error al crear la reserva: ' + err.message);
        }
    }

    handleImageChange(index) {
        this.state.currentImageIndex = index;
        this.updateMainImage();
    }

    updateMainImage() {
        const mainImage = this.detailElement.querySelector('.main-image');
        const images = Array.isArray(this.vehicle.images) && this.vehicle.images.length > 0
            ? this.vehicle.images
            : ['https://dummyimage.com/800x500/cccccc/000000&text=Sin+imagen'];
        if (mainImage) {
            mainImage.src = images[this.state.currentImageIndex];
        }
    }

    renderImageGallery() {
        const gallery = document.createElement('div');
        gallery.className = 'image-gallery';

        const images = Array.isArray(this.vehicle.images) && this.vehicle.images.length > 0
            ? this.vehicle.images
            : ['https://dummyimage.com/800x500/cccccc/000000&text=Sin+imagen'];

        const mainImage = document.createElement('img');
        mainImage.className = 'main-image';
        mainImage.src = images[this.state.currentImageIndex];
        gallery.appendChild(mainImage);

        const thumbnails = document.createElement('div');
        thumbnails.className = 'thumbnails';

        images.forEach((image, index) => {
            const thumb = document.createElement('img');
            thumb.src = image;
            thumb.alt = `Thumbnail ${index + 1}`;
            if (index === this.state.currentImageIndex) {
                thumb.classList.add('active');
            }

            thumb.addEventListener('click', () => this.handleImageChange(index));
            thumbnails.appendChild(thumb);
        });

        gallery.appendChild(thumbnails);
        return gallery;
    }

    renderBookingForm() {
        const form = document.createElement('div');
        form.className = 'booking-form';
        form.innerHTML = `
            <h3>Reservar este vehículo</h3>
            <div class="price-per-day">
                <span>${formatCurrency(this.vehicle.pricePerDay)}</span> por día
            </div>
            <div class="form-group">
                <label for="startDate">Fecha de inicio</label>
                <input type="date" id="startDate" name="startDate" min="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
                <label for="endDate">Fecha de fin</label>
                <input type="date" id="endDate" name="endDate" min="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="total-price-container">
                <strong>Total estimado:</strong>
                <span class="total-price">${formatCurrency(0)}</span>
            </div>
            <button class="btn btn-primary book-now-btn">Reservar ahora</button>
            <button class="btn btn-success pay-now-btn" style="margin-left:10px;">Pagar ahora</button>
        `;

        form.querySelector('#startDate').addEventListener('change', (e) => this.handleDateChange(e));
        form.querySelector('#endDate').addEventListener('change', (e) => this.handleDateChange(e));
        form.querySelector('.book-now-btn').addEventListener('click', () => this.handleBookNow());
        form.querySelector('.pay-now-btn').addEventListener('click', () => this.handleBookNow());

        return form;
    }

    renderFeatures() {
        const featuresList = document.createElement('ul');
        featuresList.className = 'features-list';

        (this.vehicle.features || []).forEach(feature => {
            const li = document.createElement('li');
            li.textContent = feature;
            featuresList.appendChild(li);
        });

        return featuresList;
    }

    renderReviews() {
        const reviewsSection = document.createElement('div');
        reviewsSection.className = 'reviews-section';

        const reviews = Array.isArray(this.vehicle.reviews) ? this.vehicle.reviews : [];

        const title = document.createElement('h3');
        title.textContent = `Reseñas (${reviews.length})`;
        reviewsSection.appendChild(title);

        const averageRating = document.createElement('div');
        averageRating.className = 'average-rating';
        averageRating.innerHTML = `
            <span class="rating">${this.vehicle.rating || 0}</span>
            ${'★'.repeat(Math.floor(this.vehicle.rating || 0))}${(this.vehicle.rating || 0) % 1 >= 0.5 ? '½' : ''}
        `;
        reviewsSection.appendChild(averageRating);

        reviews.forEach(review => {
            const reviewElement = document.createElement('div');
            reviewElement.className = 'review';
            reviewElement.innerHTML = `
                <div class="review-header">
                    <span class="review-user">${review.user}</span>
                    <span class="review-rating">${'★'.repeat(review.rating)}</span>
                    <span class="review-date">${formatDate(review.date)}</span>
                </div>
                <div class="review-comment">${review.comment}</div>
            `;
            reviewsSection.appendChild(reviewElement);
        });

        return reviewsSection;
    }

    renderOwnerInfo() {
        const ownerInfo = document.createElement('div');
        ownerInfo.className = 'owner-info';

        ownerInfo.innerHTML = `
            <h3>Propietario</h3>
            <div class="owner-details">
                <div class="owner-avatar">${this.vehicle.ownerName.charAt(0).toUpperCase()}</div>
                <div class="owner-text">
                    <h4>${this.vehicle.ownerName}</h4>
                    <p>Miembro desde ${this.vehicle.owner?.joinDate ? formatDate(this.vehicle.owner.joinDate) : this.vehicle.owner?.createdAt ? formatDate(this.vehicle.owner.createdAt) : 'N/A'}</p>
                    <p>Calificación: ${this.vehicle.owner?.rating || 'Sin calificaciones'} ${this.vehicle.owner?.rating ? '★' : ''}</p>
                </div>
            </div>
        `;

        return ownerInfo;
    }

    render() {
        this.detailElement = document.createElement('div');
        this.detailElement.className = 'vehicle-detail';

        const detailHeader = document.createElement('div');
        detailHeader.className = 'detail-header';
        detailHeader.innerHTML = `
            <h1>${this.vehicle.make} ${this.vehicle.model} (${this.vehicle.year})</h1>
            <p class="location">📍 ${this.vehicle.locationText}</p>
            <div class="vehicle-specs">
                <span>👥 ${this.vehicle.seats} asientos</span>
                ${this.vehicle.doors ? `<span>🚪 ${this.vehicle.doors} puertas</span>` : ''}
                ${this.vehicle.transmission ? `<span>⚙️ ${this.vehicle.transmission}</span>` : ''}
                ${this.vehicle.fuelType ? `<span>⛽ ${this.vehicle.fuelType}</span>` : ''}
                ${this.vehicle.mileage ? `<span>📏 ${this.vehicle.mileage} km</span>` : ''}
            </div>
        `;
        this.detailElement.appendChild(detailHeader);

        const detailContent = document.createElement('div');
        detailContent.className = 'detail-content';

        const leftColumn = document.createElement('div');
        leftColumn.className = 'left-column';
        leftColumn.appendChild(this.renderImageGallery());
        leftColumn.appendChild(this.renderFeatures());
        leftColumn.appendChild(this.renderReviews());

        const rightColumn = document.createElement('div');
        rightColumn.className = 'right-column';
        rightColumn.appendChild(this.renderBookingForm());
        rightColumn.appendChild(this.renderOwnerInfo());

        detailContent.appendChild(leftColumn);
        detailContent.appendChild(rightColumn);
        this.detailElement.appendChild(detailContent);

        return this.detailElement;
    }
}
