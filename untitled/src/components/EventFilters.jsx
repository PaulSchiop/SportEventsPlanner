import React from "react";

function EventFilters({ searchTerm, onSearchChange, selectedMonth, selectedYear, onMonthChange, onYearChange, sortBy, onSortChange }) {
    return (
        <div className="filter-container">
            <input
                type="text"
                placeholder="Search by title..."
                value={searchTerm}
                onChange={onSearchChange}
                className="search-input"
            />
            <select
                value={selectedMonth}
                onChange={onMonthChange}
                className="month-select"
            >
                <option value="">All Months</option>
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
            </select>
            <select
                value={selectedYear}
                onChange={onYearChange}
                className={`year-select`}>
                <option value="">All Years</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2023">2023</option>
            </select>
            <select
                value={sortBy}
                onChange={onSortChange}
                className="sort-select"
            >
                <option value="date">Sort by Date</option>
                <option value="title">Sort by Title</option>
                <option value="start_time">Sort by Start Time</option>
            </select>
        </div>
    );
}

export default EventFilters;