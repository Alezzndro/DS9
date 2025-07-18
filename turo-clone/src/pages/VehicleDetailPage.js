import { getVehicleDetails } from '../services/vehicleService.js';
import VehicleDetail from '../components/vehicle/VehicleDetail.js';
import { navigateTo } from '../utils/helpers.js';

export default class VehicleDetailPage {
    constructor(params) {
        this.vehicleId = params.id;
        this.container = document.createElement('div');
        this.container.classList.add('vehicle-detail-page');
    }

    async render() {
        try {
            const vehicle = await getVehicleDetails(this.vehicleId);
            const vehicleDetailComponent = new VehicleDetail(vehicle);
            const detailContent = await vehicleDetailComponent.render();
            this.container.innerHTML = '';
            this.container.appendChild(detailContent);
            return this.container;
        } catch (error) {
            console.error('Error cargando los detalles del vehículo:', error.message);

            // Redirige si es error de autenticación
            if (error.message.includes('inicia sesión') || error.message.includes('token')) {
                alert(error.message);
                navigateTo('/login');
                return;
            }

            this.container.innerHTML = `<p class="error">${error.message}</p>`;
            return this.container;
        }
    }
}
