import Home from './pages/Home.js';
import Search from './pages/Search.js';
import Dashboard from './pages/Dashboard.js';
import Admin from './pages/Admin.js';
import NotFound from './pages/NotFound.js';
import { navigateTo } from './utils/helpers.js';
import { verifyAuth, getUserData } from './services/authService.js';

export default class App {
    constructor() {
        this.routes = {
            '/': Home,
            '/login': () => console.log('Login page'),
            '/register': () => console.log('Register page'),
            '/search': Search,
            '/dashboard': Dashboard,
            '/admin': Admin,
            '/404': NotFound
        };
    }

    async init() {
        await this.checkAuthentication();
        this.renderPage();
        this.setupNavigation();
    }

    async checkAuthentication() {
        const isAuthenticated = await verifyAuth();
        const user = getUserData();
        const currentPath = window.location.pathname;

        // Redirigir si no está autenticado y trata de acceder a rutas protegidas
        if (!isAuthenticated && (currentPath.startsWith('/dashboard') || currentPath.startsWith('/admin'))) {
            navigateTo('/login');
            return;
        }

        // Redirigir si es usuario normal y trata de acceder al admin
        if (isAuthenticated && user.role !== 'admin' && currentPath.startsWith('/admin')) {
            navigateTo('/dashboard');
            return;
        }

        // Redirigir si ya está autenticado y trata de acceder a login/register
        if (isAuthenticated && (currentPath === '/login' || currentPath === '/register')) {
            navigateTo('/dashboard');
            return;
        }
    }

    renderPage() {
        const path = window.location.pathname;
        const page = this.routes[path] || this.routes['/404'];
        
        const appContainer = document.getElementById('app');
        appContainer.innerHTML = '';
        
        const pageInstance = new page();
        appContainer.appendChild(pageInstance.render());
    }

    setupNavigation() {
        window.addEventListener('popstate', () => this.renderPage());
        
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-link]')) {
                e.preventDefault();
                navigateTo(e.target.href);
                this.renderPage();
            }
        });
    }
}