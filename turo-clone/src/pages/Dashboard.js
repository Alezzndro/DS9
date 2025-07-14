import '../css/Dashboard.css';
import Header from '../components/common/Header.js';
import '../css/ReservationCard.css';
import '../css/UserProfile.css';
import '../css/VehicleCard.css';



import VehicleCard from '../components/dashboard/VehicleCard.js';
import ReservationCard from '../components/dashboard/ReservationCard.js';
import UserProfile from '../components/dashboard/UserProfile.js';
import Notification from '../components/common/Notification.js';

export default class Dashboard {
    constructor() {
        this.header = new Header();
        this.state = {
            activeTab: 'reservations',
            reservations: this.getSampleReservations(),
            vehicles: this.getSampleVehicles(),
            user: this.getSampleUser()
        };
    }

    getSampleReservations() {
        return [
            {
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
            },
            {
                id: '2',
                vehicle: {
                    make: 'Honda',
                    model: 'Civic',
                    year: '2019',
                    image: 'https://via.placeholder.com/300'
                },
                dates: {
                    start: '2023-05-10',
                    end: '2023-05-12'
                },
                total: 135,
                status: 'completed'
            }
        ];
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


    handleAddVehicle() {
        console.log('Añadir nuevo vehículo');
        // Aquí iría la navegación al formulario de vehículo
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
        
        if (this.state.reservations.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No tienes reservas activas</p>
                    <a href="/search" class="btn btn-primary" data-link>Buscar vehículos</a>
                </div>
            `;
            return container;
        }
        
        const activeReservations = this.state.reservations.filter(r => r.status === 'active');
        const pastReservations = this.state.reservations.filter(r => r.status !== 'active');
        
        if (activeReservations.length > 0) {
            const activeHeader = document.createElement('h3');
            activeHeader.textContent = 'Reservas activas';
            container.appendChild(activeHeader);
            
            activeReservations.forEach(reservation => {
                const reservationCard = new ReservationCard(reservation);
                container.appendChild(reservationCard.render());
            });
        }
        
        if (pastReservations.length > 0) {
            const pastHeader = document.createElement('h3');
            pastHeader.textContent = 'Reservas anteriores';
            container.appendChild(pastHeader);
            
            pastReservations.forEach(reservation => {
                const reservationCard = new ReservationCard(reservation);
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
        
        header.querySelector('.add-vehicle-btn').addEventListener('click', () => 
            this.handleAddVehicle());
        
        if (this.state.vehicles.length === 0) {
            container.innerHTML += `
                <div class="empty-state">
                    <p>No tienes vehículos registrados</p>
                    <button class="btn btn-primary add-vehicle-btn">Añadir vehículo</button>
                </div>
            `;
            container.querySelector('.add-vehicle-btn').addEventListener('click', () => 
                this.handleAddVehicle());
            return container;
        }
        
        this.state.vehicles.forEach(vehicle => {
            const vehicleCard = new VehicleCard(vehicle, true);
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