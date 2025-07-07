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
        document.addEventListener('filtersChanged', (e) => {
            this.state.filters = e.detail;
            this.updateVehicleList();
        });
    }

    updateVehicleList() {
        const filteredVehicles = this.vehicleList.filterVehicles(this.state.filters);
        const newList = this.vehicleList.render(filteredVehicles);
        
        const oldList = document.querySelector('.vehicle-list-container');
        if (oldList) {
            oldList.replaceWith(newList);
        } else {
            const container = document.querySelector('.search-container');
            if (container) {
                container.appendChild(newList);
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
        listContainer.appendChild(this.vehicleList.render());
        container.appendChild(listContainer);
        
        page.appendChild(container);
        
        this.setupEventListeners();
        
        return page;
    }
}