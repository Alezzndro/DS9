import '../../css/footer.css';

export default class Footer {
    render() {
        const footer = document.createElement('footer');
        footer.className = 'site-footer';
        footer.innerHTML = `
            <div class="container">
                <div class="footer-content">
                    <div class="footer-section">
                        <h3>RideShare</h3>
                        <p>La mejor plataforma para alquilar vehículos particulares.</p>
                    </div>
                    <div class="footer-section">
                        <h4>Enlaces rápidos</h4>
                        <ul>
                            <li><a href="/search" data-link>Buscar vehículos</a></li>
                            <li><a href="#" id="footerLogin">Iniciar sesión</a></li>
                            <li><a href="/register" data-link>Registrarse</a></li>
                        </ul>
                    </div>
                    <div class="footer-section">
                        <h4>Contacto</h4>
                        <ul>
                            <li><a href="#">Soporte</a></li>
                            <li><a href="#">Preguntas frecuentes</a></li>
                            <li><a href="#">Términos y condiciones</a></li>
                        </ul>
                    </div>
                </div>
                <div class="footer-bottom">
                    <p>&copy; ${new Date().getFullYear()} RideShare. Todos los derechos reservados.</p>
                </div>
            </div>
        `;
        
        footer.querySelector('#footerLogin').addEventListener('click', (e) => {
            e.preventDefault();
            const Login = () => console.log('Login modal'); // Temporal
            const loginModal = new Login();
            document.body.appendChild(loginModal.render());
        });
        
        return footer;
    }
}