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
      console.log("Received request body:", req.body);
      const { calendarId } = req.body;

      const calendar = await calendarRepository.findOne({
        where: { id: calendarId },
      });

      console.log("Calendar search result:", calendar);
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

  // DELETE /schedule/delete - Delete schedules for a specific color and date
  app.delete("/schedule/delete", async (req, res) => {
    const scheduleRepository = AppDataSource.getRepository(EventDetail);
    const { date, color, calendarId } = req.body;

    try {
      if (!date || !color || !calendarId) {
        return res.status(400).json({
          success: false,
          message:
            "Missing required fields: date, color, and calendarId required",
        });
      }

      const result = await scheduleRepository.delete({
        date: date,
        color: color,
        calendar: { id: calendarId },
      });

      res.status(200).json({
        success: true,
        message: "Schedules deleted successfully",
        result: result,
      });
    } catch (error) {
      console.error("Schedule deletion error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  });

  // Create new calendar
  app.post("/calendar/create", async (req, res) => {
    const calendarRepository = AppDataSource.getRepository(Calendar);

    try {
      const shareCode = Math.random().toString(36).substring(2, 8);

      const newCalendar = calendarRepository.create({
        shareCode: shareCode,
        userCount: 1,
        maxUsers: 5,
      });

      const calendar = await calendarRepository.save(newCalendar);
      res.status(200).json({
        success: true,
        shareCode: shareCode,
        calendarId: calendar.id,
      });
    } catch (error) {
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
    console.log("1. Starting default calendar fetch");

    try {
      // 모든 캘린더 조회
      const allCalendars = await calendarRepository.find();
      console.log("2. All calendars:", allCalendars);

      // id가 1인 캘린더 찾기
      const defaultCalendar = await calendarRepository.findOne({
        where: { id: 1 },
      });

      console.log("3. Default calendar search result:", defaultCalendar);

      if (!defaultCalendar) {
        console.log("4. No default calendar found, creating one");
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
      console.error("Error in default calendar API:", error);
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
