import VehicleCard from '../dashboard/VehicleCard.js';

export default class VehicleList {
    constructor() {
        this.vehicles = this.getSampleVehicles();
    }

    getSampleVehicles() {
        // Datos de ejemplo
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
                image: 'https://via.placeholder.com/300?text=Toyota+Corolla',
                available: true
            },
            {
                id: '2',
                make: 'Honda',
                model: 'Civic',
                year: '2019',
                pricePerDay: 45,
                seats: 5,
                location: 'Barcelona',
                rating: 4.2,
                image: 'https://via.placeholder.com/300?text=Honda+Civic',
                available: true
            },
            {
                id: '3',
                make: 'Ford',
                model: 'Focus',
                year: '2021',
                pricePerDay: 40,
                seats: 5,
                location: 'Valencia',
                rating: 4.0,
                image: 'https://via.placeholder.com/300?text=Ford+Focus',
                available: false
            },
            {
                id: '4',
                make: 'BMW',
                model: 'Serie 3',
                year: '2022',
                pricePerDay: 70,
                seats: 5,
                location: 'Madrid',
                rating: 4.7,
                image: 'https://via.placeholder.com/300?text=BMW+Serie3',
                available: true
            },
            {
                id: '5',
                make: 'Mercedes',
                model: 'Clase A',
                year: '2021',
                pricePerDay: 65,
                seats: 5,
                location: 'Barcelona',
                rating: 4.4,
                image: 'https://via.placeholder.com/300?text=Mercedes+ClaseA',
                available: true
            },
            {
                id: '6',
                make: 'Volkswagen',
                model: 'Golf',
                year: '2020',
                pricePerDay: 42,
                seats: 5,
                location: 'Sevilla',
                rating: 4.1,
                image: 'https://via.placeholder.com/300?text=Volkswagen+Golf',
                available: true
            }
        ];
    }

    filterVehicles(filters) {
        return this.vehicles.filter(vehicle => {
            // Filtro por ubicación
            if (filters.location && vehicle.location !== filters.location) {
                return false;
            }
            
            // Filtro por marca
            if (filters.make && vehicle.make !== filters.make) {
                return false;
            }
            
            // Filtro por pasajeros
            if (filters.passengers && vehicle.seats < parseInt(filters.passengers)) {
                return false;
            }
            
            // Filtro por precio
            if (filters.minPrice && vehicle.pricePerDay < parseFloat(filters.minPrice)) {
                return false;
            }
            
            if (filters.maxPrice && vehicle.pricePerDay > parseFloat(filters.maxPrice)) {
                return false;
            }
            
            // Filtro por disponibilidad (simplificado)
            if ((filters.startDate || filters.endDate) && !vehicle.available) {
                return false;
            }
            
            return true;
        });
    }

    render(vehicles = this.vehicles) {
        const list = document.createElement('div');
        list.className = 'vehicle-list';
        
        if (vehicles.length === 0) {
            list.innerHTML = `
                <div class="no-results">
                    <h3>No se encontraron vehículos</h3>
                    <p>Intenta ajustar tus filtros de búsqueda</p>
                </div>
            `;
            return list;
        }
        
        vehicles.forEach(vehicle => {
            const vehicleCard = new VehicleCard(vehicle);
            list.appendChild(vehicleCard.render());
        });
        
        return list;
    }
}