import Notification from '../common/Notification.js';
import { createVehicle, updateVehicle } from '../../services/vehicleService.js';

export default class VehicleForm {
    constructor(vehicle = null, onSuccess = null) {
        this.vehicle = vehicle;
        this.onSuccess = onSuccess;
        this.isEditing = !!vehicle;
        
        this.state = {
            make: vehicle?.make || '',
            model: vehicle?.model || '',
            year: vehicle?.year || new Date().getFullYear(),
            color: vehicle?.color || '',
            category: vehicle?.category || 'Economy',
            transmission: vehicle?.transmission || 'Automatic',
            fuelType: vehicle?.fuelType || 'Gasoline',
            seats: vehicle?.seats || 5,
            licensePlate: vehicle?.licensePlate || '',
            pricePerDay: vehicle?.pricePerDay || '',
            location: {
                address: vehicle?.location?.address || '',
                city: vehicle?.location?.city || '',
                state: vehicle?.location?.state || '',
                zipCode: vehicle?.location?.zipCode || ''
            },
            features: vehicle?.features || [],
            description: vehicle?.description || '',
            mileage: vehicle?.mileage || '',
            isSubmitting: false
        };
        
        // Opciones para los selects
        this.makes = ['Toyota', 'Honda', 'Ford', 'BMW', 'Mercedes', 'Audi', 'Volkswagen', 'Chevrolet', 'Nissan', 'Hyundai'];
        this.categories = ['Economy', 'Compact', 'Midsize', 'Fullsize', 'SUV', 'Pickup', 'Luxury', 'Sports'];
        this.transmissions = ['Automatic', 'Manual'];
        this.fuelTypes = ['Gasoline', 'Diesel', 'Electric', 'Hybrid'];
        this.availableFeatures = [
            'Air Conditioning', 'GPS Navigation', 'Bluetooth', 'USB Ports',
            'Backup Camera', 'Sunroof', 'Leather Seats', 'Heated Seats',
            'WiFi Hotspot', 'Premium Audio', 'Keyless Entry', 'Cruise Control'
        ];
    }

    handleInputChange(e) {
        const { name, value } = e.target;
        
        // Manejar inputs anidados para location
        if (name.startsWith('location.')) {
            const locationKey = name.split('.')[1];
            this.state.location[locationKey] = value;
        } else {
            this.state[name] = value;
        }
    }

