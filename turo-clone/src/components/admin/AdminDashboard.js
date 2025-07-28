import adminApiService from '../../services/adminApiService.js';

export default class AdminDashboard {
    constructor() {
        this.stats = {
            totalUsers: 0,
            totalVehicles: 0,
            activeReservations: 0,
            totalRevenue: 0,
            pendingDocuments: 0,
            pendingVehicles: 0
        };
        this.recentActivity = [];
        this.loading = true;
        this.retryCount = 0;
        this.maxRetries = 3;
        
        // Esperar un poco para asegurar que el token esté disponible
        setTimeout(() => {
            this.loadDashboardData();
        }, 100);
    }

    async loadDashboardData() {
        try {
            this.loading = true;
            
            // Verificar que tenemos un token de autenticación
            const token = localStorage.getItem('turo_clone_auth_token');
            if (!token) {
                console.warn('No auth token found, retrying...');
                if (this.retryCount < this.maxRetries) {
                    this.retryCount++;
                    setTimeout(() => this.loadDashboardData(), 500 * this.retryCount);
                    return;
                }
                throw new Error('No authentication token available');
            }
            
            const response = await adminApiService.getDashboardData();
            
            if (response.success) {
                this.stats = response.data.stats;
                this.recentActivity = response.data.recentActivity;
                this.retryCount = 0; // Reset retry count on success
            } else {
                throw new Error(response.message || 'Failed to load dashboard data');
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            
            // Solo usar datos de ejemplo si hemos agotado los reintentos
            if (this.retryCount >= this.maxRetries) {
                console.warn('Using fallback data after max retries');
                this.stats = {
                    totalUsers: 1247,
                    totalVehicles: 324,
                    activeReservations: 89,
                    totalRevenue: 125430,
                    pendingDocuments: 12,
                    pendingVehicles: 8
                };
            } else {
                // Intentar de nuevo
                this.retryCount++;
                setTimeout(() => this.loadDashboardData(), 500 * this.retryCount);
                return;
            }
        } finally {
            this.loading = false;
            // Re-renderizar después de cargar los datos
            if (this.container) {
                this.updateStats();
            }
        }
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    }

    renderStatsCards() {
        const statsContainer = document.createElement('div');
        statsContainer.className = 'stats-grid';
        
        const statsData = [
            {
                title: 'Total Usuarios',
                value: this.stats.totalUsers.toLocaleString(),
                icon: 'icon-users',
                color: 'blue',
                change: '+12%'
            },
            {
                title: 'Total Vehículos',
                value: this.stats.totalVehicles.toLocaleString(),
                icon: 'icon-car',
                color: 'green',
                change: '+8%'
            },
            {
                title: 'Reservaciones Activas',
                value: this.stats.activeReservations.toLocaleString(),
                icon: 'icon-calendar',
                color: 'orange',
                change: '+15%'
            },
            {
                title: 'Ingresos Totales',
                value: this.formatCurrency(this.stats.totalRevenue),
                icon: 'icon-money',
                color: 'purple',
                change: '+23%'
            }
        ];

        statsData.forEach(stat => {
            const card = document.createElement('div');
            card.className = `stat-card ${stat.color}`;
            card.innerHTML = `
                <div class="stat-icon">
                    <i class="${stat.icon}"></i>
                </div>
                <div class="stat-content">
                    <h3>${stat.value}</h3>
                    <p>${stat.title}</p>
                    <span class="stat-change positive">${stat.change}</span>
                </div>
            `;
            statsContainer.appendChild(card);
        });

        return statsContainer;
    }

    renderPendingActions() {
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'pending-actions';
        
        if (this.loading) {
            actionsContainer.innerHTML = `
                <h3>Acciones Pendientes</h3>
                <div class="loading">Cargando...</div>
            `;
            return actionsContainer;
        }
        
        actionsContainer.innerHTML = `
            <h3>Acciones Pendientes</h3>
            <div class="actions-grid">
                <div class="action-card urgent">
                    <div class="action-icon">
                        <i class="icon-document"></i>
                    </div>
                    <div class="action-content">
                        <h4>Documentos Pendientes</h4>
                        <p>${this.stats.pendingDocuments} documentos esperan revisión</p>
                        <button class="btn btn-primary" onclick="window.adminApp.navigateToSection('documents')">
                            Revisar Documentos
                        </button>
                    </div>
                </div>
                
                <div class="action-card warning">
                    <div class="action-icon">
                        <i class="icon-car"></i>
                    </div>
                    <div class="action-content">
                        <h4>Vehículos Pendientes</h4>
                        <p>${this.stats.pendingVehicles} vehículos esperan aprobación</p>
                        <button class="btn btn-primary" onclick="window.adminApp.navigateToSection('vehicles')">
                            Revisar Vehículos
                        </button>
                    </div>
                </div>
                
                <div class="action-card info">
                    <div class="action-icon">
                        <i class="icon-star"></i>
                    </div>
                    <div class="action-content">
                        <h4>Reseñas Reportadas</h4>
                        <p>3 reseñas fueron reportadas</p>
                        <button class="btn btn-primary" onclick="window.adminApp.navigateToSection('reviews')">
                            Revisar Reseñas
                        </button>
                    </div>
                </div>
            </div>
        `;

        return actionsContainer;
    }

    renderRecentActivity() {
        const activityContainer = document.createElement('div');
        activityContainer.className = 'recent-activity';
        
        if (this.loading) {
            activityContainer.innerHTML = `
                <h3>Actividad Reciente</h3>
                <div class="loading">Cargando...</div>
            `;
            return activityContainer;
        }

        // Combinar usuarios y reservaciones recientes
        const activities = [];
        
        if (this.recentActivity.users) {
            this.recentActivity.users.forEach(user => {
                activities.push({
                    type: 'user',
                    message: `Nuevo usuario registrado: ${user.firstName} ${user.lastName}`,
                    time: this.formatTimeAgo(user.createdAt),
                    icon: 'icon-user-plus'
                });
            });
        }
        
        if (this.recentActivity.reservations) {
            this.recentActivity.reservations.forEach(reservation => {
                activities.push({
                    type: 'reservation',
                    message: `Nueva reservación: ${reservation.vehicle?.make} ${reservation.vehicle?.model} por ${reservation.user?.firstName}`,
                    time: this.formatTimeAgo(reservation.createdAt),
                    icon: 'icon-calendar-plus'
                });
            });
        }

        // Ordenar por fecha más reciente
        activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        const activityList = activities.slice(0, 5).map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.type}">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <p>${activity.message}</p>
                    <span class="activity-time">${activity.time}</span>
                </div>
            </div>
        `).join('');

        activityContainer.innerHTML = `
            <h3>Actividad Reciente</h3>
            <div class="activity-list">
                ${activityList || '<p>No hay actividad reciente</p>'}
            </div>
        `;

        return activityContainer;
    }

    formatTimeAgo(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Ahora mismo';
        if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} h ago`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays} días ago`;
    }

    renderCharts() {
        const chartsContainer = document.createElement('div');
        chartsContainer.className = 'charts-container';
        
        chartsContainer.innerHTML = `
            <div class="chart-card">
                <h3>Ingresos por Mes</h3>
                <div class="chart-placeholder">
                    <canvas id="revenueChart" width="400" height="200"></canvas>
                </div>
            </div>
            
