require("dotenv").config();
const express = require("express");
const { DataSource } = require("typeorm");
const path = require("path");
const cors = require("cors");
const setupRoutes = require("./server/routes/route");
const Calendar = require("./server/entity/Calendar");

const app = express();
const port = process.env.PORT || 8081;

const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST,
  port: 3306,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [__dirname + "/server/entity/*.js"],
  synchronize: true,
  driver: require("mysql2"),
});

// 미들웨어 설정
app.use(
  cors({
    origin: [
      "http://teamcalendarapp-env.eba-9kxhdpyd.ap-southeast-2.elasticbeanstalk.com",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());

// API 라우트를 React 라우트보다 먼저 정의
setupRoutes(app, AppDataSource); // API 라우트

// 그 다음 React 라우트
app.use(express.static(path.join(__dirname, "client/build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/build", "index.html"));
});

// 데이터베이스 연결 및 라우트 설정
AppDataSource.initialize()
  .then(async () => {
    const calendarRepository = AppDataSource.getRepository(Calendar);

    // 기본 캘린더 확인
    let defaultCalendar = await calendarRepository.findOne({
      where: { shareCode: "TEST123" },
    });

    // 없으면 생성
    if (!defaultCalendar) {
      defaultCalendar = calendarRepository.create({
        shareCode: "TEST123",
        userCount: 1,
        maxUsers: 5,
      });
      defaultCalendar = await calendarRepository.save(defaultCalendar);
      console.log("Default calendar created with ID:", defaultCalendar.id);
    }

    console.log("Database connection established.");
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Error during Data Source initialization:", err);
  });
