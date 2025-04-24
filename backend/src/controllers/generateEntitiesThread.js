const {worker, isMainThread} = require('worker_threads');
const {faker} = require('@faker-js/faker');
const WebSocket = require('ws');

class generateEntitiesThread {
    constructor(webSocketServer) {
        this.webSocketServer = webSocketServer;
        this.worker = null;
        this.isGenerating = false;
    }

    start() {
        if (this.isGenerating) {
            console.log('Generation already in progress');
            return;
        }
        this.isGenerating = true;

        this.worker = new Worker(__filename, {
            workerData: {webSocketServer: this.webSocketServer}
        });

        this.worker.on('message', (message) =>{
            if(this.webSocketServer) {
                this.webSocketServer.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'NEW_ENTITY',
                            data: message
                        }));
                    }
                });
            }
        })
}
}