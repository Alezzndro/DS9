export default class PaymentCancel {
    render() {
        const container = document.createElement('div');
        container.style = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            height: 100vh;
            background-color: #fff4e6;
            color: #d84315;
            font-family: sans-serif;
        `;
        container.innerHTML = `
            <h2 style="font-size: 2rem; margin-bottom: 1rem;">❌ Pago cancelado</h2>
            <p style="font-size: 1.2rem; margin-bottom: 2rem;">Tu reserva no se completó. Puedes intentarlo nuevamente.</p>
            <a href="/search" data-link style="
                background-color: #d84315;
                color: white;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                text-decoration: none;
                font-weight: bold;
            ">Volver a buscar vehículos</a>
        `;
        return container;
    }
}
