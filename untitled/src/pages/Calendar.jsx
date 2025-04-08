import React, {useEffect, useState, useRef, useCallback} from "react";
import EventCard from "../components/EventCard";
import EventModal from "../components/EventModal";
import EventFilters from "../components/EventFilters";
import '../styles/Calendar.css';
import { getEvents, createEvent, updateEvent, deleteEvent } from "../services/apiService.jsx";
import NetworkStatusBar from "../components/NetworkStatusBar.jsx";
import {networkStatus} from "../utils/networkStatus.js";

function Calendar() {
    const [sportsEvents, setSportsEvents] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: '',
        group: '',
        date: '',
        start_time: '',
        end_time: '',
        description: ''
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editingEventId, setEditingEventId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [sortBy, setSortBy] = useState('date');

    // For infinite scrolling
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [eventsPerPage, setEventsPerPage] = useState(5); // Number of items to load per page
    const observer = useRef();
    const loadingTimeoutRef = useRef(null);
    const [localEvents, setLocalEvents] = useState([]);
    const [error, setError] = useState(null);
    const [scrollPosition, setScrollPosition] = useState(0);

    // Initial load
    useEffect(() => {
        fetchInitialEvents();
    }, []);

    const saveScrollPosition = () => {
        setScrollPosition(window.scrollY);
    };

    useEffect(() => {
        return () => {
            if (observer.current) {
                observer.current.disconnect();
            }
            if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (scrollPosition > 0 && !loading) {
            window.scrollTo(0, scrollPosition);
        }
    }, [sportsEvents, loading, scrollPosition]);

    observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasMore) {
            console.log("Last item visible, loading more...");
            setPage(prevPage => prevPage + 1);
        }
    }, {
        root: null,
        rootMargin: '0px 0px 200px 0px', // Load when 200px away from viewport bottom
        threshold: 0.1 // Trigger when at least 10% of the element is visible
    });


    const fetchInitialEvents = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getEvents(1, eventsPerPage, {
                searchTerm,
                month: selectedMonth,
                year: selectedYear,
                sortBy
            });

            if (response && Array.isArray(response.data)) {
                setSportsEvents(response.data);
                setLocalEvents(response.data);
                setHasMore(response.metadata?.hasNextPage || false);
            } else {
                setHasMore(false);
                setError("Invalid data format received");
            }
        } catch (error) {
            console.error("Error fetching initial events:", error);
            setError("Failed to load events. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const lastEventRef = useCallback((node) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    console.log("Loading more events...");
                    setPage((prevPage) => prevPage + 1);
                }
            },
            {
                root: null,
                rootMargin: '0px 0px 200px 0px',
                threshold: 0.1
            }
        );

        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    // Reset page when filters change
    useEffect(() => {
        console.log("Filters changed, resetting page");
        setSportsEvents([]);
        setPage(1);
        setHasMore(true);
        fetchInitialEvents();
    }, [searchTerm, selectedMonth, selectedYear, sortBy, eventsPerPage]);

    useEffect(() => {
        if (page > 1) {
            loadMoreEvents();
        }
    }, [page]);

    const loadMoreEvents = async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        try {
            const response = await getEvents(page, eventsPerPage, {
                searchTerm,
                month: selectedMonth,
                year: selectedYear,
                sortBy
            });

            if (response && Array.isArray(response.data)) {
                setSportsEvents(prev => [...prev, ...response.data]);
                setLocalEvents(prev => [...prev, ...response.data]);
                setHasMore(response.metadata?.hasNextPage || false);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error loading more events:", error);
            setError("Failed to load more events");
        } finally {
            setLoading(false);
        }
    };

    const openModal = () => {
        setIsModalOpen(true);
        setIsEditing(false);
        setNewEvent({
            title: '',
            group: '',
            date: '',
            start_time: '',
            end_time: '',
            description: ''
        });
    };

    const openEditModal = (event) => {
        setIsModalOpen(true);
        setIsEditing(true);
        setEditingEventId(event.ID);
        setNewEvent(event);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setIsEditing(false);
        setEditingEventId(null);
        setNewEvent({
            title: '',
            group: '',
            date: '',
            start_time: '',
            end_time: '',
            description: ''
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewEvent({
            ...newEvent,
            [name]: value
        });
    };

    const saveEvent = async () => {
        if (!validateEvent()) return;

        try {
            if (isEditing) {
                await updateEvent(editingEventId, newEvent);
            } else {
                await createEvent(newEvent);
            }
            // After creating/updating, reset and reload
            setSportsEvents([]);
            setPage(1);
            setHasMore(true);
            fetchInitialEvents();
            closeModal();
        } catch (error) {
            console.error('Error saving event:', error);
            // Optimistic update for offline case
            if (isEditing) {
                const updatedEvents = sportsEvents.map(e =>
                    e.ID === editingEventId ? {...e, ...newEvent} : e
                );
                setSportsEvents(updatedEvents);
                setLocalEvents(updatedEvents);
            } else {
                const newEventWithId = { ...newEvent, ID: Date.now() };
                setSportsEvents([...sportsEvents, newEventWithId]);
                setLocalEvents([...localEvents, newEventWithId]);
            }
            closeModal();
        }
    };

    const removeEvent = async (eventId) => {
        try {
            await deleteEvent(eventId);
            // After deleting, remove from current list
            setSportsEvents(prev => prev.filter(e => e.ID !== eventId));
            setLocalEvents(prev => prev.filter(e => e.ID !== eventId));
        } catch (error) {
            console.error('Error deleting event:', error);
            // Optimistic update for offline case
            setSportsEvents(prev => prev.filter(e => e.ID !== eventId));
            setLocalEvents(prev => prev.filter(e => e.ID !== eventId));
        }
    };

    const convertTimeToMinutes = (time) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const validateEvent = () => {
        if (!newEvent.title || !newEvent.group || !newEvent.date ||
            !newEvent.start_time || !newEvent.end_time || !newEvent.description) {
            alert('Please fill out all fields.');
            return false;
        }

        const startTime = convertTimeToMinutes(newEvent.start_time);
        const endTime = convertTimeToMinutes(newEvent.end_time);

        if (startTime >= endTime) {
            alert('Start time cannot be after or equal to end time.');
            return false;
        }

        return true;
    };

    // Apply filtering and sorting client-side
    const filteredEvents = sportsEvents.filter(event => {
        if (!event) return false; // Safety check

        const matchesSearch = searchTerm ?
            event.title.toLowerCase().includes(searchTerm.toLowerCase()) : true;

        const matchesMonth = selectedMonth ?
            new Date(event.date).getMonth() + 1 === parseInt(selectedMonth) : true;

        const matchesYear = selectedYear ?
            new Date(event.date).getFullYear() === parseInt(selectedYear) : true;

        return matchesSearch && matchesMonth && matchesYear;
    });

    const sortedEvents = [...filteredEvents].sort((a, b) => {
        if (sortBy === 'title') {
            return a.title.localeCompare(b.title);
        } else if (sortBy === 'date') {
            return new Date(a.date) - new Date(b.date);
        } else if (sortBy === 'start_time') {
            return convertTimeToMinutes(a.start_time) - convertTimeToMinutes(b.start_time);
        }
        return 0;
    });

    // Sync with server when connection restored
    useEffect(() => {
        const handleSyncComplete = (status) => {
            if (status.isOnline && status.isServerAvailable) {
                console.log("Network restored, refreshing current events without reset");

                // Instead of resetting everything, just reload the current pages
                const currentPage = page;
                setLoading(true);

                // Create an array of promises for each page we've loaded so far
                const pagePromises = [];
                for (let i = 1; i <= currentPage; i++) {
                    pagePromises.push(getEvents(i, eventsPerPage));
                }

                // Load all pages we've previously viewed
                Promise.all(pagePromises)
                    .then(results => {
                        // Flatten the results array and remove duplicates
                        const allEvents = [];
                        results.forEach(pageData => {
                            if (Array.isArray(pageData)) {
                                pageData.forEach(event => {
                                    if (!allEvents.some(e => e.ID === event.ID)) {
                                        allEvents.push(event);
                                    }
                                });
                            }
                        });

                        // Update with all events without changing page number
                        setSportsEvents(allEvents);
                        setLocalEvents(allEvents);
                    })
                    .catch(err => {
                        console.error("Error refreshing events:", err);
                    })
                    .finally(() => {
                        setLoading(false);
                    });
            }
        };

        networkStatus.addListener(handleSyncComplete);
        return () => networkStatus.removeListener(handleSyncComplete);
    }, [page, eventsPerPage]);  // Add dependencies to access current page and eventsPerPage  // Empty dependency array to ensure it only runs once

    console.log("Current sports events:", sportsEvents);
    console.log("Filtered and sorted events:", sortedEvents);

    return (
        <div>
            <h1>Calendar</h1>

            <NetworkStatusBar />

            <EventFilters
                searchTerm={searchTerm}
                onSearchChange={(e) => setSearchTerm(e.target.value)}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                onMonthChange={(e) => setSelectedMonth(e.target.value)}
                onYearChange={(e) => setSelectedYear(e.target.value)}
                sortBy={sortBy}
                onSortChange={(e) => setSortBy(e.target.value)}
            />

            <button onClick={openModal} className="add-event-button">
                +
            </button>

            <EventModal
                isOpen={isModalOpen}
                onClose={closeModal}
                event={newEvent}
                onChange={handleInputChange}
                onSave={saveEvent}
                isEditing={isEditing}
            />

            {error && <div className="error-message">{error}</div>}

            <ul className="event-list">
                {sortedEvents.length > 0 ? (
                    sortedEvents.map((event, index) => {
                        if (index === sortedEvents.length - 1) {
                            return (
                                <div ref={lastEventRef} key={event.ID}>
                                    <EventCard
                                        event={event}
                                        onEdit={openEditModal}
                                        onDelete={removeEvent}
                                    />
                                </div>
                            );
                        }
                        return (
                            <EventCard
                                key={event.ID}
                                event={event}
                                onEdit={openEditModal}
                                onDelete={removeEvent}
                            />
                        );
                    })
                ) : (
                    <div className="no-events">
                        {loading ? "Loading events..." : "No events found"}
                    </div>
                )}
                {loading && sortedEvents.length > 0 && (
                    <div className="loading">Loading more events...</div>
                )}
                {!loading && !hasMore && sortedEvents.length > 0 && (
                    <div className="end-of-list">End of events</div>
                )}
            </ul>
            <div className="items-per-page">
                <label htmlFor="events-per-page">Items per load: </label>
                <select
                    id="events-per-page"
                    data-testid="events-per-page"
                    value={eventsPerPage}
                    onChange={(e) => {
                        setEventsPerPage(parseInt(e.target.value));
                        setSportsEvents([]);
                        setPage(1);
                        setHasMore(true);
                        setTimeout(() => fetchInitialEvents(), 0);
                    }}
                    className="items-per-page-select"
                >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="15">15</option>
                    <option value="20">20</option>
                </select>
            </div>
        </div>
    );
}

export default Calendar;