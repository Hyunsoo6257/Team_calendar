require("dotenv").config({
  path:
    process.env.NODE_ENV === "production"
      ? "./.env.production"
      : "./.env.development",
});
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
  port: process.env.DB_PORT || 3306,
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
      /^http:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/, // 모든 IP 허용
      /^http:\/\/localhost:\d+$/, // localhost 허용
    ],
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
    app.listen(port, "0.0.0.0", () => {
      // 모든 IP에서 접근 가능
      console.log(`Server is running on port ${port}`);
      console.log(`Local: http://localhost:${port}`);
      console.log(`Network: http://${getLocalIP()}:${port}`); // 네트워크 IP 표시
    });
  })
  .catch((err) => {
    console.error("Error during Data Source initialization:", err);
  });

// IP 주소 가져오는 함수
function getLocalIP() {
  const { networkInterfaces } = require("os");
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
}
