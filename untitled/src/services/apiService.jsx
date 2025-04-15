import {networkStatus} from "../utils/networkStatus.js";
import {offlineQueue} from "../utils/offlineQueue.js";

const SERVER_IP = "10.220.10.194";
const SERVER_PORT = 5000;

const getApiUrl = () => {
    // When running locally on the development machine
    if (window.location.hostname === 'localhost') {
        return "http://localhost:5000/entities";
    }

    // When accessed from another device like the VM
    return `http://${window.location.hostname}:5000/entities`;
};

const API_URL = getApiUrl();

// Get all events with optional filtering and sorting
export const getEvents = async (page = 1, limit = 10, filters = {}) => {
    console.log(`Fetching events: page=${page}, limit=${limit}`);
    const { isOnline, isServerAvailable } = networkStatus.getStatus();

    if (!isOnline || !isServerAvailable) {
        console.log("Offline mode: returning local events");
        const localEvents = JSON.parse(localStorage.getItem('events')) || [];
        const filtered = filterEvents(localEvents, filters);
        const start = (page - 1) * limit;
        const end = start + limit;
        return {
            data: filtered.slice(start, end),
            metadata: {
                hasNextPage: end < filtered.length,
                totalItems: filtered.length,
                currentPage: page,
                totalPages: Math.ceil(filtered.length / limit),
                hasPreviousPage: page > 1,
                limit
            }
        };
    }

    try {
        // Fix query parameters to match backend expectations
        const queryParams = {
            page,
            limit
        };

        // Add filters based on what the backend expects
        if (filters.searchTerm) queryParams.title = filters.searchTerm;
        if (filters.month && filters.year) {
            // Create date filter in YYYY-MM format that backend can use
            const month = filters.month.padStart(2, '0');
            queryParams.date = `${filters.year}-${month}`;
        }
        if (filters.sortBy) queryParams.sortBy = filters.sortBy;

        const query = new URLSearchParams(queryParams).toString();

        console.log(`Making API request to: ${API_URL}?${query}`);
        const response = await fetch(`${API_URL}?${query}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("API response:", result);

        // Keep local storage updated with all fetched events, but don't overwrite
        // existing ones that might contain temporary offline changes
        const existingEvents = JSON.parse(localStorage.getItem('events')) || [];

        // Merge new events with existing events, preferring local events with _isQueued flag
        const mergedEvents = [...existingEvents];

        result.data.forEach(serverEvent => {
            const localIndex = mergedEvents.findIndex(e => e.ID === serverEvent.ID);
            if (localIndex === -1) {
                // Add new event from server
                mergedEvents.push(serverEvent);
            } else if (!mergedEvents[localIndex]._isQueued) {
                // Update existing event if it's not in the queue waiting to be synced
                mergedEvents[localIndex] = serverEvent;
            }
            // Leave queued events untouched
        });

        localStorage.setItem('events', JSON.stringify(mergedEvents));

        return result;
    } catch (error) {
        console.error('Failed to fetch events:', error);
        // Fall back to local events in case of error
        const localEvents = JSON.parse(localStorage.getItem('events')) || [];
        const filtered = filterEvents(localEvents, filters);
        const start = (page - 1) * limit;
        const end = start + limit;
        return {
            data: filtered.slice(start, end),
            metadata: {
                hasNextPage: end < filtered.length,
                totalItems: filtered.length,
                currentPage: page,
                totalPages: Math.ceil(filtered.length / limit),
                hasPreviousPage: page > 1,
                limit
            }
        };
    }
};

// Create a new event
export const createEvent = async (eventData) => {
    const { isOnline, isServerAvailable } = networkStatus.getStatus();
    const tempId = `temp-${Date.now()}`;
    const eventWithTempId = { ...eventData, ID: tempId }; // Changed 'id' to 'ID' for consistency

    // Update local storage immediately
    const localEvents = JSON.parse(localStorage.getItem('events')) || [];
    localStorage.setItem('events', JSON.stringify([...localEvents, eventWithTempId]));

    if (!isOnline || !isServerAvailable) {
        offlineQueue.addOperation({
            type: 'CREATE',
            endpoint: API_URL,
            data: eventData,
            tempId
        });
        return { ...eventData, ID: tempId, _isQueued: true };
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(eventData),
        });
        const createdEvent = await response.json();

        // Update local cache with real ID
        const updatedEvents = localEvents
            .filter(e => e.ID !== tempId)
            .concat(createdEvent);
        localStorage.setItem('events', JSON.stringify(updatedEvents));

        return createdEvent;
    } catch (error) {
        offlineQueue.addOperation({
            type: 'CREATE',
            endpoint: API_URL,
            data: eventData,
            tempId
        });
        console.error('Failed to create event:', error);
        return { ...eventData, ID: tempId, _isQueued: true };
    }
};

// Update an existing event
export const updateEvent = async (id, eventData) => {
    const { isOnline, isServerAvailable } = networkStatus.getStatus();

    // Update local cache immediately
    const localEvents = JSON.parse(localStorage.getItem('events')) || [];
    const updatedEvents = localEvents.map(e =>
        e.ID === id ? { ...e, ...eventData } : e
    );
    localStorage.setItem('events', JSON.stringify(updatedEvents));

    if (!isOnline || !isServerAvailable) {
        offlineQueue.addOperation({
            type: 'UPDATE',
            endpoint: `${API_URL}/${id}`,
            data: eventData,
            id
        });
        return { ...eventData, ID: id, _isQueued: true };
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(eventData),
        });
        return response.json();
    } catch (error) {
        offlineQueue.addOperation({
            type: 'UPDATE',
            endpoint: `${API_URL}/${id}`,
            data: eventData,
            id
        });
        console.error('Failed to update event:', error);
        return { ...eventData, ID: id, _isQueued: true };
    }
};

// Delete an event
export const deleteEvent = async (id) => {
    const { isOnline, isServerAvailable } = networkStatus.getStatus();

    // Update local cache immediately
    const localEvents = JSON.parse(localStorage.getItem('events')) || [];
    localStorage.setItem('events',
        JSON.stringify(localEvents.filter(e => e.ID !== id))
    );

    if (!isOnline || !isServerAvailable) {
        offlineQueue.addOperation({
            type: 'DELETE',
            endpoint: `${API_URL}/${id}`,
            id
        });
        return { ID: id, _isQueued: true };
    }

    try {
        await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        return { ID: id, success: true };
    } catch (error) {
        offlineQueue.addOperation({
            type: 'DELETE',
            endpoint: `${API_URL}/${id}`,
            id
        });
        console.error('Failed to delete event:', error);
        return { ID: id, _isQueued: true };
    }
};

// networkStatus.addListener((status) => {
//     if (status.isOnline && status.isServerAvailable) {
//         console.log("Network restored, syncing data");
//         getEvents().then(events => {
//             localStorage.setItem('events', JSON.stringify(events));
//         });
//     }
// });

const filterEvents = (events, filters) => {
    return events.filter(event => {
        // Filter by search term (title)
        if (filters.searchTerm && !event.title.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
            return false;
        }

        // Filter by month
        if (filters.month) {
            const eventMonth = new Date(event.date).getMonth() + 1;
            if (eventMonth !== parseInt(filters.month)) {
                return false;
            }
        }

        // Filter by year
        if (filters.year) {
            const eventYear = new Date(event.date).getFullYear();
            if (eventYear !== parseInt(filters.year)) {
                return false;
            }
        }

        return true;
    });
};