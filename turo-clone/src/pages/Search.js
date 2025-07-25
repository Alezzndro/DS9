import Header from '../components/common/Header.js';
import Filters from '../components/search/Filters.js';
import VehicleList from '../components/search/VehicleList.js';

export default class Search {
    constructor() {
        this.header = new Header();
        this.filters = new Filters();
        this.vehicleList = new VehicleList();
        this.state = {
            filters: {}
        };
    }

    setupEventListeners() {
        document.addEventListener('filtersChanged', async (e) => {
            this.state.filters = e.detail;
            await this.updateVehicleList();
        });
    }

    async updateVehicleList() {
        // Mostrar estado de carga
        const listContainer = document.querySelector('.vehicle-list-container');
        if (listContainer) {
            listContainer.innerHTML = `
                <div class="loading-state">
                    <h3>🔄 Aplicando filtros...</h3>
                    <p>Buscando vehículos disponibles</p>
                </div>
            `;
        }
        
        // Aplicar filtros y obtener vehículos
        const filteredVehicles = await this.vehicleList.filterVehicles(this.state.filters);
        const newList = this.vehicleList.render(filteredVehicles);
        
        const oldListContainer = document.querySelector('.vehicle-list-container');
        if (oldListContainer) {
            oldListContainer.innerHTML = '';
            oldListContainer.appendChild(newList);
        } else {
            const container = document.querySelector('.search-container');
            if (container) {
                const newContainer = document.createElement('div');
                newContainer.className = 'vehicle-list-container';
                newContainer.appendChild(newList);
                container.appendChild(newContainer);
            }
        }
    }

    render() {
        const page = document.createElement('div');
        page.className = 'search-page';
        
        page.appendChild(this.header.render());
        
        const container = document.createElement('div');
        container.className = 'container search-container';
        
        const title = document.createElement('h1');
        title.textContent = 'Buscar vehículos';
        container.appendChild(title);
        
        container.appendChild(this.filters.render());
        
        const listContainer = document.createElement('div');
        listContainer.className = 'vehicle-list-container';
        
        // Mostrar estado de carga inicial
        listContainer.innerHTML = `
            <div class="loading-state">
                <h3>🔄 Cargando vehículos...</h3>
                <p>Obteniendo vehículos disponibles</p>
            </div>
        `;
        
        container.appendChild(listContainer);
        page.appendChild(container);
        
        this.setupEventListeners();
        
        // Cargar vehículos después de renderizar (asíncrono)
        this.loadInitialVehicles(listContainer);
        
        return page;
    }

    async loadInitialVehicles(listContainer) {
        try {
            await this.vehicleList.loadVehicles();
            const newList = this.vehicleList.render();
            listContainer.innerHTML = '';
            listContainer.appendChild(newList);
        } catch (error) {
            console.error('Error cargando vehículos iniciales:', error);
            listContainer.innerHTML = `
                <div class="no-results">
                    <h3>Error al cargar vehículos</h3>
                    <p>No se pudieron cargar los vehículos. Intenta recargar la página.</p>
                </div>
            `;
        }
    }

    
}

