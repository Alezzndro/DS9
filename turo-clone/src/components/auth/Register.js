import { validateEmail, validatePassword } from '../../utils/validators.js';
import { register } from '../../services/authService.js';
import Notification from '../common/Notification.js';

export default class Register {
    constructor() {
        this.state = {
            email: '',
            password: '',
            name: '',
            errors: {}
        };
    }

    handleInputChange(e) {
        const { name, value } = e.target;
        this.state[name] = value;
        
        // Validación en tiempo real
        if (name === 'email') {
            this.state.errors.email = validateEmail(value) ? null : 'Email no válido';
        }
        
        if (name === 'password') {
            this.state.errors.password = validatePassword(value) ? null : 'La contraseña debe tener al menos 8 caracteres';
        }
        
        this.updateForm();
    }

    async handleSubmit(e) {
        e.preventDefault();
        // Validación final antes de enviar
        const errors = {};
        if (!this.state.name) errors.name = 'Nombre es requerido';
        if (!validateEmail(this.state.email)) errors.email = 'Email no válido';
        if (!validatePassword(this.state.password)) errors.password = 'La contraseña debe tener al menos 8 caracteres';
        this.state.errors = errors;
        this.updateForm();
        if (Object.keys(errors).length === 0) {
            try {
                await register({
                    name: this.state.name,
                    email: this.state.email,
                    password: this.state.password
                });
                const notification = new Notification('Registro exitoso! Redirigiendo...', 'success');
                document.body.appendChild(notification.render());
                setTimeout(() => {
                    window.history.pushState({}, '', '/login');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                    document.body.removeChild(this.modal);
                }, 2000);
            } catch (error) {
                this.state.errors.general = error.message || 'Error al registrarse';
                this.updateForm();
            }
        }
    }

    updateForm() {
        // Actualizar mensajes de error
        Object.keys(this.state.errors).forEach(key => {
            const errorElement = this.modal.querySelector(`.error-${key}`);
            if (errorElement) {
                errorElement.textContent = this.state.errors[key] || '';
            }
        });
        // Mostrar error general si existe
        const generalError = this.modal.querySelector('.error-general');
        if (generalError) {
            generalError.textContent = this.state.errors.general || '';
        }
    }

    render() {
        this.modal = document.createElement('div');
        this.modal.className = 'modal';
        this.modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Regístrate</h2>
                <form id="registerForm">
                    <div class="form-group">
                        <label for="name">Nombre completo</label>
                        <input type="text" id="name" name="name" required>
                        <div class="error-name error-message"></div>
                    </div>
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
                    <button type="submit" class="btn btn-primary">Registrarse</button>
                </form>
                <p>¿Ya tienes una cuenta? <a href="#" id="loginLink">Inicia sesión</a></p>
            </div>
        `;
        
        // Event listeners
        this.modal.querySelector('#registerForm').addEventListener('submit', (e) => this.handleSubmit(e));
        this.modal.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', (e) => this.handleInputChange(e));
        });
        
        this.modal.querySelector('.close-modal').addEventListener('click', () => {
            document.body.removeChild(this.modal);
        });
        
        this.modal.querySelector('#loginLink').addEventListener('click', (e) => {
            e.preventDefault();
            document.body.removeChild(this.modal);
            // Aquí se abriría el modal de login
        });
        
        // Cerrar modal al hacer clic fuera
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                document.body.removeChild(this.modal);
            }
        });
        
        return this.modal;
    }
}