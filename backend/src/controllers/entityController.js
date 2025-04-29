// controllers/entityController.js
const fs = require('fs').promises;
const path = require('path');
const Joi = require("joi");
const { faker } = require('@faker-js/faker');

const EVENTS_FILE = path.join(__dirname, 'events.json');

async function loadEvents() {
    try {
        const data = await fs.readFile(EVENTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return generateEvents(20); // Fallback to generating initial events
    }
}

async function saveEvents(events) {
    await fs.writeFile(EVENTS_FILE, JSON.stringify(events, null, 2));
}

// Initialize events array asynchronously
let events;
(async () => {
    events = await loadEvents();
})();

// Rest of the file remains the same
function generateEvents(count) {
    const sportsGroups = [
        'Football', 'Basketball', 'Tennis', 'Cycling', 'Olympics',
        'Cricket', 'Marathon', 'Golf', 'Athletics', 'Formula 1',
        'Motorsport', 'Rugby', 'Baseball', 'Triathlon', 'Extreme Sports',
        'Surfing', 'American Football', 'Swimming', 'Boxing', 'Volleyball'
    ];

    const events = [];
    for (let i = 0; i < count; i++) {
        const startHour = faker.number.int({ min: 6, max: 20 });
        const duration = faker.number.int({ min: 1, max: 6 });
        const endHour = startHour + duration;
        const startTime = `${startHour.toString().padStart(2, '0')}:00`;
        const endTime = `${endHour.toString().padStart(2, '0')}:00`;
        const date = faker.date.future({ years: 2 }).toISOString().split('T')[0];
        const group = faker.helpers.arrayElement(sportsGroups);
        const title = `${faker.number.int({ min: 2023, max: 2025 })} ${group} ${faker.helpers.arrayElement([
            'Championship', 'Cup', 'Tournament', 'Final', 'Series', 'Grand Prix', 'Classic'
        ])}`;
        events.push({
            ID: i + 1,
            start_time: startTime,
            end_time: endTime,
            date: date,
            group: group,
            title: title,
            description: `The ${faker.helpers.arrayElement([
                'premier', 'most prestigious', 'annual', 'biannual', 'world-class'
            ])} ${group.toLowerCase()} event ${faker.helpers.arrayElement([
                'featuring top competitors from around the world',
                'with intense competition',
                'held at a world-famous venue',
                'that determines the world champion'
            ])}.`
        });
    }
    return events;
}

exports.getAllEvents = (req, res) => {
    let filteredEvents = [...events];
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (req.query.title) {
        filteredEvents = filteredEvents.filter(event =>
            event.title.toLowerCase().includes(req.query.title.toLowerCase())
        );
    }
    if (req.query.group) {
        filteredEvents = filteredEvents.filter(event => event.group.toLowerCase() === req.query.group.toLowerCase());
    }
    if (req.query.date) {
        const [year, month] = req.query.date.split('-');
        filteredEvents = filteredEvents.filter(event => {
            const eventDate = new Date(event.date);
            return (
                (month ? eventDate.getMonth() + 1 === parseInt(month, 10) : true) &&
                (year ? eventDate.getFullYear() === parseInt(year, 10) : true)
            );
        });
    }
    if (req.query.month) {
        const month = parseInt(req.query.month, 10);
        filteredEvents = filteredEvents.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.getMonth() + 1 === month;
        });
    }

    if (req.query.sortBy) {
        if (req.query.sortBy === "title") {
            filteredEvents.sort((a, b) => a.title.localeCompare(b.title));
        } else if (req.query.sortBy === "date") {
            filteredEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
        } else if (req.query.sortBy === "start_time") {
            filteredEvents.sort((a, b) => convertTimeToMinutes(a.start_time) - convertTimeToMinutes(b.start_time));
        }
    }

    const totalItems = filteredEvents.length;
    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    const paginatedEvents = filteredEvents.slice(offset, offset + limit);

    res.json({
        data: paginatedEvents,
        metadata: {
            currentPage: page,
            totalPages,
            totalItems,
            hasNextPage,
            hasPreviousPage,
            limit
        }
    });
};

exports.createEvent = async (req, res) => {
    const { title, group, date, start_time, end_time, description } = req.body;
    if (!title || !group || !date || !start_time || !end_time || !description) {
        return res.status(400).json({ message: "All fields are required" });
    }
    if (convertTimeToMinutes(start_time) >= convertTimeToMinutes(end_time)) {
        return res.status(400).json({ message: "Start time must be before end time" });
    }
    const newEvent = { ID: events.length + 1, title, group, date, start_time, end_time, description };
    events.push(newEvent);
    await saveEvents(events);
    res.status(201).json(newEvent);
};

exports.updateEvent = async (req, res) => {
    const eventId = parseInt(req.params.id);
    const index = events.findIndex(e => e.ID === eventId);
    if (index === -1) {
        return res.status(404).json({ message: "Event not found" });
    }
    if (!req.body.title || !req.body.group || !req.body.date ||
        !req.body.start_time || !req.body.end_time || !req.body.description) {
        return res.status(400).json({ message: "All fields are required" });
    }
    if (convertTimeToMinutes(req.body.start_time) >= convertTimeToMinutes(req.body.end_time)) {
        return res.status(400).json({ message: "Start time must be before end time" });
    }
    events[index] = { ...events[index], ...req.body };
    await saveEvents(events);
    res.json(events[index]);
};

exports.deleteEvent = async (req, res) => {
    const eventId = parseInt(req.params.id);
    const index = events.findIndex(e => e.ID === eventId);
    if (index === -1) {
        return res.status(404).json({ message: "Event not found" });
    }
    events.splice(index, 1);
    await saveEvents(events);
    res.status(204).send();
};

function convertTimeToMinutes(time) {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
}