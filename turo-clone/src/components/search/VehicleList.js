import VehicleCard from '../dashboard/VehicleCard.js';
import { searchVehicles } from '../../services/vehicleService.js';

export default class VehicleList {
    constructor() {
        this.vehicles = [];
        this.isLoading = false;
        this.loadVehicles();
    }

    async loadVehicles(filters = {}) {
        try {
            this.isLoading = true;
            console.log('🔄 Cargando vehículos con filtros:', filters);
            
            const response = await searchVehicles(filters);
            this.vehicles = response.vehicles || [];
            
            console.log('✅ Vehículos cargados:', this.vehicles.length);
            if (this.vehicles.length > 0) {
                console.log('📋 Primer vehículo:', this.vehicles[0]);
            }
            
        } catch (error) {
            console.error('❌ Error cargando vehículos:', error);
            
            // Mostrar información más detallada del error
            if (error.message.includes('DATABASE_UNAVAILABLE')) {
                console.warn('⚠️ Base de datos no disponible, usando datos de ejemplo');
                this.vehicles = this.getSampleVehicles();
            } else {
                // En caso de error de red u otro, usar datos de ejemplo
                console.warn('⚠️ Error de red, usando datos de ejemplo');
                this.vehicles = this.getSampleVehicles();
            }
        } finally {
            this.isLoading = false;
        }
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

    async filterVehicles(filters) {
        // Recargar vehículos con filtros desde la API
        await this.loadVehicles(filters);
        return this.vehicles;
    }

    // Método local para filtrar en caso de que se necesite
    localFilterVehicles(filters) {
        return this.vehicles.filter(vehicle => {
            // Filtro por ubicación (maneja tanto string como objeto)
            if (filters.location) {
                const vehicleLocation = typeof vehicle.location === 'object' 
                    ? `${vehicle.location.city}, ${vehicle.location.state}` 
                    : vehicle.location;
                if (!vehicleLocation.toLowerCase().includes(filters.location.toLowerCase())) {
                    return false;
                }
            }
            
            // Filtro por marca
            if (filters.make && vehicle.make.toLowerCase() !== filters.make.toLowerCase()) {
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
            
            // Filtro por disponibilidad
            const isAvailable = vehicle.isAvailable !== undefined ? vehicle.isAvailable : vehicle.available;
            if ((filters.startDate || filters.endDate) && !isAvailable) {
                return false;
            }
            
            return true;
        });
    }

    render(vehicles = this.vehicles) {
        const list = document.createElement('div');
        list.className = 'vehicle-list';
        
        if (this.isLoading) {
            list.innerHTML = `
                <div class="loading-state">
                    <h3>🔄 Cargando vehículos...</h3>
                    <p>Por favor espera un momento</p>
                </div>
            `;
            return list;
        }
        
        if (vehicles.length === 0) {
            list.innerHTML = `
                <div class="no-results">
                    <h3>No se encontraron vehículos</h3>
                    <p>Intenta ajustar tus filtros de búsqueda</p>
                </div>
            `;
            return list;
        }
        
        console.log(`🎨 Renderizando ${vehicles.length} vehículos`);
        
        vehicles.forEach((vehicle, index) => {
            console.log(`🚗 Vehículo ${index + 1}:`, vehicle.make, vehicle.model);
            console.log(`🔍 Disponibilidad - isAvailable: ${vehicle.isAvailable}, available: ${vehicle.available}`);
            console.log(`👤 Es propietario: false`);
            
            // Crear la tarjeta del vehículo para visitantes (no propietarios)
            const vehicleCard = new VehicleCard(vehicle, false);
            list.appendChild(vehicleCard.render());
        });
        
        return list;
    }
}