            <div class="chart-card">
                <h3>Nuevos Usuarios</h3>
                <div class="chart-placeholder">
                    <canvas id="usersChart" width="400" height="200"></canvas>
                </div>
            </div>
        `;

        // Here you would initialize actual charts (Chart.js, D3, etc.)
        // For now, we'll add placeholders
        setTimeout(() => {
            this.initializeCharts();
        }, 100);

        return chartsContainer;
    }

    initializeCharts() {
        // Placeholder for chart initialization
        // In a real implementation, you would use Chart.js or similar
        const revenueCanvas = document.getElementById('revenueChart');
        const usersCanvas = document.getElementById('usersChart');
        
        if (revenueCanvas) {
            const ctx = revenueCanvas.getContext('2d');
            ctx.fillStyle = '#e3f2fd';
            ctx.fillRect(0, 0, 400, 200);
            ctx.fillStyle = '#1976d2';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Gráfico de Ingresos', 200, 100);
            ctx.fillText('(Integrar Chart.js)', 200, 120);
        }
        
        if (usersCanvas) {
            const ctx = usersCanvas.getContext('2d');
            ctx.fillStyle = '#e8f5e8';
            ctx.fillRect(0, 0, 400, 200);
            ctx.fillStyle = '#388e3c';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Gráfico de Usuarios', 200, 100);
            ctx.fillText('(Integrar Chart.js)', 200, 120);
        }
    }

    render() {
        const dashboard = document.createElement('div');
        dashboard.className = 'admin-dashboard';
        
        dashboard.innerHTML = `
            <div class="dashboard-header">
                <h1>Dashboard</h1>
                <p>Resumen general de la plataforma</p>
            </div>
        `;
        
        dashboard.appendChild(this.renderStatsCards());
        dashboard.appendChild(this.renderPendingActions());
        
        const contentGrid = document.createElement('div');
        contentGrid.className = 'dashboard-content-grid';
        
        contentGrid.appendChild(this.renderRecentActivity());
        contentGrid.appendChild(this.renderCharts());
        
        dashboard.appendChild(contentGrid);
        
        // Guardar referencia del container para updates
        this.container = dashboard;
        
        return dashboard;
    }

    updateStats() {
        if (!this.container) return;
        
        // Actualizar solo las estadísticas sin re-renderizar todo
        const statsCards = this.container.querySelectorAll('.stat-card .stat-value');
        if (statsCards.length >= 4) {
            statsCards[0].textContent = this.stats.totalUsers.toLocaleString();
            statsCards[1].textContent = this.stats.totalVehicles.toLocaleString();
            statsCards[2].textContent = this.stats.activeReservations.toLocaleString();
            statsCards[3].textContent = this.formatCurrency(this.stats.totalRevenue);
        }
        
        // Actualizar acciones pendientes
        const pendingCounts = this.container.querySelectorAll('.pending-count');
        if (pendingCounts.length >= 3) {
            pendingCounts[0].textContent = `${this.stats.pendingDocuments} documentos esperan revisión`;
            pendingCounts[1].textContent = `${this.stats.pendingVehicles} vehículos esperan aprobación`;
            // Agregar más actualizaciones según sea necesario
        }
    }
}
