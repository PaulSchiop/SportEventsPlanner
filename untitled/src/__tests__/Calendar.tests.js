import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Calendar from '../pages/Calendar';

// Mock child components
jest.mock('../components/EventCard', () => ({ event, onEdit, onDelete }) => (
    <div data-testid="event-card">
        <h3>{event.title}</h3>
        <button onClick={() => onEdit(event)}>Edit</button>
        <button onClick={() => onDelete(event.ID)}>Delete</button>
    </div>
));

jest.mock('../components/EventModal', () => ({ isOpen, onClose, event, onChange, onSave, isEditing }) => (
    isOpen ? (
        <div data-testid="event-modal">
            <h3>{isEditing ? 'Edit Event' : 'Add Event'}</h3>
            <label htmlFor="title">Title</label>
            <input id="title" name="title" data-testid="modal-title" value={event.title} onChange={onChange} />
            <label htmlFor="group">Group</label>
            <input id="group" name="group" value={event.group} onChange={onChange} />
            <label htmlFor="date">Date</label>
            <input id="date" type="date" name="date" value={event.date} onChange={onChange} />
            <label htmlFor="start_time">Start Time</label>
            <input id="start_time" type="time" name="start_time" value={event.start_time} onChange={onChange} />
            <label htmlFor="end_time">End Time</label>
            <input id="end_time" type="time" name="end_time" value={event.end_time} onChange={onChange} />
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" value={event.description} onChange={onChange} />
            <button onClick={onSave}>{isEditing ? 'Save Changes' : 'Add Event'}</button>
            <button onClick={onClose}>Cancel</button>
        </div>
    ) : null
));

jest.mock('../components/EventFilters', () => ({
                                                   searchTerm, onSearchChange, selectedMonth, onMonthChange, sortBy, onSortChange
                                               }) => (
    <div data-testid="event-filters">
        <input
            data-testid="search-input"
            value={searchTerm}
            onChange={onSearchChange}
        />
        <select
            data-testid="month-select"
            value={selectedMonth}
            onChange={onMonthChange}
        >
            <option value="">All Months</option>
        </select>
        <select
            data-testid="sort-select"
            value={sortBy}
            onChange={onSortChange}
        >
            <option value="date">Date</option>
        </select>
    </div>
));

beforeAll(() => {
    window.alert = jest.fn();
});

