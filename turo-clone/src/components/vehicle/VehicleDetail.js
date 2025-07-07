import { formatCurrency, formatDate } from '../../utils/helpers.js';
import ReviewForm from './ReviewForm.js';

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
            reviews: [
                {
                    user: 'Juan Pérez',
                    rating: 5,
                    comment: 'Excelente vehículo, muy cómodo y económico.',
                    date: '2023-05-15'
                },
                {
                    user: 'Ana García',
                    rating: 4,
                    comment: 'Buen coche, pero el aire acondicionado podría funcionar mejor.',
                    date: '2023-04-22'
                }
            ],
            images: [
                'https://via.placeholder.com/800x500?text=Toyota+Corolla+1',
                'https://via.placeholder.com/800x500?text=Toyota+Corolla+2',
                'https://via.placeholder.com/800x500?text=Toyota+Corolla+3'
            ],
            owner: {
                name: 'Carlos Martínez',
                joinDate: '2021-03-10',
                rating: 4.8
            },
            features: ['Aire acondicionado', 'Bluetooth', 'Cámara de retroceso', 'Control de crucero']
        };
        
        this.state = {
            currentImageIndex: 0,
            startDate: '',
            endDate: '',
            totalPrice: 0
        };
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

    handleBookNow() {
        if (!this.state.startDate || !this.state.endDate) {
            alert('Por favor selecciona las fechas de alquiler');
            return;
        }
        
        console.log('Reservando vehículo', {
            vehicleId: this.vehicle.id,
            startDate: this.state.startDate,
            endDate: this.state.endDate,
            totalPrice: this.state.totalPrice
        });
        
        // Aquí iría la navegación al proceso de pago
    }

    handleImageChange(index) {
        this.state.currentImageIndex = index;
        this.updateMainImage();
    }

    updateMainImage() {
        const mainImage = this.detailElement.querySelector('.main-image');
        if (mainImage) {
            mainImage.src = this.vehicle.images[this.state.currentImageIndex];
        }
    }

    renderImageGallery() {
        const gallery = document.createElement('div');
        gallery.className = 'image-gallery';
        
        const mainImage = document.createElement('img');
        mainImage.className = 'main-image';
        mainImage.src = this.vehicle.images[this.state.currentImageIndex];
        gallery.appendChild(mainImage);
        
        const thumbnails = document.createElement('div');
        thumbnails.className = 'thumbnails';
        
        this.vehicle.images.forEach((image, index) => {
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
                <input type="date" id="startDate" name="startDate" 
                    min="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
                <label for="endDate">Fecha de fin</label>
                <input type="date" id="endDate" name="endDate" 
                    min="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="total-price-container">
                <strong>Total estimado:</strong>
                <span class="total-price">${formatCurrency(0)}</span>
            </div>
            <button class="btn btn-primary book-now-btn">Reservar ahora</button>
        `;
        
        form.querySelector('#startDate').addEventListener('change', (e) => this.handleDateChange(e));
        form.querySelector('#endDate').addEventListener('change', (e) => this.handleDateChange(e));
        form.querySelector('.book-now-btn').addEventListener('click', () => this.handleBookNow());
        
        return form;
    }

    renderFeatures() {
        const featuresList = document.createElement('ul');
        featuresList.className = 'features-list';
        
        this.vehicle.features.forEach(feature => {
            const li = document.createElement('li');
            li.textContent = feature;
            featuresList.appendChild(li);
        });
        
        return featuresList;
    }

    renderReviews() {
        const reviewsSection = document.createElement('div');
        reviewsSection.className = 'reviews-section';
        
        const title = document.createElement('h3');
        title.textContent = `Reseñas (${this.vehicle.reviews.length})`;
        reviewsSection.appendChild(title);
        
        const averageRating = document.createElement('div');
        averageRating.className = 'average-rating';
        averageRating.innerHTML = `
            <span class="rating">${this.vehicle.rating}</span>
            ${'★'.repeat(Math.floor(this.vehicle.rating))}${this.vehicle.rating % 1 >= 0.5 ? '½' : ''}
        `;
        reviewsSection.appendChild(averageRating);
        
        this.vehicle.reviews.forEach(review => {
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
                <div class="owner-avatar">${this.vehicle.owner.name.charAt(0)}</div>
                <div class="owner-text">
                    <h4>${this.vehicle.owner.name}</h4>
                    <p>Miembro desde ${formatDate(this.vehicle.owner.joinDate)}</p>
                    <p>Calificación: ${this.vehicle.owner.rating} ★</p>
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
            <p class="location">${this.vehicle.location}</p>
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