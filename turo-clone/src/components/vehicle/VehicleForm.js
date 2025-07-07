import Notification from '../common/Notification.js';

export default class VehicleForm {
    constructor(vehicle = null) {
        this.vehicle = vehicle || {
            make: '',
            model: '',
            year: '',
            pricePerDay: '',
            seats: '',
            doors: '',
            transmission: '',
            fuelType: '',
            mileage: '',
            location: '',
            features: [],
            description: ''
        };
        
        this.state = {
            ...this.vehicle,
            images: [],
            featuresInput: ''
        };
        
        // Opciones para los selects
        this.makes = ['Toyota', 'Honda', 'Ford', 'BMW', 'Mercedes', 'Audi', 'Volkswagen'];
        this.transmissions = ['Automática', 'Manual'];
        this.fuelTypes = ['Gasolina', 'Diésel', 'Híbrido', 'Eléctrico'];
        this.locations = ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao', 'Málaga'];
    }

    handleInputChange(e) {
        const { name, value } = e.target;
        this.state[name] = value;
    }

    handleFeaturesKeyDown(e) {
        if (e.key === 'Enter' && this.state.featuresInput.trim()) {
            e.preventDefault();
            if (!this.state.features.includes(this.state.featuresInput.trim())) {
                this.state.features.push(this.state.featuresInput.trim());
                this.state.featuresInput = '';
                this.updateFeaturesList();
            }
        }
    }

    removeFeature(index) {
        this.state.features.splice(index, 1);
        this.updateFeaturesList();
    }

