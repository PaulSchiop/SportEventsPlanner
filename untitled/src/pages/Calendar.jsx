import React, {useEffect, useState} from "react";
import EventCard from "../components/EventCard";
import EventModal from "../components/EventModal";
import EventFilters from "../components/EventFilters";
import '../styles/Calendar.css';
import { getEvents, createEvent, updateEvent, deleteEvent } from "../services/api";

function Calendar() {

    const [sportsEvents, setSportsEvents] = useState([]);

    // State for managing the modal visibility
    const [isModalOpen, setIsModalOpen] = useState(false);

    // State for managing the form data (for adding/editing events)
    const [newEvent, setNewEvent] = useState({
        title: '',
        group: '',
        date: '',
        start_time: '',
        end_time: '',
        description: ''
    });

    // State to track whether the modal is for adding or editing
    const [isEditing, setIsEditing] = useState(false);
    const [editingEventId, setEditingEventId] = useState(null); // Track which event is being edited

    // State for search filter
    const [searchTerm, setSearchTerm] = useState('');

    // State for month filter
    const [selectedMonth, setSelectedMonth] = useState('');

    // State for year filter
    const [selectedYear, setSelectedYear] = useState('');

    // State for sorting
    const [sortBy, setSortBy] = useState('date'); // Default sorting by date

    //States for pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [eventsPerPage, setEventsPerPage] = useState(5); // Default 5 items per page

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedMonth, selectedYear, sortBy, eventsPerPage]);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        const data = await getEvents();
        setSportsEvents(data);
        console.log('Api data: ', data);
    };


    // Function to open the modal for adding a new event
    const openModal = () => {
        setIsModalOpen(true);
        setIsEditing(false); // Set to "add" mode
        setNewEvent({
            title: '',
            group: '',
            date: '',
            start_time: '',
            end_time: '',
            description: ''
        });
    };

    // Function to open the modal for editing an existing event
    const openEditModal = (event) => {
        setIsModalOpen(true);
        setIsEditing(true); // Set to "edit" mode
        setEditingEventId(event.ID); // Track the event being edited
        setNewEvent(event); // Pre-fill the form with the event's data
    };

    // Function to close the modal
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

    // Function to handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewEvent({
            ...newEvent,
            [name]: value
        });
    };

    // Function to validate and add/edit an event
    const saveEvent = async () => {
        if (!newEvent.title || !newEvent.group || !newEvent.date || !newEvent.start_time || !newEvent.end_time || !newEvent.description) {
            alert('Please fill out all fields.');
            return;
        }

        const startTime = convertTimeToMinutes(newEvent.start_time);
        const endTime = convertTimeToMinutes(newEvent.end_time);

        if (startTime >= endTime) {
            alert('Start time cannot be after or equal to end time.');
            return;
        }

        if (isEditing) {
            await updateEvent(editingEventId, newEvent);
        } else {
            await createEvent(newEvent);
        }

        fetchEvents(); // Refresh event list after API call
        closeModal();
    };

    const removeEvent = async (eventId) => {
        await deleteEvent(eventId);
        fetchEvents(); // Refresh event list after API call
    };

    const convertTimeToMinutes = (time) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const filteredEvents = sportsEvents.filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesMonth = selectedMonth ? new Date(event.date).getMonth() + 1 === parseInt(selectedMonth) : true;
        const matchesYear = selectedYear ? new Date(event.date).getFullYear() === parseInt(selectedYear) : true;
        return matchesSearch && matchesMonth && matchesYear;
    });

    const sortedEvents = filteredEvents.sort((a, b) => {
        if (sortBy === 'title') {
            return a.title.localeCompare(b.title);
        } else if (sortBy === 'date') {
            return new Date(a.date) - new Date(b.date);
        } else if (sortBy === 'start_time') {
            return convertTimeToMinutes(a.start_time) - convertTimeToMinutes(b.start_time);
        }
        return 0;
    });

    // Get current events
    const indexOfLastEvent = currentPage * eventsPerPage;
    const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
    const currentEvents = sortedEvents.slice(indexOfFirstEvent, indexOfLastEvent);
    const totalPages = Math.ceil(sortedEvents.length / eventsPerPage);

    // Change page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);
    const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
    const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

    // Handle events per page change
    const handleEventsPerPageChange = (e) => {
        setEventsPerPage(parseInt(e.target.value));
    };

    return (
        <div>
            <h1>Calendar</h1>

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

            <ul className="event-list" data-testid="event-list">
                {currentEvents.map(event => (
                    <EventCard
                        key={event.ID}
                        event={event}
                        onEdit={openEditModal}
                        onDelete={removeEvent}
                    />
                ))}
            </ul>

            <div className="pagination-controls">
                <div className="items-per-page">
                    <label htmlFor="events-per-page">Items per page: </label>
                    <select
                        id="events-per-page"
                        data-testid="events-per-page"
                        value={eventsPerPage}
                        onChange={handleEventsPerPageChange}
                        className="items-per-page-select"
                    >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="15">15</option>
                        <option value="20">20</option>
                    </select>
                </div>

                {totalPages > 1 && (
                    <div className="pagination">
                        <button
                            onClick={prevPage}
                            disabled={currentPage === 1}
                            className="pagination-button"
                        >
                            Previous
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                            <button
                                key={number}
                                onClick={() => paginate(number)}
                                className={`pagination-button ${currentPage === number ? 'active' : ''}`}
                            >
                                {number}
                            </button>
                        ))}

                        <button
                            onClick={nextPage}
                            disabled={currentPage === totalPages}
                            className="pagination-button"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Calendar;