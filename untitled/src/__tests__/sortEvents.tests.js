import { sortEvents } from '../utils/sortEvents.js';

describe('sortEvents', () => {
    const events = [
        {
            ID: 1,
            title: 'Event B',
            date: '2024-02-11',
            start_time: '18:30',
        },
        {
            ID: 2,
            title: 'Event A',
            date: '2024-01-01',
            start_time: '10:00',
        },
        {
            ID: 3,
            title: 'Event C',
            date: '2024-03-15',
            start_time: '12:00',
        },
    ];

    test('sorts events by title', () => {
        const sortedEvents = sortEvents([...events], 'title');
        expect(sortedEvents[0].title).toBe('Event A');
        expect(sortedEvents[1].title).toBe('Event B');
        expect(sortedEvents[2].title).toBe('Event C');
    });

    test('sorts events by date', () => {
        const sortedEvents = sortEvents([...events], 'date');
        expect(sortedEvents[0].date).toBe('2024-01-01');
        expect(sortedEvents[1].date).toBe('2024-02-11');
        expect(sortedEvents[2].date).toBe('2024-03-15');
    });

    test('sorts events by start time', () => {
        const sortedEvents = sortEvents([...events], 'start_time');
        expect(sortedEvents[0].start_time).toBe('10:00');
        expect(sortedEvents[1].start_time).toBe('12:00');
        expect(sortedEvents[2].start_time).toBe('18:30');
    });
});