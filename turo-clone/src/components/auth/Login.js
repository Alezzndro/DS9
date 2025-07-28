import { validateEmail } from '../../utils/validators.js';
import { login } from '../../services/authService.js';
import Notification from '../common/Notification.js';


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

    async handleSubmit(e) {
        e.preventDefault();
        const submitBtn = this.container.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;

        // Limpiar errores previos
        this.state.errors = {};
        this.updateForm();

        const errors = {};
        if (!validateEmail(this.state.email)) errors.email = 'Email no válido';
        if (!this.state.password) errors.password = 'Contraseña es requerida';

        this.state.errors = errors;
        this.updateForm();

        if (Object.keys(errors).length === 0) {
            try {
                // Mostrar indicador de carga
                submitBtn.textContent = 'Iniciando sesión...';
                submitBtn.disabled = true;
                
                const user = await login(this.state.email, this.state.password);
                
                const notification = new Notification('Inicio de sesión exitoso!', 'success');
                document.body.appendChild(notification.render());
                
                setTimeout(() => {
                    // Redirigir según el rol del usuario
                    if (user.role === 'admin') {
                        window.history.pushState({}, '', '/admin');
                    } else {
                        window.history.pushState({}, '', '/dashboard');
                    }
                    window.dispatchEvent(new PopStateEvent('popstate'));
                }, 1500);
                
            } catch (error) {
                // Mostrar error específico
                console.error('Login error:', error);
                this.state.errors.general = error.message || 'Credenciales inválidas. Verifica tu email y contraseña.';
                this.updateForm();
            } finally {
                // Restaurar botón en ambos casos (éxito o error)
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        }
    }

    updateForm() {
        if (!this.container) return;
        
        // Limpiar todos los errores primero
        const errorElements = this.container.querySelectorAll('.error-message');
        errorElements.forEach(el => el.textContent = '');
        
        // Mostrar errores específicos
        Object.keys(this.state.errors).forEach(key => {
            const errorElement = this.container.querySelector(`.error-${key}`);
            if (errorElement && this.state.errors[key]) {
                errorElement.textContent = this.state.errors[key];
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
                    <div class="error-general error-message"></div>
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
