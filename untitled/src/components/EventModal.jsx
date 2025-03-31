import React from "react";

function EventModal({ isOpen, onClose, event, onChange, onSave, isEditing }) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h3>{isEditing ? 'Edit Event' : 'Add New Event'}</h3>
                <form>
                    <div className="form-group">
                        <label htmlFor="event-title">Title</label>
                        <input
                            id="event-title"
                            data-testid="ecent-modal-"
                            type="text"
                            name="title"
                            value={event.title}
                            onChange={onChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="event-group">Group</label>
                        <input
                            id="event-group"
                            type="text"
                            name="group"
                            value={event.group}
                            onChange={onChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="event-date">Date</label>
                        <input
                            id="event-date"
                            type="date"
                            name="date"
                            value={event.date}
                            onChange={onChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="event-start-time">Start Time</label>
                        <input
                            id="event-start-time"
                            type="time"
                            name="start_time"
                            value={event.start_time}
                            onChange={onChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="event-end-time">End Time</label>
                        <input
                            id="event-end-time"
                            type="time"
                            name="end_time"
                            value={event.end_time}
                            onChange={onChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="event-description">Description</label>
                        <textarea
                            id="event-description"
                            name="description"
                            value={event.description}
                            onChange={onChange}
                            required
                        />
                    </div>
                    <div className="modal-buttons">
                        <button type="button" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="button" onClick={onSave}>
                            {isEditing ? 'Save Changes' : 'Add Event'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EventModal;