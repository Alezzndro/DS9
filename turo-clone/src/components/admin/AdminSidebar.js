export default class AdminSidebar {
    constructor() {
        this.activeSection = 'dashboard';
    }

    setActiveSection(section) {
        this.activeSection = section;
        this.updateActiveState();
    }

    updateActiveState() {
        const sidebar = document.querySelector('.admin-sidebar');
        if (sidebar) {
            sidebar.querySelectorAll('.sidebar-item').forEach(item => {
                item.classList.remove('active');
                if (item.dataset.section === this.activeSection) {
                    item.classList.add('active');
                }
            });
        }
    }

    render() {
        const sidebar = document.createElement('div');
        sidebar.className = 'admin-sidebar';
        
        sidebar.innerHTML = `
            <div class="sidebar-header">
                <h2>Admin Panel</h2>
            </div>
            <nav class="sidebar-nav">
                <div class="sidebar-item ${this.activeSection === 'dashboard' ? 'active' : ''}" data-section="dashboard">
                    <i class="icon-dashboard"></i>
                    <span>Dashboard</span>
                </div>
                <div class="sidebar-item ${this.activeSection === 'users' ? 'active' : ''}" data-section="users">
                    <i class="icon-users"></i>
                    <span>Usuarios</span>
                </div>
                <div class="sidebar-item ${this.activeSection === 'vehicles' ? 'active' : ''}" data-section="vehicles">
                    <i class="icon-car"></i>
                    <span>Vehículos</span>
                </div>
                <div class="sidebar-item ${this.activeSection === 'reservations' ? 'active' : ''}" data-section="reservations">
                    <i class="icon-calendar"></i>
                    <span>Reservaciones</span>
                </div>
                <div class="sidebar-item ${this.activeSection === 'documents' ? 'active' : ''}" data-section="documents">
                    <i class="icon-document"></i>
                    <span>Documentos</span>
                </div>
                <div class="sidebar-item ${this.activeSection === 'payments' ? 'active' : ''}" data-section="payments">
                    <i class="icon-payment"></i>
                    <span>Pagos</span>
                </div>
                <div class="sidebar-item ${this.activeSection === 'reviews' ? 'active' : ''}" data-section="reviews">
                    <i class="icon-star"></i>
                    <span>Reseñas</span>
                </div>
                <div class="sidebar-item ${this.activeSection === 'analytics' ? 'active' : ''}" data-section="analytics">
                    <i class="icon-chart"></i>
                    <span>Analytics</span>
                </div>
                <div class="sidebar-item ${this.activeSection === 'settings' ? 'active' : ''}" data-section="settings">
                    <i class="icon-settings"></i>
                    <span>Configuración</span>
                </div>
            </nav>
        `;

        // Add event listeners
        sidebar.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.section;
                this.setActiveSection(section);
                
                // Dispatch custom event for parent component
                document.dispatchEvent(new CustomEvent('admin-section-change', {
                    detail: { section }
                }));
            });
        });

        return sidebar;
    }
}
