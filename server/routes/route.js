const express = require("express");
const EventDetail = require("../entity/EventDetail");
const Calendar = require("../entity/Calendar");

module.exports = (app, AppDataSource) => {
  // POST /schedules/reset - Reset all schedules
  app.post("/schedules/reset", async (req, res) => {
    const scheduleRepository = AppDataSource.getRepository(EventDetail);
    try {
      await scheduleRepository.clear();
      res.status(200).json({ message: "All schedules reset successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /schedule/create - Create a new schedule
  app.post("/schedule/create", async (req, res) => {
    const scheduleRepository = AppDataSource.getRepository(EventDetail);
    const calendarRepository = AppDataSource.getRepository(Calendar);

    try {
      console.log("Schedule create request:", req.body);
      const { calendarId } = req.body;

      // 모든 캘린더 조회해서 확인
      const allCalendars = await calendarRepository.find();
      console.log("All calendars in DB:", allCalendars);

      const calendar = await calendarRepository.findOne({
        where: { id: calendarId },
      });
      console.log("Found calendar:", calendar);

      if (!calendar) {
        return res.status(400).json({
          success: false,
          message: "Calendar not found",
        });
      }

      const detail = req.body;
      const schedule = scheduleRepository.create({
        time: detail.time,
        date: detail.date,
        color: detail.color,
        calendar: calendar,
      });

      await scheduleRepository.save(schedule);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Schedule creation error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  // GET /schedule/available - Calculate available time slots for all members
  app.get("/schedule/available", async (req, res) => {
    const { date } = req.query;
    const scheduleRepository = AppDataSource.getRepository(EventDetail);

    try {
      const schedules = await scheduleRepository.find({ where: { date } });
      const unavailableTimes = schedules.flatMap(
        (schedule) => schedule.unavailableTimes
      );
      const availableTimes = calculateAvailableTimes(unavailableTimes);
      res.status(200).json(availableTimes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /colors/used - Get all used colors
  app.get("/colors/used", async (req, res) => {
    const scheduleRepository = AppDataSource.getRepository(EventDetail);
    try {
      // Aurora optimized query
      const events = await scheduleRepository
        .createQueryBuilder("event")
        .select("DISTINCT event.color")
        .getRawMany();

      res.status(200).json(events.map((e) => e.color));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /schedules - Get schedules for a specific date
  app.get("/schedules", async (req, res) => {
    const { date } = req.query;
    const scheduleRepository = AppDataSource.getRepository(EventDetail);

    try {
      const schedules = await scheduleRepository.find({
        where: {
          date,
          calendar: { id: req.query.calendarId }, // 캘린더 ID로 필터링 추가
        },
        select: ["time", "color"],
      });
      res.status(200).json(schedules);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /schedule/delete - 특정 날짜의 모든 이벤트 삭제
  app.delete("/schedule/delete", async (req, res) => {
    const scheduleRepository = AppDataSource.getRepository(EventDetail);
    const { date, calendarId } = req.body;

    try {
      if (!date || !calendarId) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: date and calendarId required",
        });
      }

      const result = await scheduleRepository.delete({
        date: date,
        calendar: { id: calendarId },
      });

      res.status(200).json({
        success: true,
        message: "Schedules deleted successfully",
        result: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  // Create new calendar
  app.post("/calendar/create", async (req, res) => {
    const calendarRepository = AppDataSource.getRepository(Calendar);

    try {
      console.log("Creating new calendar...");
      const shareCode = Math.random().toString(36).substring(2, 8);

      const newCalendar = calendarRepository.create({
        shareCode: shareCode,
        userCount: 1,
        maxUsers: 5,
      });

      const calendar = await calendarRepository.save(newCalendar);
      console.log("New calendar created:", calendar); // 새로 생성된 캘린더 정보

      res.status(200).json({
        success: true,
        shareCode: shareCode,
        calendarId: calendar.id,
      });
    } catch (error) {
      console.error("Error creating calendar:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  // Join existing calendar
  app.post("/calendar/join/:shareCode", async (req, res) => {
    const { shareCode } = req.params;
    const calendarRepository = AppDataSource.getRepository(Calendar);

    try {
      const calendar = await calendarRepository.findOne({
        where: { shareCode },
      });

      if (!calendar) {
        return res.status(404).json({
          success: false,
          message: "Calendar not found",
        });
      }

      if (calendar.userCount >= 5) {
        return res.status(400).json({
          success: false,
          message: "Calendar has reached maximum number of users",
        });
      }

      calendar.userCount += 1;
      await calendarRepository.save(calendar);

      res.status(200).json({
        success: true,
        calendarId: calendar.id,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  // 기본 캘린더 조회
  app.get("/calendar/default", async (req, res) => {
    const calendarRepository = AppDataSource.getRepository(Calendar);
    console.log("Checking default calendar...");

    try {
      const defaultCalendar = await calendarRepository.findOne({
        where: { id: 1 },
      });
      console.log("Default calendar found:", defaultCalendar);

      if (!defaultCalendar) {
        console.log("No default calendar, creating one...");
        // 기본 캘린더가 없으면 생성
        const newDefaultCalendar = calendarRepository.create({
          shareCode: "TEST123",
          userCount: 1,
          maxUsers: 5,
        });

        const savedCalendar = await calendarRepository.save(newDefaultCalendar);
        console.log("5. Created new default calendar:", savedCalendar);

        return res.status(200).json({
          success: true,
          calendarId: savedCalendar.id,
        });
      }

      res.status(200).json({
        success: true,
        calendarId: defaultCalendar.id,
      });
    } catch (error) {
      console.error("Error in default calendar:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  // 캘린더 shareCode로 접근
  app.get("/calendar/:shareCode", async (req, res) => {
    const calendarRepository = AppDataSource.getRepository(Calendar);
    const { shareCode } = req.params;

    try {
      const calendar = await calendarRepository.findOne({
        where: { shareCode },
      });

      if (!calendar) {
        return res.status(404).json({
          success: false,
          message: "Calendar not found",
        });
      }

      res.status(200).json({
        success: true,
        calendarId: calendar.id,
        shareCode: calendar.shareCode,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  // 캘린더 공유 시 availableTimes도 함께 전달
  app.get("/calendar/byShareCode/:shareCode", async (req, res) => {
    const calendarRepository = AppDataSource.getRepository(Calendar);
    const { shareCode } = req.params;

    try {
      const calendar = await calendarRepository.findOne({
        where: { shareCode },
      });

      if (!calendar) {
        return res.status(404).json({
          success: false,
          message: "Calendar not found",
        });
      }

      const availableTimes = JSON.parse(calendar.availableTimes);

      res.status(200).json({
        success: true,
        calendarId: calendar.id,
        shareCode: calendar.shareCode,
        availableTimes: availableTimes,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  app.get("/available-times", async (req, res) => {
    try {
      const calendarId = req.query.calendarId;

      // 1. 예약된 시간을 Map으로 변환 (O(b))
      const bookedMap = new Map();
      const bookedTimes = await AppDataSource.getRepository(EventDetail).find({
        where: { calendar_id: calendarId },
        order: { date: "ASC", time: "ASC" },
      });

      bookedTimes.forEach((booking) => {
        const key = `${booking.date}_${booking.time}`;
        bookedMap.set(key, true);
      });

      // 2. 시간대 배열
      const timeSlots = [
        "06:00",
        "07:00",
        "08:00",
        "09:00",
        "10:00",
        "11:00",
        "12:00",
        "13:00",
        "14:00",
        "15:00",
        "16:00",
        "17:00",
        "18:00",
        "19:00",
        "20:00",
        "21:00",
        "22:00",
        "23:00",
        "24:00",
        "25:00",
      ];

      const availableTimes = [];
      const today = new Date();
      const nextMonth = new Date(today.setMonth(today.getMonth() + 1));

      // 3. O(d * t) 복잡도로 감소
      for (let d = new Date(); d <= nextMonth; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];

        timeSlots.forEach((time) => {
          const key = `${dateStr}_${time}`;
          if (!bookedMap.has(key)) {
            // O(1) 검색
            availableTimes.push({
              date: dateStr,
              time: time,
            });
          }
        });
      }

      res.json({ success: true, availableTimes });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  function calculateAvailableTimes(unavailableTimes) {
    // Create an array to represent the time slots from 06:00 to 25:00
    const timeSlots = new Array(24 * 60).fill(true); // 24 hours * 60 minutes

    unavailableTimes.forEach(({ startTime, endTime }) => {
      const start =
        new Date(startTime).getHours() * 60 + new Date(startTime).getMinutes();
      const end =
        new Date(endTime).getHours() * 60 + new Date(endTime).getMinutes();

      for (let i = start; i < end; i++) {
        timeSlots[i] = false;
      }
    });

    const availableTimes = [];
    let start = null;

    for (let i = 360; i < 1500; i++) {
      // From 06:00 to 25:00
      if (timeSlots[i]) {
        if (start === null) {
          start = i;
        }
      } else {
        if (start !== null) {
          availableTimes.push({
            startTime: new Date().setHours(0, start),
            endTime: new Date().setHours(0, i),
          });
          start = null;
        }
      }
    }

    if (start !== null) {
      availableTimes.push({
        startTime: new Date().setHours(0, start),
        endTime: new Date().setHours(0, 1500),
      });
    }

    return availableTimes;
  }
};
