export default class Header {
    render() {
        const header = document.createElement('header');
        header.innerHTML = `
            <div class="container">
                <nav>
                    <a href="/" class="logo" data-link>TuroClone</a>
                    <div class="nav-links">
                        <a href="/search" data-link>Buscar vehículos</a>
                        <a href="#" id="loginBtn">Iniciar sesión</a>
                        <a href="/register" class="btn btn-primary" data-link>Registrarse</a>
                    </div>
                </nav>
            </div>
        `;
        
        header.querySelector('#loginBtn').addEventListener('click', (e) => {
            e.preventDefault();
            const Login = () => console.log('Login modal'); // Temporal
            const loginModal = new Login();
            document.body.appendChild(loginModal.render());
        });
        
        return header;
    }
}