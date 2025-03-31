export const sortEvents = (events, sortBy) => {
    return events.sort((a, b) => {
        if (sortBy === 'title') {
            return a.title.localeCompare(b.title); // Sort by title (A-Z)
        } else if (sortBy === 'date') {
            return new Date(a.date) - new Date(b.date); // Sort by date (earliest first)
        } else if (sortBy === 'start_time') {
            return convertTimeToMinutes(a.start_time) - convertTimeToMinutes(b.start_time); // Sort by start time
        }
        return 0; // Default: no sorting
    });
};

const convertTimeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};