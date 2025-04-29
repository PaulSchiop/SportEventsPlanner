// src/utils/offlineQueue.js
class OfflineQueue {
    constructor() {
        this.queue = JSON.parse(localStorage.getItem('offlineQueue')) || [];
        this.isSyncing = false;
    }

    addOperation = (operation) => {
        this.queue.push({
            ...operation,
            timestamp: Date.now(),
            id: Math.random().toString(36).substr(2, 9)
        });
        this.persistQueue();
    };

    processQueue = async () => {
        if (this.isSyncing || this.queue.length === 0) return;

        this.isSyncing = true;
        try {
            while (this.queue.length > 0) {
                const operation = this.queue[0];
                try {
                    await this.executeOperation(operation);
                    this.queue.shift(); // Remove successful operation
                    this.persistQueue();
                } catch (error) {
                    console.error('Failed to sync operation:', operation, error);
                    // Continue processing for 404 on DELETE (event already gone)
                    if (operation.type === 'DELETE' && error.message.includes('status: 404')) {
                        console.log(`Event ${operation.data?.ID || operation.tempId} already deleted on server, removing from queue`);
                        this.queue.shift();
                        this.persistQueue();
                        continue;
                    }
                    break; // Stop for other errors
                }
            }
        } finally {
            this.isSyncing = false;
        }
    };

    executeOperation = async (operation) => {
        const { type, endpoint, data, tempId } = operation;
        try {
            const response = await fetch(endpoint, {
                method: type === 'CREATE' ? 'POST' :
                    type === 'UPDATE' ? 'PUT' :
                        type === 'DELETE' ? 'DELETE' : 'GET',
                headers: { 'Content-Type': 'application/json' },
                body: type !== 'DELETE' ? JSON.stringify(data) : undefined
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            if (type === 'CREATE') {
                const createdItem = await response.json();
                console.log('Created item from server:', createdItem);
                const localEvents = JSON.parse(localStorage.getItem('events')) || [];
                const updatedEvents = localEvents.map(item =>
                    item.ID === tempId ? { ...item, ID: createdItem.ID, _isQueued: false } : item
                );
                localStorage.setItem('events', JSON.stringify(updatedEvents));
            } else if (type === 'DELETE') {
                const eventId = data?.ID || tempId;
                const localEvents = JSON.parse(localStorage.getItem('events')) || [];
                const updatedEvents = localEvents.filter(item => item.ID !== eventId);
                localStorage.setItem('events', JSON.stringify(updatedEvents));
            }

            return response;
        } catch (error) {
            console.error('Operation failed:', error, operation);
            operation.error = error.message;
            this.persistQueue();
            throw error;
        }
    };

    persistQueue = () => {
        localStorage.setItem('offlineQueue', JSON.stringify(this.queue));
    };

    clearQueue = () => {
        this.queue = [];
        this.persistQueue();
    };
}

export const offlineQueue = new OfflineQueue();