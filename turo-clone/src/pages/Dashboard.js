import Header from '../components/common/Header.js';
import VehicleCard from '../components/dashboard/VehicleCard.js';
import ReservationCard from '../components/dashboard/ReservationCard.js';
import UserProfile from '../components/dashboard/UserProfile.js';
import Notification from '../components/common/Notification.js';
import VehicleForm from '../components/vehicle/VehicleFormNew.js';
import { getUserData } from '../services/authService.js';
import { getUserVehicles, deleteVehicle, toggleVehicleAvailability } from '../services/vehicleService.js';
import { getReservations } from '../services/reservationService.js';

export default class Dashboard {
    constructor() {
        this.header = new Header();
        this.state = {
            activeTab: 'reservations',
            reservations: [],
            vehicles: [],
            user: this.getCurrentUser(),
            isLoadingVehicles: false,
            isLoadingReservations: false
        };
        
        // Cargar datos reales
        this.loadUserVehicles();
        this.loadUserReservations();

        // NUEVO: Si viene de Stripe, recarga reservas
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('payment') === 'success') {
            this.loadUserReservations();
            Notification.show('¡Pago realizado con éxito!', 'success');
            // Opcional: limpiar el parámetro de la URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    getSampleVehicles() {
        return [
            {
                id: '1',
                make: 'Toyota',
                model: 'Corolla',
                year: '2020',
                pricePerDay: 50,
                seats: 5,
                location: 'Madrid',
                rating: 4.5,
                image: 'https://via.placeholder.com/300',
                available: true
            },
            {
                id: '2',
                make: 'BMW',
                model: 'Serie 3',
                year: '2021',
                pricePerDay: 70,
                seats: 5,
                location: 'Barcelona',
                rating: 4.7,
                image: 'https://via.placeholder.com/300',
                available: false
            }
        ];
    }

    async loadUserVehicles() {
        try {
            this.state.isLoadingVehicles = true;
            const vehicles = await getUserVehicles();
            this.state.vehicles = vehicles || [];
            
            // Actualizar la vista si está en la pestaña de vehículos
            if (this.state.activeTab === 'vehicles') {
                this.refreshVehiclesTab();
            }
        } catch (error) {
            console.error('Error cargando vehículos:', error);
            Notification.show('Error al cargar los vehículos', 'error');
        } finally {
            this.state.isLoadingVehicles = false;
        }
    }

    async loadUserReservations() {
        try {
            this.state.isLoadingReservations = true;
            const reservations = await getReservations();
            this.state.reservations = reservations || [];
            
            // Actualizar la vista si está en la pestaña de reservas
            if (this.state.activeTab === 'reservations') {
                this.refreshReservationsTab();
            }
        } catch (error) {
            console.error('Error cargando reservas:', error);
            Notification.show('Error al cargar las reservas', 'error');
            // En caso de error, mantener array vacío
            this.state.reservations = [];
        } finally {
            this.state.isLoadingReservations = false;
            // SIEMPRE refresca la pestaña de reservas si está montada
            if (this.contentContainer && this.state.activeTab === 'reservations') {
                this.refreshReservationsTab();
            }
        }
    }

    refreshVehiclesTab() {
        const contentContainer = document.querySelector('.dashboard-content');
        if (contentContainer && this.state.activeTab === 'vehicles') {
            contentContainer.innerHTML = '';
            contentContainer.appendChild(this.renderVehiclesTab());
        }
    }

    refreshReservationsTab() {
        const contentContainer = document.querySelector('.dashboard-content');
        if (contentContainer && this.state.activeTab === 'reservations') {
            contentContainer.innerHTML = '';
            contentContainer.appendChild(this.renderReservationsTab());
        }
    }

    handleAddVehicle() {
        try {
            const vehicleForm = new VehicleForm(null, async (result) => {
                console.log('🚗 Nuevo vehículo creado:', result);
                // Recargar todos los vehículos para obtener la información actualizada
                await this.loadUserVehicles();
            });
            
            document.body.appendChild(vehicleForm.render());
        } catch (error) {
            console.error('Error en handleAddVehicle:', error);
            alert('Error: ' + error.message);
        }
    }

