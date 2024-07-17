require("reflect-metadata");
const express = require("express");
const { createConnection } = require("typeorm");
const bodyParser = require("body-parser");
const setupRoutes = require("./routes/route");

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Default route
app.get("/", (req, res) => {
  res.send("Hello, this is the API server. Use /api for API requests.");
});

// Establish database connection and start the server
createConnection()
  .then(() => {
    console.log("Database connection established");

    // Set up routes
    setupRoutes(app);

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  })
  .catch((error) => console.log("Database connection error: ", error));