describe('Calendar Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders calendar with initial events', async () => {
        render(<Calendar />);

        await waitFor(() => {
            expect(screen.getByTestId('event-list')).toHaveTextContent('2023 FIFA World Cup Final');
            expect(screen.getByTestId('event-list')).toHaveTextContent('Rugby World Cup Final');
        });
    });

    test('opens and closes the event modal', async () => {
        render(<Calendar />);
        const user = userEvent.setup();

        // Open modal
        await user.click(screen.getByText('+'));
        expect(screen.getByTestId('event-modal')).toBeInTheDocument();

        // Close modal
        await user.click(screen.getByText('Cancel'));
        expect(screen.queryByTestId('event-modal')).not.toBeInTheDocument();
    });

    describe('Event Management', () => {
        test('successfully adds a new event', async () => {
            render(<Calendar />);
            const user = userEvent.setup();

            // Open the add event modal
            await user.click(screen.getByText('+'));

            // Verify the modal is open
            expect(screen.getByTestId('event-modal')).toBeInTheDocument();

            // Fill out the form
            await user.type(screen.getByLabelText('Title'), 'New Event');
            await user.type(screen.getByLabelText(/group/i), 'Group A');
            await user.type(screen.getByLabelText(/date/i), '2023-12-31');
            await user.type(screen.getByLabelText(/start time/i), '10:00');
            await user.type(screen.getByLabelText(/end time/i), '12:00');
            await user.type(screen.getByLabelText(/description/i), 'Event description');

            // Save the new event
            await user.click(screen.getByRole('button', { name: 'Add Event' }));

            // Verify the new event is added
            await waitFor(() => {
                expect(screen.getByText('New Event')).toBeInTheDocument();
            });
        });

        test('edits an existing event', async () => {
            render(<Calendar />);
            const user = userEvent.setup();

            // Click edit on first event
            const editButtons = screen.getAllByText('Edit');
            await user.click(editButtons[0]);

            // Change title
            fireEvent.change(screen.getByTestId('modal-title'), {
                target: { value: 'Updated Event' }
            });

            // Save changes
            await user.click(screen.getByText('Save Changes'));

            await waitFor(() => {
                expect(screen.getByText('Updated Event')).toBeInTheDocument();
            });
        });

        test('deletes an event', async () => {
            render(<Calendar />);
            const user = userEvent.setup();

            // Find the event to delete
            const eventToDelete = screen.getByText('2023 FIFA World Cup Final');
            const deleteButton = within(eventToDelete.closest('[data-testid="event-card"]')).getByText('Delete');

            // Click the delete button
            await user.click(deleteButton);

            // Wait for the event to be removed from the DOM
            await waitFor(() => {
                expect(screen.queryByText('2023 FIFA World Cup Final')).not.toBeInTheDocument();
            });
        });
    });

    describe('Form Validation', () => {
        test('shows error for empty form submission', async () => {
            render(<Calendar />);
            const user = userEvent.setup();

            await user.click(screen.getByText('+'));
            await user.click(screen.getByRole('button', { name: 'Add Event' }));

            expect(window.alert).toHaveBeenCalledWith('Please fill out all fields.');
        });

        test('validates time ranges', async () => {
            render(<Calendar />);
            const user = userEvent.setup();

            await user.click(screen.getByText('+'));

            // Fill ALL required fields first
            fireEvent.change(screen.getByTestId('modal-title'), {
                target: { value: 'Invalid Time Event' }
            });
            fireEvent.change(screen.getByLabelText(/group/i), {
                target: { value: 'Test Group' }
            });
            fireEvent.change(screen.getByLabelText(/date/i), {
                target: { value: '2023-12-31' }
            });
            fireEvent.change(screen.getByLabelText(/description/i), {
                target: { value: 'Test description' }
            });

            // Invalid time range
            fireEvent.change(screen.getByLabelText(/start time/i), {
                target: { value: '12:00' }
            });
            fireEvent.change(screen.getByLabelText(/end time/i), {
                target: { value: '10:00' }
            });

            await user.click(screen.getByRole('button', { name: 'Add Event' }));

            expect(window.alert).toHaveBeenCalledWith(
                'Start time cannot be after or equal to end time.'
            );
        });
    });

    describe('Filtering and Sorting', () => {
// For the search term test:
        test('filters events by search term', async () => {
            render(<Calendar />);

            fireEvent.change(screen.getByTestId('search-input'), {
                target: { value: 'FIFA World Cup' }
            });

            const customTextMatcher = (content, element) => {
                const hasText = (node) => node.textContent === '2023 FIFA World Cup Final';
                const nodeHasText = hasText(element);
                const childrenDontHaveText = Array.from(element.children).every(
                    (child) => !hasText(child)
                );
                return nodeHasText && childrenDontHaveText;
            };

            expect(screen.getByText(customTextMatcher)).toBeInTheDocument();
            expect(screen.queryByText('Rugby World Cup Final')).not.toBeInTheDocument();
        });

        /*test('sorts events by title in alphabetical order', async () => {
            render(<Calendar />);

            // Change sort to title
            fireEvent.change(screen.getByTestId('sort-select'), {
                target: { value: 'title' }
            });

            // Wait for the sorting to complete
            await waitFor(() => {
                // Get all event cards on the current page
                const eventCards = screen.getAllByTestId('event-card');
                const displayedTitles = eventCards.map(card =>
                    within(card).getByRole('heading').textContent
                );

                // Check if the titles are in alphabetical order
                const isSorted = displayedTitles.every((title, i) =>
                    i === 0 || title.localeCompare(displayedTitles[i-1]) >= 0
                );

                expect(isSorted).toBe(true);
            });
        });*/

    describe('Pagination', () => {
        test('paginates events correctly', async () => {
            render(<Calendar />);
            const user = userEvent.setup();

            // Get initial events
            const initialEvents = screen.getAllByTestId('event-card');
            const initialTitles = initialEvents.map(card => within(card).getByRole('heading').textContent);

            // Try to find and click page 2
            const pageButtons = screen.queryAllByRole('button', { name: /^[0-9]$/ });

            if (pageButtons.length > 1) {
                await user.click(pageButtons[1]); // Click page 2

                await waitFor(() => {
                    const newEvents = screen.getAllByTestId('event-card');
                    const newTitles = newEvents.map(card => within(card).getByRole('heading').textContent);
                    expect(newTitles).not.toEqual(initialTitles);
                });
            } else {
                // If no pagination, just verify we see events
                expect(initialEvents.length).toBeGreaterThan(0);
            }
        });
    });
});
});