const express = require("express");
const { DataSource } = require("typeorm");

const path = require("path");
const cors = require("cors");
const setupRoutes = require("./routes/route");

const app = express();
const port = 4000;

const AppDataSource = new DataSource({
  type: "sqlite",
  database: "database.sqlite",
  entities: ["entity/*.js"],
  synchronize: true,
  logging: true,
});

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "client/build")));

AppDataSource.initialize()
  .then(() => {
    console.log("Database connection established.");
    setupRoutes(app, AppDataSource);
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("Error during Data Source initialization:", err);
  });