    handleFeatureToggle(feature) {
        const index = this.state.features.indexOf(feature);
        if (index > -1) {
            this.state.features.splice(index, 1);
        } else {
            this.state.features.push(feature);
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (this.state.isSubmitting) return;
        
        this.state.isSubmitting = true;
        this.updateSubmitButton();
        
        try {
            // Validaciones básicas
            if (!this.state.make || !this.state.model || !this.state.year || 
                !this.state.licensePlate || !this.state.pricePerDay) {
                throw new Error('Por favor completa todos los campos obligatorios');
            }
            
            if (!this.state.location.address || !this.state.location.city || 
                !this.state.location.state || !this.state.location.zipCode) {
                throw new Error('Por favor completa toda la información de ubicación');
            }
            
            // Preparar datos para enviar
            const vehicleData = {
                make: this.state.make,
                model: this.state.model,
                year: parseInt(this.state.year),
                color: this.state.color,
                category: this.state.category,
                transmission: this.state.transmission,
                fuelType: this.state.fuelType,
                seats: parseInt(this.state.seats),
                licensePlate: this.state.licensePlate.toUpperCase(),
                pricePerDay: parseFloat(this.state.pricePerDay),
                location: this.state.location,
                features: this.state.features,
                description: this.state.description,
                mileage: this.state.mileage ? parseInt(this.state.mileage) : undefined
            };
            
            let result;
            if (this.isEditing) {
                result = await updateVehicle(this.vehicle._id, vehicleData);
                Notification.show('Vehículo actualizado exitosamente', 'success');
            } else {
                result = await createVehicle(vehicleData);
                Notification.show('Vehículo creado exitosamente', 'success');
            }
            
            if (this.onSuccess) {
                this.onSuccess(result);
            }
            
            // Cerrar modal
            document.querySelector('.vehicle-form-modal').remove();
            
        } catch (error) {
            console.error('Error guardando vehículo:', error);
            Notification.show(error.message || 'Error al guardar el vehículo', 'error');
        } finally {
            this.state.isSubmitting = false;
            this.updateSubmitButton();
        }
    }

    updateSubmitButton() {
        const button = document.querySelector('.submit-btn');
        if (button) {
            button.disabled = this.state.isSubmitting;
            button.textContent = this.state.isSubmitting ? 'Guardando...' : 
                this.isEditing ? 'Actualizar Vehículo' : 'Crear Vehículo';
        }
    }

    renderFeaturesList() {
        return this.availableFeatures.map(feature => `
            <label class="feature-item">
                <input type="checkbox" value="${feature}" 
                       ${this.state.features.includes(feature) ? 'checked' : ''}>
                <span>${feature}</span>
            </label>
        `).join('');
    }

    render() {
        const form = document.createElement('div');
        form.className = 'vehicle-form-modal';
        form.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>${this.isEditing ? 'Editar Vehículo' : 'Añadir Nuevo Vehículo'}</h2>
                        <button class="close-btn">&times;</button>
                    </div>
                    
                    <form class="vehicle-form">
                        <div class="form-section">
                            <h3>Información Básica</h3>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="make">Marca *</label>
                                    <select name="make" id="make" required>
                                        <option value="">Seleccionar marca</option>
                                        ${this.makes.map(make => 
                                            `<option value="${make}" ${this.state.make === make ? 'selected' : ''}>${make}</option>`
                                        ).join('')}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="model">Modelo *</label>
                                    <input type="text" name="model" id="model" value="${this.state.model}" required>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="year">Año *</label>
                                    <input type="number" name="year" id="year" value="${this.state.year}" 
                                           min="1950" max="${new Date().getFullYear() + 1}" required>
                                </div>
                                <div class="form-group">
                                    <label for="color">Color *</label>
                                    <input type="text" name="color" id="color" value="${this.state.color}" required>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="licensePlate">Placa *</label>
                                    <input type="text" name="licensePlate" id="licensePlate" 
                                           value="${this.state.licensePlate}" required>
                                </div>
                                <div class="form-group">
                                    <label for="category">Categoría</label>
                                    <select name="category" id="category">
                                        ${this.categories.map(cat => 
                                            `<option value="${cat}" ${this.state.category === cat ? 'selected' : ''}>${cat}</option>`
                                        ).join('')}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div class="form-section">
                            <h3>Especificaciones</h3>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="transmission">Transmisión</label>
                                    <select name="transmission" id="transmission">
                                        ${this.transmissions.map(trans => 
                                            `<option value="${trans}" ${this.state.transmission === trans ? 'selected' : ''}>${trans}</option>`
                                        ).join('')}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="fuelType">Combustible</label>
                                    <select name="fuelType" id="fuelType">
                                        ${this.fuelTypes.map(fuel => 
                                            `<option value="${fuel}" ${this.state.fuelType === fuel ? 'selected' : ''}>${fuel}</option>`
                                        ).join('')}
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="seats">Asientos *</label>
                                    <input type="number" name="seats" id="seats" value="${this.state.seats}" 
                                           min="2" max="8" required>
                                </div>
                                <div class="form-group">
                                    <label for="mileage">Kilometraje</label>
                                    <input type="number" name="mileage" id="mileage" value="${this.state.mileage}" min="0">
                                </div>
                            </div>
                        </div>

                        <div class="form-section">
                            <h3>Ubicación</h3>
                            <div class="form-row">
                                <div class="form-group full-width">
                                    <label for="location.address">Dirección *</label>
                                    <input type="text" name="location.address" id="location.address" 
                                           value="${this.state.location.address}" required>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="location.city">Ciudad *</label>
                                    <input type="text" name="location.city" id="location.city" 
                                           value="${this.state.location.city}" required>
                                </div>
                                <div class="form-group">
                                    <label for="location.state">Estado *</label>
                                    <input type="text" name="location.state" id="location.state" 
                                           value="${this.state.location.state}" required>
                                </div>
                                <div class="form-group">
                                    <label for="location.zipCode">Código Postal *</label>
                                    <input type="text" name="location.zipCode" id="location.zipCode" 
                                           value="${this.state.location.zipCode}" required>
                                </div>
                            </div>
                        </div>

                        <div class="form-section">
                            <h3>Precio</h3>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="pricePerDay">Precio por día (€) *</label>
                                    <input type="number" name="pricePerDay" id="pricePerDay" 
                                           value="${this.state.pricePerDay}" min="1" step="0.01" required>
                                </div>
                            </div>
                        </div>

                        <div class="form-section">
                            <h3>Características</h3>
                            <div class="features-list">
                                ${this.renderFeaturesList()}
                            </div>
                        </div>

                        <div class="form-section">
                            <h3>Descripción</h3>
                            <div class="form-group full-width">
                                <textarea name="description" id="description" rows="4" 
                                          placeholder="Describe tu vehículo...">${this.state.description}</textarea>
                            </div>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary cancel-btn">Cancelar</button>
                            <button type="submit" class="btn btn-primary submit-btn">
                                ${this.isEditing ? 'Actualizar Vehículo' : 'Crear Vehículo'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Event listeners
        const formElement = form.querySelector('.vehicle-form');
        formElement.addEventListener('submit', (e) => this.handleSubmit(e));

        // Input change listeners
        form.querySelectorAll('input, select, textarea').forEach(input => {
            input.addEventListener('input', (e) => this.handleInputChange(e));
            input.addEventListener('change', (e) => this.handleInputChange(e));
        });

        // Feature checkboxes
        form.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.handleFeatureToggle(e.target.value);
            });
        });

        // Close modal
        form.querySelector('.close-btn').addEventListener('click', () => {
            form.remove();
        });

        form.querySelector('.cancel-btn').addEventListener('click', () => {
            form.remove();
        });

        form.querySelector('.modal-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                form.remove();
            }
        });

        return form;
    }
}
