// WebSocket Configuration
const WS_URL = window.location.protocol === 'https:' 
    ? `wss://${window.location.host}/ws/` 
    : `ws://${window.location.host}/ws/`;

// برای اتصال مستقیم به IP:
// const WS_URL = 'ws://95.38.135.253:8001/ws/';

class DeviceWebSocket {
    constructor(deviceId) {
        this.deviceId = deviceId;
        this.ws = null;
        this.reconnectInterval = 5000;
        this.shouldReconnect = true;
        this.connect();
    }

    connect() {
        this.ws = new WebSocket(`${WS_URL}device/${this.deviceId}/`);
        
        this.ws.onopen = () => {
            console.log('WebSocket Connected');
            this.onConnect();
        };
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.onMessage(data);
        };
        
        this.ws.onclose = () => {
            console.log('WebSocket Disconnected');
            if (this.shouldReconnect) {
                setTimeout(() => this.connect(), this.reconnectInterval);
            }
        };
        
        this.ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
        };
    }
    
    send(data) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }
    
    close() {
        this.shouldReconnect = false;
        if (this.ws) {
            this.ws.close();
        }
    }
}