const Joi = require("joi");

// let events = [
//     {
//         ID: 1,
//         start_time: '18:00',
//         end_time: '20:00',
//         date: '2023-12-18',
//         group: 'Football',
//         title: '2023 FIFA World Cup Final',
//         description: 'The final match of the 2023 FIFA World Cup.'
//     },
//     {
//         ID: 2,
//         start_time: '18:30',
//         end_time: '22:00',
//         date: '2024-02-11',
//         group: 'American Football',
//         title: 'Super Bowl LVIII',
//         description: 'The championship game of the NFL season.'
//     },
//     {
//         ID: 3,
//         start_time: '20:00',
//         end_time: '23:00',
//         date: '2024-06-20',
//         group: 'Basketball',
//         title: 'NBA Finals Game 7',
//         description: 'The decisive game of the NBA Finals.'
//     },
//     {
//         ID: 4,
//         start_time: '10:00',
//         end_time: '18:00',
//         date: '2024-07-01',
//         group: 'Tennis',
//         title: 'Wimbledon Championships',
//         description: 'The oldest and most prestigious tennis tournament.'
//     },
//     {
//         ID: 5,
//         start_time: '08:00',
//         end_time: '17:00',
//         date: '2024-07-06',
//         group: 'Cycling',
//         title: 'Tour de France',
//         description: 'The world\'s most famous cycling race.'
//     },
//     {
//         ID: 6,
//         start_time: '19:00',
//         end_time: '22:00',
//         date: '2024-07-26',
//         group: 'Olympics',
//         title: 'Olympic Games Opening Ceremony',
//         description: 'The opening ceremony of the 2024 Summer Olympics.'
//     },
//     {
//         ID: 7,
//         start_time: '11:00',
//         end_time: '19:00',
//         date: '2024-08-26',
//         group: 'Tennis',
//         title: 'US Open Tennis Championship',
//         description: 'One of the four Grand Slam tennis tournaments.'
//     },
//     {
//         ID: 8,
//         start_time: '14:00',
//         end_time: '18:00',
//         date: '2023-11-19',
//         group: 'Cricket',
//         title: 'ICC Cricket World Cup Final',
//         description: 'The final match of the 2023 ICC Cricket World Cup.'
//     },
//     {
//         ID: 9,
//         start_time: '09:00',
//         end_time: '15:00',
//         date: '2024-04-15',
//         group: 'Marathon',
//         title: 'Boston Marathon',
//         description: 'The world\'s oldest annual marathon.'
//     },
//     {
//         ID: 10,
//         start_time: '20:00',
//         end_time: '23:00',
//         date: '2024-06-01',
//         group: 'Football',
//         title: 'UEFA Champions League Final',
//         description: 'The final match of Europe\'s premier club football tournament.'
//     },
//     {
//         ID: 11,
//         start_time: '10:00',
//         end_time: '18:00',
//         date: '2024-01-14',
//         group: 'Tennis',
//         title: 'Australian Open Tennis',
//         description: 'The first Grand Slam tennis tournament of the year.'
//     },
//     {
//         ID: 12,
//         start_time: '12:00',
//         end_time: '18:00',
//         date: '2024-09-27',
//         group: 'Golf',
//         title: 'Ryder Cup Golf Tournament',
//         description: 'A biennial golf competition between Europe and the USA.'
//     },
//     {
//         ID: 13,
//         start_time: '09:00',
//         end_time: '17:00',
//         date: '2024-08-22',
//         group: 'Athletics',
//         title: 'World Athletics Championships',
//         description: 'The premier global competition for track and field athletes.'
//     },
//     {
//         ID: 14,
//         start_time: '14:00',
//         end_time: '17:00',
//         date: '2024-05-26',
//         group: 'Formula 1',
//         title: 'Monaco Grand Prix',
//         description: 'One of the most prestigious Formula 1 races.'
//     },
//     {
//         ID: 15,
//         start_time: '12:00',
//         end_time: '16:00',
//         date: '2024-05-26',
//         group: 'Motorsport',
//         title: 'Indianapolis 500',
//         description: 'The world\'s most famous car race.'
//     },
//     {
//         ID: 16,
//         start_time: '15:00',
//         end_time: '18:00',
//         date: '2023-10-28',
//         group: 'Rugby',
//         title: 'Rugby World Cup Final',
//         description: 'The final match of the 2023 Rugby World Cup.'
//     },
//     {
//         ID: 17,
//         start_time: '19:00',
//         end_time: '22:00',
//         date: '2024-10-30',
//         group: 'Baseball',
//         title: 'World Series Game 7',
//         description: 'The decisive game of the MLB World Series.'
//     },
//     {
//         ID: 18,
//         start_time: '06:00',
//         end_time: '17:00',
//         date: '2024-10-12',
//         group: 'Triathlon',
//         title: 'Ironman World Championship',
//         description: 'The most famous triathlon competition in the world.'
//     },
//     {
//         ID: 19,
//         start_time: '10:00',
//         end_time: '16:00',
//         date: '2024-01-25',
//         group: 'Extreme Sports',
//         title: 'Winter X Games',
//         description: 'An extreme sports event featuring snowboarding, skiing, and more.'
//     },
//     {
//         ID: 20,
//         start_time: '08:00',
//         end_time: '14:00',
//         date: '2024-12-20',
//         group: 'Surfing',
//         title: 'World Surf League Championship',
//         description: 'The final event of the World Surf League season.'
//     }
// ];

