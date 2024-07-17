const { createConnection } = require("typeorm");
const EventDetail = require("../entity/EventDetail");
const Color = require("../entity/Color");

async function seed() {
  const connection = await createConnection();
  const colorRepository = connection.getRepository(Color);
  const eventDetailRepository = connection.getRepository(EventDetail);

  // 색상 데이터 추가
  const redColor = await colorRepository.save({ name: "red" });
  const blueColor = await colorRepository.save({ name: "blue" });

  // 초기 이벤트 데이터 추가
  await eventDetailRepository.save([
    {
      time: 10,
      date: "2024-07-14",
      color: redColor,
    },
    {
      time: 11,
      date: "2024-07-14",
      color: redColor,
    },
    {
      time: 12,
      date: "2024-07-14",
      color: blueColor,
    },
  ]);

  console.log("Data has been seeded");
  process.exit(0);
}

seed().catch((error) => console.log("Error: ", error));
