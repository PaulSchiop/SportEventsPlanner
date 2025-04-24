const express = require("express");
const GenerateEntitiesThread = require("../controllers/generateEntitiesThread");

module.exports = (wss) => {
    const router = express.Router();
    const entityGenerator = new GenerateEntitiesThread(wss);

    router.post("/start", (req, res) => {
        entityGenerator.start();
        res.status(200).json({ message: "Thread started" });
    });

    router.post("/stop", (req, res) => {
        entityGenerator.stop();
        res.status(200).json({ message: "Thread stopped" });
    });

    return router;
};