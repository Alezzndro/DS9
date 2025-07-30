import Header from '../components/common/Header.js';
import Login from '../components/auth/Login.js';
import Register from '../components/auth/Register.js';


export default class Home {
    constructor() {
        this.header = new Header();
        this.currentModal = null;
    }

    renderHeroSection() {
        const hero = document.createElement('section');
        hero.className = 'hero';
        
        // Verificar si el usuario está logueado
        const isAuthenticated = !!localStorage.getItem('turo-clone_auth_token');
        
        // Crear botones dinámicamente según el estado de autenticación
        let heroButtons = '';
        if (isAuthenticated) {
            // Usuario logueado: solo mostrar botón de explorar
            heroButtons = `
                <div class="hero-buttons">
                    <a href="/search" class="btn btn-primary" data-link>Explorar vehículos</a>
                </div>
            `;
        } else {
            // Usuario no logueado: mostrar todos los botones
            heroButtons = `
                <div class="hero-buttons">
                    <a href="/search" class="btn btn-primary" data-link>Explorar vehículos</a>
                    <a href="/login" class="btn btn-outline" id="loginBtn" data-link>Iniciar sesión</a>
                    <a href="/register" class="btn btn-outline" id="registerBtn" data-link>Registrarse</a>
                </div>
            `;
        }
        
        hero.innerHTML = `
            <div class="container">
                <h1>Alquila el coche perfecto para tu próxima aventura</h1>
                <p>Desde deportivos hasta familiares, encuentra el vehículo ideal a los mejores precios.</p>
                ${heroButtons}
            </div>
        `;

        // Solo agregar el event listener si el botón existe (usuario no logueado)
        if (!isAuthenticated) {
            const registerBtn = hero.querySelector('#registerBtn');
            if (registerBtn) {
                registerBtn.addEventListener('click', () => {
                    this.currentModal = new Register();
                    document.body.appendChild(this.currentModal.render());
                });
            }
        }

        return hero;
    }


    renderFeatures() {
        const features = document.createElement('section');
        features.className = 'features';
        features.innerHTML = `
            <div class="container">
                <h2>¿Por qué elegirnos?</h2>
                <div class="features-grid">
                    <div class="feature">
                        <h3>Variedad</h3>
                        <p>Cientos de vehículos para elegir en toda la región.</p>
                    </div>
                    <div class="feature">
                        <h3>Seguridad</h3>
                        <p>Proceso de verificación para tu tranquilidad.</p>
                    </div>
                    <div class="feature">
                        <h3>Flexibilidad</h3>
                        <p>Alquila por horas, días o semanas.</p>
                    </div>
                </div>
            </div>
        `;
        return features;
    }

    render() {
        const fragment = document.createDocumentFragment();
        fragment.appendChild(this.header.render());
        fragment.appendChild(this.renderHeroSection());
        fragment.appendChild(this.renderFeatures());
        return fragment;
    }
}