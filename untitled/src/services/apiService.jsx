import {networkStatus} from "../utils/networkStatus.js";
import {offlineQueue} from "../utils/offlineQueue.js";

const API_URL = "http://localhost:5000/entities";

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
                hasNextPage: end < filtered.length
            }
        };
    }

    try {
        const query = new URLSearchParams({
            ...filters,
            page,
            limit
        }).toString();

        console.log(`Making API request to: ${API_URL}?${query}`);
        const response = await fetch(`${API_URL}?${query}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("API response:", result);

        // Update local storage
        const existingEvents = JSON.parse(localStorage.getItem('events')) || [];
        const newEvents = result.data.filter(newEvent =>
            !existingEvents.some(existingEvent => existingEvent.ID === newEvent.ID)
        );
        localStorage.setItem('events', JSON.stringify([...existingEvents, ...newEvents]));

        return result;
    } catch (error) {
        console.error('Failed to fetch events:', error);
        const localEvents = JSON.parse(localStorage.getItem('events')) || [];
        const filtered = filterEvents(localEvents, filters);
        const start = (page - 1) * limit;
        const end = start + limit;
        return {
            data: filtered.slice(start, end),
            metadata: {
                hasNextPage: end < filtered.length
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
        return Object.entries(filters).every(([key, value]) => {
            if (!value) return true;
            return event[key]?.toString().toLowerCase().includes(value.toLowerCase());
        });
    });
};