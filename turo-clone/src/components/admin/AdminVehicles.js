import adminApiService from '../../services/adminApiService.js';

export default class AdminVehicles {
    constructor() {
        this.vehicles = [];
        this.filteredVehicles = [];
        this.currentPage = 1;
        this.vehiclesPerPage = 10;
        this.searchTerm = '';
        this.statusFilter = 'all';
        this.typeFilter = 'all';
        this.loading = true;
        this.totalPages = 1;
        this.retryCount = 0;
        this.maxRetries = 3;
        
        // Esperar un poco para asegurar que el token esté disponible
        setTimeout(() => {
            this.loadVehicles();
        }, 100);
    }

    async loadVehicles() {
        try {
            this.loading = true;
            
            // Verificar que tenemos un token de autenticación
            const token = localStorage.getItem('turo_clone_auth_token');
            if (!token) {
                console.warn('No auth token found for vehicles, retrying...');
                if (this.retryCount < this.maxRetries) {
                    this.retryCount++;
                    setTimeout(() => this.loadVehicles(), 500 * this.retryCount);
                    return;
                }
                throw new Error('No authentication token available');
            }
            
            const filters = {
                page: this.currentPage,
                limit: this.vehiclesPerPage,
                search: this.searchTerm,
                status: this.statusFilter,
                type: this.typeFilter
            };
            
            console.log('🚗 Loading vehicles with filters:', filters);
            const response = await adminApiService.getVehicles(filters);
            
            if (response.success) {
                console.log('📊 Raw vehicles data:', response.data.vehicles);
                
                this.vehicles = response.data.vehicles.map(vehicle => ({
                    // Preservar el objeto original completo
                    ...vehicle,
                    // Agregar campos mapeados para compatibilidad con la tabla
                    id: vehicle._id,
                    type: vehicle.category, // Mapear category a type para compatibilidad
                    approved: vehicle.status === 'approved',
                    price: vehicle.pricePerDay,
                    pricePerDay: vehicle.pricePerDay, // Preservar ambos nombres
                    location: vehicle.location?.address || 'No especificada',
                    locationObject: vehicle.location, // Preservar objeto de ubicación completo
                    ownerName: vehicle.owner ? `${vehicle.owner.firstName} ${vehicle.owner.lastName}` : 'Sin asignar',
                    ownerId: vehicle.owner?._id,
                    totalReservations: vehicle.stats?.totalBookings || 0,
                    totalEarnings: vehicle.stats?.totalEarnings || 0,
                    rating: vehicle.rating || 0,
                    images: vehicle.images || [],
                    features: vehicle.features || []
                }));
                
                console.log('🚗 Processed vehicles:', this.vehicles);
                console.log(`✅ Loaded ${this.vehicles.length} vehicles successfully`);
                
                // Forzar actualización del dashboard después de cargar vehículos
                if (window.adminApp && window.adminApp.dashboard) {
                    console.log('🔄 Forcing dashboard reload after loading vehicles');
                    setTimeout(() => {
                        window.adminApp.dashboard.loadDashboardData();
                    }, 500);
                }
                
                this.totalPages = response.data.pagination.total;
                this.filteredVehicles = [...this.vehicles];
                this.retryCount = 0; // Reset retry count on success
            } else {
                throw new Error(response.message || 'Failed to load vehicles');
            }
        } catch (error) {
            console.error('Error loading vehicles:', error);
            console.error('API Error details:', error.message);
            
            // Intentar de nuevo si no hemos agotado los reintentos
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                console.log(`🔄 Retry attempt ${this.retryCount}/${this.maxRetries}`);
                setTimeout(() => this.loadVehicles(), 500 * this.retryCount);
                return;
            }
            
            // Si agotamos los reintentos, usar datos de ejemplo temporalmente para debug
            console.error('❌ Max retries reached. Using fallback data for debugging.');
            console.log('🔧 Check browser console for API error details');
            this.loadMockData(); // Restaurar temporalmente para debug
        } finally {
            this.loading = false;
            this.renderTable();
        }
    }

    loadMockData() {
        // Datos de ejemplo como fallback
        this.vehicles = [
            {
                id: 'mock1',
                make: 'Toyota',
                model: 'Camry',
                year: 2022,
                type: 'sedan',
                licensePlate: 'ABC-123',
                status: 'approved',
                approved: true,
                price: 45,
                location: 'Madrid, España',
                ownerName: 'Juan Pérez',
                ownerId: 'owner1',
                totalReservations: 12,
                totalEarnings: 1240.50,
                rating: 4.8,
                images: [],
                createdAt: new Date('2023-12-01'),
                features: ['aire_acondicionado', 'gps', 'bluetooth']
            },
            {
                id: 'mock2',
                make: 'Ford',
                model: 'Focus',
                year: 2021,
                type: 'hatchback',
                licensePlate: 'XYZ-789',
                status: 'pending',
                approved: false,
                price: 35,
                location: 'Barcelona, España',
                ownerName: 'María García',
                ownerId: 'owner2',
                totalReservations: 0,
                totalEarnings: 0,
                rating: 0,
                images: [],
                createdAt: new Date('2024-01-15'),
                features: ['aire_acondicionado', 'radio']
            }
        ];
        this.filteredVehicles = [...this.vehicles];
        this.totalPages = 1;
    }

    applyFilters() {
        this.filteredVehicles = this.vehicles.filter(vehicle => {
            const searchMatch = 
                vehicle.make.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                vehicle.model.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                vehicle.ownerName.toLowerCase().includes(this.searchTerm.toLowerCase());
            
            const statusMatch = this.statusFilter === 'all' || vehicle.status === this.statusFilter;
            
            return searchMatch && statusMatch;
        });
        
        this.currentPage = 1;
    }

    handleSearch(searchTerm) {
        this.searchTerm = searchTerm;
        this.currentPage = 1;
        this.loadVehicles();
    }

    handleStatusFilter(status) {
        this.statusFilter = status;
        this.currentPage = 1;
        this.loadVehicles();
    }

    handleTypeFilter(type) {
        this.typeFilter = type;
        this.currentPage = 1;
        this.loadVehicles();
    }

    async handleVehicleAction(vehicleId, action) {
        console.log('🎯 handleVehicleAction called:', { vehicleId, action });
        console.log('🚗 Available vehicles:', this.vehicles.length);
        console.log('🔍 Looking for vehicle with ID:', vehicleId);
        
        const vehicle = this.vehicles.find(v => v.id === vehicleId);
        console.log('🎯 Found vehicle:', vehicle);
        
        if (!vehicle) {
            console.error('❌ Vehicle not found with ID:', vehicleId);
            console.log('Available vehicle IDs:', this.vehicles.map(v => v.id));
            return;
        }

        switch (action) {
            case 'view':
                console.log('👁️ Opening vehicle details');
                this.showVehicleDetails(vehicle);
                break;
            case 'edit':
                console.log('✏️ Opening vehicle edit modal');
                this.editVehicle(vehicle);
                break;
            case 'approve':
                await this.updateVehicleStatus(vehicleId, 'approved');
                break;
            case 'reject':
                await this.updateVehicleStatus(vehicleId, 'rejected');
                break;
            case 'suspend':
                await this.updateVehicleStatus(vehicleId, 'suspended');
                break;
            case 'activate':
                await this.updateVehicleStatus(vehicleId, 'approved');
                break;
            case 'delete':
                if (confirm('¿Estás seguro de que quieres eliminar este vehículo?')) {
                    await this.deleteVehicle(vehicleId);
                }
                break;
        }
    }

    async updateVehicleStatus(vehicleId, newStatus) {
        try {
            const response = await adminApiService.updateVehicleStatus(vehicleId, newStatus);
            
            if (response.success) {
                // Actualizar el vehículo en la lista local
                const vehicleIndex = this.vehicles.findIndex(v => v.id === vehicleId);
                if (vehicleIndex !== -1) {
                    this.vehicles[vehicleIndex].status = newStatus;
                    this.vehicles[vehicleIndex].approved = newStatus === 'approved';
                    this.renderTable();
                    this.showNotification(`Vehículo ${this.getStatusText(newStatus)} correctamente`, 'success');
                    
                    // Notificar al dashboard que se actualice si hay un cambio de estado pending
                    if (window.adminApp && window.adminApp.dashboard) {
                        console.log('🔄 Reloading dashboard data after vehicle status change');
                        window.adminApp.dashboard.loadDashboardData();
                    }
                }
            } else {
                this.showNotification('Error al actualizar el vehículo', 'error');
            }
        } catch (error) {
            console.error('Error updating vehicle status:', error);
            this.showNotification('Error al actualizar el vehículo', 'error');
        }
    }

    async deleteVehicle(vehicleId) {
        try {
            const response = await adminApiService.deleteVehicle(vehicleId);
            
            if (response.success) {
                // Remover vehículo de la lista local
                this.vehicles = this.vehicles.filter(v => v.id !== vehicleId);
                this.renderTable();
                this.showNotification('Vehículo eliminado correctamente', 'success');
            } else {
                this.showNotification('Error al eliminar el vehículo', 'error');
            }
        } catch (error) {
            console.error('Error deleting vehicle:', error);
            this.showNotification('Error al eliminar el vehículo', 'error');
        }
    }

    showCreateVehicleModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>Crear Nuevo Vehículo</h3>
                    <button onclick="this.closest('.modal-overlay').remove()" class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="createVehicleForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="newVehicleMake">Marca:</label>
                                <input type="text" id="newVehicleMake" name="make" required>
                            </div>
                            <div class="form-group">
                                <label for="newVehicleModel">Modelo:</label>
                                <input type="text" id="newVehicleModel" name="model" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="newVehicleYear">Año:</label>
                                <input type="number" id="newVehicleYear" name="year" min="1950" max="2025" required>
                            </div>
                            <div class="form-group">
                                <label for="newVehicleColor">Color:</label>
                                <input type="text" id="newVehicleColor" name="color" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="newVehiclePrice">Precio por día (€):</label>
                                <input type="number" id="newVehiclePrice" name="pricePerDay" min="1" step="0.01" required>
                            </div>
                            <div class="form-group">
                                <label for="newVehicleSeats">Asientos:</label>
                                <input type="number" id="newVehicleSeats" name="seats" min="2" max="8" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="newVehicleLicensePlate">Placa:</label>
                                <input type="text" id="newVehicleLicensePlate" name="licensePlate" maxlength="10" required style="text-transform: uppercase;">
                            </div>
                            <div class="form-group">
                                <label for="newVehicleOwner">Propietario:</label>
                                <select id="newVehicleOwner" name="owner" required>
                                    <option value="">Seleccionar propietario...</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="newVehicleCategory">Categoría:</label>
                                <select id="newVehicleCategory" name="category" required>
                                    <option value="Economy">Economy</option>
                                    <option value="Compact">Compact</option>
                                    <option value="Midsize">Midsize</option>
                                    <option value="Fullsize">Fullsize</option>
                                    <option value="SUV">SUV</option>
                                    <option value="Pickup">Pickup</option>
                                    <option value="Luxury">Luxury</option>
                                    <option value="Sports">Sports</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="newVehicleTransmission">Transmisión:</label>
                                <select id="newVehicleTransmission" name="transmission" required>
                                    <option value="Automatic">Automática</option>
                                    <option value="Manual">Manual</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="newVehicleFuelType">Tipo de Combustible:</label>
                            <select id="newVehicleFuelType" name="fuelType" required>
                                <option value="Gasoline">Gasolina</option>
                                <option value="Diesel">Diesel</option>
                                <option value="Electric">Eléctrico</option>
                                <option value="Hybrid">Híbrido</option>
                            </select>
                        </div>
                        <h4>Ubicación</h4>
                        <div class="form-group">
                            <label for="newVehicleAddress">Dirección:</label>
                            <input type="text" id="newVehicleAddress" name="address" required placeholder="Ej: Calle Principal 123">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="newVehicleCity">Ciudad:</label>
                                <input type="text" id="newVehicleCity" name="city" required placeholder="Ej: Madrid">
                            </div>
                            <div class="form-group">
                                <label for="newVehicleState">Estado/Provincia:</label>
                                <input type="text" id="newVehicleState" name="state" required placeholder="Ej: Madrid">
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="newVehicleZipCode">Código Postal:</label>
                            <input type="text" id="newVehicleZipCode" name="zipCode" required placeholder="Ej: 28001">
                        </div>
                        <div class="form-actions">
                            <button type="button" onclick="this.closest('.modal-overlay').remove()" class="btn-secondary">Cancelar</button>
                            <button type="submit" class="btn-primary">Crear Vehículo</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Cargar usuarios para el selector de propietario
        this.loadUsersForSelect(modal);

        // Agregar event listener para el formulario
        modal.querySelector('#createVehicleForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const vehicleData = {
                make: formData.get('make'),
                model: formData.get('model'),
                year: parseInt(formData.get('year')),
                color: formData.get('color'),
                pricePerDay: parseFloat(formData.get('pricePerDay')),
                seats: parseInt(formData.get('seats')),
                licensePlate: formData.get('licensePlate'),
                owner: formData.get('owner'),
                category: formData.get('category'),
                transmission: formData.get('transmission'),
                fuelType: formData.get('fuelType'),
                location: {
                    address: formData.get('address'),
                    city: formData.get('city'),
                    state: formData.get('state'),
                    zipCode: formData.get('zipCode'),
                    coordinates: [0, 0] // Coordenadas por defecto
                },
                status: 'pending'
            };

            try {
                this.showNotification('Creando vehículo...', 'info');
                const response = await adminApiService.createVehicle(vehicleData);
                
                if (response.success) {
                    this.showNotification('Vehículo creado exitosamente', 'success');
                    modal.remove();
                    await this.loadVehicles(); // Recargar la lista de vehículos
                } else {
                    this.showNotification('Error al crear el vehículo: ' + (response.message || 'Error desconocido'), 'error');
                }
            } catch (error) {
                console.error('Error creating vehicle:', error);
                this.showNotification('Error al crear el vehículo: ' + (error.message || 'Error desconocido'), 'error');
            }
        });

        document.body.appendChild(modal);
    }

    async loadUsersForSelect(modal) {
        try {
            const response = await adminApiService.getUsers({ limit: 100 });
            if (response.success) {
                const ownerSelect = modal.querySelector('#newVehicleOwner');
                response.data.users.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user._id;
                    option.textContent = `${user.fullName || user.firstName + ' ' + user.lastName} (${user.email})`;
                    ownerSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    getStatusText(status) {
        const statusMap = {
            'approved': 'aprobado',
            'rejected': 'rechazado',
            'suspended': 'suspendido',
            'pending': 'pendiente'
        };
        return statusMap[status] || status;
    }

    showNotification(message, type = 'info') {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Agregar estilos
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            transform: translateX(400px);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Animar entrada
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    editVehicle(vehicle) {
        console.log('🚗 Editando vehículo:', vehicle);
        console.log('🆔 ID del vehículo:', vehicle._id || vehicle.id);
        
        // Asegurar que tenemos un ID válido
        const vehicleId = vehicle._id || vehicle.id;
        if (!vehicleId) {
            console.error('❌ No se encontró ID del vehículo:', vehicle);
            this.showNotification('Error: No se pudo obtener el ID del vehículo', 'error');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        
        // Obtener la ubicación como string para mostrar en el campo
        const locationString = vehicle.locationObject ? 
            (typeof vehicle.locationObject === 'string' ? vehicle.locationObject : vehicle.locationObject.address || '') 
            : (vehicle.location || '');
        
        modal.innerHTML = `
            <div class="modal-content vehicle-edit-modal">
                <div class="modal-header">
                    <h2>Editar Vehículo</h2>
                    <button class="close-modal" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <form class="edit-vehicle-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="editVehicleMake">Marca:</label>
                                <input type="text" id="editVehicleMake" value="${vehicle.make || ''}" required>
                            </div>
                            <div class="form-group">
                                <label for="editVehicleModel">Modelo:</label>
                                <input type="text" id="editVehicleModel" value="${vehicle.model || ''}" required>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="editVehicleYear">Año:</label>
                                <input type="number" id="editVehicleYear" value="${vehicle.year || 2024}" min="1950" max="2025" required>
                            </div>
                            <div class="form-group">
                                <label for="editVehicleColor">Color:</label>
                                <input type="text" id="editVehicleColor" value="${vehicle.color || ''}" required>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="editVehicleCategory">Categoría:</label>
                                <select id="editVehicleCategory" required>
                                    <option value="Economy" ${vehicle.category === 'Economy' ? 'selected' : ''}>Economy</option>
                                    <option value="Compact" ${vehicle.category === 'Compact' ? 'selected' : ''}>Compact</option>
                                    <option value="Midsize" ${vehicle.category === 'Midsize' ? 'selected' : ''}>Midsize</option>
                                    <option value="Fullsize" ${vehicle.category === 'Fullsize' ? 'selected' : ''}>Fullsize</option>
                                    <option value="SUV" ${vehicle.category === 'SUV' ? 'selected' : ''}>SUV</option>
                                    <option value="Pickup" ${vehicle.category === 'Pickup' ? 'selected' : ''}>Pickup</option>
                                    <option value="Luxury" ${vehicle.category === 'Luxury' ? 'selected' : ''}>Luxury</option>
                                    <option value="Sports" ${vehicle.category === 'Sports' ? 'selected' : ''}>Sports</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="editVehicleTransmission">Transmisión:</label>
                                <select id="editVehicleTransmission" required>
                                    <option value="Automatic" ${vehicle.transmission === 'Automatic' ? 'selected' : ''}>Automática</option>
                                    <option value="Manual" ${vehicle.transmission === 'Manual' ? 'selected' : ''}>Manual</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="editVehicleFuelType">Combustible:</label>
                                <select id="editVehicleFuelType" required>
                                    <option value="Gasoline" ${vehicle.fuelType === 'Gasoline' ? 'selected' : ''}>Gasolina</option>
                                    <option value="Diesel" ${vehicle.fuelType === 'Diesel' ? 'selected' : ''}>Diesel</option>
                                    <option value="Electric" ${vehicle.fuelType === 'Electric' ? 'selected' : ''}>Eléctrico</option>
                                    <option value="Hybrid" ${vehicle.fuelType === 'Hybrid' ? 'selected' : ''}>Híbrido</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="editVehicleSeats">Asientos:</label>
                                <input type="number" id="editVehicleSeats" value="${vehicle.seats || 4}" min="2" max="8" required>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="editVehiclePrice">Precio por día (€):</label>
                                <input type="number" id="editVehiclePrice" value="${vehicle.pricePerDay || 0}" min="1" step="0.01" required>
                            </div>
                            <div class="form-group">
                                <label for="editVehicleLicensePlate">Placa:</label>
                                <input type="text" id="editVehicleLicensePlate" value="${vehicle.licensePlate || ''}" maxlength="10" required style="text-transform: uppercase;">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="editVehicleStatus">Estado:</label>
                            <select id="editVehicleStatus" required>
                                <option value="pending" ${vehicle.status === 'pending' ? 'selected' : ''}>Pendiente</option>
                                <option value="approved" ${vehicle.status === 'approved' ? 'selected' : ''}>Aprobado</option>
                                <option value="rejected" ${vehicle.status === 'rejected' ? 'selected' : ''}>Rechazado</option>
                                <option value="suspended" ${vehicle.status === 'suspended' ? 'selected' : ''}>Suspendido</option>
                            </select>
                        </div>
                        
                        <h4>Ubicación</h4>
                        <div class="form-group">
                            <label for="editVehicleAddress">Dirección:</label>
                            <input type="text" id="editVehicleAddress" value="${vehicle.locationObject?.address || locationString}" required>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="editVehicleCity">Ciudad:</label>
                                <input type="text" id="editVehicleCity" value="${vehicle.locationObject?.city || 'Ciudad por defecto'}" required>
                            </div>
                            <div class="form-group">
                                <label for="editVehicleState">Estado/Provincia:</label>
                                <input type="text" id="editVehicleState" value="${vehicle.locationObject?.state || 'Estado por defecto'}" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="editVehicleZipCode">Código Postal:</label>
                            <input type="text" id="editVehicleZipCode" value="${vehicle.locationObject?.zipCode || '00000'}" required>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                    <button class="btn btn-primary" id="saveVehicleBtn" data-vehicle-id="${vehicleId}">Guardar Cambios</button>
                </div>
            </div>
        `;

        // Agregar event listener para el botón de guardar
        modal.querySelector('#saveVehicleBtn').addEventListener('click', async () => {
            const buttonVehicleId = modal.querySelector('#saveVehicleBtn').dataset.vehicleId;
            console.log('🔧 Vehicle ID from button:', buttonVehicleId);
            console.log('🔧 Original vehicle ID:', vehicleId);
            await this.saveVehicleChanges(buttonVehicleId || vehicleId);
        });

        document.body.appendChild(modal);
    }

    async saveVehicleChanges(vehicleId) {
        try {
            const modal = document.querySelector('.modal-overlay');
            
            // Recopilar todos los datos del formulario incluyendo los campos nuevos
            const formData = {
                make: modal.querySelector('#editVehicleMake').value,
                model: modal.querySelector('#editVehicleModel').value,
                year: parseInt(modal.querySelector('#editVehicleYear').value),
                color: modal.querySelector('#editVehicleColor').value,
                category: modal.querySelector('#editVehicleCategory').value,
                transmission: modal.querySelector('#editVehicleTransmission').value,
                fuelType: modal.querySelector('#editVehicleFuelType').value,
                seats: parseInt(modal.querySelector('#editVehicleSeats').value),
                pricePerDay: parseFloat(modal.querySelector('#editVehiclePrice').value),
                licensePlate: modal.querySelector('#editVehicleLicensePlate').value.toUpperCase(),
                status: modal.querySelector('#editVehicleStatus').value,
                location: {
                    address: modal.querySelector('#editVehicleAddress').value,
                    city: modal.querySelector('#editVehicleCity').value,
                    state: modal.querySelector('#editVehicleState').value,
                    zipCode: modal.querySelector('#editVehicleZipCode').value
                }
            };

            console.log('🔧 Enviando datos de actualización:', formData);
            console.log('🆔 Vehicle ID:', vehicleId);

            const response = await adminApiService.updateVehicle(vehicleId, formData);
            
            if (response.success) {
                this.showNotification('Vehículo actualizado correctamente', 'success');
                modal.remove();
                await this.loadVehicles(); // Recargar la lista de vehículos
            } else {
                console.error('Error del servidor:', response);
                this.showNotification('Error al actualizar el vehículo: ' + (response.message || 'Error desconocido'), 'error');
            }
        } catch (error) {
            console.error('Error updating vehicle:', error);
            this.showNotification('Error al actualizar el vehículo: ' + (error.message || 'Error desconocido'), 'error');
        }
    }

    showVehicleDetails(vehicle) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content vehicle-details-modal">
                <div class="modal-header">
                    <h2>Detalles del Vehículo</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="vehicle-details-grid">
                        <div class="detail-group">
                            <h3>Información del Vehículo</h3>
                            <p><strong>Marca:</strong> ${vehicle.make}</p>
                            <p><strong>Modelo:</strong> ${vehicle.model}</p>
                            <p><strong>Año:</strong> ${vehicle.year}</p>
                            <p><strong>Precio por día:</strong> €${vehicle.price}</p>
                            <p><strong>Ubicación:</strong> ${vehicle.location}</p>
                            <p><strong>Estado:</strong> <span class="status ${vehicle.status}">${vehicle.status}</span></p>
                            <p><strong>Fecha de registro:</strong> ${new Date(vehicle.createdAt).toLocaleDateString()}</p>
                        </div>
                        
                        <div class="detail-group">
                            <h3>Propietario</h3>
                            <p><strong>Nombre:</strong> ${vehicle.ownerName}</p>
                            <p><strong>ID:</strong> ${vehicle.ownerId}</p>
                        </div>
                        
                        <div class="detail-group">
                            <h3>Estadísticas</h3>
                            <p><strong>Reservaciones totales:</strong> ${vehicle.totalReservations}</p>
                            <p><strong>Ingresos totales:</strong> €${vehicle.totalEarnings}</p>
                            <p><strong>Calificación:</strong> ${vehicle.rating > 0 ? `${vehicle.rating}/5` : 'Sin calificaciones'}</p>
                        </div>
                        
                        <div class="detail-group">
                            <h3>Imágenes</h3>
                            <div class="vehicle-images">
                                ${vehicle.images.map(img => `<img src="${img}" alt="Vehicle" style="width: 100px; height: 75px; object-fit: cover; border-radius: 4px;">`).join('')}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cerrar</button>
                    <button class="btn btn-primary" id="editVehicleBtn" data-vehicle-id="${vehicle.id}">Editar</button>
                </div>
            </div>
        `;

        modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        // Agregar event listener para el botón de editar
        modal.querySelector('#editVehicleBtn').addEventListener('click', () => {
            modal.remove(); // Cerrar el modal de detalles
            this.editVehicle(vehicle); // Abrir el modal de edición
        });

        document.body.appendChild(modal);
    }

    renderFilters() {
        const filters = document.createElement('div');
        filters.className = 'admin-filters';
        
        filters.innerHTML = `
            <div class="filters-row">
                <div class="search-box">
                    <input type="text" 
                           placeholder="Buscar vehículos..." 
                           value="${this.searchTerm}"
                           class="search-input">
                    <i class="icon-search"></i>
                </div>
                
                <div class="filter-group">
                    <select class="filter-select status-filter">
                        <option value="all">Todos los estados</option>
                        <option value="approved" ${this.statusFilter === 'approved' ? 'selected' : ''}>Aprobado</option>
                        <option value="pending" ${this.statusFilter === 'pending' ? 'selected' : ''}>Pendiente</option>
                        <option value="suspended" ${this.statusFilter === 'suspended' ? 'selected' : ''}>Suspendido</option>
                        <option value="rejected" ${this.statusFilter === 'rejected' ? 'selected' : ''}>Rechazado</option>
                    </select>
                </div>
                
                <button class="btn btn-primary new-vehicle-btn">
                    <i class="icon-plus"></i>
                    Nuevo Vehículo
                </button>
            </div>
        `;

        // Add event listeners
        const searchInput = filters.querySelector('.search-input');
        const statusFilter = filters.querySelector('.status-filter');
        const newVehicleBtn = filters.querySelector('.new-vehicle-btn');

        searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        statusFilter.addEventListener('change', (e) => this.handleStatusFilter(e.target.value));
        newVehicleBtn.addEventListener('click', () => this.showCreateVehicleModal());

        return filters;
    }

    renderTable() {
        const tableContainer = document.querySelector('.vehicles-table-container');
        if (!tableContainer) return;

        if (this.loading) {
            tableContainer.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>Cargando vehículos...</p>
                </div>
            `;
            return;
        }

        if (this.vehicles.length === 0) {
            tableContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🚗</div>
                    <h3>No hay vehículos</h3>
                    <p>No se encontraron vehículos en la plataforma.</p>
                </div>
                <style>
                    .empty-state {
                        text-align: center;
                        padding: 60px 20px;
                        color: #6b7280;
                    }
                    .empty-icon {
                        font-size: 4rem;
                        margin-bottom: 1rem;
                    }
                    .empty-state h3 {
                        color: #374151;
                        margin-bottom: 0.5rem;
                    }
                    .empty-state p {
                        margin-bottom: 2rem;
                    }
                </style>
            `;
            return;
        }

        const startIndex = (this.currentPage - 1) * this.vehiclesPerPage;
        const endIndex = startIndex + this.vehiclesPerPage;
        const pageVehicles = this.vehicles.slice(startIndex, endIndex);

        tableContainer.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Vehículo</th>
                        <th>Propietario</th>
                        <th>Precio/día</th>
                        <th>Ubicación</th>
                        <th>Estado</th>
                        <th>Reservaciones</th>
                        <th>Ingresos</th>
                        <th>Calificación</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${pageVehicles.map(vehicle => `
                        <tr>
                            <td>
                                <div class="vehicle-cell">
                                    <img src="${vehicle.images[0]}" alt="${vehicle.make} ${vehicle.model}" 
                                         style="width: 60px; height: 40px; object-fit: cover; border-radius: 4px; margin-right: 0.75rem;">
                                    <div class="vehicle-info">
                                        <span class="vehicle-name">${vehicle.make} ${vehicle.model}</span>
                                        <span class="vehicle-year">${vehicle.year}</span>
                                    </div>
                                </div>
                            </td>
                            <td>${vehicle.ownerName}</td>
                            <td>€${vehicle.price}</td>
                            <td>${vehicle.location}</td>
                            <td><span class="status-badge ${vehicle.status || 'undefined'}">${vehicle.status || 'UNDEFINED'}</span></td>
                            <td>${vehicle.totalReservations}</td>
                            <td>€${vehicle.totalEarnings}</td>
                            <td>${vehicle.rating > 0 ? `${vehicle.rating}/5 ⭐` : 'N/A'}</td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-icon" onclick="window.adminApp.vehicles.handleVehicleAction('${vehicle.id}', 'view')" title="Ver detalles">
                                        <i class="icon-eye"></i>
                                    </button>
                                    <button class="btn-icon" onclick="window.adminApp.vehicles.handleVehicleAction('${vehicle.id}', 'edit')" title="Editar">
                                        <i class="icon-edit"></i>
                                    </button>
                                    ${vehicle.status === 'pending' ? 
                                        `<button class="btn-icon success" onclick="window.adminApp.vehicles.handleVehicleAction('${vehicle.id}', 'approve')" title="Aprobar">
                                            <i class="icon-check"></i>
                                        </button>
                                        <button class="btn-icon danger" onclick="window.adminApp.vehicles.handleVehicleAction('${vehicle.id}', 'reject')" title="Rechazar">
                                            <i class="icon-x"></i>
                                        </button>` :
                                        vehicle.status === 'approved' ?
                                        `<button class="btn-icon warning" onclick="window.adminApp.vehicles.handleVehicleAction('${vehicle.id}', 'suspend')" title="Suspender">
                                            <i class="icon-pause"></i>
                                        </button>` :
                                        `<button class="btn-icon success" onclick="window.adminApp.vehicles.handleVehicleAction('${vehicle.id}', 'activate')" title="Activar">
                                            <i class="icon-play"></i>
                                        </button>`
                                    }
                                    <button class="btn-icon danger" onclick="window.adminApp.vehicles.handleVehicleAction('${vehicle.id}', 'delete')" title="Eliminar">
                                        <i class="icon-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        this.renderPagination();
    }

    renderPagination() {
        const paginationContainer = document.querySelector('.vehicles-pagination-container');
        if (!paginationContainer) return;

        if (this.totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = '<div class="pagination">';
        
        // Previous button
        if (this.currentPage > 1) {
            paginationHTML += `<button class="page-btn" onclick="window.adminApp.vehicles.goToPage(${this.currentPage - 1})">‹</button>`;
        }
        
        // Page numbers
        for (let i = 1; i <= this.totalPages; i++) {
            if (i === this.currentPage) {
                paginationHTML += `<span class="page-btn active">${i}</span>`;
            } else {
                paginationHTML += `<button class="page-btn" onclick="window.adminApp.vehicles.goToPage(${i})">${i}</button>`;
            }
        }
        
        // Next button
        if (this.currentPage < this.totalPages) {
            paginationHTML += `<button class="page-btn" onclick="window.adminApp.vehicles.goToPage(${this.currentPage + 1})">›</button>`;
        }
        
        paginationHTML += '</div>';
        paginationContainer.innerHTML = paginationHTML;
    }

    goToPage(page) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.loadVehicles(); // Recargar con nueva página desde la API
        }
    }

    render() {
        const vehiclesSection = document.createElement('div');
        vehiclesSection.className = 'admin-vehicles';
        
        vehiclesSection.innerHTML = `
            <div class="section-header">
                <h1>Gestión de Vehículos</h1>
                <p>Administra todos los vehículos de la plataforma</p>
            </div>
        `;
        
        vehiclesSection.appendChild(this.renderFilters());
        
        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'table-wrapper';
        tableWrapper.innerHTML = `
            <div class="vehicles-table-container"></div>
            <div class="vehicles-pagination-container"></div>
        `;
        
        vehiclesSection.appendChild(tableWrapper);
        
        // Render table after DOM is ready
        setTimeout(() => {
            this.renderTable();
        }, 0);
        
        return vehiclesSection;
    }
}
