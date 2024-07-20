require("reflect-metadata");
const express = require("express");
const { createConnection } = require("typeorm");
const bodyParser = require("body-parser");
const path = require("path");
const setupRoutes = require("./routes/route");

const app = express();
const port = 4000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "client/build")));

// Catch-all route to serve the React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/build", "index.html"));
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
