import React from 'react';
import Calendar from 'react-calendar';
//import 'react-calendar/dist/Calendar.css';

function CalendarWidget({ events, onDateChange, selectedDate }) {
    // Function to handle date selection from calendar
    const handleDateChange = (date) => {
        onDateChange(date);
    };

    // Function to add markers/tooltips for dates with events
    const getTileContent = ({ date, view }) => {
        if (view !== 'month') return null;

        const formattedDate = date.toISOString().split('T')[0];
        // Add null check for events
        const hasEvent = events && Array.isArray(events) && events.some(event => event.date === formattedDate);

        return hasEvent ? <div className="event-marker"></div> : null;
    };

    return (
        <div className="calendar-widget">
            <Calendar
                onChange={handleDateChange}
                value={selectedDate}
                tileContent={getTileContent}
                className="react-calendar"
            />
        </div>
    );
}

export default CalendarWidget;