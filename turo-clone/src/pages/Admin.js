import Header from '../components/common/Header.js';
import Notification from '../components/common/Notification.js';

export default class Admin {
    constructor() {
        this.header = new Header();
        this.state = {
            activeTab: 'documents',
            pendingDocuments: this.getPendingDocuments(),
            pendingVehicles: this.getPendingVehicles(),
            reportedReviews: this.getReportedReviews()
        };
    }

    getPendingDocuments() {
        // Datos de ejemplo
        return [
            {
                id: '1',
                userId: '101',
                userName: 'Juan Pérez',
                userEmail: 'juan@example.com',
                idDocument: 'https://via.placeholder.com/300?text=ID+Juan',
                licenseDocument: 'https://via.placeholder.com/300?text=License+Juan',
                submittedAt: '2023-06-10T14:30:00Z'
            },
            {
                id: '2',
                userId: '102',
                userName: 'María García',
                userEmail: 'maria@example.com',
                idDocument: 'https://via.placeholder.com/300?text=ID+Maria',
                licenseDocument: 'https://via.placeholder.com/300?text=License+Maria',
                submittedAt: '2023-06-11T10:15:00Z'
            }
        ];
    }

    getPendingVehicles() {
        // Datos de ejemplo
        return [
            {
                id: 'v1',
                userId: '201',
                userName: 'Carlos López',
                make: 'Toyota',
                model: 'Corolla',
                year: '2020',
                submittedAt: '2023-06-09T16:45:00Z'
            },
            {
                id: 'v2',
                userId: '202',
                userName: 'Ana Martínez',
                make: 'BMW',
                model: 'Serie 3',
                year: '2021',
                submittedAt: '2023-06-12T09:20:00Z'
            }
        ];
    }

    getReportedReviews() {
        // Datos de ejemplo
        return [
            {
                id: 'r1',
                vehicleId: 'v1',
                vehicleName: 'Toyota Corolla',
                userId: '301',
                userName: 'Luisa Fernández',
                rating: 1,
                comment: 'El coche estaba en mal estado y el propietario fue muy grosero.',
                reportedAt: '2023-06-08T11:10:00Z'
            }
        ];
    }

    handleTabChange(tab) {
        this.state.activeTab = tab;
        this.renderContent();
    }

    handleDocumentAction(userId, action) {
        // Aquí iría la llamada al API
        console.log(`${action} documentos del usuario ${userId}`);
        
        const notification = new Notification(
            action === 'approve' ? 'Documentos aprobados' : 'Documentos rechazados',
            'success'
        );
        document.body.appendChild(notification.render());
        
        // Actualizar estado
        this.state.pendingDocuments = this.state.pendingDocuments.filter(doc => doc.userId !== userId);
        this.renderContent();
    }

    handleVehicleAction(vehicleId, action) {
        // Aquí iría la llamada al API
        console.log(`${action} vehículo ${vehicleId}`);
        
        const notification = new Notification(
            action === 'approve' ? 'Vehículo aprobado' : 'Vehículo rechazado',
            'success'
        );
        document.body.appendChild(notification.render());
        
        // Actualizar estado
        this.state.pendingVehicles = this.state.pendingVehicles.filter(vehicle => vehicle.id !== vehicleId);
        this.renderContent();
    }

    handleReviewAction(reviewId, action) {
        // Aquí iría la llamada al API
        console.log(`${action} reseña ${reviewId}`);
        
        const notification = new Notification(
            action === 'approve' ? 'Reseña aprobada' : 'Reseña eliminada',
            'success'
        );
        document.body.appendChild(notification.render());
        
        // Actualizar estado
        this.state.reportedReviews = this.state.reportedReviews.filter(review => review.id !== reviewId);
        this.renderContent();
    }

