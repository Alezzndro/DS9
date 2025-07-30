import { validateEmail, validatePassword } from '../../utils/validators.js';
import { register } from '../../services/authService.js';
import Notification from '../common/Notification.js';

export default class Register {
    constructor() {
        this.state = {
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            phone: '',
            dateOfBirth: '',
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
            this.state.errors.password = validatePassword(value) ? null : 'La contraseña debe tener al menos 6 caracteres';
        }
        
        if (name === 'firstName') {
            this.state.errors.firstName = value.trim() ? null : 'Nombre es requerido';
        }
        
        if (name === 'lastName') {
            this.state.errors.lastName = value.trim() ? null : 'Apellido es requerido';
        }
        
        this.updateForm();
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        // Validación final antes de enviar
        const errors = {};
        if (!this.state.firstName.trim()) errors.firstName = 'Nombre es requerido';
        if (!this.state.lastName.trim()) errors.lastName = 'Apellido es requerido';
        if (!validateEmail(this.state.email)) errors.email = 'Email no válido';
        if (!validatePassword(this.state.password)) errors.password = 'La contraseña debe tener al menos 6 caracteres';
        
        this.state.errors = errors;
        this.updateForm();
        
        if (Object.keys(errors).length === 0) {
            try {
                const userData = {
                    firstName: this.state.firstName.trim(),
                    lastName: this.state.lastName.trim(),
                    email: this.state.email.trim(),
                    password: this.state.password
                };
                
                // Agregar campos opcionales si tienen valor
                if (this.state.phone.trim()) {
                    userData.phone = this.state.phone.trim();
                }
                
                if (this.state.dateOfBirth) {
                    userData.dateOfBirth = this.state.dateOfBirth;
                }
                
                const result = await register(userData);
                
                const notification = new Notification('¡Registro exitoso! Redirigiendo...', 'success');
                document.body.appendChild(notification.render());
                
                setTimeout(() => {
                    window.history.pushState({}, '', '/login');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                }, 2000);
                
            } catch (error) {
                console.error('Error en registro:', error);
                this.state.errors.general = error.message || 'Error al registrarse. Intenta nuevamente.';
                this.updateForm();
            }
        }
    }

    updateForm() {
        // Actualizar mensajes de error
        Object.keys(this.state.errors).forEach(key => {
            const errorElement = this.container.querySelector(`.error-${key}`);
            if (errorElement) {
                errorElement.textContent = this.state.errors[key] || '';
            }
        });
        // Mostrar error general si existe
        const generalError = this.container.querySelector('.error-general');
        if (generalError) {
            generalError.textContent = this.state.errors.general || '';
        }
    }

    render() {
        this.container = document.createElement('div');
        this.container.className = 'register-page';
        this.container.innerHTML = `
            <div class="register-form-container">
                <h2>Crear Cuenta</h2>
                <form id="registerForm">
                    <div class="form-group">
                        <label for="firstName">Nombre</label>
                        <input type="text" id="firstName" name="firstName" required>
                        <div class="error-firstName error-message"></div>
                    </div>
                    <div class="form-group">
                        <label for="lastName">Apellido</label>
                        <input type="text" id="lastName" name="lastName" required>
                        <div class="error-lastName error-message"></div>
                    </div>
                    <div class="form-group">
                        <label for="email">Correo electrónico</label>
                        <input type="email" id="email" name="email" required>
                        <div class="error-email error-message"></div>
                    </div>
                    <div class="form-group">
                        <label for="password">Contraseña</label>
                        <input type="password" id="password" name="password" required>
                        <small class="form-help">Mínimo 6 caracteres</small>
                        <div class="error-password error-message"></div>
                    </div>
                    <div class="form-group">
                        <label for="phone">Teléfono (opcional)</label>
                        <input type="tel" id="phone" name="phone" placeholder="+52 555 123 4567">
                        <div class="error-phone error-message"></div>
                    </div>
                    <div class="form-group">
                        <label for="dateOfBirth">Fecha de nacimiento (opcional)</label>
                        <input type="date" id="dateOfBirth" name="dateOfBirth">
                        <small class="form-help">Debes ser mayor de 18 años</small>
                        <div class="error-dateOfBirth error-message"></div>
                    </div>
                    <div class="error-general error-message"></div>
                    <button type="submit" class="btn btn-primary">Registrarse</button>
                </form>
                <p>¿Ya tienes una cuenta? <a href="#" id="loginLink">Inicia sesión</a></p>
            </div>
        `;
        
        // Event listeners
        this.container.querySelector('#registerForm').addEventListener('submit', (e) => this.handleSubmit(e));
        this.container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', (e) => this.handleInputChange(e));
        });
        
        this.container.querySelector('#loginLink').addEventListener('click', (e) => {
            e.preventDefault();
            window.history.pushState({}, '', '/login');
            window.dispatchEvent(new PopStateEvent('popstate'));
        });
        
        return this.container;
    }
}