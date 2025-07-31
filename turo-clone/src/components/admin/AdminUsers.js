import adminApiService from '../../services/adminApiService.js';

export default class AdminUsers {
    constructor() {
        this.users = [];
        this.filteredUsers = [];
        this.currentPage = 1;
        this.usersPerPage = 10;
        this.searchTerm = '';
        this.statusFilter = 'all';
        this.roleFilter = 'all';
        this.loading = true;
        this.totalPages = 1;
        this.retryCount = 0;
        this.maxRetries = 3;
        
        // Esperar un poco para asegurar que el token esté disponible
        setTimeout(() => {
            this.loadUsers();
        }, 100);
    }

    async loadUsers() {
        try {
            this.loading = true;
            const filters = {
                page: this.currentPage,
                limit: this.usersPerPage,
                search: this.searchTerm,
                status: this.statusFilter,
                role: this.roleFilter
            };
            
            const response = await adminApiService.getUsers(filters);
            
            if (response.success) {
                this.users = response.data.users.map(user => ({
                    id: user._id,
                    name: user.fullName || `${user.firstName} ${user.lastName}`,
                    email: user.email,
                    phone: user.phone || 'No especificado',
                    role: user.role,
                    status: user.verificationStatus === 'approved' ? 'active' : 
                           user.verificationStatus === 'rejected' ? 'suspended' : 'pending',
                    verified: user.verificationStatus === 'approved',
                    joinDate: user.createdAt,
                    totalReservations: user.stats?.totalReservations || 0,
                    totalSpent: user.stats?.totalSpent || 0,
                    documentsStatus: user.verificationStatus
                }));
                
                this.totalPages = response.data.pagination.total;
                this.filteredUsers = [...this.users];
            }
        } catch (error) {
            console.error('Error loading users:', error);
            console.error('API Error details:', error.message);
            
            // Si hay error, mostrar lista vacía en lugar de datos de ejemplo
            this.users = [];
            this.filteredUsers = [];
            this.totalPages = 1;
        } finally {
            this.loading = false;
            this.renderTable();
        }
    }

    loadMockData() {
        // Datos de ejemplo como fallback
        this.users = [
            {
                id: '1',
                name: 'Juan Pérez',
                email: 'juan@example.com',
                phone: '+34 666 777 888',
                role: 'user',
                status: 'active',
                verified: true,
                joinDate: '2023-01-15',
                totalReservations: 5,
                totalSpent: 850.00,
                documentsStatus: 'approved'
            }
        ];
        this.filteredUsers = [...this.users];
    }

    handleSearch(searchTerm) {
        this.searchTerm = searchTerm;
        this.currentPage = 1; // Reset a primera página
        this.loadUsers(); // Recargar con nuevos filtros
    }

    handleStatusFilter(status) {
        this.statusFilter = status;
        this.currentPage = 1; // Reset a primera página
        this.loadUsers(); // Recargar con nuevos filtros
    }

    handleRoleFilter(role) {
        this.roleFilter = role;
        this.currentPage = 1; // Reset a primera página
        this.loadUsers(); // Recargar con nuevos filtros
    }