    updateFeaturesList() {
        const featuresList = this.formElement.querySelector('.features-list');
        if (featuresList) {
            featuresList.innerHTML = this.state.features.map((feature, index) => `
                <span class="feature-tag">
                    ${feature}
                    <span class="remove-feature" data-index="${index}">&times;</span>
                </span>
            `).join('');
            
            featuresList.querySelectorAll('.remove-feature').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.removeFeature(parseInt(e.target.dataset.index));
                });
            });
        }
    }

    handleImageUpload(e) {
        const files = Array.from(e.target.files);
        if (files.length + this.state.images.length > 5) {
            const notification = new Notification('Máximo 5 imágenes permitidas', 'error');
            document.body.appendChild(notification.render());
            return;
        }
        
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                this.state.images.push(event.target.result);
                this.updateImagePreviews();
            };
            reader.readAsDataURL(file);
        });
    }

    updateImagePreviews() {
        const previewContainer = this.formElement.querySelector('.image-previews');
        if (previewContainer) {
            previewContainer.innerHTML = this.state.images.map((image, index) => `
                <div class="image-preview">
                    <img src="${image}" alt="Preview ${index + 1}">
                    <span class="remove-image" data-index="${index}">&times;</span>
                </div>
            `).join('');
            
            previewContainer.querySelectorAll('.remove-image').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.state.images.splice(parseInt(e.target.dataset.index), 1);
                    this.updateImagePreviews();
                });
            });
        }
    }

    handleSubmit(e) {
        e.preventDefault();
        
        // Validación básica
        const requiredFields = ['make', 'model', 'year', 'pricePerDay', 'seats', 'location'];
        const errors = {};
        
        requiredFields.forEach(field => {
            if (!this.state[field]) {
                errors[field] = 'Este campo es requerido';
            }
        });
        
        if (this.state.images.length === 0) {
            errors.images = 'Debes subir al menos una imagen';
        }
        
        if (Object.keys(errors).length > 0) {
            const notification = new Notification('Por favor completa todos los campos requeridos', 'error');
            document.body.appendChild(notification.render());
            return;
        }
        
        // Aquí iría la llamada al API para guardar el vehículo
        const vehicleData = {
            ...this.state,
            features: [...this.state.features]
        };
        
        console.log('Guardando vehículo:', vehicleData);
        
        const notification = new Notification(
            this.vehicle ? 'Vehículo actualizado correctamente' : 'Vehículo publicado correctamente', 
            'success'
        );
        document.body.appendChild(notification.render());
        
        setTimeout(() => {
            window.history.pushState({}, '', '/dashboard');
            window.dispatchEvent(new PopStateEvent('popstate'));
        }, 1500);
    }

    render() {
        this.formElement = document.createElement('div');
        this.formElement.className = 'vehicle-form';
        this.formElement.innerHTML = `
            <h2>${this.vehicle ? 'Editar vehículo' : 'Publicar nuevo vehículo'}</h2>
            <form id="vehicleForm">
                <div class="form-row">
                    <div class="form-group">
                        <label for="make">Marca *</label>
                        <select id="make" name="make" required>
                            <option value="">Selecciona una marca</option>
                            ${this.makes.map(make => 
                                `<option value="${make}" ${this.state.make === make ? 'selected' : ''}>${make}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="model">Modelo *</label>
                        <input type="text" id="model" name="model" value="${this.state.model}" required>
                    </div>
                    <div class="form-group">
                        <label for="year">Año *</label>
                        <input type="number" id="year" name="year" min="1990" max="${new Date().getFullYear()}" 
                            value="${this.state.year}" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="pricePerDay">Precio por día (€) *</label>
                        <input type="number" id="pricePerDay" name="pricePerDay" min="1" 
                            value="${this.state.pricePerDay}" required>
                    </div>
                    <div class="form-group">
                        <label for="seats">Número de asientos *</label>
                        <input type="number" id="seats" name="seats" min="1" max="9" 
                            value="${this.state.seats}" required>
                    </div>
                    <div class="form-group">
                        <label for="doors">Número de puertas</label>
                        <input type="number" id="doors" name="doors" min="2" max="5" 
                            value="${this.state.doors}">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="transmission">Transmisión</label>
                        <select id="transmission" name="transmission">
                            <option value="">Selecciona una opción</option>
                            ${this.transmissions.map(trans => 
                                `<option value="${trans}" ${this.state.transmission === trans ? 'selected' : ''}>${trans}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="fuelType">Tipo de combustible</label>
                        <select id="fuelType" name="fuelType">
                            <option value="">Selecciona una opción</option>
                            ${this.fuelTypes.map(fuel => 
                                `<option value="${fuel}" ${this.state.fuelType === fuel ? 'selected' : ''}>${fuel}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="mileage">Kilometraje</label>
                        <input type="number" id="mileage" name="mileage" min="0" 
                            value="${this.state.mileage}">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="location">Ubicación *</label>
                    <select id="location" name="location" required>
                        <option value="">Selecciona una ubicación</option>
                        ${this.locations.map(loc => 
                            `<option value="${loc}" ${this.state.location === loc ? 'selected' : ''}>${loc}</option>`
                        ).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="features">Características (presiona Enter para agregar)</label>
                    <input type="text" id="features" name="featuresInput" 
                        value="${this.state.featuresInput}" placeholder="Ej: Aire acondicionado, Bluetooth">
                    <div class="features-list"></div>
                </div>
                
                <div class="form-group">
                    <label for="description">Descripción</label>
                    <textarea id="description" name="description" rows="4">${this.state.description}</textarea>
                </div>
                
                <div class="form-group">
                    <label for="images">Imágenes (máx. 5) *</label>
                    <input type="file" id="images" name="images" multiple accept="image/*">
                    <div class="image-previews"></div>
                </div>
                
                <button type="submit" class="btn btn-primary">${this.vehicle ? 'Actualizar' : 'Publicar'}</button>
            </form>
        `;
        
        // Event listeners
        this.formElement.querySelectorAll('input, select, textarea').forEach(input => {
            input.addEventListener('change', (e) => this.handleInputChange(e));
        });
        
        this.formElement.querySelector('#features').addEventListener('keydown', (e) => 
            this.handleFeaturesKeyDown(e));
        
        this.formElement.querySelector('#images').addEventListener('change', (e) => 
            this.handleImageUpload(e));
        
        this.formElement.querySelector('#vehicleForm').addEventListener('submit', (e) => 
            this.handleSubmit(e));
        
        // Inicializar listas
        this.updateFeaturesList();
        
        return this.formElement;
    }
}