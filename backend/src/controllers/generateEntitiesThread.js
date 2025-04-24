const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const { faker } = require('@faker-js/faker');

class GenerateEntitiesThread {
    constructor(webSocketServer) {
        this.wss = webSocketServer;
        this.worker = null;
        this.isRunning = false;
        this.events = []; // Shared array to store generated events
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;

        this.worker = new Worker(__filename);

        this.worker.on('message', (data) => {
            this.events.push(data); // Add the generated event to the shared array
            this.wss.broadcast({
                type: 'NEW_ENTITY',
                data: data,
            });
        });

        this.worker.on('error', (err) => {
            console.error('Worker error:', err);
            this.isRunning = false;
        });

        this.worker.on('exit', (code) => {
            if (code !== 0) console.error(`Worker stopped with exit code ${code}`);
            this.isRunning = false;
        });
    }

    stop() {
        if (!this.isRunning || !this.worker) return;

        this.worker.postMessage('stop');
        setTimeout(() => {
            if (this.isRunning) {
                this.worker.terminate();
                this.isRunning = false;
            }
        }, 1000);
    }

    getEvents() {
        return this.events; // Expose the stored events
    }
}

if (!isMainThread) {
    let interval = null;

    function generateSingleEvent() {
        const sportsGroups = [
            'Football', 'Basketball', 'Tennis', 'Cycling', 'Olympics',
            'Cricket', 'Marathon', 'Golf', 'Athletics', 'Formula 1'
        ];

        const startHour = faker.number.int({ min: 6, max: 20 });
        const duration = faker.number.int({ min: 1, max: 6 });
        const endHour = startHour + duration;

        return {
            ID: Date.now(),
            start_time: `${startHour.toString().padStart(2, '0')}:00`,
            end_time: `${endHour.toString().padStart(2, '0')}:00`,
            date: faker.date.future({ years: 2 }).toISOString().split('T')[0],
            group: faker.helpers.arrayElement(sportsGroups),
            title: `${faker.number.int({ min: 2023, max: 2025 })} ${faker.helpers.arrayElement([
                'Championship', 'Cup', 'Tournament'
            ])}`,
            description: `The ${faker.helpers.arrayElement(['premier', 'annual'])} event.`
        };
    }

    function startGeneration() {
        if (interval) clearInterval(interval);

        interval = setInterval(() => {
            try {
                const newEvent = generateSingleEvent();
                parentPort.postMessage(newEvent);
            } catch (err) {
                console.error('Error generating event:', err);
            }
        }, 1000);
    }

    parentPort.on('message', (msg) => {
        if (msg === 'start') {
            startGeneration();
        } else if (msg === 'stop') {
            if (interval) clearInterval(interval);
            interval = null;
        }
    });

    parentPort.on('message', (msg) => {
        if (msg === 'stop') {
            console.log('Stopping event generation');
            if (interval) clearInterval(interval);
            interval = null;
        }
    });

    startGeneration();
}

module.exports = GenerateEntitiesThread;