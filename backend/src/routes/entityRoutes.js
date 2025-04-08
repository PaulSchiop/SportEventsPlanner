// In entityRoutes.js:
const express = require("express");
const {getAllEvents, createEvent, updateEvent, deleteEvent} = require("../controllers/entityController");

const router = express.Router();

router.get("/", getAllEvents);
router.post("/", createEvent);
router.put("/:id", updateEvent);
router.delete("/:id", deleteEvent);

router.get('/health-check', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString() // Add timestamp to prevent caching
    });
});

module.exports = router;