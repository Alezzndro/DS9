import Home from './pages/Home.js';
import Search from './pages/Search.js';
import Dashboard from './pages/Dashboard.js';
import Admin from './pages/Admin.js';
import NotFound from './pages/NotFound.js';

import Login from './components/auth/Login.js';
import Register from './components/auth/Register.js'; // Asegúrate de que exista

import { navigateTo } from './utils/helpers.js';
import { verifyAuth, getUserData } from './services/authService.js';

export default class App {
    constructor() {
        this.routes = {
            '/': Home,
            '/login': Login,
            '/register': Register,
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

        if (!isAuthenticated && (currentPath.startsWith('/dashboard') || currentPath.startsWith('/admin'))) {
            navigateTo('/login');
            return;
        }

        if (isAuthenticated && user.role !== 'admin' && currentPath.startsWith('/admin')) {
            navigateTo('/dashboard');
            return;
        }

        if (isAuthenticated && (currentPath === '/login' || currentPath === '/register')) {
            navigateTo('/dashboard');
            return;
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
        window.addEventListener('popstate', () => this.renderPage());

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
