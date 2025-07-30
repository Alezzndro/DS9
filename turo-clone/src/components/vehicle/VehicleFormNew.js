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
            images: vehicle?.images ? vehicle.images.map(img => ({
                url: img.url,
                isPrimary: img.isPrimary,
                isTemp: false
            })) : [],
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

    async handleImageUpload(files) {
        console.log('📁 Archivos seleccionados:', files.length);
        
        const maxImages = 5;
        const currentImages = this.state.images.length;
        
        if (currentImages + files.length > maxImages) {
            throw new Error(`Solo puedes subir un máximo de ${maxImages} imágenes`);
        }
        
        const uploadedImages = [];
        
        for (const [index, file] of files.entries()) {
            console.log(`📝 Procesando archivo ${index + 1}:`, {
                name: file.name,
                type: file.type,
                size: `${(file.size / 1024 / 1024).toFixed(2)}MB`
            });
            
            // Validar tipo de archivo
            if (!file.type.startsWith('image/')) {
                throw new Error('Solo se permiten archivos de imagen');
            }
            
            // Validar tamaño (10MB máximo)
            if (file.size > 10 * 1024 * 1024) {
                throw new Error('Las imágenes no pueden exceder 10MB');
            }
            
            // Crear una URL temporal para mostrar la imagen
            const tempUrl = URL.createObjectURL(file);
            console.log('🔗 URL temporal creada:', tempUrl);
            
            uploadedImages.push({
                file: file,
                url: tempUrl,
                isPrimary: this.state.images.length === 0 && uploadedImages.length === 0,
                isTemp: true
            });
        }
        
        this.state.images.push(...uploadedImages);
        console.log('📊 Estado de imágenes actualizado. Total:', this.state.images.length);
        this.updateImagePreview();
    }

    removeImage(index) {
        const image = this.state.images[index];
        
        // Si es una imagen temporal, liberar la URL
        if (image.isTemp) {
            URL.revokeObjectURL(image.url);
        }
        
        // Si era la imagen principal y quedan imágenes, hacer la siguiente como principal
        if (image.isPrimary && this.state.images.length > 1) {
            const nextIndex = index === 0 ? 1 : 0;
            this.state.images[nextIndex].isPrimary = true;
        }
        
        this.state.images.splice(index, 1);
        this.updateImagePreview();
    }

    setPrimaryImage(index) {
        // Quitar el flag de principal de todas las imágenes
        this.state.images.forEach(img => {
            img.isPrimary = false;
        });
        
        // Establecer la nueva imagen principal
        this.state.images[index].isPrimary = true;
        this.updateImagePreview();
    }

    updateImagePreview() {
        const container = document.querySelector('.image-preview-container');
        if (container) {
            container.innerHTML = this.renderImagePreview();
            this.attachImageEvents();
        }
    }

    async uploadImagesToServer(vehicleId) {
        console.log('🔄 Iniciando subida de imágenes para vehículo:', vehicleId);
        const tempImages = this.state.images.filter(img => img.isTemp);
        console.log('📸 Imágenes temporales a subir:', tempImages.length);
        for (const [index, imageData] of tempImages.entries()) {
            console.log(`📤 Subiendo imagen ${index + 1}/${tempImages.length}:`, imageData.file.name);
            const formData = new FormData();
            formData.append('file', imageData.file);
            try {
                const response = await fetch(`/api/vehicles/${vehicleId}/images`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('turo-clone_auth_token')}`
                    },
                    body: formData
                });
                console.log('📡 Respuesta del servidor:', response.status, response.statusText);
                if (!response.ok) {
                    const error = await response.json();
                    console.error('❌ Error en la respuesta:', error);
                    throw new Error(error.message || 'Error subiendo imagen');
                }
                const result = await response.json();
                console.log('✅ Imagen subida exitosamente:', result);
                // Reemplazar la imagen temporal por la real en el array de imágenes
                const tempIdx = this.state.images.findIndex(img => img.isTemp && img.url === imageData.url);
                if (tempIdx !== -1) {
                    this.state.images[tempIdx] = {
                        url: result.imageUrl || result.url,
                        isPrimary: imageData.isPrimary,
                        isTemp: false
                    };
                }
                this.updateImagePreview();
            } catch (fetchError) {
                console.error('❌ Error de conexión:', fetchError);
                throw fetchError;
            }
        }
        console.log('🎉 Todas las imágenes subidas exitosamente');
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

            // --- Sincronizar imágenes eliminadas y principal ---
            let originalImages = (this.vehicle?.images || []).map(img => img.url);
            let currentImages = this.state.images.filter(img => !img.isTemp).map(img => img.url);
            // Imágenes eliminadas (estaban antes y ya no están)
            let deletedImages = originalImages.filter(url => !currentImages.includes(url));

            // Eliminar imágenes en backend
            for (let url of deletedImages) {
                // Buscar el índice de la imagen eliminada en el array original
                let idx = this.vehicle.images.findIndex(img => img.url === url);
                if (idx !== -1) {
                    try {
                        await fetch(`/api/vehicles/${this.vehicle._id}/images/${idx}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('turo-clone_auth_token')}`
                            }
                        });
                    } catch (err) {
                        console.error('Error eliminando imagen en backend:', err);
                    }
                }
            }

            // Subir nuevas imágenes si las hay
            const hasNewImages = this.state.images.some(img => img.isTemp);
            if (hasNewImages) {
                await this.uploadImagesToServer(this.vehicle._id);
                // Esperar un momento para que el servidor procese las imágenes
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            // Actualizar isPrimary en backend (si cambió)
            // El array de imágenes puede haber cambiado de orden, así que lo actualizamos
            // Solo si hay imágenes existentes (no temporales)
            const updatedImages = this.state.images.filter(img => !img.isTemp).map(img => ({
                url: img.url,
                isPrimary: img.isPrimary
            }));
            // Si hay imágenes existentes, actualizar el array en backend
            if (updatedImages.length > 0) {
                try {
                    await fetch(`/api/vehicles/${this.vehicle._id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('turo-clone_auth_token')}`
                        },
                        body: JSON.stringify({ images: updatedImages })
                    });
                } catch (err) {
                    console.error('Error actualizando imágenes en backend:', err);
                }
            }

            // Preparar datos para enviar (resto de campos)
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
                if (this.onSuccess) {
                    await this.onSuccess(result);
                }
                const notif = new Notification('Vehículo actualizado exitosamente', 'success');
                document.body.appendChild(notif.render());
            } else {
                result = await createVehicle(vehicleData);
                // Subir imágenes si es un vehículo nuevo
                const hasNewImages = this.state.images.some(img => img.isTemp);
                if (hasNewImages) {
                    await this.uploadImagesToServer(result.vehicle._id);
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
                if (this.onSuccess) {
                    await this.onSuccess(result);
                }
                const notif = new Notification('Vehículo creado exitosamente', 'success');
                document.body.appendChild(notif.render());
            }
            // Cerrar modal
            document.querySelector('.vehicle-form-modal').remove();
        } catch (error) {
            console.error('Error guardando vehículo:', error);
            const notif = new Notification(error.message || 'Error al guardar el vehículo', 'error');
            document.body.appendChild(notif.render());
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

    renderImagePreview() {
        if (this.state.images.length === 0) {
            return `
                <div class="no-images">
                    <i class="icon-camera"></i>
                    <p>No hay imágenes seleccionadas</p>
                </div>
            `;
        }

        return this.state.images.map((image, index) => `
            <div class="image-item ${image.isPrimary ? 'primary' : ''}">
                <img src="${image.url}" alt="Vehículo ${index + 1}">
                <div class="image-overlay">
                    <div class="image-actions">
                        ${!image.isPrimary ? `<button type="button" class="btn-icon set-primary" data-index="${index}" title="Establecer como principal">
                            <i class="icon-star"></i>
                        </button>` : ''}
                        <button type="button" class="btn-icon remove-image" data-index="${index}" title="Eliminar imagen">
                            <i class="icon-trash"></i>
                        </button>
                    </div>
                </div>
                ${image.isPrimary ? '<div class="primary-badge">Principal</div>' : ''}
            </div>
        `).join('');
    }

    attachImageEvents() {
        // Buscar el contenedor de imágenes SOLO dentro del formulario actual
        if (!this.formElement) return;
        const container = this.formElement.querySelector('.image-preview-container');
        if (!container) return;
        // Eliminar listeners previos
        container.onclick = null;
        container.onclick = (e) => {
            const setBtn = e.target.closest('.set-primary');
            if (setBtn) {
                const index = parseInt(setBtn.dataset.index);
                this.setPrimaryImage(index);
                return;
            }
            const removeBtn = e.target.closest('.remove-image');
            if (removeBtn) {
                const index = parseInt(removeBtn.dataset.index);
                this.removeImage(index);
                return;
            }
        };
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
                            <h3>Imágenes del Vehículo</h3>
                            <div class="form-group">
                                <label for="vehicle-images">Seleccionar imágenes (máximo 5)</label>
                                <input type="file" id="vehicle-images" accept="image/*" multiple 
                                       class="image-upload-input">
                                <div class="upload-help">
                                    <small>Formatos soportados: JPG, PNG, WEBP. Tamaño máximo: 10MB por imagen</small>
                                </div>
                            </div>
                            <div class="image-preview-container">
                                ${this.renderImagePreview()}
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
        this.formElement = form.querySelector('.vehicle-form');
        this.formElement.addEventListener('submit', (e) => this.handleSubmit(e));

        // Input change listeners
        form.querySelectorAll('input, select, textarea').forEach(input => {
            // Skip file input for images
            if (input.type === 'file') return;
            
            input.addEventListener('input', (e) => this.handleInputChange(e));
            input.addEventListener('change', (e) => this.handleInputChange(e));
        });

        // Image upload listener
        const imageInput = form.querySelector('#vehicle-images');
        if (imageInput) {
            imageInput.addEventListener('change', async (e) => {
                try {
                    const files = Array.from(e.target.files);
                    if (files.length > 0) {
                        await this.handleImageUpload(files);
                    }
                } catch (error) {
                    const notif = new Notification(error.message, 'error');
                    document.body.appendChild(notif.render());
                }
                // Reset input to allow selecting the same files again
                e.target.value = '';
            });
        }

        // Feature checkboxes
        form.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.handleFeatureToggle(e.target.value);
            });
        });

        // Image events
        this.attachImageEvents();

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
