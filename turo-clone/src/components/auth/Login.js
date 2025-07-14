import { validateEmail } from '../../utils/validators.js';
import Notification from '../common/Notification.js';
import '../css/Login.css';


export default class LoginPage {
    constructor() {
        this.state = {
            email: '',
            password: '',
            errors: {}
        };
    }

    handleInputChange(e) {
        const { name, value } = e.target;
        this.state[name] = value;

        if (name === 'email') {
            this.state.errors.email = validateEmail(value) ? null : 'Email no válido';
        }

        this.updateForm();
    }

    handleSubmit(e) {
        e.preventDefault();

        const errors = {};
        if (!validateEmail(this.state.email)) errors.email = 'Email no válido';
        if (!this.state.password) errors.password = 'Contraseña es requerida';

        this.state.errors = errors;
        this.updateForm();

        if (Object.keys(errors).length === 0) {
            const notification = new Notification('Inicio de sesión exitoso!', 'success');
            document.body.appendChild(notification.render());

            setTimeout(() => {
                window.history.pushState({}, '', '/dashboard');
                window.dispatchEvent(new PopStateEvent('popstate'));
            }, 1500);
        }
    }

    updateForm() {
        Object.keys(this.state.errors).forEach(key => {
            const errorElement = this.container.querySelector(`.error-${key}`);
            if (errorElement) {
                errorElement.textContent = this.state.errors[key] || '';
            }
        });
    }

    render() {
        this.container = document.createElement('div');
        this.container.className = 'login-page';
        this.container.innerHTML = `
            <div class="login-form-container">
                <h2>Iniciar sesión</h2>
                <form id="loginForm">
                    <div class="form-group">
                        <label for="email">Correo electrónico</label>
                        <input type="email" id="email" name="email" required>
                        <div class="error-email error-message"></div>
                    </div>
                    <div class="form-group">
                        <label for="password">Contraseña</label>
                        <input type="password" id="password" name="password" required>
                        <div class="error-password error-message"></div>
                    </div>
                    <button type="submit" class="btn btn-primary">Iniciar sesión</button>
                </form>
                <p>¿No tienes una cuenta? <a href="#" id="registerLink">Regístrate</a></p>
            </div>
        `;

        this.container.querySelector('#loginForm').addEventListener('submit', (e) => this.handleSubmit(e));
        this.container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', (e) => this.handleInputChange(e));
        });

        this.container.querySelector('#registerLink').addEventListener('click', (e) => {
            e.preventDefault();
            window.history.pushState({}, '', '/register');
            window.dispatchEvent(new PopStateEvent('popstate'));
        });

        return this.container;
    }
}
