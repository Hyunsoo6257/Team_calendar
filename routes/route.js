const express = require("express");
const { getRepository } = require("typeorm");
const EventDetail = require("../entity/EventDetail");

module.exports = (app) => {
  // GET /schedules - Retrieve all schedules
  app.get("/schedules", async (req, res) => {
    const scheduleRepository = getRepository(EventDetail);
    try {
      const schedules = await scheduleRepository.find();
      res.status(200).json(schedules);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /schedules/reset - Reset all schedules
  app.post("/schedules/reset", async (req, res) => {
    const scheduleRepository = getRepository(EventDetail);
    try {
      await scheduleRepository.clear();
      res.status(200).json({ message: "All schedules reset successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /schedule/create - Create a new schedule
  app.post("/schedule/create", async (req, res) => {
    const { eventDetails } = req.body;
    const scheduleRepository = getRepository(EventDetail);

    try {
      const eventDetailPromises = eventDetails.map((detail) => {
        const newEventDetail = scheduleRepository.create(detail);
        return scheduleRepository.save(newEventDetail);
      });

      await Promise.all(eventDetailPromises);

      res.status(200).json({ message: "Event details created successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // PUT /schedule/update - Update an existing schedule
  app.put("/schedule/update", async (req, res) => {
    const { user, date, unavailableTimes } = req.body;
    const scheduleRepository = getRepository(EventDetail);

    try {
      const existingSchedule = await scheduleRepository.findOne({
        where: { user, date },
      });
      if (existingSchedule) {
        existingSchedule.unavailableTimes = unavailableTimes;
        await scheduleRepository.save(existingSchedule);
        res.status(200).json({ message: "Schedule updated successfully" });
      } else {
        res.status(404).json({ message: "Schedule not found" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /schedule/reset - Reset a schedule
  app.post("/schedule/reset", async (req, res) => {
    const { user, date } = req.body;
    const scheduleRepository = getRepository(EventDetail);

    try {
      await scheduleRepository.delete({ user, date });
      res.status(200).json({ message: "Schedule reset successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /schedule/available - Calculate available time slots for all members
  app.get("/schedule/available", async (req, res) => {
    const { date } = req.query;
    const scheduleRepository = getRepository(EventDetail);

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
