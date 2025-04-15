// server.js
const express = require("express");
const cors = require("cors");

const entityRoutes = require("./routes/entityRoutes");

const app = express();
const PORT = process.env.PORT || 5000;
const corsOptions = {
    origin: "*", // Allow connections from any origin
    credentials: true // Include if you need cookies/auth
}

// Middleware
app.use(express.json());
app.use(cors(corsOptions));

app.use("/entities", entityRoutes);

// Start server - IMPORTANT CHANGE HERE
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Access from other devices using your IP address: http://<your-ip-address>:${PORT}`);
});