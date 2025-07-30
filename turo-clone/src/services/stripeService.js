const API_BASE_URL = 'http://localhost:5000'; // o usa import desde tu config

export async function startStripeCheckout(reservationId) {
    try {
        console.log('🔄 Iniciando checkout de Stripe para reserva:', reservationId);
        
        const token = localStorage.getItem('turo-clone_auth_token');
        if (!token) {
            alert('No estás autenticado. Por favor, inicia sesión.');
            return;
        }

        const res = await fetch(`${API_BASE_URL}/api/stripe/checkout`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': 'Bearer ' + token 
            },
            body: JSON.stringify({ reservationId })
        });

        console.log('📡 Respuesta del servidor:', res.status, res.statusText);

        const text = await res.text();
        console.log('📄 Respuesta raw:', text);

        let data = {};
        try {
            data = JSON.parse(text);
            console.log('✅ Data parseada:', data);
        } catch (e) {
            console.error('❌ Error parseando respuesta:', e);
            alert('Error en la respuesta del servidor');
            return;
        }

        if (data.url) {
            console.log('🚀 Redirigiendo a Stripe:', data.url);
            window.location.href = data.url;
        } else {
            console.error('❌ No se recibió URL de Stripe:', data);
            alert('No se pudo iniciar el pago: ' + (data.message || 'Error desconocido'));
        }
    } catch (error) {
        console.error('🚨 Error en startStripeCheckout:', error);
        alert('Error al procesar el pago: ' + error.message);
    }
}