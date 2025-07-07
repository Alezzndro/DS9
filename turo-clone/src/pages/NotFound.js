import Header from '../components/common/Header.js';

export default class NotFound {
    constructor() {
        this.header = new Header();
    }

    render() {
        const page = document.createElement('div');
        page.className = 'not-found-page';
        
        page.appendChild(this.header.render());
        
        const container = document.createElement('div');
        container.className = 'container';
        container.innerHTML = `
            <div class="not-found-content">
                <h1>404 - Página no encontrada</h1>
                <p>Lo sentimos, la página que estás buscando no existe.</p>
                <a href="/" class="btn btn-primary" data-link>Volver al inicio</a>
            </div>
        `;
        
        page.appendChild(container);
        return page;
    }
}