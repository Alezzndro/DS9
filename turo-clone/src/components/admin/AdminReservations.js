import adminApiService from '../../services/adminApiService.js';

export default class AdminReservations {
    constructor() {
        this.reservations = [];
        this.filteredReservations = [];
        this.currentPage = 1;
        this.reservationsPerPage = 10;
        this.searchTerm = '';
        this.statusFilter = 'all';
        this.dateFilter = 'all';
        this.loading = true;
        this.totalPages = 1;
        
        this.loadReservations();
    }

    async loadReservations() {
        try {
            this.loading = true;
            const filters = {
                page: this.currentPage,
                limit: this.reservationsPerPage,
                search: this.searchTerm,
                status: this.statusFilter,
                dateFilter: this.dateFilter
            };
            
            const response = await adminApiService.getReservations(filters);
            
            if (response.success) {
                this.reservations = response.data.reservations.map(reservation => ({
                    id: reservation._id,
                    userName: reservation.user ? `${reservation.user.firstName} ${reservation.user.lastName}` : 'Usuario no encontrado',
                    userId: reservation.user?._id,
                    userEmail: reservation.user?.email,
                    vehicleName: reservation.vehicle ? `${reservation.vehicle.make} ${reservation.vehicle.model} ${reservation.vehicle.year}` : 'Vehículo no encontrado',
                    vehicleId: reservation.vehicle?._id,
                    startDate: reservation.startDate,
                    endDate: reservation.endDate,
                    status: reservation.status,
                    totalAmount: reservation.totalAmount,
                    paymentStatus: reservation.paymentStatus || 'pending',
                    location: reservation.vehicle?.location?.address || 'No especificada',
                    createdAt: reservation.createdAt
                }));
                
                this.totalPages = response.data.pagination.total;
                this.filteredReservations = [...this.reservations];
            }
        } catch (error) {
            console.error('Error loading reservations:', error);
            this.loadMockData(); // Fallback a datos de ejemplo
        } finally {
            this.loading = false;
            this.renderTable();
        }
    }

    loadMockData() {
        // Mock data - replace with actual API call
        this.reservations = [
            {
                id: 'r1',
                vehicleId: 'v1',
                vehicleName: 'BMW Serie 3 2021',
                userId: 'u1',
                userName: 'Juan Pérez',
                userEmail: 'juan@example.com',
                startDate: '2024-01-15',
                endDate: '2024-01-18',
                totalAmount: 195.00,
                status: 'confirmed',
                paymentStatus: 'paid',
                createdAt: '2024-01-10T10:30:00Z',
                location: 'Madrid'
            },
            {
                id: 'r2',
                vehicleId: 'v2',
                vehicleName: 'Toyota Corolla 2020',
                userId: 'u2',
                userName: 'María García',
                userEmail: 'maria@example.com',
                startDate: '2024-01-20',
                endDate: '2024-01-22',
                totalAmount: 90.00,
                status: 'active',
                paymentStatus: 'paid',
                createdAt: '2024-01-18T14:15:00Z',
                location: 'Barcelona'
            },
            {
                id: 'r3',
                vehicleId: 'v3',
                vehicleName: 'Mercedes Clase C 2022',
                userId: 'u3',
                userName: 'Carlos López',
                userEmail: 'carlos@example.com',
                startDate: '2024-01-25',
                endDate: '2024-01-27',
                totalAmount: 170.00,
                status: 'pending',
                paymentStatus: 'pending',
                createdAt: '2024-01-22T09:45:00Z',
                location: 'Valencia'
            },
            {
                id: 'r4',
                vehicleId: 'v1',
                vehicleName: 'BMW Serie 3 2021',
                userId: 'u4',
                userName: 'Ana Martínez',
                userEmail: 'ana@example.com',
                startDate: '2024-01-12',
                endDate: '2024-01-14',
                totalAmount: 130.00,
                status: 'completed',
                paymentStatus: 'paid',
                createdAt: '2024-01-08T16:20:00Z',
                location: 'Madrid'
            },
            {
                id: 'r5',
                vehicleId: 'v4',
                vehicleName: 'Audi A4 2021',
                userId: 'u5',
                userName: 'Luis Fernández',
                userEmail: 'luis@example.com',
                startDate: '2024-01-30',
                endDate: '2024-02-02',
                totalAmount: 210.00,
                status: 'cancelled',
                paymentStatus: 'refunded',
                createdAt: '2024-01-25T11:30:00Z',
                location: 'Sevilla'
            }
        ];
        
        this.applyFilters();
    }

