const API_URL = "http://localhost:5000/entities";

// Get all events with optional filtering and sorting
export const getEvents = async (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_URL}?${query}`);
    return response.json();
};

// Create a new event
export const createEvent = async (eventData) => {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
    });
    return response.json();
};

// Update an existing event
export const updateEvent = async (id, eventData) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
    });
    return response.json();
};

// Delete an event
export const deleteEvent = async (id) => {
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
};
