import Header from '../components/common/Header.js';
import Notification from '../components/common/Notification.js';
import AdminSidebar from '../components/admin/AdminSidebar.js';
import AdminDashboard from '../components/admin/AdminDashboard.js';
import AdminUsers from '../components/admin/AdminUsers.js';
import AdminVehicles from '../components/admin/AdminVehicles.js';
import AdminReservations from '../components/admin/AdminReservations.js';
import AdminAnalytics from '../components/admin/AdminAnalytics.js';
import AdminSettings from '../components/admin/AdminSettings.js';

export default class Admin {
    constructor() {
        this.sidebar = new AdminSidebar();
        this.dashboard = new AdminDashboard();
        this.users = new AdminUsers();
        this.vehicles = new AdminVehicles();
        this.reservations = new AdminReservations();
        this.analytics = new AdminAnalytics();
        this.settings = new AdminSettings();
        this.currentSection = 'dashboard';
        
        // Legacy state for existing functionality
        this.state = {
            activeTab: 'documents',
            pendingDocuments: this.getPendingDocuments(),
            pendingVehicles: this.getPendingVehicles(),
            reportedReviews: this.getReportedReviews()
        };

        // Set up global reference for component communication
        window.adminApp = this;

        // Listen for section changes
        document.addEventListener('admin-section-change', (e) => {
            this.navigateToSection(e.detail.section);
        });
    }

    navigateToSection(section) {
        this.currentSection = section;
        this.sidebar.setActiveSection(section);
        this.renderCurrentSection();
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

    handleUserAction(userId, action) {
        if (this.users && typeof this.users.handleUserAction === 'function') {
            this.users.handleUserAction(userId, action);
        }
    }

    editUser(userId) {
        if (this.users && typeof this.users.editUser === 'function') {
            const user = this.users.users.find(u => u.id === userId);
            if (user) {
                this.users.editUser(user);
            }
        }
    }

    saveUserChanges(userId) {
        if (this.users && typeof this.users.saveUserChanges === 'function') {
            this.users.saveUserChanges(userId);
        }
    }

    saveVehicleChanges(vehicleId) {
        if (this.vehicles && typeof this.vehicles.saveVehicleChanges === 'function') {
            this.vehicles.saveVehicleChanges(vehicleId);
        }
    }

    saveReservationChanges(reservationId) {
        if (this.reservations && typeof this.reservations.saveReservationChanges === 'function') {
            this.reservations.saveReservationChanges(reservationId);
        }
    }

    goToPage(page) {
        if (this.users && typeof this.users.goToPage === 'function') {
            this.users.goToPage(page);
        }
    }

    renderCurrentSection() {
        const contentContainer = document.querySelector('.admin-content');
        if (!contentContainer) return;

        // Clear current content
        contentContainer.innerHTML = '';

        let sectionComponent;
        switch (this.currentSection) {
            case 'dashboard':
                sectionComponent = this.dashboard.render();
                break;
            case 'users':
                sectionComponent = this.users.render();
                break;
            case 'vehicles':
                sectionComponent = this.renderVehiclesSection();
                break;
            case 'reservations':
                sectionComponent = this.renderReservationsSection();
                break;
            case 'documents':
                sectionComponent = this.renderDocumentsSection();
                break;
            case 'payments':
                sectionComponent = this.renderPaymentsSection();
                break;
            case 'reviews':
                sectionComponent = this.renderReviewsSection();
                break;
            case 'analytics':
                sectionComponent = this.analytics.render();
                break;
            case 'settings':
                sectionComponent = this.renderSettingsSection();
                break;
            default:
                sectionComponent = this.dashboard.render();
        }

        contentContainer.appendChild(sectionComponent);
    }

    renderVehiclesSection() {
        return this.vehicles.render();
    }

    renderReservationsSection() {
        return this.reservations.render();
    }

    renderDocumentsSection() {
        const section = document.createElement('div');
        section.className = 'admin-documents';
        section.innerHTML = `
            <div class="section-header">
                <h1>Gestión de Documentos</h1>
                <p>Revisa y aprueba documentos de usuarios</p>
            </div>
            <div class="documents-content">
                ${this.renderDocumentsTab().outerHTML}
            </div>
        `;
        return section;
    }

    renderPaymentsSection() {
        const section = document.createElement('div');
        section.className = 'admin-payments';
        section.innerHTML = `
            <div class="section-header">
                <h1>Gestión de Pagos</h1>
                <p>Administra todos los pagos y transacciones</p>
            </div>
            <div class="payments-content">
                <p>Funcionalidad de pagos en desarrollo...</p>
            </div>
        `;
        return section;
    }

    renderReviewsSection() {
        const section = document.createElement('div');
        section.className = 'admin-reviews';
        section.innerHTML = `
            <div class="section-header">
                <h1>Gestión de Reseñas</h1>
                <p>Modera reseñas reportadas por usuarios</p>
            </div>
            <div class="reviews-content">
                ${this.renderReviewsTab().outerHTML}
            </div>
        `;
        return section;
    }

    renderSettingsSection() {
        return this.settings.render();
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
        page.className = 'admin-layout';
        
        // Add sidebar
        page.appendChild(this.sidebar.render());
        
        // Add main content area
        const main = document.createElement('div');
        main.className = 'admin-main';
        
        // Add admin header (different from main site header)
        const header = document.createElement('div');
        header.className = 'admin-header';
        header.innerHTML = `
            <div class="admin-header-content">
                <h2>Panel de Administración</h2>
                <div class="admin-header-actions">
                    <span>Administrador</span>
                    <button class="btn btn-outline" onclick="window.location.href='/'">
                        Volver al sitio
                    </button>
                </div>
            </div>
        `;
        main.appendChild(header);
        
        // Add content container
        const content = document.createElement('div');
        content.className = 'admin-content';
        main.appendChild(content);
        
        page.appendChild(main);
        
        // Render initial section
        setTimeout(() => {
            this.renderCurrentSection();
        }, 0);
        
        return page;
    }
}