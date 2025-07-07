import Notification from '../common/Notification.js';

export default class ReviewForm {
    constructor(vehicleId, reservationId) {
        this.vehicleId = vehicleId;
        this.reservationId = reservationId;
        this.state = {
            rating: 0,
            comment: '',
            hoverRating: 0
        };
    }

    handleRatingClick(rating) {
        this.state.rating = rating;
        this.updateStars();
    }

    handleRatingHover(rating) {
        this.state.hoverRating = rating;
        this.updateStars();
    }

    handleRatingLeave() {
        this.state.hoverRating = 0;
        this.updateStars();
    }

    updateStars() {
        const stars = this.modal.querySelectorAll('.star');
        const ratingToShow = this.state.hoverRating || this.state.rating;
        
        stars.forEach((star, index) => {
            if (index < ratingToShow) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    handleCommentChange(e) {
        this.state.comment = e.target.value;
    }

    handleSubmit(e) {
        e.preventDefault();
        
        if (this.state.rating === 0) {
            const notification = new Notification('Por favor selecciona una calificación', 'error');
            document.body.appendChild(notification.render());
            return;
        }
        
        // Aquí iría la llamada al API para enviar la review
        console.log('Enviando review:', {
            vehicleId: this.vehicleId,
            reservationId: this.reservationId,
            rating: this.state.rating,
            comment: this.state.comment
        });
        
        const notification = new Notification('¡Gracias por tu reseña!', 'success');
        document.body.appendChild(notification.render());
        
        setTimeout(() => {
            document.body.removeChild(this.modal);
            // Podrías emitir un evento aquí para actualizar la UI
        }, 1500);
    }

    render() {
        this.modal = document.createElement('div');
        this.modal.className = 'modal';
        this.modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Deja tu reseña</h2>
                <form id="reviewForm">
                    <div class="rating-stars">
                        <span class="star" data-rating="1">★</span>
                        <span class="star" data-rating="2">★</span>
                        <span class="star" data-rating="3">★</span>
                        <span class="star" data-rating="4">★</span>
                        <span class="star" data-rating="5">★</span>
                    </div>
                    <div class="form-group">
                        <label for="comment">Comentario (opcional)</label>
                        <textarea id="comment" name="comment" rows="4"></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">Enviar reseña</button>
                </form>
            </div>
        `;
        
        // Event listeners para las estrellas
        this.modal.querySelectorAll('.star').forEach(star => {
            star.addEventListener('click', () => 
                this.handleRatingClick(parseInt(star.dataset.rating)));
            
            star.addEventListener('mouseover', () => 
                this.handleRatingHover(parseInt(star.dataset.rating)));
            
            star.addEventListener('mouseleave', () => 
                this.handleRatingLeave());
        });
        
        // Event listener para el comentario
        this.modal.querySelector('#comment').addEventListener('input', (e) => 
            this.handleCommentChange(e));
        
        // Event listener para el formulario
        this.modal.querySelector('#reviewForm').addEventListener('submit', (e) => 
            this.handleSubmit(e));
        
        // Event listener para cerrar el modal
        this.modal.querySelector('.close-modal').addEventListener('click', () => 
            document.body.removeChild(this.modal));
        
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                document.body.removeChild(this.modal);
            }
        });
        
        return this.modal;
    }
}