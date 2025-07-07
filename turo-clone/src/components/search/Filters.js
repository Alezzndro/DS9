import { formatCurrency } from '../../utils/helpers.js';

export default class Filters {
    constructor() {
        this.state = {
            location: '',
            make: '',
            passengers: '',
            minPrice: '',
            maxPrice: '',
            startDate: '',
            endDate: ''
        };
        
        // Datos de ejemplo para los selects
        this.makes = ['Toyota', 'Honda', 'Ford', 'BMW', 'Mercedes', 'Audi', 'Volkswagen'];
        this.locations = ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao', 'Málaga'];
    }

    handleInputChange(e) {
        const { name, value } = e.target;
        this.state[name] = value;
        this.dispatchFilterChange();
    }

    dispatchFilterChange() {
        const event = new CustomEvent('filtersChanged', { detail: this.state });
        document.dispatchEvent(event);
    }

    renderLocationFilter() {
        return `
            <div class="filter-group">
                <label for="location">Ubicación</label>
                <select id="location" name="location" class="filter-select">
                    <option value="">Todas las ubicaciones</option>
                    ${this.locations.map(loc => 
                        `<option value="${loc}" ${this.state.location === loc ? 'selected' : ''}>${loc}</option>`
                    ).join('')}
                </select>
            </div>
        `;
    }

    renderMakeFilter() {
        return `
            <div class="filter-group">
                <label for="make">Marca</label>
                <select id="make" name="make" class="filter-select">
                    <option value="">Todas las marcas</option>
                    ${this.makes.map(make => 
                        `<option value="${make}" ${this.state.make === make ? 'selected' : ''}>${make}</option>`
                    ).join('')}
                </select>
            </div>
        `;
    }

    renderPassengersFilter() {
        return `
            <div class="filter-group">
                <label for="passengers">Pasajeros</label>
                <select id="passengers" name="passengers" class="filter-select">
                    <option value="">Cualquier cantidad</option>
                    <option value="2" ${this.state.passengers === '2' ? 'selected' : ''}>2 pasajeros</option>
                    <option value="4" ${this.state.passengers === '4' ? 'selected' : ''}>4 pasajeros</option>
                    <option value="5" ${this.state.passengers === '5' ? 'selected' : ''}>5 pasajeros</option>
                    <option value="7" ${this.state.passengers === '7' ? 'selected' : ''}>7+ pasajeros</option>
                </select>
            </div>
        `;
    }

    renderPriceFilter() {
        return `
            <div class="filter-group">
                <label for="priceRange">Rango de precio (por día)</label>
                <div class="price-inputs">
                    <input type="number" id="minPrice" name="minPrice" placeholder="Mínimo" 
                        value="${this.state.minPrice}" min="0">
                    <span>-</span>
                    <input type="number" id="maxPrice" name="maxPrice" placeholder="Máximo" 
                        value="${this.state.maxPrice}" min="0">
                </div>
            </div>
        `;
    }

    renderDateFilter() {
        return `
            <div class="filter-group">
                <label for="dates">Fechas de alquiler</label>
                <div class="date-inputs">
                    <input type="date" id="startDate" name="startDate" 
                        value="${this.state.startDate}">
                    <span>a</span>
                    <input type="date" id="endDate" name="endDate" 
                        value="${this.state.endDate}">
                </div>
            </div>
        `;
    }

    render() {
        const filters = document.createElement('div');
        filters.className = 'search-filters';
        filters.innerHTML = `
            <h3>Filtrar por:</h3>
            <form id="filtersForm">
                ${this.renderLocationFilter()}
                ${this.renderMakeFilter()}
                ${this.renderPassengersFilter()}
                ${this.renderPriceFilter()}
                ${this.renderDateFilter()}
                <button type="submit" class="btn btn-primary">Aplicar filtros</button>
                <button type="reset" class="btn btn-outline">Limpiar filtros</button>
            </form>
        `;
        
        // Event listeners
        filters.querySelectorAll('select, input').forEach(input => {
            input.addEventListener('change', (e) => this.handleInputChange(e));
        });
        
        filters.querySelector('#filtersForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.dispatchFilterChange();
        });
        
        filters.querySelector('#filtersForm').addEventListener('reset', () => {
            this.state = {
                location: '',
                make: '',
                passengers: '',
                minPrice: '',
                maxPrice: '',
                startDate: '',
                endDate: ''
            };
            setTimeout(() => this.dispatchFilterChange(), 0);
        });
        
        return filters;
    }
}