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

    try {
      const detail = req.body;

      // 입력값 검증
      if (!detail || !detail.time || !detail.date || !detail.color) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
          receivedData: detail,
        });
      }

      const newEventDetail = scheduleRepository.create({
        time: detail.time,
        date: detail.date,
        color: detail.color,
      });

      const savedEvent = await scheduleRepository.save(newEventDetail);

      res.status(200).json({
        success: true,
        message: "Event detail created successfully",
        data: savedEvent,
      });
    } catch (error) {
      console.error("Schedule creation error:", error.message);
      res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
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
      const events = await scheduleRepository.find();
      const usedColors = [...new Set(events.map((event) => event.color))]; // 중복 제거
      res.status(200).json(usedColors);
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
        where: { date },
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
    const { date, color } = req.body;

    try {
      console.log("Attempting to delete schedules:", { date, color }); // Debug log

      if (!date || !color) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: date and color required",
        });
      }

      const result = await scheduleRepository.delete({
        date: date,
        color: color,
      });

      console.log("Delete result:", result); // Debug log

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
      // Generate unique share code
      const shareCode = Math.random().toString(36).substring(2, 8);

      const newCalendar = calendarRepository.create({
        shareCode: shareCode,
        userCount: 1,
      });

      const savedCalendar = await calendarRepository.save(newCalendar);

      res.status(200).json({
        success: true,
        shareCode: shareCode,
        calendarId: savedCalendar.id,
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
