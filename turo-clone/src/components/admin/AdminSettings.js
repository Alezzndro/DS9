import adminApiService from '../../services/adminApiService.js';

export default class AdminSettings {
    constructor() {
        this.loading = true;
        this.settings = {
            platform: {
                name: 'Turo Clone',
                description: 'Plataforma de alquiler de vehículos peer-to-peer',
                email: 'admin@turoclone.com',
                phone: '+34 900 123 456',
                address: 'Calle Principal 123, Madrid, España'
            },
            business: {
                commission: 15,
                currency: 'USD',
                minRentalDays: 1,
                maxRentalDays: 30,
                cancellationHours: 24,
                autoApproval: false
            },
            notifications: {
                emailNotifications: true,
                smsNotifications: false,
                pushNotifications: true,
                newUserWelcome: true,
                reservationConfirmation: true,
                paymentAlerts: true
            },
            security: {
                requireEmailVerification: true,
                requirePhoneVerification: false,
                documentVerification: true,
                twoFactorAuth: false,
                passwordMinLength: 8
            }
        };
        
        this.loadSettings();
    }

    async loadSettings() {
        try {
            this.loading = true;
            const response = await adminApiService.getSettings();
            if (response && response.settings) {
                this.settings = { ...this.settings, ...response.settings };
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            this.showNotification('Error al cargar configuraciones', 'error');
        } finally {
            this.loading = false;
            this.updateSettingsDisplay();
        }
    }

    async handleSettingChange(category, setting, value) {
        try {
            const updatedSettings = { ...this.settings };
            updatedSettings[category][setting] = value;
            
            await adminApiService.updateSettings({ [category]: { [setting]: value } });
            this.settings = updatedSettings;
            this.showNotification(`Configuración actualizada: ${setting}`);
        } catch (error) {
            console.error('Error updating setting:', error);
            this.showNotification('Error al actualizar configuración', 'error');
        }
    }

    updateSettingsDisplay() {
        // Rerender the settings interface with new data
        const settingsContainer = document.querySelector('.admin-settings');
        if (settingsContainer && !this.loading) {
            const newContent = this.render();
            settingsContainer.replaceWith(newContent);
        }
    }

    showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `admin-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i>
                <span>${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    renderPlatformSettings() {
        const section = document.createElement('div');
        section.className = 'settings-section';
        section.innerHTML = `
            <h3>Configuración de la Plataforma</h3>
            <div class="settings-grid">
                <div class="setting-item">
                    <label>Nombre de la plataforma</label>
                    <input type="text" value="${this.settings.platform.name}" 
                           onchange="window.adminApp.settings.handleSettingChange('platform', 'name', this.value)">
                </div>
                
                <div class="setting-item">
                    <label>Descripción</label>
                    <textarea onchange="window.adminApp.settings.handleSettingChange('platform', 'description', this.value)">${this.settings.platform.description}</textarea>
                </div>
                
                <div class="setting-item">
                    <label>Email de contacto</label>
                    <input type="email" value="${this.settings.platform.email}" 
                           onchange="window.adminApp.settings.handleSettingChange('platform', 'email', this.value)">
                </div>
                
                <div class="setting-item">
                    <label>Teléfono</label>
                    <input type="tel" value="${this.settings.platform.phone}" 
                           onchange="window.adminApp.settings.handleSettingChange('platform', 'phone', this.value)">
                </div>
                
                <div class="setting-item full-width">
                    <label>Dirección</label>
                    <input type="text" value="${this.settings.platform.address}" 
                           onchange="window.adminApp.settings.handleSettingChange('platform', 'address', this.value)">
                </div>
            </div>
        `;
        return section;
    }

    renderBusinessSettings() {
        const section = document.createElement('div');
        section.className = 'settings-section';
        section.innerHTML = `
            <h3>Configuración del Negocio</h3>
            <div class="settings-grid">
                <div class="setting-item">
                    <label>Comisión de la plataforma (%)</label>
                    <input type="number" min="0" max="50" value="${this.settings.business.commission}" 
                           onchange="window.adminApp.settings.handleSettingChange('business', 'commission', parseInt(this.value))">
                </div>
                
                <div class="setting-item">
                    <label>Moneda</label>
                    <select onchange="window.adminApp.settings.handleSettingChange('business', 'currency', this.value)">
                        <option value="USD" ${this.settings.business.currency === 'USD' ? 'selected' : ''}>USD ($)</option>
                    </select>
                </div>
                
                <div class="setting-item">
                    <label>Días mínimos de alquiler</label>
                    <input type="number" min="1" max="7" value="${this.settings.business.minRentalDays}" 
                           onchange="window.adminApp.settings.handleSettingChange('business', 'minRentalDays', parseInt(this.value))">
                </div>
                
                <div class="setting-item">
                    <label>Días máximos de alquiler</label>
                    <input type="number" min="7" max="365" value="${this.settings.business.maxRentalDays}" 
                           onchange="window.adminApp.settings.handleSettingChange('business', 'maxRentalDays', parseInt(this.value))">
                </div>
                
                <div class="setting-item">
                    <label>Horas límite para cancelación</label>
                    <input type="number" min="1" max="72" value="${this.settings.business.cancellationHours}" 
                           onchange="window.adminApp.settings.handleSettingChange('business', 'cancellationHours', parseInt(this.value))">
                </div>
                
                <div class="setting-item">
                    <label>Aprobación automática de vehículos</label>
                    <label class="toggle">
                        <input type="checkbox" ${this.settings.business.autoApproval ? 'checked' : ''} 
                               onchange="window.adminApp.settings.handleSettingChange('business', 'autoApproval', this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>
            </div>
        `;
        return section;
    }

    renderNotificationSettings() {
        const section = document.createElement('div');
        section.className = 'settings-section';
        section.innerHTML = `
            <h3>Configuración de Notificaciones</h3>
            <div class="settings-grid">
                <div class="setting-item">
                    <label>Notificaciones por email</label>
                    <label class="toggle">
                        <input type="checkbox" ${this.settings.notifications.emailNotifications ? 'checked' : ''} 
                               onchange="window.adminApp.settings.handleSettingChange('notifications', 'emailNotifications', this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>
                
                <div class="setting-item">
                    <label>Notificaciones por SMS</label>
                    <label class="toggle">
                        <input type="checkbox" ${this.settings.notifications.smsNotifications ? 'checked' : ''} 
                               onchange="window.adminApp.settings.handleSettingChange('notifications', 'smsNotifications', this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>
                
                <div class="setting-item">
                    <label>Notificaciones push</label>
                    <label class="toggle">
                        <input type="checkbox" ${this.settings.notifications.pushNotifications ? 'checked' : ''} 
                               onchange="window.adminApp.settings.handleSettingChange('notifications', 'pushNotifications', this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>
                
                <div class="setting-item">
                    <label>Email de bienvenida</label>
                    <label class="toggle">
                        <input type="checkbox" ${this.settings.notifications.newUserWelcome ? 'checked' : ''} 
                               onchange="window.adminApp.settings.handleSettingChange('notifications', 'newUserWelcome', this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>
                
                <div class="setting-item">
                    <label>Confirmación de reservas</label>
                    <label class="toggle">
                        <input type="checkbox" ${this.settings.notifications.reservationConfirmation ? 'checked' : ''} 
                               onchange="window.adminApp.settings.handleSettingChange('notifications', 'reservationConfirmation', this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>
                
                <div class="setting-item">
                    <label>Alertas de pago</label>
                    <label class="toggle">
                        <input type="checkbox" ${this.settings.notifications.paymentAlerts ? 'checked' : ''} 
                               onchange="window.adminApp.settings.handleSettingChange('notifications', 'paymentAlerts', this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>
            </div>
        `;
        return section;
    }

    renderSecuritySettings() {
        const section = document.createElement('div');
        section.className = 'settings-section';
        section.innerHTML = `
            <h3>Configuración de Seguridad</h3>
            <div class="settings-grid">
                <div class="setting-item">
                    <label>Verificación de email obligatoria</label>
                    <label class="toggle">
                        <input type="checkbox" ${this.settings.security.requireEmailVerification ? 'checked' : ''} 
                               onchange="window.adminApp.settings.handleSettingChange('security', 'requireEmailVerification', this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>
                
                <div class="setting-item">
                    <label>Verificación de teléfono obligatoria</label>
                    <label class="toggle">
                        <input type="checkbox" ${this.settings.security.requirePhoneVerification ? 'checked' : ''} 
                               onchange="window.adminApp.settings.handleSettingChange('security', 'requirePhoneVerification', this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>
                
                <div class="setting-item">
                    <label>Verificación de documentos</label>
                    <label class="toggle">
                        <input type="checkbox" ${this.settings.security.documentVerification ? 'checked' : ''} 
                               onchange="window.adminApp.settings.handleSettingChange('security', 'documentVerification', this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>
                
                <div class="setting-item">
                    <label>Autenticación de dos factores</label>
                    <label class="toggle">
                        <input type="checkbox" ${this.settings.security.twoFactorAuth ? 'checked' : ''} 
                               onchange="window.adminApp.settings.handleSettingChange('security', 'twoFactorAuth', this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>
                
                <div class="setting-item">
                    <label>Longitud mínima de contraseña</label>
                    <input type="number" min="6" max="20" value="${this.settings.security.passwordMinLength}" 
                           onchange="window.adminApp.settings.handleSettingChange('security', 'passwordMinLength', parseInt(this.value))">
                </div>
            </div>
        `;
        return section;
    }

    render() {
        const settingsSection = document.createElement('div');
        settingsSection.className = 'admin-settings';
        
        if (this.loading) {
            settingsSection.innerHTML = `
                <div class="section-header">
                    <h1>Configuración del Sistema</h1>
                    <p>Gestiona la configuración general de la plataforma</p>
                </div>
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>Cargando configuraciones...</p>
                </div>
            `;
            return settingsSection;
        }
        
        settingsSection.innerHTML = `
            <div class="section-header">
                <h1>Configuración del Sistema</h1>
                <p>Gestiona la configuración general de la plataforma</p>
            </div>
            
            <div class="settings-actions">
                <button class="btn btn-primary" onclick="this.saveAllSettings()">Guardar Cambios</button>
                <button class="btn btn-outline" onclick="this.resetToDefaults()">Restaurar Valores por Defecto</button>
                <button class="btn btn-outline" onclick="this.exportSettings()">Exportar Configuración</button>
            </div>
        `;
        
        const settingsContainer = document.createElement('div');
        settingsContainer.className = 'settings-container';
        
        settingsContainer.appendChild(this.renderPlatformSettings());
        settingsContainer.appendChild(this.renderBusinessSettings());
        settingsContainer.appendChild(this.renderNotificationSettings());
        settingsContainer.appendChild(this.renderSecuritySettings());
        
        settingsSection.appendChild(settingsContainer);
        
        return settingsSection;
    }

    async saveAllSettings() {
        try {
            await adminApiService.updateSettings(this.settings);
            this.showNotification('Todas las configuraciones guardadas correctamente');
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showNotification('Error al guardar configuraciones', 'error');
        }
    }

    async resetToDefaults() {
        if (confirm('¿Estás seguro de que quieres restaurar todas las configuraciones a sus valores por defecto?')) {
            try {
                await adminApiService.resetSettings();
                await this.loadSettings();
                this.showNotification('Configuraciones restauradas a valores por defecto');
            } catch (error) {
                console.error('Error resetting settings:', error);
                this.showNotification('Error al restaurar configuraciones', 'error');
            }
        }
    }

    exportSettings() {
        try {
            const dataStr = JSON.stringify(this.settings, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = 'settings-export.json';
            link.click();
            
            URL.revokeObjectURL(url);
            this.showNotification('Configuraciones exportadas correctamente');
        } catch (error) {
            console.error('Error exporting settings:', error);
            this.showNotification('Error al exportar configuraciones', 'error');
        }
    }
}
