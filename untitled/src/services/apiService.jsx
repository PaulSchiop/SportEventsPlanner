import {networkStatus} from "../utils/networkStatus.js";
import {offlineQueue} from "../utils/offlineQueue.js";

const getApiUrl = () => {
    return `http://${window.location.hostname}:5000/entities`;
};

const API_URL = getApiUrl();
const THREAD_API_URL = `http://${window.location.hostname}:5000/api/thread`;
let socket = null;
let eventListeners = [];

// Simplified data handling
const updateLocalStorage = (newEvents, replaceMode = false) => {
    const localEvents = replaceMode ? [] : JSON.parse(localStorage.getItem('events')) || [];

    // Simple merge strategy
    const mergedEvents = [...localEvents];
    newEvents.forEach(newEvent => {
        const existingIndex = mergedEvents.findIndex(e => e.ID === newEvent.ID);
        if (existingIndex === -1) {
            mergedEvents.push(newEvent);
        } else if (!mergedEvents[existingIndex]._isQueued) {
            mergedEvents[existingIndex] = newEvent;
        }
    });

    localStorage.setItem('events', JSON.stringify(mergedEvents));
    return mergedEvents;
};

// Core API functions
export const getEvents = async (page = 1, limit = 10, filters = {}) => {
    const { isOnline, isServerAvailable } = networkStatus.getStatus();

    // Offline mode - return filtered local data
    if (!isOnline || !isServerAvailable) {
        const localEvents = JSON.parse(localStorage.getItem('events')) || [];
        const filtered = filterEvents(localEvents, filters);
        return paginateData(filtered, page, limit);
    }

    // Online mode - fetch from API
    try {
        const queryParams = buildQueryParams(page, limit, filters);
        const response = await fetch(`${API_URL}?${queryParams}`);

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const result = await response.json();
        updateLocalStorage(result.data);
        return result;
    } catch (error) {
        console.error('Failed to fetch events:', error);
        return fallbackToLocalData(page, limit, filters);
    }
};

export const createEvent = async (eventData) => {
    const tempId = `temp-${Date.now()}`;
    const eventWithTempId = { ...eventData, ID: tempId, _isQueued: !networkStatus.getStatus().isServerAvailable };

    // Optimistic update
    updateLocalStorage([eventWithTempId]);

    // Handle offline case
    if (!networkStatus.getStatus().isServerAvailable) {
        offlineQueue.addOperation({
            type: 'CREATE',
            endpoint: API_URL,
            data: eventData,
            tempId
        });
        return eventWithTempId;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Failed to create event:', error);
        return eventWithTempId;
    }
};

export const updateEvent = async (id, eventData) => {
    // Optimistic update
    const updatedEvent = { ...eventData, ID: id, _isQueued: !networkStatus.getStatus().isServerAvailable };
    updateLocalStorage([updatedEvent]);

    if (!networkStatus.getStatus().isServerAvailable) {
        offlineQueue.addOperation({
            type: 'UPDATE',
            endpoint: `${API_URL}/${id}`,
            data: eventData
        });
        return updatedEvent;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Failed to update event:', error);
        return updatedEvent;
    }
};

export const deleteEvent = async (id) => {
    // Optimistic delete
    const localEvents = JSON.parse(localStorage.getItem('events')) || [];
    localStorage.setItem('events', JSON.stringify(localEvents.filter(e => e.ID !== id)));

    if (!networkStatus.getStatus().isServerAvailable) {
        offlineQueue.addOperation({
            type: 'DELETE',
            endpoint: `${API_URL}/${id}`
        });
        return { ID: id, _isQueued: true };
    }

    try {
        await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        return { ID: id, success: true };
    } catch (error) {
        console.error('Failed to delete event:', error);
        return { ID: id, _isQueued: true };
    }
};

export const initWebSocket = (onMessage) => {
    if (socket) return;

    socket = new WebSocket(`ws://${window.location.hostname}:5000`);

    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'NEW_ENTITY') {
                //const updatedEvents = updateLocalStorage([data.data]);
                if (onMessage) {
                    onMessage(data.data); // Pass just the new event data
                }
            }
        } catch (error) {
            console.error('Error processing WebSocket message:', error);
        }
    };

    socket.onopen = () => {
        console.log("WebSocket connection established");
    };

    socket.onclose = () => {
        console.log("WebSocket connection closed");
        socket = null;
    };

    socket.onerror = (error) => {
        console.error("WebSocket error:", error);
    };

    if (onMessage) {
        eventListeners.push(onMessage);
    }
}

export const removeWebSocketListener = (listener) => {
    eventListeners = eventListeners.filter(cb => cb !== listener);
};

export const startGenerationThread = async () => {
    try {
        const response = await fetch(`${THREAD_API_URL}/start`, {
            method: 'POST'
        });
        if(!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        return await response.json();
    } catch (error) {
        console.error('Failed to start thread:', error);
        throw error;
    }
};

export const stopGenerationThread = async () => {
    try {
        const response = await fetch(`${THREAD_API_URL}/stop`, {
            method: 'POST'
        });
        if (!response.ok) {
            throw new Error(`Failed to start thread: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to stop thread:', error);
        throw error;
    }
};

const buildQueryParams = (page, limit, filters) => {
    const params = { page, limit };

    if (filters.searchTerm) {
        params.title = filters.searchTerm;
    }

    if (filters.date) {
        // Use specific date if provided
        params.date = filters.date;
    } else if (filters.month && filters.year) {
        // Combine month and year into a single date parameter
        params.date = `${filters.year}-${filters.month.toString().padStart(2, '0')}`;
    } else if (filters.year) {
        // Use only the year if no month is provided
        params.date = `${filters.year}`;
    }
    //filter by month if year not provided
    if (filters.month && !filters.year) {
        params.month = filters.month.toString().padStart(2, '0');
    }

    if (filters.sortBy) {
        params.sortBy = filters.sortBy;
    }

    // Remove undefined or null values
    Object.keys(params).forEach(key => {
        if (params[key] == null) {
            delete params[key];
        }
    });

    return new URLSearchParams(params).toString();
};

const paginateData = (data, page, limit) => {
    const start = (page - 1) * limit;
    const end = start + limit;
    return {
        data: data.slice(start, end),
        metadata: {
            hasNextPage: end < data.length,
            totalItems: data.length,
            currentPage: page,
            totalPages: Math.ceil(data.length / limit),
            hasPreviousPage: page > 1,
            limit
        }
    };
};

const fallbackToLocalData = (page, limit, filters) => {
    const localEvents = JSON.parse(localStorage.getItem('events')) || [];
    const filtered = filterEvents(localEvents, filters);
    return paginateData(filtered, page, limit);
};

const filterEvents = (events, filters) => {
    return events.filter(event => {
        if (!event) return false;

        const eventDate = new Date(event.date); // Ensure proper date parsing
        const eventMonth = eventDate.getMonth() + 1; // Months are 0-indexed
        const eventYear = eventDate.getFullYear();

        console.log('Event:', event, 'date', eventDate);

        const matchesSearch = !filters.searchTerm ||
            event.title.toLowerCase().includes(filters.searchTerm.toLowerCase());

        const matchesMonth = !filters.month || eventMonth === parseInt(filters.month, 10);

        const matchesYear = !filters.year || eventYear === parseInt(filters.year, 10);

        return matchesSearch && matchesMonth && matchesYear;
    });
};