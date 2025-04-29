const express = require("express");
const cors = require("cors");
const http = require("http"); // Required for WebSocket+Express integration
const { WebSocketServer, WebSocket } = require("ws");
const entityRoutes = require("./routes/entityRoutes");
const fileRoutes = require("./routes/fileRoutes");
const path = require("path");
const uploadsDir = path.join(__dirname, "uploads");

const app = express();
const PORT = process.env.PORT || 5000;
const corsOptions = {
    origin: "*", // Allow connections from any origin
    credentials: true, // Include if you need cookies/auth
};


// Middleware
app.use(express.json());
app.use(cors(corsOptions));

// Create HTTP server (instead of app.listen)
const server = http.createServer(app);

// Initialize WebSocket server
const wss = new WebSocketServer({ server });

wss.broadcast = (data) => {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};

// Import threadRoutes after initializing wss
const threadRoutes = require("./routes/threadRoutes")(wss);

// Routes
app.use("/entities", entityRoutes);
app.use("/api/thread", threadRoutes);
app.use("/api", fileRoutes);

app.use('/api/files', express.static(uploadsDir));

wss.broadcast = (data) => {
    console.log(`Broadcasting to ${wss.clients.size} clients:`, data);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server and WebSocket running on http://0.0.0.0:${PORT}`);
});

// Export WebSocket server if needed elsewhere
module.exports = { wss };