import Notification from './Notification.js';

export default class Header {
    constructor() {
        this.isAuthenticated = this.checkAuthStatus();
        this.userInfo = this.getUserInfo();
    }

    checkAuthStatus() {
        const token = localStorage.getItem('turo-clone_auth_token');
        return !!token;
    }

    getUserInfo() {
        try {
            const userInfo = localStorage.getItem('user'); // Cambiado para usar la clave correcta
            return userInfo ? JSON.parse(userInfo) : null;
        } catch (error) {
            console.error('Error parsing user info:', error);
            return null;
        }
    }

    handleLogout() {
        try {
            // Limpiar localStorage usando las mismas claves que authService
            localStorage.removeItem('turo-clone_auth_token');
            localStorage.removeItem('user'); // Usar la clave correcta
            
            // Mostrar notificación
            Notification.show('Sesión cerrada exitosamente', 'success');
            
            // Redirigir inmediatamente - window.location.replace fuerza una recarga completa
            setTimeout(() => {
                window.location.replace('/');
            }, 800);
            
        } catch (error) {
            console.error('Error en handleLogout:', error);
            // En caso de error, forzar redirección
            window.location.replace('/');
        }
    }

    render() {
        const header = document.createElement('header');
        
        if (this.isAuthenticated) {
            // Header para usuarios autenticados
            const isAdmin = this.userInfo && this.userInfo.role === 'admin';
            const adminLink = isAdmin ? '<a href="/admin" data-link>Panel Admin</a>' : '';
            
            header.innerHTML = `
                <div class="container">
                    <nav>
                        <a href="/dashboard" class="logo" data-link>RideShare</a>
                        <div class="nav-links">
                            <a href="/search" data-link>Buscar vehículos</a>
                            <a href="/dashboard" data-link>Mi Dashboard</a>
                            ${adminLink}
                            <button class="btn logout-btn">Cerrar sesión</button>
                        </div>
                    </nav>
                </div>
            `;
        } else {
            // Header para usuarios no autenticados
            header.innerHTML = `
                <div class="container">
                    <nav>
                        <a href="/" class="logo" data-link>RideShare</a>
                        <div class="nav-links">
                            <a href="/search" data-link>Buscar vehículos</a>
                            <a href="/login" data-link>Iniciar sesión</a>
                            <a href="/register" class="btn btn-primary" data-link>Registrarse</a>
                        </div>
                    </nav>
                </div>
            `;
        }

        // Agregar event listener para el botón de logout
        if (this.isAuthenticated) {
            const logoutBtn = header.querySelector('.logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Cambiar texto del botón inmediatamente
                    logoutBtn.textContent = 'Cerrando sesión...';
                    logoutBtn.disabled = true;
                    
                    // Ejecutar logout inmediatamente
                    this.handleLogout();
                });
            }
        }

        return header;
    }
}
