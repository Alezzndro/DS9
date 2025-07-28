export default class UserProfile {
    constructor(user) {
        this.user = user || {
            name: 'Juan Pérez',
            email: 'juan@example.com',
            phone: '+123456789',
            verified: true,
            documents: {
                id: 'pending',
                license: 'approved'
            }
        };
    }

    renderVerificationStatus() {
        return `
            <div class="verification-status">
                <h4>Estado de verificación</h4>
                <ul>
                    <li>Identificación: <span class="status-${this.user.documents.id}">${this.user.documents.id === 'approved' ? 'Aprobada' : this.user.documents.id === 'pending' ? 'Pendiente' : 'Rechazada'}</span></li>
                    <li>Licencia: <span class="status-${this.user.documents.license}">${this.user.documents.license === 'approved' ? 'Aprobada' : this.user.documents.license === 'pending' ? 'Pendiente' : 'Rechazada'}</span></li>
                </ul>
                ${this.user.documents.id !== 'approved' || this.user.documents.license !== 'approved' ? 
                    '<button class="btn btn-outline upload-docs-btn">Subir documentos</button>' : ''}
            </div>
        `;
    }

    render() {
        const profile = document.createElement('div');
        profile.className = 'user-profile';
        profile.innerHTML = `
            <div class="profile-header">
                <div class="avatar">${this.user.name.charAt(0)}</div>
                <h2>${this.user.name}</h2>
                <p>${this.user.email}</p>
                <p>${this.user.phone}</p>
            </div>
            ${this.renderVerificationStatus()}
            <div class="profile-actions">
                <button class="btn btn-outline edit-profile-btn">Editar perfil</button>
                <button class="btn btn-outline change-password-btn">Cambiar contraseña</button>
            </div>
        `;
        
        // Event listeners
        profile.querySelector('.edit-profile-btn').addEventListener('click', () => this.handleEditProfile());
        profile.querySelector('.change-password-btn').addEventListener('click', () => this.handleChangePassword());
        
        const uploadDocsBtn = profile.querySelector('.upload-docs-btn');
        if (uploadDocsBtn) {
            uploadDocsBtn.addEventListener('click', () => this.handleUploadDocs());
        }
        
        // Supón que tienes el usuario cargado en la variable 'user'
        const balanceDiv = document.createElement('div');
        balanceDiv.className = 'user-balance';
        balanceDiv.innerHTML = `<strong>Balance disponible:</strong> €${this.user.balance ? this.user.balance.toFixed(2) : '0.00'}`;
        profile.appendChild(balanceDiv);
        
        return profile;
    }

    handleEditProfile() {
        console.log('Editar perfil');
    }

    handleChangePassword() {
        console.log('Cambiar contraseña');
    }

    handleUploadDocs() {
        console.log('Subir documentos');
    }
}