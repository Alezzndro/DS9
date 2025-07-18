export default class PaymentSuccess {
    render() {
        const container = document.createElement('div');
        container.style = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            height: 100vh;
            background-color: #e6fff2;
            color: #2e7d32;
            font-family: sans-serif;
        `;
        container.innerHTML = `
            <h2 style="font-size: 2rem; margin-bottom: 1rem;">✅ ¡Pago exitoso!</h2>
            <p style="font-size: 1.2rem; margin-bottom: 2rem;">Tu reserva ha sido confirmada correctamente.</p>
            <a href="/" data-link style="
                background-color: #2e7d32;
                color: white;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                text-decoration: none;
                font-weight: bold;
            ">Volver al inicio</a>
        `;
        return container;
    }
}