    async handleEditVehicle(vehicle) {
        const vehicleForm = new VehicleForm(vehicle, async (result) => {
            console.log('✏️ Vehículo editado:', result);
            // Recargar todos los vehículos para obtener la información actualizada
            await this.loadUserVehicles();
        });
        
        document.body.appendChild(vehicleForm.render());
    }

    async handleDeleteVehicle(vehicleId) {
        if (!confirm('¿Estás seguro de que quieres eliminar este vehículo?')) {
            return;
        }
        
        try {
            await deleteVehicle(vehicleId);
            this.state.vehicles = this.state.vehicles.filter(v => v._id !== vehicleId);
            this.refreshVehiclesTab();
            Notification.show('Vehículo eliminado exitosamente', 'success');
        } catch (error) {
            console.error('Error eliminando vehículo:', error);
            Notification.show('Error al eliminar el vehículo', 'error');
        }
    }

    async handleToggleAvailability(vehicleId, isAvailable) {
        try {
            const updatedVehicle = await toggleVehicleAvailability(vehicleId, isAvailable);
            const index = this.state.vehicles.findIndex(v => v._id === vehicleId);
            if (index !== -1) {
                this.state.vehicles[index] = updatedVehicle;
                this.refreshVehiclesTab();
            }
            Notification.show(`Vehículo ${isAvailable ? 'habilitado' : 'deshabilitado'} exitosamente`, 'success');
        } catch (error) {
            console.error('Error cambiando disponibilidad:', error);
            Notification.show('Error al cambiar la disponibilidad', 'error');
        }
    }

    getCurrentUser() {
        // Obtener datos del usuario autenticado desde localStorage
        const userData = getUserData();
        
        if (userData) {
            return {
                name: userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Usuario',
                email: userData.email || '',
                phone: userData.phone || '',
                verified: userData.documents?.idDocument?.verified && userData.documents?.driverLicense?.verified || false,
                documents: {
                    id: userData.documents?.idDocument?.verified ? 'approved' : 'pending',
                    license: userData.documents?.driverLicense?.verified ? 'approved' : 'pending'
                }
            };
        }
        
        // Fallback si no hay datos (no debería pasar si está autenticado)
        return {
            name: 'Usuario',
            email: '',
            phone: '',
            verified: false,
            documents: {
                id: 'pending',
                license: 'pending'
            }
        };
    }

    getSampleUser() {
        return {
            name: 'Juan Pérez',
            email: 'juan@example.com',
            phone: '+123456789',
            verified: true,
            documents: {
                id: 'approved',
                license: 'approved'
            }
        };
    }

    handleTabChange(tab) {
    this.state.activeTab = tab;
    // Actualizar los tabs
    const tabsContainer = document.querySelector('.dashboard-tabs');
    if (tabsContainer) {
        tabsContainer.replaceWith(this.renderTabs());
    }
    // Actualizar el contenido
    this.contentContainer.innerHTML = '';
    this.contentContainer.appendChild(this.renderContent());
}

