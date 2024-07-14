require("reflect-metadata");
const express = require("express");
const { createConnection } = require("typeorm");
const bodyParser = require("body-parser");
const routes = require("./routes/route");

const app = express();
const port = 3000;

app.use(bodyParser.json());

// 기본 경로에 대한 핸들러 추가
app.get("/", (req, res) => {
  res.send("Hello, this is the API server. Use /api for API requests.");
});

createConnection()
  .then(() => {
    app.use("/api", routes);

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  })
  .catch((error) => console.log(error));