    applyFilters() {
        this.filteredReservations = this.reservations.filter(reservation => {
            const searchMatch = 
                reservation.vehicleName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                reservation.userName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                reservation.id.toLowerCase().includes(this.searchTerm.toLowerCase());
            
            const statusMatch = this.statusFilter === 'all' || reservation.status === this.statusFilter;
            
            return searchMatch && statusMatch;
        });
        
        this.currentPage = 1;
    }

    handleSearch(searchTerm) {
        this.searchTerm = searchTerm;
        this.currentPage = 1;
        this.loadReservations();
    }

    handleStatusFilter(status) {
        this.statusFilter = status;
        this.currentPage = 1;
        this.loadReservations();
    }

    handleDateFilter(dateFilter) {
        this.dateFilter = dateFilter;
        this.currentPage = 1;
        this.loadReservations();
    }

    async handleReservationAction(reservationId, action) {
        const reservation = this.reservations.find(r => r.id === reservationId);
        if (!reservation) return;

        switch (action) {
            case 'view':
                this.showReservationDetails(reservation);
                break;
            case 'edit':
                this.editReservation(reservation);
                break;
            case 'confirm':
                await this.updateReservationStatus(reservationId, 'confirmed');
                break;
            case 'cancel':
                if (confirm('¿Estás seguro de que quieres cancelar esta reservación?')) {
                    await this.updateReservationStatus(reservationId, 'cancelled');
                }
                break;
            case 'complete':
                await this.updateReservationStatus(reservationId, 'completed');
                break;
            case 'delete':
                if (confirm('¿Estás seguro de que quieres eliminar esta reservación?')) {
                    await this.deleteReservation(reservationId);
                }
                break;
        }
    }

    async updateReservationStatus(reservationId, newStatus) {
        try {
            const response = await adminApiService.updateReservationStatus(reservationId, newStatus);
            
            if (response.success) {
                // Actualizar la reservación en la lista local
                const reservationIndex = this.reservations.findIndex(r => r.id === reservationId);
                if (reservationIndex !== -1) {
                    this.reservations[reservationIndex].status = newStatus;
                    this.renderTable();
                    this.showNotification(`Reservación ${this.getStatusText(newStatus)} correctamente`, 'success');
                }
            } else {
                this.showNotification('Error al actualizar la reservación', 'error');
            }
        } catch (error) {
            console.error('Error updating reservation status:', error);
            this.showNotification('Error al actualizar la reservación', 'error');
        }
    }

    async deleteReservation(reservationId) {
        try {
            const response = await adminApiService.deleteReservation(reservationId);
            
            if (response.success) {
                // Remover reservación de la lista local
                this.reservations = this.reservations.filter(r => r.id !== reservationId);
                this.renderTable();
                this.showNotification('Reservación eliminada correctamente', 'success');
            } else {
                this.showNotification('Error al eliminar la reservación', 'error');
            }
        } catch (error) {
            console.error('Error deleting reservation:', error);
            this.showNotification('Error al eliminar la reservación', 'error');
        }
    }

