// src/tests/entityController.test.js
const httpMocks = require('node-mocks-http');
const controller = require('../controllers/entityController');

// Create a mock events array
const mockEvents = [
    {
        ID: 1,
        start_time: '18:00',
        end_time: '20:00',
        date: '2023-12-18',
        group: 'Football',
        title: '2023 FIFA World Cup Final',
        description: 'The final match of the 2023 FIFA World Cup.'
    },
    {
        ID: 2,
        start_time: '18:30',
        end_time: '22:00',
        date: '2024-02-11',
        group: 'American Football',
        title: 'Super Bowl LVIII',
        description: 'The championship game of the NFL season.'
    },
    {
        ID: 3,
        start_time: '20:00',
        end_time: '23:00',
        date: '2024-06-20',
        group: 'Basketball',
        title: 'NBA Finals Game 7',
        description: 'The decisive game of the NBA Finals.'
    }
];

describe('Event Controller Tests', () => {
    beforeEach(() => {
        // Reset the events array to our mock data before each test
        controller.events = [...mockEvents];
    });

    // Test getAllEvents
    describe('getAllEvents', () => {
        it('should return all events', () => {
            const req = httpMocks.createRequest();
            const res = httpMocks.createResponse();

            controller.getAllEvents(req, res);

            const data = res._getJSONData();
            expect(res._isEndCalled()).toBeTruthy();
            expect(data.length).toBe(20); // Based on our mock data
        });

        it('should filter events by title', () => {
            const req = httpMocks.createRequest({
                query: { title: 'FIFA' }
            });
            const res = httpMocks.createResponse();

            controller.getAllEvents(req, res);

            const data = res._getJSONData();
            expect(data.length).toBeGreaterThan(0);
            expect(data.every(event => event.title.toLowerCase().includes('fifa'))).toBeTruthy();
        });

        it('should filter events by group', () => {
            const req = httpMocks.createRequest({
                query: { group: 'Football' }
            });
            const res = httpMocks.createResponse();

            controller.getAllEvents(req, res);

            const data = res._getJSONData();
            expect(data.length).toBeGreaterThan(0);
            expect(data.every(event => event.group.toLowerCase() === 'football')).toBeTruthy();
        });

        it('should filter events by date', () => {
            const req = httpMocks.createRequest({
                query: { date: '2023-12-18' }
            });
            const res = httpMocks.createResponse();

            controller.getAllEvents(req, res);

            const data = res._getJSONData();
            expect(data.length).toBeGreaterThan(0);
            expect(data.every(event => event.date === '2023-12-18')).toBeTruthy();
        });

        it('should sort events by title', () => {
            const req = httpMocks.createRequest({
                query: { sortBy: 'title' }
            });
            const res = httpMocks.createResponse();

            controller.getAllEvents(req, res);

            const data = res._getJSONData();
            expect(data.length).toBe(20);
            // Check if sorted alphabetically
            for (let i = 1; i < data.length; i++) {
                expect(data[i].title.localeCompare(data[i-1].title)).toBeGreaterThanOrEqual(0);
            }
        });

        it('should sort events by date', () => {
            const req = httpMocks.createRequest({
                query: { sortBy: 'date' }
            });
            const res = httpMocks.createResponse();

            controller.getAllEvents(req, res);

            const data = res._getJSONData();
            expect(data.length).toBe(20);
            // Check if sorted by date
            for (let i = 1; i < data.length; i++) {
                expect(new Date(data[i].date) - new Date(data[i-1].date)).toBeGreaterThanOrEqual(0);
            }
        });
    });

    // Test createEvent
    describe('createEvent', () => {
        it('should create a new event', () => {
            const req = httpMocks.createRequest({
                body: {
                    title: 'Test Event',
                    group: 'Test Group',
                    date: '2024-08-01',
                    start_time: '10:00',
                    end_time: '12:00',
                    description: 'Test description'
                }
            });
            const res = httpMocks.createResponse();

            controller.createEvent(req, res);

            expect(res.statusCode).toBe(201);
            const data = res._getJSONData();
            expect(data.title).toBe('Test Event');
            expect(data.ID).toBeDefined();
        });

        it('should validate required fields', () => {
            const req = httpMocks.createRequest({
                body: {
                    title: 'Test Event',
                    // Missing other required fields
                }
            });
            const res = httpMocks.createResponse();

            controller.createEvent(req, res);

            expect(res.statusCode).toBe(400);
            expect(res._getJSONData().message).toBe('All fields are required');
        });

        it('should validate time constraints', () => {
            const req = httpMocks.createRequest({
                body: {
                    title: 'Test Event',
                    group: 'Test Group',
                    date: '2024-08-01',
                    start_time: '12:00',
                    end_time: '10:00', // End time before start time
                    description: 'Test description'
                }
            });
            const res = httpMocks.createResponse();

            controller.createEvent(req, res);

            expect(res.statusCode).toBe(400);
            expect(res._getJSONData().message).toBe('Start time must be before end time');
        });
    });

    // Test updateEvent
    describe('updateEvent', () => {
        it('should update an existing event', () => {
            const req = httpMocks.createRequest({
                params: { id: '1' },
                body: {
                    title: 'Updated FIFA World Cup Final',
                    group: 'Football',
                    date: '2023-12-18',
                    start_time: '18:00',
                    end_time: '20:00',
                    description: 'Updated description'
                }
            });
            const res = httpMocks.createResponse();

            controller.updateEvent(req, res);

            expect(res.statusCode).toBe(200);
            const data = res._getJSONData();
            expect(data.title).toBe('Updated FIFA World Cup Final');
            expect(data.description).toBe('Updated description');
        });

        it('should return 404 for non-existent event', () => {
            const req = httpMocks.createRequest({
                params: { id: '999' },
                body: {
                    title: 'Updated Event',
                    group: 'Test Group',
                    date: '2024-08-01',
                    start_time: '10:00',
                    end_time: '12:00',
                    description: 'Test description'
                }
            });
            const res = httpMocks.createResponse();

            controller.updateEvent(req, res);

            expect(res.statusCode).toBe(404);
            expect(res._getJSONData().message).toBe('Event not found');
        });

        it('should validate required fields in update', () => {
            const req = httpMocks.createRequest({
                params: { id: '1' },
                body: {
                    title: 'Updated Event',
                    // Missing other required fields
                }
            });
            const res = httpMocks.createResponse();

            controller.updateEvent(req, res);

            expect(res.statusCode).toBe(400);
            expect(res._getJSONData().message).toBe('All fields are required');
        });

        it('should validate time constraints in update', () => {
            const req = httpMocks.createRequest({
                params: { id: '1' },
                body: {
                    title: 'Updated Event',
                    group: 'Test Group',
                    date: '2024-08-01',
                    start_time: '12:00',
                    end_time: '10:00', // End time before start time
                    description: 'Test description'
                }
            });
            const res = httpMocks.createResponse();

            controller.updateEvent(req, res);

            expect(res.statusCode).toBe(400);
            expect(res._getJSONData().message).toBe('Start time must be before end time');
        });
    });

    // Test deleteEvent
    describe('deleteEvent', () => {
        it('should delete an existing event', () => {
            const req = httpMocks.createRequest({
                params: { id: '1' }
            });
            const res = httpMocks.createResponse();

            controller.deleteEvent(req, res);

            expect(res.statusCode).toBe(204);
        });

        it('should return 404 for non-existent event', () => {
            const req = httpMocks.createRequest({
                params: { id: '999' }
            });
            const res = httpMocks.createResponse();

            controller.deleteEvent(req, res);

            expect(res.statusCode).toBe(404);
            expect(res._getJSONData().message).toBe('Event not found');
        });
    });
});