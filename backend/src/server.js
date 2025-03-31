const express = require("express");
const cors = require("cors");

const entityRoutes = require("./routes/entityRoutes");

const app = express();
const PORT = process.env.PORT || 5000;
const corsOptions = {
    origin: "http://localhost:5173",
}

// Middleware
app.use(express.json());
app.use(cors(corsOptions));

// Test route
// Routes
app.use("/entities", entityRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
