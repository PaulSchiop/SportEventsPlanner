import React from "react";

function EventCard({ event, onEdit, onDelete }) {
    return (
        <li className="event-item">
            <div className="event-header">
                <h3 className="event-title">{event.title}</h3>
                <div className="event-actions">
                    <button onClick={() => onEdit(event)} className="edit-button">
                        <i className="fas fa-ellipsis-v"></i> {/* "..." icon */}
                    </button>
                    <button onClick={() => onDelete(event.ID)} className="delete-button">
                        <i className="fas fa-trash"></i> {/* Trash icon */}
                    </button>
                </div>
            </div>
            <p className="event-detail"><strong>Group:</strong> {event.group}</p>
            <p className="event-detail"><strong>Date:</strong> {event.date}</p>
            <p className="event-detail">{event.start_time} - {event.end_time}</p>
            <p className="event-detail"><strong>Description:</strong> {event.description}</p>
        </li>
    );
}

export default EventCard;