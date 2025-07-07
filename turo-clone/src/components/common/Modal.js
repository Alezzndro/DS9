export default class Modal {
    constructor(title, content) {
        this.title = title;
        this.content = content;
    }

    closeModal() {
        if (this.modalElement && this.modalElement.parentNode) {
            document.body.removeChild(this.modalElement);
        }
    }

    render() {
        this.modalElement = document.createElement('div');
        this.modalElement.className = 'modal';
        this.modalElement.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>${this.title}</h2>
                <div class="modal-body">${this.content}</div>
            </div>
        `;
        
        this.modalElement.querySelector('.close-modal').addEventListener('click', () => this.closeModal());
        
        this.modalElement.addEventListener('click', (e) => {
            if (e.target === this.modalElement) {
                this.closeModal();
            }
        });
        
        return this.modalElement;
    }
}