    renderTabs() {
        const tabs = document.createElement('div');
        tabs.className = 'dashboard-tabs';
        tabs.innerHTML = `
            <button class="tab ${this.state.activeTab === 'reservations' ? 'active' : ''}" data-tab="reservations">
                Mis reservas
            </button>
            <button class="tab ${this.state.activeTab === 'vehicles' ? 'active' : ''}" data-tab="vehicles">
                Mis vehículos
            </button>
            <button class="tab ${this.state.activeTab === 'profile' ? 'active' : ''}" data-tab="profile">
                Mi perfil
            </button>
        `;
        
        tabs.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => 
                this.handleTabChange(tab.dataset.tab));
        });
        
        return tabs;
    }

    renderReservationsTab() {
        const container = document.createElement('div');
        container.className = 'reservations-container';

        // Mostrar estado de carga
        if (this.state.isLoadingReservations) {
            container.innerHTML = `
                <div class="loading-state">
                    <p>Cargando reservas...</p>
                </div>
            `;
            return container;
        }
        
        if (this.state.reservations.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No tienes reservas</p>
                    <a href="/search" class="btn btn-primary" data-link>Buscar vehículos</a>
                </div>
            `;
            return container;
        }
        
        // Categorizar reservas
        const activeReservations = this.state.reservations.filter(r => 
            ['pending', 'confirmed', 'active'].includes(r.status)
        );
        const pastReservations = this.state.reservations.filter(r => 
            ['completed', 'cancelled'].includes(r.status)
        );
        
        if (activeReservations.length > 0) {
            const activeHeader = document.createElement('h3');
            activeHeader.textContent = 'Reservas activas';
            container.appendChild(activeHeader);
            
            activeReservations.forEach(reservation => {
                const reservationCard = new ReservationCard(reservation, () => {
                    // Callback para actualizar la lista cuando se modifica una reserva
                    this.loadUserReservations();
                });
                container.appendChild(reservationCard.render());
            });
        }
        
        if (pastReservations.length > 0) {
            const pastHeader = document.createElement('h3');
            pastHeader.textContent = 'Historial de reservas';
            container.appendChild(pastHeader);
            
            pastReservations.forEach(reservation => {
                const reservationCard = new ReservationCard(reservation, () => {
                    // Callback para actualizar la lista cuando se modifica una reserva
                    this.loadUserReservations();
                });
                container.appendChild(reservationCard.render());
            });
        }
        
        return container;
    }

    renderVehiclesTab() {
        const container = document.createElement('div');
        container.className = 'vehicles-container';
        
        const header = document.createElement('div');
        header.className = 'vehicles-header';
        header.innerHTML = `
            <h3>Mis vehículos</h3>
            <button class="btn btn-primary add-vehicle-btn">Añadir vehículo</button>
        `;
        container.appendChild(header);
        
        const addBtn = header.querySelector('.add-vehicle-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.handleAddVehicle();
            });
        }
        
        if (this.state.isLoadingVehicles) {
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'loading-state';
            loadingDiv.innerHTML = `<p>Cargando vehículos...</p>`;
            container.appendChild(loadingDiv);
            return container;
        }
        
        if (this.state.vehicles.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty-state';
            emptyDiv.innerHTML = `
                <p>No tienes vehículos registrados</p>
                <button class="btn btn-primary add-vehicle-btn">Añadir vehículo</button>
            `;
            
            const emptyBtn = emptyDiv.querySelector('.add-vehicle-btn');
            if (emptyBtn) {
                emptyBtn.addEventListener('click', () => {
                    this.handleAddVehicle();
                });
            }
            
            container.appendChild(emptyDiv);
            return container;
        }
        
        // Renderizar vehículos con callbacks
        this.state.vehicles.forEach(vehicle => {
            const vehicleCard = new VehicleCard(vehicle, true, {
                onEdit: (vehicle) => this.handleEditVehicle(vehicle),
                onDelete: (vehicleId) => this.handleDeleteVehicle(vehicleId),
                onToggleAvailability: (vehicleId, isAvailable) => this.handleToggleAvailability(vehicleId, isAvailable)
            });
            container.appendChild(vehicleCard.render());
        });
        
        return container;
    }

    renderProfileTab() {
        const container = document.createElement('div');
        container.className = 'profile-container';
        
        const userProfile = new UserProfile(this.state.user);
        container.appendChild(userProfile.render());
        
        return container;
    }

    renderContent() {
        const content = document.createElement('div');
        content.className = 'dashboard-content';
        
        switch (this.state.activeTab) {
            case 'reservations':
                content.appendChild(this.renderReservationsTab());
                break;
            case 'vehicles':
                content.appendChild(this.renderVehiclesTab());
                break;
            case 'profile':
                content.appendChild(this.renderProfileTab());
                break;
        }
        
        return content;
    }

    render() {
    const page = document.createElement('div');
    page.className = 'dashboard-page';

    page.appendChild(this.header.render());

    const container = document.createElement('div');
    container.className = 'container';

    const welcome = document.createElement('div');
    welcome.className = 'welcome-message';
    welcome.innerHTML = `
        <h1>Bienvenido, ${this.state.user.name.split(' ')[0]}</h1>
        <p>¿Qué te gustaría hacer hoy?</p>
    `;
    container.appendChild(welcome);
    
    // Renderizar tabs
    container.appendChild(this.renderTabs());

    this.contentContainer = document.createElement('div');
    this.contentContainer.className = 'dashboard-content';
    this.contentContainer.appendChild(this.renderContent());

    container.appendChild(this.contentContainer);
    page.appendChild(container);
    return page;
}

}