    handleUserAction(userId, action) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        switch (action) {
            case 'view':
                this.showUserDetails(user);
                break;
            case 'edit':
                this.editUser(user);
                break;
            case 'suspend':
                this.updateUserStatus(userId, 'suspended');
                break;
            case 'activate':
                this.updateUserStatus(userId, 'active');
                break;
            case 'delete':
                if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
                    this.deleteUser(userId);
                }
                break;
        }
    }

    async updateUserStatus(userId, newStatus) {
        try {
            const response = await adminApiService.updateUserStatus(userId, newStatus);
            
            if (response.success) {
                // Actualizar el usuario en la lista local
                const userIndex = this.users.findIndex(u => u.id === userId);
                if (userIndex !== -1) {
                    this.users[userIndex].status = newStatus;
                    this.users[userIndex].verified = newStatus === 'active';
                    this.renderTable();
                    this.showNotification(`Usuario ${newStatus === 'active' ? 'activado' : 'suspendido'} correctamente`, 'success');
                }
            } else {
                this.showNotification('Error al actualizar el usuario', 'error');
            }
        } catch (error) {
            console.error('Error updating user status:', error);
            this.showNotification('Error al actualizar el usuario', 'error');
        }
    }

    async deleteUser(userId) {
        try {
            const response = await adminApiService.deleteUser(userId);
            
            if (response.success) {
                // Remover usuario de la lista local
                this.users = this.users.filter(u => u.id !== userId);
                this.renderTable();
                this.showNotification('Usuario eliminado correctamente', 'success');
            } else {
                this.showNotification('Error al eliminar el usuario', 'error');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            this.showNotification('Error al eliminar el usuario', 'error');
        }
    }

    async updateUserRole(userId, newRole) {
        try {
            const response = await adminApiService.updateUserRole(userId, newRole);
            
            if (response.success) {
                // Actualizar el usuario en la lista local
                const userIndex = this.users.findIndex(u => u.id === userId);
                if (userIndex !== -1) {
                    this.users[userIndex].role = newRole;
                    this.renderTable();
                    this.showNotification('Rol actualizado correctamente', 'success');
                }
            } else {
                this.showNotification('Error al actualizar el rol', 'error');
            }
        } catch (error) {
            console.error('Error updating user role:', error);
            this.showNotification('Error al actualizar el rol', 'error');
        }
    }

    async verifyUserDocuments(userId, status) {
        try {
            const response = await adminApiService.verifyUserDocuments(userId, status);
            
            if (response.success) {
                // Actualizar el estado de documentos
                const userIndex = this.users.findIndex(u => u.id === userId);
                if (userIndex !== -1) {
                    this.users[userIndex].documentsStatus = status;
                    this.users[userIndex].verified = status === 'approved';
                    this.renderTable();
                    this.showNotification(`Documentos ${status === 'approved' ? 'aprobados' : 'rechazados'}`, 'success');
                }
            } else {
                this.showNotification('Error al verificar documentos', 'error');
            }
        } catch (error) {
            console.error('Error verifying documents:', error);
            this.showNotification('Error al verificar documentos', 'error');
        }
    }

    showUserDetails(user) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content user-details-modal">
                <div class="modal-header">
                    <h2>Detalles del Usuario</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="user-details-grid">
                        <div class="detail-group">
                            <h3>Información Personal</h3>
                            <p><strong>Nombre:</strong> ${user.name}</p>
                            <p><strong>Email:</strong> ${user.email}</p>
                            <p><strong>Teléfono:</strong> ${user.phone}</p>
                            <p><strong>Rol:</strong> ${user.role}</p>
                            <p><strong>Estado:</strong> <span class="status ${user.status}">${user.status}</span></p>
                            <p><strong>Verificado:</strong> ${user.verified ? 'Sí' : 'No'}</p>
                            <p><strong>Fecha de registro:</strong> ${new Date(user.joinDate).toLocaleDateString()}</p>
                        </div>
                        
                        <div class="detail-group">
                            <h3>Estadísticas</h3>
                            <p><strong>Total reservaciones:</strong> ${user.totalReservations}</p>
                            <p><strong>Total gastado:</strong> $${user.totalSpent.toFixed(2)}</p>
                            ${user.vehiclesCount ? `<p><strong>Vehículos publicados:</strong> ${user.vehiclesCount}</p>` : ''}
                            <p><strong>Estado documentos:</strong> <span class="status ${user.documentsStatus}">${user.documentsStatus}</span></p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cerrar</button>
                    <button class="btn btn-primary edit-user-btn">Editar</button>
                </div>
            </div>
        `;

        modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        // Agregar event listener para el botón de editar
        modal.querySelector('.edit-user-btn').addEventListener('click', () => {
            modal.remove();
            this.editUser(user);
        });

        document.body.appendChild(modal);
    }

    editUser(user) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Editar Usuario</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <form class="edit-user-form">
                        <div class="form-group">
                            <label for="editUserName">Nombre Completo:</label>
                            <input type="text" id="editUserName" value="${user.name}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="editUserEmail">Email:</label>
                            <input type="email" id="editUserEmail" value="${user.email}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="editUserPhone">Teléfono:</label>
                            <input type="tel" id="editUserPhone" value="${user.phone}">
                        </div>
                        
                        <div class="form-group">
                            <label for="editUserRole">Rol:</label>
                            <select id="editUserRole">
                                <option value="user" ${user.role === 'user' ? 'selected' : ''}>Usuario</option>
                                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrador</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="editUserStatus">Estado:</label>
                            <select id="editUserStatus">
                                <option value="active" ${user.status === 'active' ? 'selected' : ''}>Activo</option>
                                <option value="suspended" ${user.status === 'suspended' ? 'selected' : ''}>Suspendido</option>
                                <option value="pending" ${user.status === 'pending' ? 'selected' : ''}>Pendiente</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="editDocumentsStatus">Estado de Documentos:</label>
                            <select id="editDocumentsStatus">
                                <option value="pending" ${user.documentsStatus === 'pending' ? 'selected' : ''}>Pendiente</option>
                                <option value="approved" ${user.documentsStatus === 'approved' ? 'selected' : ''}>Aprobado</option>
                                <option value="rejected" ${user.documentsStatus === 'rejected' ? 'selected' : ''}>Rechazado</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                    <button class="btn btn-primary save-user-btn">Guardar Cambios</button>
                </div>
            </div>
        `;

        modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        // Agregar event listener para el botón de guardar
        modal.querySelector('.save-user-btn').addEventListener('click', () => {
            this.saveUserChanges(user.id);
        });

        document.body.appendChild(modal);
    }

    async saveUserChanges(userId) {
        console.log('Guardando cambios para usuario:', userId);
        try {
            const modal = document.querySelector('.modal-overlay');
            if (!modal) {
                console.error('Modal no encontrado');
                return;
            }
            
            const userStatus = modal.querySelector('#editUserStatus').value;
            const documentsStatus = modal.querySelector('#editDocumentsStatus').value;
            
            const formData = {
                name: modal.querySelector('#editUserName').value,
                email: modal.querySelector('#editUserEmail').value,
                phone: modal.querySelector('#editUserPhone').value,
                role: modal.querySelector('#editUserRole').value
            };
            
            // PRIORIDAD: Estado de Documentos siempre tiene prioridad sobre Estado general
            // Solo usar el Estado general si no se ha modificado el Estado de Documentos
            
            console.log('🔍 Estado de documentos seleccionado:', documentsStatus);
            console.log('🔍 Estado general seleccionado:', userStatus);
            
            // Usar directamente el estado de documentos seleccionado
            formData.documentsStatus = documentsStatus;
            console.log('🎯 Usando estado de documentos:', documentsStatus);
            
            console.log('Datos a enviar:', formData);
            console.log('Estado de documentos usado:', formData.documentsStatus);

            const response = await adminApiService.updateUser(userId, formData);
            
            if (response.success) {
                console.log('✅ Usuario actualizado en servidor:', response.data);
                
                // Cerrar modal
                modal.remove();
                
                // Mostrar notificación de éxito
                this.showNotification('Usuario actualizado correctamente', 'success');
                
                // Recargar datos del servidor para asegurar sincronización
                await this.loadUsers();
            } else {
                console.error('❌ Error en respuesta del servidor:', response);
                this.showNotification('Error al actualizar el usuario: ' + (response.message || 'Error desconocido'), 'error');
            }
        } catch (error) {
            console.error('❌ Error saving user changes:', error);
            this.showNotification('Error al guardar los cambios: ' + error.message, 'error');
        }
    }

    renderFilters() {
        const filters = document.createElement('div');
        filters.className = 'admin-filters';
        
        filters.innerHTML = `
            <div class="filters-row">
                <div class="search-box">
                    <input type="text" 
                           placeholder="Buscar usuarios..." 
                           value="${this.searchTerm}"
                           class="search-input">
                    <i class="icon-search"></i>
                </div>
                
                <div class="filter-group">
                    <select class="filter-select status-filter">
                        <option value="all">Todos los estados</option>
                        <option value="active" ${this.statusFilter === 'active' ? 'selected' : ''}>Activo</option>
                        <option value="suspended" ${this.statusFilter === 'suspended' ? 'selected' : ''}>Suspendido</option>
                    </select>
                </div>
                
                <div class="filter-group">
                    <select class="filter-select role-filter">
                        <option value="all">Todos los roles</option>
                        <option value="user" ${this.roleFilter === 'user' ? 'selected' : ''}>Usuario</option>
                        <option value="admin" ${this.roleFilter === 'admin' ? 'selected' : ''}>Administrador</option>
                    </select>
                </div>
                
                <button class="btn btn-primary">
                    <i class="icon-plus"></i>
                    Nuevo Usuario
                </button>
            </div>
        `;

        // Add event listeners
        const searchInput = filters.querySelector('.search-input');
        const statusFilter = filters.querySelector('.status-filter');
        const roleFilter = filters.querySelector('.role-filter');
        const newUserBtn = filters.querySelector('.btn-primary');

        searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        statusFilter.addEventListener('change', (e) => this.handleStatusFilter(e.target.value));
        roleFilter.addEventListener('change', (e) => this.handleRoleFilter(e.target.value));
        newUserBtn.addEventListener('click', () => this.showCreateUserModal());

        return filters;
    }

    renderTable() {
        const tableContainer = document.querySelector('.users-table-container');
        if (!tableContainer) return;

        if (this.loading) {
            tableContainer.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>Cargando usuarios...</p>
                </div>
            `;
            return;
        }

        if (this.users.length === 0) {
            tableContainer.innerHTML = `
                <div class="empty-state">
                    <h3>No hay usuarios</h3>
                    <p>No se encontraron usuarios que coincidan con los filtros.</p>
                </div>
            `;
            return;
        }

        const startIndex = (this.currentPage - 1) * this.usersPerPage;
        const endIndex = startIndex + this.usersPerPage;
        const pageUsers = this.users.slice(startIndex, endIndex);

        tableContainer.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Usuario</th>
                        <th>Email</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        <th>Verificado</th>
                        <th>Reservaciones</th>
                        <th>Total Gastado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${pageUsers.map(user => `
                        <tr>
                            <td>
                                <div class="user-cell">
                                    <div class="user-avatar">${user.name.charAt(0)}</div>
                                    <div class="user-info">
                                        <span class="user-name">${user.name}</span>
                                        <span class="user-date">Registro: ${new Date(user.joinDate).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </td>
                            <td>${user.email}</td>
                            <td><span class="role-badge ${user.role}">${user.role}</span></td>
                            <td><span class="status-badge ${user.status}">${user.status}</span></td>
                            <td>
                                <span class="verified-badge ${user.verified ? 'verified' : 'unverified'}">
                                    ${user.verified ? '✓' : '✗'}
                                </span>
                            </td>
                            <td>${user.totalReservations}</td>
                            <td>$${user.totalSpent.toFixed(2)}</td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-icon" onclick="window.adminApp.users.handleUserAction('${user.id}', 'view')" title="Ver detalles">
                                        <i class="icon-eye"></i>
                                    </button>
                                    <button class="btn-icon" onclick="window.adminApp.users.handleUserAction('${user.id}', 'edit')" title="Editar">
                                        <i class="icon-edit"></i>
                                    </button>
                                    ${user.status === 'active' ? 
                                        `<button class="btn-icon warning" onclick="window.adminApp.users.handleUserAction('${user.id}', 'suspend')" title="Suspender">
                                            <i class="icon-pause"></i>
                                        </button>` :
                                        `<button class="btn-icon success" onclick="window.adminApp.users.handleUserAction('${user.id}', 'activate')" title="Activar">
                                            <i class="icon-play"></i>
                                        </button>`
                                    }
                                    <button class="btn-icon danger" onclick="window.adminApp.users.handleUserAction('${user.id}', 'delete')" title="Eliminar">
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
        const paginationContainer = document.querySelector('.pagination-container');
        if (!paginationContainer) return;

        const totalPages = this.totalPages;
        
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = '<div class="pagination">';
        
        // Previous button
        if (this.currentPage > 1) {
            paginationHTML += `<button class="page-btn" onclick="window.adminApp.goToPage(${this.currentPage - 1})">‹</button>`;
        }
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === this.currentPage) {
                paginationHTML += `<span class="page-btn active">${i}</span>`;
            } else {
                paginationHTML += `<button class="page-btn" onclick="window.adminApp.goToPage(${i})">${i}</button>`;
            }
        }
        
        // Next button
        if (this.currentPage < totalPages) {
            paginationHTML += `<button class="page-btn" onclick="window.adminApp.goToPage(${this.currentPage + 1})">›</button>`;
        }
        
        paginationHTML += '</div>';
        paginationContainer.innerHTML = paginationHTML;
    }

    goToPage(page) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.loadUsers(); // Recargar con nueva página desde la API
        }
    }

    render() {
        const usersSection = document.createElement('div');
        usersSection.className = 'admin-users';
        
        usersSection.innerHTML = `
            <div class="section-header">
                <h1>Gestión de Usuarios</h1>
                <p>Administra todos los usuarios de la plataforma</p>
            </div>
        `;
        
        usersSection.appendChild(this.renderFilters());
        
        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'table-wrapper';
        tableWrapper.innerHTML = `
            <div class="users-table-container"></div>
            <div class="pagination-container"></div>
        `;
        
        usersSection.appendChild(tableWrapper);
        
        // Render table after DOM is ready
        setTimeout(() => {
            this.renderTable();
        }, 0);
        
        return usersSection;
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

    showCreateUserModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>Crear Nuevo Usuario</h3>
                    <button onclick="this.closest('.modal-overlay').remove()" class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="createUserForm">
                        <div class="form-group">
                            <label for="newUserName">Nombre completo:</label>
                            <input type="text" id="newUserName" name="fullName" required>
                        </div>
                        <div class="form-group">
                            <label for="newUserEmail">Email:</label>
                            <input type="email" id="newUserEmail" name="email" required>
                        </div>
                        <div class="form-group">
                            <label for="newUserPassword">Contraseña:</label>
                            <input type="password" id="newUserPassword" name="password" required>
                        </div>
                        <div class="form-group">
                            <label for="newUserPhone">Teléfono:</label>
                            <input type="tel" id="newUserPhone" name="phone" required>
                        </div>
                        <div class="form-group">
                            <label for="newUserRole">Rol:</label>
                            <select id="newUserRole" name="role" required>
                                <option value="user">Usuario</option>
                                <option value="admin">Administrador</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="button" onclick="this.closest('.modal-overlay').remove()" class="btn-secondary">Cancelar</button>
                            <button type="submit" class="btn-primary">Crear Usuario</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Agregar event listener para el formulario
        modal.querySelector('#createUserForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const userData = {
                fullName: formData.get('fullName'),
                email: formData.get('email'),
                password: formData.get('password'),
                phone: formData.get('phone'),
                role: formData.get('role')
            };

            try {
                this.showNotification('Creando usuario...', 'info');
                const response = await adminApiService.createUser(userData);
                
                if (response.success) {
                    this.showNotification('Usuario creado exitosamente', 'success');
                    modal.remove();
                    await this.loadUsers(); // Recargar la lista de usuarios
                } else {
                    this.showNotification('Error al crear el usuario: ' + (response.message || 'Error desconocido'), 'error');
                }
            } catch (error) {
                console.error('Error creating user:', error);
                this.showNotification('Error al crear el usuario: ' + (error.message || 'Error desconocido'), 'error');
            }
        });

        document.body.appendChild(modal);
    }
}
