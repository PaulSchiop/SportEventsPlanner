// src/utils/networkStatus.js
import { offlineQueue } from "./offlineQueue.js";

class NetworkStatus {
    constructor() {
        this.isOnline = navigator.onLine;
        this.serverAvailable = false;
        this.listeners = [];

        window.addEventListener('online', this.handleConnectionChange);
        window.addEventListener('offline', this.handleConnectionChange);
        this.checkServerStatus(); // Initial check
        this.initialize();
    }

    initialize = async () => {
        await this.checkServerStatus();
        this.checkInterval = setInterval(this.checkServerStatus, 15000);
    };

    handleConnectionChange = () => {
        this.isOnline = navigator.onLine;
        this.notifyListeners();
        if (this.isOnline) {
            this.checkServerStatus(); // Verify server when connection returns
        }
    };

    checkServerStatus = async () => {
        const previousStatus = this.serverAvailable;
        try {
            const baseUrl = `http://${window.location.hostname}:5000`;
            const response = await fetch(`${baseUrl}/entities/health-check`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                cache: 'no-store'
            });
            this.serverAvailable = response.ok;
        } catch (error) {
            console.error("Server check failed:", error);
            this.serverAvailable = false;
        }

        // Trigger queue processing if server becomes available
        if (this.isOnline && this.serverAvailable && !previousStatus) {
            console.log("Server became available, processing queue...");
            await offlineQueue.processQueue();
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