    getStatusText(status) {
        const statusMap = {
            'confirmed': 'confirmada',
            'pending': 'pendiente',
            'cancelled': 'cancelada',
            'completed': 'completada'
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

    showReservationDetails(reservation) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content reservation-details-modal">
                <div class="modal-header">
                    <h2>Detalles de la Reservación</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="reservation-details-grid">
                        <div class="detail-group">
                            <h3>Información de la Reservación</h3>
                            <p><strong>ID:</strong> ${reservation.id}</p>
                            <p><strong>Vehículo:</strong> ${reservation.vehicleName}</p>
                            <p><strong>Fecha inicio:</strong> ${new Date(reservation.startDate).toLocaleDateString()}</p>
                            <p><strong>Fecha fin:</strong> ${new Date(reservation.endDate).toLocaleDateString()}</p>
                            <p><strong>Ubicación:</strong> ${reservation.location}</p>
                            <p><strong>Estado:</strong> <span class="status ${reservation.status}">${reservation.status}</span></p>
                            <p><strong>Creada:</strong> ${new Date(reservation.createdAt).toLocaleDateString()}</p>
                        </div>
                        
                        <div class="detail-group">
                            <h3>Cliente</h3>
                            <p><strong>Nombre:</strong> ${reservation.userName}</p>
                            <p><strong>Email:</strong> ${reservation.userEmail}</p>
                            <p><strong>ID Usuario:</strong> ${reservation.userId}</p>
                        </div>
                        
                        <div class="detail-group">
                            <h3>Información de Pago</h3>
                            <p><strong>Monto total:</strong> $${reservation.totalAmount.toFixed(2)}</p>
                            <p><strong>Estado del pago:</strong> <span class="status ${reservation.paymentStatus}">${reservation.paymentStatus}</span></p>
                        </div>
                        
                        <div class="detail-group">
                            <h3>Duración</h3>
                            <p><strong>Días:</strong> ${Math.ceil((new Date(reservation.endDate) - new Date(reservation.startDate)) / (1000 * 60 * 60 * 24))}</p>
                            <p><strong>Precio por día:</strong> $${(reservation.totalAmount / Math.ceil((new Date(reservation.endDate) - new Date(reservation.startDate)) / (1000 * 60 * 60 * 24))).toFixed(2)}</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cerrar</button>
                    <button class="btn btn-primary">Contactar Cliente</button>
                </div>
            </div>
        `;

        modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        document.body.appendChild(modal);
    }

    editReservation(reservation) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content reservation-edit-modal">
                <div class="modal-header">
                    <h2>Editar Reservación</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <form class="edit-reservation-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="editReservationStatus">Estado:</label>
                                <select id="editReservationStatus">
                                    <option value="pending" ${reservation.status === 'pending' ? 'selected' : ''}>Pendiente</option>
                                    <option value="confirmed" ${reservation.status === 'confirmed' ? 'selected' : ''}>Confirmada</option>
                                    <option value="completed" ${reservation.status === 'completed' ? 'selected' : ''}>Completada</option>
                                    <option value="cancelled" ${reservation.status === 'cancelled' ? 'selected' : ''}>Cancelada</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="editPaymentStatus">Estado del Pago:</label>
                                <select id="editPaymentStatus">
                                    <option value="pending" ${reservation.paymentStatus === 'pending' ? 'selected' : ''}>Pendiente</option>
                                    <option value="paid" ${reservation.paymentStatus === 'paid' ? 'selected' : ''}>Pagado</option>
                                    <option value="refunded" ${reservation.paymentStatus === 'refunded' ? 'selected' : ''}>Reembolsado</option>
                                    <option value="failed" ${reservation.paymentStatus === 'failed' ? 'selected' : ''}>Fallido</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="editStartDate">Fecha de Inicio:</label>
                                <input type="date" id="editStartDate" value="${reservation.startDate.split('T')[0]}" required>
                            </div>
                            <div class="form-group">
                                <label for="editEndDate">Fecha de Fin:</label>
                                <input type="date" id="editEndDate" value="${reservation.endDate.split('T')[0]}" required>
                            </div>
                        </div>
                        
                        <div class="form-group full-width">
                            <label for="editTotalAmount">Monto Total ($):</label>
                            <input type="number" id="editTotalAmount" value="${reservation.totalAmount}" min="0" step="0.01" required>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                    <button class="btn btn-primary" onclick="window.adminApp.reservations.saveReservationChanges('${reservation.id}')">Guardar Cambios</button>
                </div>
            </div>
        `;

        modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        document.body.appendChild(modal);
    }

    async saveReservationChanges(reservationId) {
        try {
            const modal = document.querySelector('.modal-overlay');
            const formData = {
                status: modal.querySelector('#editReservationStatus').value,
                paymentStatus: modal.querySelector('#editPaymentStatus').value,
                startDate: modal.querySelector('#editStartDate').value,
                endDate: modal.querySelector('#editEndDate').value,
                totalAmount: parseFloat(modal.querySelector('#editTotalAmount').value)
            };

            const response = await adminApiService.updateReservation(reservationId, formData);
            
            if (response.success) {
                // Actualizar reservación en la lista local
                const reservationIndex = this.reservations.findIndex(r => r.id === reservationId);
                if (reservationIndex !== -1) {
                    Object.assign(this.reservations[reservationIndex], formData);
                }
                
                this.renderTable();
                modal.remove();
                this.showNotification('Reservación actualizada correctamente', 'success');
            } else {
                this.showNotification('Error al actualizar la reservación', 'error');
            }
        } catch (error) {
            console.error('Error saving reservation changes:', error);
            this.showNotification('Error al guardar los cambios', 'error');
        }
    }

    renderFilters() {
        const filters = document.createElement('div');
        filters.className = 'admin-filters';
        
        filters.innerHTML = `
            <div class="filters-row">
                <div class="search-box">
                    <input type="text" 
                           placeholder="Buscar reservaciones..." 
                           value="${this.searchTerm}"
                           class="search-input">
                    <i class="icon-search"></i>
                </div>
                
                <div class="filter-group">
                    <select class="filter-select status-filter">
                        <option value="all">Todos los estados</option>
                        <option value="pending" ${this.statusFilter === 'pending' ? 'selected' : ''}>Pendiente</option>
                        <option value="confirmed" ${this.statusFilter === 'confirmed' ? 'selected' : ''}>Confirmada</option>
                        <option value="active" ${this.statusFilter === 'active' ? 'selected' : ''}>Activa</option>
                        <option value="completed" ${this.statusFilter === 'completed' ? 'selected' : ''}>Completada</option>
                        <option value="cancelled" ${this.statusFilter === 'cancelled' ? 'selected' : ''}>Cancelada</option>
                    </select>
                </div>
                
                <button class="btn btn-primary">
                    <i class="icon-plus"></i>
                    Nueva Reservación
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
        const tableContainer = document.querySelector('.reservations-table-container');
        if (!tableContainer) return;

        if (this.loading) {
            tableContainer.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>Cargando reservaciones...</p>
                </div>
            `;
            return;
        }

        if (this.reservations.length === 0) {
            tableContainer.innerHTML = `
                <div class="empty-state">
                    <h3>No hay reservaciones</h3>
                    <p>No se encontraron reservaciones que coincidan con los filtros.</p>
                </div>
            `;
            return;
        }

        const startIndex = (this.currentPage - 1) * this.reservationsPerPage;
        const endIndex = startIndex + this.reservationsPerPage;
        const pageReservations = this.reservations.slice(startIndex, endIndex);

        tableContainer.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Vehículo</th>
                        <th>Cliente</th>
                        <th>Fechas</th>
                        <th>Ubicación</th>
                        <th>Monto</th>
                        <th>Estado</th>
                        <th>Pago</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${pageReservations.map(reservation => {
                        const days = Math.ceil((new Date(reservation.endDate) - new Date(reservation.startDate)) / (1000 * 60 * 60 * 24));
                        return `
                        <tr>
                            <td><strong>${reservation.id}</strong></td>
                            <td>${reservation.vehicleName}</td>
                            <td>
                                <div class="user-cell">
                                    <div class="user-info">
                                        <span class="user-name">${reservation.userName}</span>
                                        <span class="user-email">${reservation.userEmail}</span>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div class="date-range">
                                    <div>${new Date(reservation.startDate).toLocaleDateString()}</div>
                                    <div>→ ${new Date(reservation.endDate).toLocaleDateString()}</div>
                                    <small>(${days} días)</small>
                                </div>
                            </td>
                            <td>${reservation.location}</td>
                            <td><strong>$${reservation.totalAmount.toFixed(2)}</strong></td>
                            <td><span class="status-badge ${reservation.status}">${reservation.status}</span></td>
                            <td><span class="status-badge ${reservation.paymentStatus}">${reservation.paymentStatus}</span></td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-icon" onclick="window.adminApp.reservations.handleReservationAction('${reservation.id}', 'view')" title="Ver detalles">
                                        <i class="icon-eye"></i>
                                    </button>
                                    ${reservation.status === 'pending' ? 
                                        `<button class="btn-icon success" onclick="window.adminApp.reservations.handleReservationAction('${reservation.id}', 'confirm')" title="Confirmar">
                                            <i class="icon-check"></i>
                                        </button>` : ''
                                    }
                                    ${reservation.status === 'confirmed' ? 
                                        `<button class="btn-icon success" onclick="window.adminApp.reservations.handleReservationAction('${reservation.id}', 'complete')" title="Completar">
                                            <i class="icon-check"></i>
                                        </button>` : ''
                                    }
                                    ${(reservation.status === 'pending' || reservation.status === 'confirmed') ? 
                                        `<button class="btn-icon danger" onclick="window.adminApp.reservations.handleReservationAction('${reservation.id}', 'cancel')" title="Cancelar">
                                            <i class="icon-trash"></i>
                                        </button>` : ''
                                    }
                                </div>
                            </td>
                        </tr>
                    `}).join('')}
                </tbody>
            </table>
        `;

        this.renderPagination();
    }

    renderPagination() {
        const paginationContainer = document.querySelector('.reservations-pagination-container');
        if (!paginationContainer) return;

        if (this.totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = '<div class="pagination">';
        
        if (this.currentPage > 1) {
            paginationHTML += `<button class="page-btn" onclick="window.adminApp.reservations.goToPage(${this.currentPage - 1})">‹</button>`;
        }
        
        for (let i = 1; i <= this.totalPages; i++) {
            if (i === this.currentPage) {
                paginationHTML += `<span class="page-btn active">${i}</span>`;
            } else {
                paginationHTML += `<button class="page-btn" onclick="window.adminApp.reservations.goToPage(${i})">${i}</button>`;
            }
        }
        
        if (this.currentPage < this.totalPages) {
            paginationHTML += `<button class="page-btn" onclick="window.adminApp.reservations.goToPage(${this.currentPage + 1})">›</button>`;
        }
        
        paginationHTML += '</div>';
        paginationContainer.innerHTML = paginationHTML;
    }

    goToPage(page) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.loadReservations(); // Recargar con nueva página desde la API
        }
    }

    render() {
        const reservationsSection = document.createElement('div');
        reservationsSection.className = 'admin-reservations';
        
        reservationsSection.innerHTML = `
            <div class="section-header">
                <h1>Gestión de Reservaciones</h1>
                <p>Administra todas las reservaciones de la plataforma</p>
            </div>
        `;
        
        reservationsSection.appendChild(this.renderFilters());
        
        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'table-wrapper';
        tableWrapper.innerHTML = `
            <div class="reservations-table-container"></div>
            <div class="reservations-pagination-container"></div>
        `;
        
        reservationsSection.appendChild(tableWrapper);
        
        setTimeout(() => {
            this.renderTable();
        }, 0);
        
        return reservationsSection;
    }
}
