export async function startStripeCheckout(reservationId) {
    const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
        body: JSON.stringify({ reservationId })
    });
    const data = await res.json();
    if (data.url) {
        window.location.href = data.url;
    } else {
        throw new Error('No se pudo iniciar el pago');
    }
}