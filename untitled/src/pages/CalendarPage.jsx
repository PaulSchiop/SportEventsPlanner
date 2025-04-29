import React, {useState, useEffect, useRef, useCallback} from 'react';
import { getEvents, createEvent, updateEvent, deleteEvent,   initWebSocket,
    removeWebSocketListener, startGenerationThread, stopGenerationThread  } from '../services/apiService';
import '../styles/Calendar.css';
import NetworkStatusBar from '../components/NetworkStatusBar';
import EventModal from '../components/EventModal';
import EventFilters from '../components/EventFilters';
import EventsList from '../components/EventsList';
import CalendarWidget from "../components/CalendarWidget.jsx";
import FileUpload from '../components/FileUpload';
import '../styles/FileUpload.css';
import {getFileUrl} from "../services/fileService.jsx";

// Add this function to your fileService.jsx and import it here
const getUploadedFiles = async () => {
    try {
        const response = await fetch(`http://${window.location.hostname}:5000/api/files`);

        if (!response.ok) {
            throw new Error(`Failed to fetch files: ${response.statusText}`);
        }

        const files = await response.json();
        return files;
    } catch (error) {
        console.error("Error fetching files:", error);
        throw error;
    }
};

function CalendarPage() {
    // State declarations
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: '',
        group: '',
        date: '',
        start_time: '',
        end_time: '',
        description: ''
    });
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [page, setPage] = useState(1);
    const [eventsPerPage, setEventsPerPage] = useState(10);
    const [hasMore, setHasMore] = useState(true);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);
    const lastEventRef = useRef();
    const observer = useRef();

    //Generating thread
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedEvents, setGeneratedEvents] = useState([]);

    // Auto-fetch uploaded files on component mount
    useEffect(() => {
        const fetchUploadedFiles = async () => {
            setIsLoadingFiles(true);
            try {
                const files = await getUploadedFiles();
                console.log("Fetched files from server:", files);

                // Enhance file objects with mimetype guess based on extension
                const enhancedFiles = files.map(file => {
                    const extension = file.filename.split('.').pop().toLowerCase();
                    const videoExtensions = ['mp4', 'mov', 'avi', 'webm', 'mkv', 'wmv', 'flv'];

                    return {
                        ...file,
                        // Add mimetype if it doesn't exist
                        mimetype: file.mimetype || (videoExtensions.includes(extension) ? 'video/mp4' : 'application/octet-stream'),
                        // Add originalname if it doesn't exist
                        originalname: file.originalname || file.filename
                    };
                });

                setUploadedFiles(enhancedFiles);
            } catch (error) {
                console.error("Failed to fetch uploaded files:", error);
                // Optionally set an error state here
            } finally {
                setIsLoadingFiles(false);
            }
        };

        fetchUploadedFiles();
    }, []); // Empty dependency array means this runs once on component mount

    // Set up intersection observer for infinite scroll
    useEffect(() => {
        if (loading) return;

        if (observer.current) observer.current.disconnect();

        const handleObserver = entries => {
            const [entry] = entries;
            if (entry.isIntersecting && hasMore) {
                console.log("Last item visible, loading more...");
                setPage(prevPage => prevPage + 1);
            }
        };

        observer.current = new IntersectionObserver(handleObserver, {
            root: null,
            rootMargin: '0px 0px 200px 0px',
            threshold: 0.1
        });

        if (lastEventRef.current) {
            observer.current.observe(lastEventRef.current);
        }

        // Check if we need to load more items immediately (when initial data doesn't fill the screen)
        if (lastEventRef.current && isElementInViewport(lastEventRef.current) && hasMore && !loading) {
            console.log("Last item already visible on load, loading more items...");
            setPage(prevPage => prevPage + 1);
        }

        return () => {
            if (observer.current) observer.current.disconnect();
        };
    }, [loading, hasMore, events.length]);

    const isElementInViewport = (el) => {
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    };

    // Load more events when page changes
    useEffect(() => {
        if (page > 1) {
            loadMoreEvents();
        }
    }, [page]);

    const resetToFirstPage = () => {
        // Reset to first page and scroll to top
        setPage(1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Refetch first page events
        fetchEvents(1).catch(err => console.error('Error fetching events:', err));
    };

// Add a useEffect to detect when we've reached the end
    useEffect(() => {
        if (!loading && !hasMore && events.length > 0 && page > 1) {
            // Wait a bit to allow the user to see the "returning to beginning" message
            const timer = setTimeout(() => {
                resetToFirstPage();
            }, 2000); // Wait 2 seconds before resetting

            return () => clearTimeout(timer);
        }
    }, [loading, hasMore, events.length, page]);

    // WebSocket connection
    useEffect(() => {
        const handleNewEvent = (updatedEvents) => {
            // Check if this is a single event or array of events
            const newEvent = Array.isArray(updatedEvents) ? updatedEvents[updatedEvents.length - 1] : updatedEvents;

            // Add to generated events counter
            setGeneratedEvents(prev => [...prev, newEvent]);

            // Check if the new event matches current filters before adding to main list
            const shouldAddToMainList = matchesCurrentFilters(newEvent);

            if (shouldAddToMainList) {
                setEvents(prev => [...prev, newEvent]);
            }
        };

        // Helper function to check if event matches current filters
        const matchesCurrentFilters = (event) => {
            if (searchTerm && !event.title.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
            }

            if (selectedMonth || selectedYear) {
                const eventDate = new Date(event.date);
                const eventMonth = eventDate.getMonth() + 1;
                const eventYear = eventDate.getFullYear();

                if (selectedMonth && eventMonth !== parseInt(selectedMonth, 10)) {
                    return false;
                }

                if (selectedYear && eventYear !== parseInt(selectedYear, 10)) {
                    return false;
                }
            }

            return true;
        };

        initWebSocket(handleNewEvent);

        return () => {
            removeWebSocketListener(handleNewEvent);
        };
    }, [searchTerm, selectedMonth, selectedYear]);

    const fetchEvents = useCallback(async (pageNum = 1) => {
        setLoading(true);
        console.log("Fetching events with filters: ", { searchTerm, selectedMonth, selectedYear, sortBy });
        try {
            const filters = {
                searchTerm,
                month: selectedMonth,
                year: selectedYear,
                sortBy
            };
            console.log("Filters: ", filters);
            const response = await getEvents(pageNum, eventsPerPage, filters);
            console.log("Fetched events: ", response.data);
            setEvents(response.data);
            setHasMore(response.metadata.hasNextPage);
        } catch (err) {
            setError('Failed to fetch events. Please try again later.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, selectedMonth, selectedYear, sortBy, eventsPerPage]);

    const loadMoreEvents = async () => {
        if (!hasMore || loading) return;

        setLoading(true);
        try {
            const filters = {
                searchTerm,
                month: selectedMonth,
                year: selectedYear,
                sortBy
            };
            const response = await getEvents(page, eventsPerPage, filters);
            setEvents(prevEvents => [...prevEvents, ...response.data]);
            setHasMore(response.metadata.hasNextPage);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Load events on initial render
    useEffect(() => {
        fetchEvents().catch(err => console.error('Error fetching events:', err));
    }, [fetchEvents]);

    // Filter events when search or filters change
    useEffect(() => {
        if (searchTerm || selectedMonth || selectedYear) {
            setPage(1);
            console.log("Filter applied");
            fetchEvents(1).catch(err => console.error('Error fetching filtered events:', err));
        }
    }, [searchTerm, selectedMonth, selectedYear, sortBy, fetchEvents]);

    const openModal = () => {
        setIsEditing(false);
        setNewEvent({
            title: '',
            group: '',
            date: '',
            start_time: '',
            end_time: '',
            description: ''
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const openEditModal = (event) => {
        setIsEditing(true);
        setNewEvent(event);
        setIsModalOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewEvent(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const saveEvent = async () => {
        try {
            if (isEditing) {
                await updateEvent(newEvent.ID, newEvent);
                setEvents(prevEvents =>
                    prevEvents.map(e => e.ID === newEvent.ID ? newEvent : e)
                );
            } else {
                const createdEvent = await createEvent(newEvent);
                setEvents(prevEvents => [...prevEvents, createdEvent]);
            }
            setIsModalOpen(false);
        } catch (err) {
            console.error('Error saving event:', err);
        }
    };

    const removeEvent = async (id) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            try {
                await deleteEvent(id);
                setEvents(prevEvents => prevEvents.filter(event => event.ID !== id));
            } catch (err) {
                console.error('Error deleting event:', err);
            }
        }
    };

    const handleDateChange = async (date) => {
        setSelectedDate(date);

        // Format date as YYYY-MM-DD
        const formattedDate = date.getFullYear() + '-' +
            String(date.getMonth() + 1).padStart(2, '0') + '-' +
            String(date.getDate()).padStart(2, '0');

        // Update month/year filters
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        setSelectedMonth(month.toString());
        setSelectedYear(year.toString());

        setLoading(true);
        try {
            // Create a specific date filter
            const filters = {
                searchTerm,
                date: formattedDate,
                sortBy
            };

            // Reset page and fetch events with the date filter
            setPage(1);
            const response = await getEvents(1, eventsPerPage, filters);
            setEvents(response.data);
            setHasMore(response.metadata.hasNextPage);
        } catch (err) {
            setError('Failed to fetch events for the selected date.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleStartGeneration = async () => {
        try {
            await startGenerationThread();
            setIsGenerating(true);
        } catch (error) {
            console.error('Error starting generation:', error);
        }
    };

    const handleStopGeneration = async () => {
        try {
            await stopGenerationThread();
            setIsGenerating(false);
        } catch (error) {
            console.error('Error stopping generation:', error);
        }
    };

    // Function to refresh the list of uploaded files
    const refreshUploadedFiles = async () => {
        setIsLoadingFiles(true);
        try {
            const files = await getUploadedFiles();
            // Enhance file objects with mimetype based on extension
            const enhancedFiles = files.map(file => {
                const extension = file.filename.split('.').pop().toLowerCase();
                const videoExtensions = ['mp4', 'mov', 'avi', 'webm', 'mkv', 'wmv', 'flv'];

                return {
                    ...file,
                    // Add mimetype if it doesn't exist
                    mimetype: file.mimetype || (videoExtensions.includes(extension) ? 'video/mp4' : 'application/octet-stream'),
                    // Add originalname if it doesn't exist
                    originalname: file.originalname || file.filename
                };
            });

            setUploadedFiles(enhancedFiles);
        } catch (error) {
            console.error("Failed to refresh uploaded files:", error);
        } finally {
            setIsLoadingFiles(false);
        }
    };

    // Apply sorting
    const sortedEvents = [...events].sort((a, b) => {
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        if (sortBy === 'date') return new Date(a.date) - new Date(b.date);
        return 0;
    });

    // Render function
    return (
        <div className="calendar-container">
            <header className="calendar-header">
                <h1>Calendar</h1>
                <button onClick={openModal} className="add-event-button">+</button>
            </header>

            <NetworkStatusBar />

            <EventFilters
                searchTerm={searchTerm}
                onSearchChange={(e) => setSearchTerm(e.target.value)}
                selectedMonth={selectedMonth}
                onMonthChange={(e) => setSelectedMonth(e.target.value)}
                selectedYear={selectedYear}
                onYearChange={(e) => setSelectedYear(e.target.value)}
                sortBy={sortBy}
                onSortChange={(e) => setSortBy(e.target.value)}
            />

            <div className="generation-controls">
                <button
                    onClick={handleStartGeneration}
                    disabled={isGenerating}
                    className="control-button start-button"
                >
                    Start Auto-Generation
                </button>
                <button
                    onClick={handleStopGeneration}
                    disabled={!isGenerating}
                    className="control-button stop-button"
                >
                    Stop Auto-Generation
                </button>
                {isGenerating && (
                    <div className="generation-status">
                        Generating events... {generatedEvents.length} created
                    </div>
                )}
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="calendar-layout">
                <div className="calendar-left-column">
                    <EventsList
                        events={sortedEvents}
                        loading={loading}
                        hasMore={hasMore}
                        lastEventRef={lastEventRef}
                        onEdit={openEditModal}
                        onDelete={removeEvent}
                    />

                    <div className="items-per-page">
                        <label htmlFor="events-per-page">Items per load: </label>
                        <select
                            id="events-per-page"
                            value={eventsPerPage}
                            onChange={(e) => setEventsPerPage(Number(e.target.value))}
                            className="items-select"
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="15">15</option>
                            <option value="20">20</option>
                        </select>
                    </div>
                </div>

                <div className="calendar-right-column">
                    <CalendarWidget
                        events={events}
                        onDateChange={handleDateChange}
                        selectedDate={selectedDate}
                    />
                </div>
            </div>


            <EventModal
                isOpen={isModalOpen}
                onClose={closeModal}
                event={newEvent}
                onChange={handleInputChange}
                onSave={saveEvent}
                isEditing={isEditing}
            />

            <div className="file-upload-section">
                <h3>Upload Video Attachment</h3>
                <div className="file-actions">
                    <FileUpload
                        onUploadSuccess={(fileInfo) => {
                            console.log("Upload success, file info:", fileInfo);
                            setUploadedFiles(prev => [...prev, fileInfo]);
                        }}
                        onUploadError={(error) => {
                            console.error("Upload failed:", error);
                        }}
                    />
                    <button
                        className="refresh-button"
                        onClick={refreshUploadedFiles}
                        disabled={isLoadingFiles}
                    >
                        {isLoadingFiles ? "Loading..." : "Refresh Files"}
                    </button>
                </div>

                {isLoadingFiles && <div className="loading-message">Loading files...</div>}

                {uploadedFiles.length > 0 && (
                    <div className="uploaded-files">
                        <h4>Uploaded Videos:</h4>
                        <ul className="files-list">
                            {uploadedFiles.map((file, index) => (
                                <li key={index} className="file-item">
                                    {file && file.mimetype && file.mimetype.startsWith("video/") ? (
                                        <div className="uploaded-video">
                                            <video controls width="300" src={getFileUrl(file.filename)} />
                                            <div className="file-info">
                                                <strong>{file.originalname || file.filename}</strong>
                                                <a
                                                    href={getFileUrl(file.filename)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="download-link"
                                                >
                                                    Download
                                                </a>
                                            </div>
                                        </div>
                                    ) : (
                                        <a href={getFileUrl(file.filename)} target="_blank" rel="noopener noreferrer">
                                            {file.originalname || file.filename}
                                        </a>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {!isLoadingFiles && uploadedFiles.length === 0 && (
                    <div className="no-files-message">No files uploaded yet.</div>
                )}
            </div>

        </div>
    );
}

export default CalendarPage;