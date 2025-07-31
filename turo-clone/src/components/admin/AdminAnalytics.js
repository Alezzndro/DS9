import adminApiService from '../../services/adminApiService.js';

export default class AdminAnalytics {
    constructor() {
        this.loading = true;
        this.timeRange = 'month';
        this.analytics = {};
        this.data = {
            revenue: {
                labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                values: [8200, 9100, 7800, 10500, 12300, 11800]
            },
            users: {
                labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                values: [45, 62, 38, 71, 89, 67]
            },
            reservations: {
                labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                values: [120, 145, 98, 167, 201, 189]
            },
            vehicles: {
                labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                values: [12, 18, 8, 25, 31, 22]
            }
        };
        
        this.loadAnalytics();
    }

    async loadAnalytics() {
        try {
            this.loading = true;
            const response = await adminApiService.getAnalytics({
                timeRange: this.timeRange
            });
            
            if (response.success) {
                this.analytics = {
                    totalRevenue: response.data.totalRevenue || 0,
                    totalUsers: response.data.totalUsers || 0,
                    totalReservations: response.data.totalReservations || 0,
                    totalVehicles: response.data.totalVehicles || 0,
                    revenueGrowth: response.data.revenueGrowth || 0,
                    usersGrowth: response.data.usersGrowth || 0,
                    reservationsGrowth: response.data.reservationsGrowth || 0,
                    vehiclesGrowth: response.data.vehiclesGrowth || 0,
                    topVehicles: response.data.topVehicles || [],
                    topUsers: response.data.topUsers || [],
                    monthlyStats: response.data.monthlyStats || []
                };
                
                // Actualizar datos de gráficos si están disponibles
                if (response.data.chartData) {
                    this.data = response.data.chartData;
                }
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
            this.loadMockData();
        } finally {
            this.loading = false;
            this.updateAnalyticsDisplay();
        }
    }

    loadMockData() {
        this.analytics = {
            totalRevenue: 59700,
            totalUsers: 372,
            totalReservations: 920,
            totalVehicles: 116,
            revenueGrowth: 12.5,
            usersGrowth: 8.3,
            reservationsGrowth: 15.2,
            vehiclesGrowth: 5.7,
            topVehicles: [
                { name: 'BMW Serie 3', bookings: 45, revenue: 2850 },
                { name: 'Toyota Corolla', bookings: 38, revenue: 1710 },
                { name: 'Mercedes Clase C', bookings: 32, revenue: 2720 }
            ],
            topUsers: [
                { name: 'Juan Pérez', bookings: 12, totalSpent: 850 },
                { name: 'María García', bookings: 9, totalSpent: 720 },
                { name: 'Carlos López', bookings: 8, totalSpent: 640 }
            ],
            monthlyStats: [
                { month: 'Enero', revenue: 8200, users: 45, reservations: 120 },
                { month: 'Febrero', revenue: 9100, users: 62, reservations: 145 },
                { month: 'Marzo', revenue: 7800, users: 38, reservations: 98 },
                { month: 'Abril', revenue: 10500, users: 71, reservations: 167 },
                { month: 'Mayo', revenue: 12300, users: 89, reservations: 201 },
                { month: 'Junio', revenue: 11800, users: 67, reservations: 189 }
            ]
        };
    }

    async handleTimeRangeChange(range) {
        this.timeRange = range;
        await this.loadAnalytics(); // Recargar con nuevo rango de tiempo
        this.updateCharts();
        this.updateTimeRangeButtons();
    }

    updateTimeRangeButtons() {
        const buttons = document.querySelectorAll('.time-range-btn');
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.range === this.timeRange) {
                btn.classList.add('active');
            }
        });
    }

    updateCharts() {
        // En una implementación real, aquí cargarías nuevos datos y actualizarías los gráficos
        console.log('Actualizando gráficos para el rango:', this.timeRange);
        this.updateAnalyticsDisplay();
    }

    updateAnalyticsDisplay() {
        // Actualizar tarjetas de estadísticas principales
        this.updateStatsCards();
        
        // Actualizar listas de top performers
        this.updateTopLists();
    }

    updateStatsCards() {
        // Actualizar Revenue
        const revenueCard = document.querySelector('[data-metric="revenue"]');
        if (revenueCard) {
            const valueEl = revenueCard.querySelector('.metric-value');
            const growthEl = revenueCard.querySelector('.metric-growth');
            if (valueEl) valueEl.textContent = `$${this.analytics.totalRevenue?.toLocaleString() || '0'}`;
            if (growthEl) {
                growthEl.textContent = `${this.analytics.revenueGrowth >= 0 ? '+' : ''}${this.analytics.revenueGrowth?.toFixed(1) || '0'}%`;
                growthEl.className = `metric-growth ${this.analytics.revenueGrowth >= 0 ? 'positive' : 'negative'}`;
            }
        }

        // Actualizar Users
        const usersCard = document.querySelector('[data-metric="users"]');
        if (usersCard) {
            const valueEl = usersCard.querySelector('.metric-value');
            const growthEl = usersCard.querySelector('.metric-growth');
            if (valueEl) valueEl.textContent = this.analytics.totalUsers?.toLocaleString() || '0';
            if (growthEl) {
                growthEl.textContent = `${this.analytics.usersGrowth >= 0 ? '+' : ''}${this.analytics.usersGrowth?.toFixed(1) || '0'}%`;
                growthEl.className = `metric-growth ${this.analytics.usersGrowth >= 0 ? 'positive' : 'negative'}`;
            }
        }

        // Actualizar Reservations
        const reservationsCard = document.querySelector('[data-metric="reservations"]');
        if (reservationsCard) {
            const valueEl = reservationsCard.querySelector('.metric-value');
            const growthEl = reservationsCard.querySelector('.metric-growth');
            if (valueEl) valueEl.textContent = this.analytics.totalReservations?.toLocaleString() || '0';
            if (growthEl) {
                growthEl.textContent = `${this.analytics.reservationsGrowth >= 0 ? '+' : ''}${this.analytics.reservationsGrowth?.toFixed(1) || '0'}%`;
                growthEl.className = `metric-growth ${this.analytics.reservationsGrowth >= 0 ? 'positive' : 'negative'}`;
            }
        }

        // Actualizar Vehicles
        const vehiclesCard = document.querySelector('[data-metric="vehicles"]');
        if (vehiclesCard) {
            const valueEl = vehiclesCard.querySelector('.metric-value');
            const growthEl = vehiclesCard.querySelector('.metric-growth');
            if (valueEl) valueEl.textContent = this.analytics.totalVehicles?.toLocaleString() || '0';
            if (growthEl) {
                growthEl.textContent = `${this.analytics.vehiclesGrowth >= 0 ? '+' : ''}${this.analytics.vehiclesGrowth?.toFixed(1) || '0'}%`;
                growthEl.className = `metric-growth ${this.analytics.vehiclesGrowth >= 0 ? 'positive' : 'negative'}`;
            }
        }
    }

    updateTopLists() {
        // Actualizar top vehículos
        const topVehiclesList = document.querySelector('.top-vehicles-list');
        if (topVehiclesList && this.analytics.topVehicles) {
            topVehiclesList.innerHTML = this.analytics.topVehicles.map(vehicle => `
                <div class="top-item">
                    <div class="item-info">
                        <span class="item-name">${vehicle.name}</span>
                        <span class="item-detail">${vehicle.bookings} reservaciones</span>
                    </div>
                    <div class="item-value">$${vehicle.revenue?.toLocaleString() || '0'}</div>
                </div>
            `).join('');
        }

        // Actualizar top usuarios
        const topUsersList = document.querySelector('.top-users-list');
        if (topUsersList && this.analytics.topUsers) {
            topUsersList.innerHTML = this.analytics.topUsers.map(user => `
                <div class="top-item">
                    <div class="item-info">
                        <span class="item-name">${user.name}</span>
                        <span class="item-detail">${user.bookings} reservaciones</span>
                    </div>
                    <div class="item-value">$${user.totalSpent?.toLocaleString() || '0'}</div>
                </div>
            `).join('');
        }
    }

    renderTimeRangeSelector() {
        const selector = document.createElement('div');
        selector.className = 'time-range-selector';
        
        selector.innerHTML = `
            <div class="time-range-buttons">
                <button class="time-range-btn ${this.timeRange === 'week' ? 'active' : ''}" data-range="week">
                    Última semana
                </button>
                <button class="time-range-btn ${this.timeRange === 'month' ? 'active' : ''}" data-range="month">
                    Último mes
                </button>
                <button class="time-range-btn ${this.timeRange === 'quarter' ? 'active' : ''}" data-range="quarter">
                    Último trimestre
                </button>
                <button class="time-range-btn ${this.timeRange === 'year' ? 'active' : ''}" data-range="year">
                    Último año
                </button>
            </div>
        `;

        selector.querySelectorAll('.time-range-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleTimeRangeChange(btn.dataset.range);
            });
        });

        return selector;
    }

    renderKPIs() {
        const kpisContainer = document.createElement('div');
        kpisContainer.className = 'kpis-grid';
        
        const { stats } = this.analyticsData;
        
        const kpis = [
            {
                title: 'Ingresos Totales',
                value: `$${stats.totalRevenue?.toLocaleString() || '0'}`,
                change: `${stats.revenueGrowth >= 0 ? '+' : ''}${stats.revenueGrowth?.toFixed(1) || '0'}%`,
                changeType: stats.revenueGrowth >= 0 ? 'positive' : 'negative',
                icon: 'icon-money'
            },
            {
                title: 'Usuarios Activos',
                value: stats.activeUsers?.toLocaleString() || '0',
                change: `${stats.userGrowth >= 0 ? '+' : ''}${stats.userGrowth?.toFixed(1) || '0'}%`,
                changeType: stats.userGrowth >= 0 ? 'positive' : 'negative',
                icon: 'icon-users'
            },
            {
                title: 'Vehículos Rentados',
                value: stats.vehiclesRented?.toLocaleString() || '0',
                change: `${stats.rentalsGrowth >= 0 ? '+' : ''}${stats.rentalsGrowth?.toFixed(1) || '0'}%`,
                changeType: stats.rentalsGrowth >= 0 ? 'positive' : 'negative',
                icon: 'icon-car'
            },
            {
                title: 'Duración Promedio',
                value: `${stats.avgRentalDuration || '0'} días`,
                change: `${stats.durationGrowth >= 0 ? '+' : ''}${stats.durationGrowth?.toFixed(1) || '0'}%`,
                changeType: stats.durationGrowth >= 0 ? 'positive' : 'negative',
                icon: 'icon-time'
            }
        ];

        kpis.forEach(kpi => {
            const kpiCard = document.createElement('div');
            kpiCard.className = 'kpi-card';
            kpiCard.innerHTML = `
                <div class="kpi-icon">
                    <i class="${kpi.icon}"></i>
                </div>
                <div class="kpi-content">
                    <h3>${kpi.value}</h3>
                    <p>${kpi.title}</p>
                    <span class="kpi-change ${kpi.changeType}">${kpi.change}</span>
                </div>
            `;
            kpisContainer.appendChild(kpiCard);
        });

        return kpisContainer;
    }

    renderCharts() {
        const chartsContainer = document.createElement('div');
        chartsContainer.className = 'analytics-charts';
        
        chartsContainer.innerHTML = `
            <div class="chart-row">
                <div class="chart-card large">
                    <h3>Ingresos por Período</h3>
                    <canvas id="revenueChart" width="600" height="300"></canvas>
                </div>
                <div class="chart-card">
                    <h3>Nuevos Usuarios</h3>
                    <canvas id="usersChart" width="300" height="300"></canvas>
                </div>
            </div>
            
            <div class="chart-row">
                <div class="chart-card">
                    <h3>Reservaciones</h3>
                    <canvas id="reservationsChart" width="300" height="300"></canvas>
                </div>
                <div class="chart-card">
                    <h3>Vehículos Agregados</h3>
                    <canvas id="vehiclesChart" width="300" height="300"></canvas>
                </div>
            </div>
        `;

        // Inicializar gráficos después de que el DOM esté listo
        setTimeout(() => {
            this.initializeCharts();
        }, 100);

        return chartsContainer;
    }

    initializeCharts() {
        const { charts } = this.analyticsData;
        
        // Gráfico de ingresos
        const revenueCanvas = document.getElementById('revenueChart');
        if (revenueCanvas && charts?.revenue) {
            this.drawLineChart(revenueCanvas, charts.revenue, '#1976d2');
        }

        // Gráfico de usuarios
        const usersCanvas = document.getElementById('usersChart');
        if (usersCanvas && charts?.users) {
            this.drawBarChart(usersCanvas, charts.users, '#388e3c');
        }

        // Gráfico de reservaciones
        const reservationsCanvas = document.getElementById('reservationsChart');
        if (reservationsCanvas && charts?.reservations) {
            this.drawBarChart(reservationsCanvas, charts.reservations, '#f57c00');
        }

        // Gráfico de vehículos
        const vehiclesCanvas = document.getElementById('vehiclesChart');
        if (vehiclesCanvas && charts?.vehicles) {
            this.drawLineChart(vehiclesCanvas, charts.vehicles, '#7b1fa2');
        }
    }

    drawLineChart(canvas, data, color) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const padding = 40;
        
        // Limpiar canvas
        ctx.clearRect(0, 0, width, height);
        
        // Configurar estilos
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.fillStyle = color + '20'; // Transparencia
        
        // Calcular puntos
        const maxValue = Math.max(...data.values);
        const stepX = (width - 2 * padding) / (data.values.length - 1);
        const stepY = (height - 2 * padding) / maxValue;
        
        // Dibujar línea
        ctx.beginPath();
        data.values.forEach((value, index) => {
            const x = padding + index * stepX;
            const y = height - padding - value * stepY;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
        
        // Dibujar puntos
        ctx.fillStyle = color;
        data.values.forEach((value, index) => {
            const x = padding + index * stepX;
            const y = height - padding - value * stepY;
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });
        
        // Etiquetas
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        data.labels.forEach((label, index) => {
            const x = padding + index * stepX;
            ctx.fillText(label, x, height - 10);
        });
    }

    drawBarChart(canvas, data, color) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const padding = 40;
        
        // Limpiar canvas
        ctx.clearRect(0, 0, width, height);
        
        // Configurar estilos
        ctx.fillStyle = color;
        
        // Calcular dimensiones
        const maxValue = Math.max(...data.values);
        const barWidth = (width - 2 * padding) / data.values.length * 0.8;
        const barSpacing = (width - 2 * padding) / data.values.length * 0.2;
        
        // Dibujar barras
        data.values.forEach((value, index) => {
            const barHeight = (value / maxValue) * (height - 2 * padding);
            const x = padding + index * (barWidth + barSpacing);
            const y = height - padding - barHeight;
            
            ctx.fillRect(x, y, barWidth, barHeight);
        });
        
        // Etiquetas
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        data.labels.forEach((label, index) => {
            const x = padding + index * (barWidth + barSpacing) + barWidth / 2;
            ctx.fillText(label, x, height - 10);
        });
    }

    renderTopStats() {
        const statsContainer = document.createElement('div');
        statsContainer.className = 'top-stats';
        
        const { topVehicles, topCities, topHosts } = this.analyticsData;
        
        statsContainer.innerHTML = `
            <div class="stats-row">
                <div class="stat-item">
                    <h4>Vehículos Más Populares</h4>
                    <div class="stat-list">
                        ${topVehicles?.map(vehicle => `
                            <div class="stat-entry">
                                <span>${vehicle.name}</span>
                                <span class="stat-value">${vehicle.bookings} reservas</span>
                            </div>
                        `).join('') || '<div class="stat-entry"><span>No hay datos</span></div>'}
                    </div>
                </div>
                
                <div class="stat-item">
                    <h4>Ciudades Más Activas</h4>
                    <div class="stat-list">
                        ${topCities?.map(city => `
                            <div class="stat-entry">
                                <span>${city.city}</span>
                                <span class="stat-value">$${city.revenue?.toLocaleString() || '0'}</span>
                            </div>
                        `).join('') || '<div class="stat-entry"><span>No hay datos</span></div>'}
                    </div>
                </div>
                
                <div class="stat-item">
                    <h4>Anfitriones Top</h4>
                    <div class="stat-list">
                        ${topHosts?.map(host => `
                            <div class="stat-entry">
                                <span>${host.name}</span>
                                <span class="stat-value">$${host.revenue?.toLocaleString() || '0'}</span>
                            </div>
                        `).join('') || '<div class="stat-entry"><span>No hay datos</span></div>'}
                    </div>
                </div>
            </div>
        `;

        return statsContainer;
    }

    render() {
        const analytics = document.createElement('div');
        analytics.className = 'admin-analytics';
        
        if (this.loading) {
            analytics.innerHTML = `
                <div class="section-header">
                    <h1>Analytics & Reportes</h1>
                    <p>Análisis detallado del rendimiento de la plataforma</p>
                </div>
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>Cargando analytics...</p>
                </div>
            `;
            return analytics;
        }
        
        analytics.innerHTML = `
            <div class="section-header">
                <h1>Analytics & Reportes</h1>
                <p>Análisis detallado del rendimiento de la plataforma</p>
            </div>
        `;
        
        analytics.appendChild(this.renderTimeRangeSelector());
        analytics.appendChild(this.renderKPIs());
        analytics.appendChild(this.renderCharts());
        analytics.appendChild(this.renderTopStats());
        
        return analytics;
    }
}
