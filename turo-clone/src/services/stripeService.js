const API_BASE_URL = 'http://localhost:5000'; // o usa import desde tu config

export async function startStripeCheckout(reservationId) {
    const res = await fetch(`${API_BASE_URL}/api/stripe/checkout`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json', 
            'Authorization': 'Bearer ' + localStorage.getItem('turo_clone_token') 
        },
        body: JSON.stringify({ reservationId })
    });
    const text = await res.text();
    let data = {};
    try {
        data = JSON.parse(text);
    } catch (e) {
        data = {};
    }
    if (data.url) {
        window.location.href = data.url;
    } else {
        alert('No se pudo iniciar el pago');
    }
}