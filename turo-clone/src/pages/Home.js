import '../css/Home.css';
import '../css/header.css';
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
        hero.innerHTML = `
            <div class="container">
                <h1>Alquila el coche perfecto para tu próxima aventura</h1>
                <p>Desde deportivos hasta familiares, encuentra el vehículo ideal a los mejores precios.</p>
                <div class="hero-buttons">
                    <a href="/search" class="btn btn-primary" data-link>Explorar vehículos</a>
                    <button id="registerBtn" class="btn btn-outline">Registrarse</button>
                </div>
            </div>
        `;
        
        hero.querySelector('#registerBtn').addEventListener('click', () => {
            this.currentModal = new Register();
            document.body.appendChild(this.currentModal.render());
        });
        
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