const { faker } = require('@faker-js/faker');

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

const events = generateEvents(1);
console.log(JSON.stringify(events, null, 2));

// Get all events with optional filtering, sorting, and pagination
exports.getAllEvents = (req, res) => {
    let filteredEvents = [...events];
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Filtering by title, group, or date
    if (req.query.title) {
        filteredEvents = filteredEvents.filter(event =>
            event.title.toLowerCase().includes(req.query.title.toLowerCase())
        );
    }
    if (req.query.group) {
        filteredEvents = filteredEvents.filter(event => event.group.toLowerCase() === req.query.group.toLowerCase());
    }
    if (req.query.date) {
        const [year, month] = req.query.date.split('-'); // Extract year and month from query
        filteredEvents = filteredEvents.filter(event => {
            const eventDate = new Date(event.date);
            return (
                (month ? eventDate.getMonth() + 1 === parseInt(month, 10) : true) &&
                (year ? eventDate.getFullYear() === parseInt(year, 10) : true)// Check month if provided
            );
        });
    }
    if (req.query.month) {
        const month = parseInt(req.query.month, 10);
        filteredEvents = filteredEvents.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.getMonth() + 1 === month; // Match month across all years
        });
    }

    // Sorting (default: by date)
    if (req.query.sortBy) {
        if (req.query.sortBy === "title") {
            filteredEvents.sort((a, b) => a.title.localeCompare(b.title));
        } else if (req.query.sortBy === "date") {
            filteredEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
        } else if (req.query.sortBy === "start_time") {
            filteredEvents.sort((a, b) => convertTimeToMinutes(a.start_time) - convertTimeToMinutes(b.start_time));
        }
    }

    // Calculate pagination metadata
    const totalItems = filteredEvents.length;
    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // Apply pagination
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

// Create a new event with validation
exports.createEvent = (req, res) => {
    const { title, group, date, start_time, end_time, description } = req.body;

    // Server-side validation
    if (!title || !group || !date || !start_time || !end_time || !description) {
        return res.status(400).json({ message: "All fields are required" });
    }

    if (convertTimeToMinutes(start_time) >= convertTimeToMinutes(end_time)) {
        return res.status(400).json({ message: "Start time must be before end time" });
    }

    const newEvent = { ID: events.length + 1, title, group, date, start_time, end_time, description };
    events.push(newEvent);
    res.status(201).json(newEvent);
};

// Update an existing event with validation
exports.updateEvent = (req, res) => {
    const eventId = parseInt(req.params.id);
    const index = events.findIndex(e => e.ID === eventId);
    if (index === -1) {
        return res.status(404).json({ message: "Event not found" });
    }

    // Validate required fields in the update request
    if (!req.body.title || !req.body.group || !req.body.date || 
        !req.body.start_time || !req.body.end_time || !req.body.description) {
        return res.status(400).json({ message: "All fields are required" });
    }

    // Validate time constraints
    if (convertTimeToMinutes(req.body.start_time) >= convertTimeToMinutes(req.body.end_time)) {
        return res.status(400).json({ message: "Start time must be before end time" });
    }

    // Update the event
    events[index] = { ...events[index], ...req.body };
    res.json(events[index]);
};

// Delete an event
exports.deleteEvent = (req, res) => {
    const eventId = parseInt(req.params.id);
    const index = events.findIndex(e => e.ID === eventId);
    if (index === -1) {
        return res.status(404).json({ message: "Event not found" });
    }

    events.splice(index, 1);
    res.status(204).send();
};

// Helper function to convert time to minutes
function convertTimeToMinutes(time) {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
}