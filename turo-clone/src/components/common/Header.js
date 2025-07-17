export default class Header {
    render() {
        const header = document.createElement('header');
        header.innerHTML = `
            <div class="container">
                <nav>
                    <a href="/" class="logo" data-link>RideShare</a>
                    <div class="nav-links">
                        <a href="/search" data-link>Buscar vehículos</a>
                        <a href="/login" data-link>Iniciar sesión</a>
                        <a href="/register" class="btn btn-primary" data-link>Registrarse</a>
                    </div>
                </nav>
            </div>
        `;
        return header;
    }
}
