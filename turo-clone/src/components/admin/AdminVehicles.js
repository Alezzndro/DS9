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
            
            const response = await adminApiService.getVehicles(filters);
            
            if (response.success) {
                this.vehicles = response.data.vehicles.map(vehicle => ({
                    id: vehicle._id,
                    make: vehicle.make,
                    model: vehicle.model,
                    year: vehicle.year,
                    type: vehicle.type,
                    licensePlate: vehicle.licensePlate,
                    status: vehicle.status,
                    approved: vehicle.status === 'approved',
                    price: vehicle.pricePerDay,
                    location: vehicle.location?.address || 'No especificada',
                    ownerName: vehicle.owner ? `${vehicle.owner.firstName} ${vehicle.owner.lastName}` : 'Sin asignar',
                    ownerId: vehicle.owner?._id,
                    totalReservations: vehicle.stats?.totalBookings || 0,
                    totalEarnings: vehicle.stats?.totalEarnings || 0,
                    rating: vehicle.rating || 0,
                    images: vehicle.images || [],
                    createdAt: vehicle.createdAt,
                    features: vehicle.features || []
                }));
                
                this.totalPages = response.data.pagination.total;
                this.filteredVehicles = [...this.vehicles];
                this.retryCount = 0; // Reset retry count on success
            } else {
                throw new Error(response.message || 'Failed to load vehicles');
            }
        } catch (error) {
            console.error('Error loading vehicles:', error);
            
            // Solo usar datos de ejemplo si hemos agotado los reintentos
            if (this.retryCount >= this.maxRetries) {
                console.warn('Using fallback vehicle data after max retries');
                this.loadMockData(); // Fallback a datos de ejemplo
            } else {
                // Intentar de nuevo
                this.retryCount++;
                setTimeout(() => this.loadVehicles(), 500 * this.retryCount);
                return;
            }
        } finally {
            this.loading = false;
            this.renderTable();
        }
    }

    loadMockData() {
        // Mock data - replace with actual API call
        this.vehicles = [
            {
                id: 'v1',
                make: 'BMW',
                model: 'Serie 3',
                year: 2021,
                ownerId: 'u1',
                ownerName: 'María García',
                price: 65,
                location: 'Madrid',
                status: 'active',
                approved: true,
                images: ['https://via.placeholder.com/300x200?text=BMW+Serie+3'],
                totalReservations: 28,
                totalEarnings: 4200,
                rating: 4.8,
                createdAt: '2023-02-15'
            },
            {
                id: 'v2',
                make: 'Toyota',
                model: 'Corolla',
                year: 2020,
                ownerId: 'u2',
                ownerName: 'Carlos López',
                price: 45,
                location: 'Barcelona',
                status: 'active',
                approved: true,
                images: ['https://via.placeholder.com/300x200?text=Toyota+Corolla'],
                totalReservations: 35,
                totalEarnings: 3850,
                rating: 4.6,
                createdAt: '2023-01-20'
            },
            {
                id: 'v3',
                make: 'Mercedes',
                model: 'Clase C',
                year: 2022,
                ownerId: 'u3',
                ownerName: 'Ana Martínez',
                price: 85,
                location: 'Valencia',
                status: 'pending',
                approved: false,
                images: ['https://via.placeholder.com/300x200?text=Mercedes+Clase+C'],
                totalReservations: 0,
                totalEarnings: 0,
                rating: 0,
                createdAt: '2023-06-10'
            }
        ];
        
        this.applyFilters();
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
        const vehicle = this.vehicles.find(v => v.id === vehicleId);
        if (!vehicle) return;

        switch (action) {
            case 'view':
                this.showVehicleDetails(vehicle);
                break;
            case 'edit':
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
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content vehicle-edit-modal">
                <div class="modal-header">
                    <h2>Editar Vehículo</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <form class="edit-vehicle-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="editVehicleMake">Marca:</label>
                                <input type="text" id="editVehicleMake" value="${vehicle.make}" required>
                            </div>
                            <div class="form-group">
                                <label for="editVehicleModel">Modelo:</label>
                                <input type="text" id="editVehicleModel" value="${vehicle.model}" required>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="editVehicleYear">Año:</label>
                                <input type="number" id="editVehicleYear" value="${vehicle.year}" min="1950" max="2025" required>
                            </div>
                            <div class="form-group">
                                <label for="editVehicleType">Tipo:</label>
                                <select id="editVehicleType">
                                    <option value="Sedan" ${vehicle.type === 'Sedan' ? 'selected' : ''}>Sedán</option>
                                    <option value="SUV" ${vehicle.type === 'SUV' ? 'selected' : ''}>SUV</option>
                                    <option value="Hatchback" ${vehicle.type === 'Hatchback' ? 'selected' : ''}>Hatchback</option>
                                    <option value="Convertible" ${vehicle.type === 'Convertible' ? 'selected' : ''}>Convertible</option>
                                    <option value="Coupe" ${vehicle.type === 'Coupe' ? 'selected' : ''}>Coupé</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="editVehiclePrice">Precio por día (€):</label>
                                <input type="number" id="editVehiclePrice" value="${vehicle.price}" min="1" step="0.01" required>
                            </div>
                            <div class="form-group">
                                <label for="editVehicleStatus">Estado:</label>
                                <select id="editVehicleStatus">
                                    <option value="pending" ${vehicle.status === 'pending' ? 'selected' : ''}>Pendiente</option>
                                    <option value="approved" ${vehicle.status === 'approved' ? 'selected' : ''}>Aprobado</option>
                                    <option value="rejected" ${vehicle.status === 'rejected' ? 'selected' : ''}>Rechazado</option>
                                    <option value="suspended" ${vehicle.status === 'suspended' ? 'selected' : ''}>Suspendido</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group full-width">
                            <label for="editVehicleLocation">Ubicación:</label>
                            <input type="text" id="editVehicleLocation" value="${vehicle.location}">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                    <button class="btn btn-primary" onclick="window.adminApp.vehicles.saveVehicleChanges('${vehicle.id}')">Guardar Cambios</button>
                </div>
            </div>
        `;

        modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        document.body.appendChild(modal);
    }

    async saveVehicleChanges(vehicleId) {
        try {
            const modal = document.querySelector('.modal-overlay');
            const formData = {
                make: modal.querySelector('#editVehicleMake').value,
                model: modal.querySelector('#editVehicleModel').value,
                year: parseInt(modal.querySelector('#editVehicleYear').value),
                type: modal.querySelector('#editVehicleType').value,
                pricePerDay: parseFloat(modal.querySelector('#editVehiclePrice').value),
                status: modal.querySelector('#editVehicleStatus').value,
                location: modal.querySelector('#editVehicleLocation').value
            };

            const response = await adminApiService.updateVehicle(vehicleId, formData);
            
            if (response.success) {
                // Actualizar vehículo en la lista local
                const vehicleIndex = this.vehicles.findIndex(v => v.id === vehicleId);
                if (vehicleIndex !== -1) {
                    Object.assign(this.vehicles[vehicleIndex], formData);
                    this.vehicles[vehicleIndex].approved = formData.status === 'approved';
                }
                
                this.renderTable();
                modal.remove();
                this.showNotification('Vehículo actualizado correctamente', 'success');
            } else {
                this.showNotification('Error al actualizar el vehículo', 'error');
            }
        } catch (error) {
            console.error('Error saving vehicle changes:', error);
            this.showNotification('Error al guardar los cambios', 'error');
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
                    <button class="btn btn-primary">Editar</button>
                </div>
            </div>
        `;

        modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
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
                        <option value="active" ${this.statusFilter === 'active' ? 'selected' : ''}>Activo</option>
                        <option value="pending" ${this.statusFilter === 'pending' ? 'selected' : ''}>Pendiente</option>
                        <option value="suspended" ${this.statusFilter === 'suspended' ? 'selected' : ''}>Suspendido</option>
                        <option value="rejected" ${this.statusFilter === 'rejected' ? 'selected' : ''}>Rechazado</option>
                    </select>
                </div>
                
                <button class="btn btn-primary">
                    <i class="icon-plus"></i>
                    Nuevo Vehículo
                </button>
            </div>
        `;

        // Add event listeners
        const searchInput = filters.querySelector('.search-input');
        const statusFilter = filters.querySelector('.status-filter');

        searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        statusFilter.addEventListener('change', (e) => this.handleStatusFilter(e.target.value));

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
                    <h3>No hay vehículos</h3>
                    <p>No se encontraron vehículos que coincidan con los filtros.</p>
                </div>
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
                            <td><span class="status-badge ${vehicle.status}">${vehicle.status}</span></td>
                            <td>${vehicle.totalReservations}</td>
                            <td>€${vehicle.totalEarnings}</td>
                            <td>${vehicle.rating > 0 ? `${vehicle.rating}/5 ⭐` : 'N/A'}</td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-icon" onclick="window.adminApp.vehicles.handleVehicleAction('${vehicle.id}', 'view')" title="Ver detalles">
                                        <i class="icon-eye"></i>
                                    </button>
                                    ${vehicle.status === 'pending' ? 
                                        `<button class="btn-icon success" onclick="window.adminApp.vehicles.handleVehicleAction('${vehicle.id}', 'approve')" title="Aprobar">
                                            <i class="icon-check"></i>
                                        </button>
                                        <button class="btn-icon danger" onclick="window.adminApp.vehicles.handleVehicleAction('${vehicle.id}', 'reject')" title="Rechazar">
                                            <i class="icon-trash"></i>
                                        </button>` :
                                        vehicle.status === 'active' ?
                                        `<button class="btn-icon warning" onclick="window.adminApp.vehicles.handleVehicleAction('${vehicle.id}', 'suspend')" title="Suspender">
                                            <i class="icon-pause"></i>
                                        </button>` :
                                        `<button class="btn-icon success" onclick="window.adminApp.vehicles.handleVehicleAction('${vehicle.id}', 'approve')" title="Activar">
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
