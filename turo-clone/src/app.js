import Home from './pages/Home.js';
import Search from './pages/Search.js';
import Dashboard from './pages/Dashboard.js';
import Admin from './pages/Admin.js';
import NotFound from './pages/NotFound.js';

import Login from './components/auth/Login.js';
import Register from './components/auth/Register.js';

import { navigateTo } from './utils/helpers.js';
import { verifyAuth, getUserData } from './services/authService.js';

import PaymentSuccess from './components/payment/PaymentSuccess.js';
import PaymentCancel from './components/payment/PaymentCancel.js';

export default class App {
    constructor() {
        this.routes = {
            '/': Home,
            '/login': Login,
            '/register': Register,
            '/search': Search,
            '/dashboard': Dashboard,
            '/admin': Admin,
            '/success': PaymentSuccess,  // Ruta para mostrar mensaje de pago exitoso
            '/cancel': PaymentCancel,    // Ruta para mostrar mensaje de pago cancelado
            '/404': NotFound
        };
    }

    async init() {
        // Mostrar indicador de carga mientras se verifica la autenticación
        const appContainer = document.getElementById('app');
        appContainer.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-size: 1.2rem;">Cargando...</div>';
        
        try {
            await this.checkAuthentication();
            this.renderPage();
            this.setupNavigation();
        } catch (error) {
            console.error('Error inicializando la aplicación:', error);
            // En caso de error, continuar con la renderización normal
            this.renderPage();
            this.setupNavigation();
        }
    }

    async checkAuthentication() {
        const currentPath = window.location.pathname;
        const token = localStorage.getItem('turo_clone_auth_token');
        
        // Si no hay token y está en rutas protegidas, redirigir al login
        if (!token && (currentPath.startsWith('/dashboard') || currentPath.startsWith('/admin'))) {
            navigateTo('/login');
            return;
        }
        
        // Si hay token, verificar que sea válido
        if (token) {
            try {
                const isAuthenticated = await verifyAuth();
                const user = getUserData();
                
                if (!isAuthenticated) {
                    // Token inválido, limpiar y redirigir al login
                    localStorage.removeItem('turo_clone_auth_token');
                    localStorage.removeItem('turo_clone_user_data');
                    if (currentPath.startsWith('/dashboard') || currentPath.startsWith('/admin')) {
                        navigateTo('/login');
                        return;
                    }
                } else {
                    // Token válido, manejar rutas según el rol
                    if (user && user.role !== 'admin' && currentPath.startsWith('/admin')) {
                        navigateTo('/dashboard');
                        return;
                    }

                    // Si está autenticado y trata de ir a login/register, enviarlo al dashboard
                    if (currentPath === '/login' || currentPath === '/register') {
                        navigateTo('/dashboard');
                        return;
                    }
                }
            } catch (error) {
                console.error('Error verificando autenticación:', error);
                // En caso de error, limpiar y redirigir si es necesario
                localStorage.removeItem('turo_clone_auth_token');
                localStorage.removeItem('turo_clone_user_data');
                if (currentPath.startsWith('/dashboard') || currentPath.startsWith('/admin')) {
                    navigateTo('/login');
                    return;
                }
            }
        }
    }

    renderPage() {
        const path = window.location.pathname;
        const PageClass = this.routes[path] || this.routes['/404'];

        const appContainer = document.getElementById('app');
        appContainer.innerHTML = '';

        const pageInstance = new PageClass();
        appContainer.appendChild(pageInstance.render());
    }

    setupNavigation() {
        // Soporta navegación con botones del navegador (adelante/atrás)
        window.addEventListener('popstate', () => this.renderPage());

        // Manejar clics en elementos con data-link para navegación SPA
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-link]');
            if (target) {
                e.preventDefault();
                navigateTo(target.getAttribute('href'));
                this.renderPage();
            }
        });
    }
}
