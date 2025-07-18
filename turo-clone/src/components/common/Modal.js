export default class Modal {
    constructor(title, content) {
        this.title = title;
        this.content = content; // Puede ser string o nodo
    }

    closeModal() {
        if (this.modalElement && this.modalElement.parentNode) {
            document.body.removeChild(this.modalElement);
        }
    }

    render() {
        this.modalElement = document.createElement('div');
        this.modalElement.className = 'modal';

        // Contenedor base
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';

        // Botón de cierre
        const closeButton = document.createElement('span');
        closeButton.className = 'close-modal';
        closeButton.innerHTML = '&times;';
        closeButton.addEventListener('click', () => this.closeModal());

        // Título
        const titleElement = document.createElement('h2');
        titleElement.textContent = this.title;

        // Cuerpo del modal
        const bodyElement = document.createElement('div');
        bodyElement.className = 'modal-body';

        if (typeof this.content === 'string') {
            bodyElement.innerHTML = this.content;
        } else {
            bodyElement.appendChild(this.content);
        }

        // Ensamblar todo
        modalContent.appendChild(closeButton);
        modalContent.appendChild(titleElement);
        modalContent.appendChild(bodyElement);
        this.modalElement.appendChild(modalContent);

        this.modalElement.addEventListener('click', (e) => {
            if (e.target === this.modalElement) {
                this.closeModal();
            }
        });

        return this.modalElement;
    }

}
