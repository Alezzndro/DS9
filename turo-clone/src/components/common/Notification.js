export default class Notification {
    constructor(message, type = 'info') {
        this.message = message;
        this.type = type;
    }

    render() {
        const notification = document.createElement('div');
        notification.className = `notification notification-${this.type}`;
        notification.innerHTML = this.message;
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 500);
        }, 3000);
        
        return notification;
    }
}