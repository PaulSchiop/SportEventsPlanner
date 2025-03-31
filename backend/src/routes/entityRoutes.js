// In entityRoutes.js:
const express = require("express");
const {getAllEvents, createEvent, updateEvent, deleteEvent} = require("../controllers/entityController");

const router = express.Router();

router.get("/", getAllEvents);
router.post("/", createEvent);
router.put("/:id", updateEvent);
router.delete("/:id", deleteEvent);

module.exports = router;