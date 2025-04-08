import {offlineQueue} from "./offlineQueue.js";

class NetworkStatus {
    constructor() {
        this.isOnline = navigator.onLine;
        this.serverAvailable = false;
        this.listeners = [];

        window.addEventListener('online', this.handleConnectionChange);
        window.addEventListener('offline', this.handleConnectionChange);
        this.checkServerStatus(); // Initial check
        this.checkInterval = setInterval(this.checkServerStatus, 15000);
        this.initialize();
    }

    initialize = async () => {
        await this.checkServerStatus();
        this.checkInterval = setInterval(async () => {
            const previousStatus = this.serverAvailable;
            await this.checkServerStatus();
            // Only process queue if status changed from offline to online
            if (this.isOnline && this.serverAvailable && !previousStatus) {
                await offlineQueue.processQueue();
                // Notification happens in checkServerStatus already, no need to call it again
            }
        }, 15000);
    };



    handleConnectionChange = () => {
        this.isOnline = navigator.onLine;
        this.notifyListeners();
        if (this.isOnline) {
            this.checkServerStatus(); // Verify server when connection returns
        }
    };

    checkServerStatus = async () => {
        try {
            const response = await fetch('http://localhost:5000/entities/health-check', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                cache: 'no-store'
            });

            this.serverAvailable = response.ok;
        } catch (error) {
            this.serverAvailable = false;
        }

        this.notifyListeners();
    };

    addListener = (listener) => {
        this.listeners.push(listener);
    };

    removeListener = (listenerToRemove) => {
        this.listeners = this.listeners.filter(
            listener => listener !== listenerToRemove
        );
    };

    notifyListeners = () => {
        this.listeners.forEach(listener => listener({
            isOnline: this.isOnline,
            isServerAvailable: this.serverAvailable
        }));
    };

    getStatus = () => ({
        isOnline: this.isOnline,
        isServerAvailable: this.serverAvailable
    });
}

export const networkStatus = new NetworkStatus();