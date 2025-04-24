import React from 'react';
import EventCard from './EventCard';

function EventsList({
                        events,
                        loading,
                        hasMore,
                        lastEventRef,
                        onEdit,
                        onDelete
                    }) {
    // Show loading state when no events and in loading state
    if (events.length === 0 && loading) {
        return (
            <div className="loading-indicator">
                <div className="spinner"></div>
                <p>Loading events...</p>
            </div>
        );
    }

    // Show empty state when no events and not loading
    if (events.length === 0 && !loading) {
        return <div className="no-events">No events found</div>;
    }

    // Get first few events to display at the end for circular effect
    const circularEvents = hasMore ? [] : events.slice(0, Math.min(5, events.length));

    return (
        <div className="events-container">
            <ul className="event-list">
                {events.map((event, index) => (
                    <div
                        key={`original-${event.ID}`}
                        ref={index === events.length - 1 ? lastEventRef : null}
                        className="event-item-wrapper"
                    >
                        <EventCard
                            event={event}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    </div>
                ))}

                {/* When we've reached the end, show the beginning events again */}
                {!loading && !hasMore && circularEvents.map((event) => (
                    <div key={`circular-${event.ID}`} className="event-item-wrapper circular-event">
                        <EventCard
                            event={event}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    </div>
                ))}
            </ul>

            {/* Loading indicator */}
            {loading && (
                <div className="loading-indicator bottom-loader">
                    <div className="spinner"></div>
                    <p>Loading more events...</p>
                </div>
            )}

            {/* Circular scroll notice */}
            {!loading && !hasMore && events.length > 0 && (
                <div className="circular-notice">
                    Returning to the beginning of events
                </div>
            )}
        </div>
    );
}

export default EventsList;