    renderTabs() {
        const tabs = document.createElement('div');
        tabs.className = 'admin-tabs';
        tabs.innerHTML = `
            <button class="tab ${this.state.activeTab === 'documents' ? 'active' : ''}" data-tab="documents">
                Documentos pendientes
                <span class="badge">${this.state.pendingDocuments.length}</span>
            </button>
            <button class="tab ${this.state.activeTab === 'vehicles' ? 'active' : ''}" data-tab="vehicles">
                Vehículos pendientes
                <span class="badge">${this.state.pendingVehicles.length}</span>
            </button>
            <button class="tab ${this.state.activeTab === 'reviews' ? 'active' : ''}" data-tab="reviews">
                Reseñas reportadas
                <span class="badge">${this.state.reportedReviews.length}</span>
            </button>
        `;
        
        tabs.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => 
                this.handleTabChange(tab.dataset.tab));
        });
        
        return tabs;
    }

    renderDocumentsTab() {
        if (this.state.pendingDocuments.length === 0) {
            return this.renderEmptyState('No hay documentos pendientes de revisión');
        }
        
        const container = document.createElement('div');
        container.className = 'documents-container';
        
        this.state.pendingDocuments.forEach(doc => {
            const docElement = document.createElement('div');
            docElement.className = 'document-card';
            docElement.innerHTML = `
                <div class="document-header">
                    <h3>${doc.userName}</h3>
                    <p>${doc.userEmail}</p>
                    <p class="submitted-date">Enviado el ${new Date(doc.submittedAt).toLocaleDateString()}</p>
                </div>
                <div class="document-images">
                    <div class="document-image">
                        <h4>Documento de identidad</h4>
                        <img src="${doc.idDocument}" alt="ID Document">
                    </div>
                    <div class="document-image">
                        <h4>Licencia de conducir</h4>
                        <img src="${doc.licenseDocument}" alt="License Document">
                    </div>
                </div>
                <div class="document-actions">
                    <button class="btn btn-primary approve-btn" data-user-id="${doc.userId}">Aprobar</button>
                    <button class="btn btn-danger reject-btn" data-user-id="${doc.userId}">Rechazar</button>
                </div>
            `;
            
            docElement.querySelector('.approve-btn').addEventListener('click', () => 
                this.handleDocumentAction(doc.userId, 'approve'));
            
            docElement.querySelector('.reject-btn').addEventListener('click', () => 
                this.handleDocumentAction(doc.userId, 'reject'));
            
            container.appendChild(docElement);
        });
        
        return container;
    }

    renderVehiclesTab() {
        if (this.state.pendingVehicles.length === 0) {
            return this.renderEmptyState('No hay vehículos pendientes de aprobación');
        }
        
        const container = document.createElement('div');
        container.className = 'vehicles-container';
        
        this.state.pendingVehicles.forEach(vehicle => {
            const vehicleElement = document.createElement('div');
            vehicleElement.className = 'vehicle-card';
            vehicleElement.innerHTML = `
                <div class="vehicle-info">
                    <h3>${vehicle.make} ${vehicle.model} (${vehicle.year})</h3>
                    <p>Publicado por: ${vehicle.userName}</p>
                    <p class="submitted-date">Enviado el ${new Date(vehicle.submittedAt).toLocaleDateString()}</p>
                </div>
                <div class="vehicle-actions">
                    <button class="btn btn-primary approve-btn" data-vehicle-id="${vehicle.id}">Aprobar</button>
                    <button class="btn btn-danger reject-btn" data-vehicle-id="${vehicle.id}">Rechazar</button>
                    <button class="btn btn-outline details-btn" data-vehicle-id="${vehicle.id}">Ver detalles</button>
                </div>
            `;
            
            vehicleElement.querySelector('.approve-btn').addEventListener('click', () => 
                this.handleVehicleAction(vehicle.id, 'approve'));
            
            vehicleElement.querySelector('.reject-btn').addEventListener('click', () => 
                this.handleVehicleAction(vehicle.id, 'reject'));
            
            vehicleElement.querySelector('.details-btn').addEventListener('click', () => 
                console.log('Ver detalles del vehículo', vehicle.id));
            
            container.appendChild(vehicleElement);
        });
        
        return container;
    }

    renderReviewsTab() {
        if (this.state.reportedReviews.length === 0) {
            return this.renderEmptyState('No hay reseñas reportadas');
        }
        
        const container = document.createElement('div');
        container.className = 'reviews-container';
        
        this.state.reportedReviews.forEach(review => {
            const reviewElement = document.createElement('div');
            reviewElement.className = 'review-card';
            reviewElement.innerHTML = `
                <div class="review-header">
                    <h3>Reseña sobre ${review.vehicleName}</h3>
                    <p>Por: ${review.userName}</p>
                    <p class="reported-date">Reportado el ${new Date(review.reportedAt).toLocaleDateString()}</p>
                </div>
                <div class="review-content">
                    <div class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
                    <p class="review-comment">${review.comment}</p>
                </div>
                <div class="review-actions">
                    <button class="btn btn-primary approve-btn" data-review-id="${review.id}">Aprobar</button>
                    <button class="btn btn-danger reject-btn" data-review-id="${review.id}">Eliminar</button>
                </div>
            `;
            
            reviewElement.querySelector('.approve-btn').addEventListener('click', () => 
                this.handleReviewAction(review.id, 'approve'));
            
            reviewElement.querySelector('.reject-btn').addEventListener('click', () => 
                this.handleReviewAction(review.id, 'reject'));
            
            container.appendChild(reviewElement);
        });
        
        return container;
    }

    renderEmptyState(message) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <p>${message}</p>
        `;
        return emptyState;
    }

    renderContent() {
        const content = document.createElement('div');
        content.className = 'admin-content';
        
        switch (this.state.activeTab) {
            case 'documents':
                content.appendChild(this.renderDocumentsTab());
                break;
            case 'vehicles':
                content.appendChild(this.renderVehiclesTab());
                break;
            case 'reviews':
                content.appendChild(this.renderReviewsTab());
                break;
        }
        
        return content;
    }

    render() {
        const page = document.createElement('div');
        page.className = 'admin-page';
        
        page.appendChild(this.header.render());
        
        const container = document.createElement('div');
        container.className = 'container';
        
        const title = document.createElement('h1');
        title.textContent = 'Panel de Administración';
        container.appendChild(title);
        
        container.appendChild(this.renderTabs());
        container.appendChild(this.renderContent());
        
        page.appendChild(container);
        return page;
    }
}