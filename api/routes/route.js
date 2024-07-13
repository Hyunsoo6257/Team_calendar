const express = require("express");
const router = express.Router();

let schedules = []; // In-memory data store for schedules

/**
 * @swagger
 * /schedules:
 *   get:
 *     summary: Retrieve all schedules
 *     responses:
 *       200:
 *         description: A list of schedules
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   user:
 *                     type: string
 *                   date:
 *                     type: string
 *                     format: date
 *                   unavailableTimes:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         startTime:
 *                           type: string
 *                           format: date-time
 *                         endTime:
 *                           type: string
 *                           format: date-time
 */
router.get("/schedules", (req, res) => {
  res.status(200).json(schedules);
});

/**
 * @swagger
 * /schedules/reset:
 *   post:
 *     summary: Reset all schedules
 *     responses:
 *       200:
 *         description: All schedules reset successfully
 */
router.post("/schedules/reset", (req, res) => {
  schedules = [];
  res.status(200).json({ message: "All schedules reset successfully" });
});

/**
 * @swagger
 * /schedule/create:
 *   post:
 *     summary: Create a new schedule
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               unavailableTimes:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     startTime:
 *                       type: string
 *                       format: date-time
 *                     endTime:
 *                       type: string
 *                       format: date-time
 *     responses:
 *       200:
 *         description: Schedule created successfully
 *       500:
 *         description: Server error
 */
router.post("/schedule/create", async (req, res) => {
  const { user, date, unavailableTimes } = req.body;

  try {
    const newSchedule = new Schedule({ user, date, unavailableTimes });
    await newSchedule.save();
    res.status(200).json({ message: "Schedule created successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /schedule/update:
 *   put:
 *     summary: Update an existing schedule
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               unavailableTimes:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     startTime:
 *                       type: string
 *                       format: date-time
 *                     endTime:
 *                       type: string
 *                       format: date-time
 *     responses:
 *       200:
 *         description: Schedule updated successfully
 *       404:
 *         description: Schedule not found
 *       500:
 *         description: Server error
 */
router.put("/schedule/update", async (req, res) => {
  const { user, date, unavailableTimes } = req.body;

  try {
    const existingSchedule = await Schedule.findOne({ user, date });
    if (existingSchedule) {
      existingSchedule.unavailableTimes = unavailableTimes;
      await existingSchedule.save();
      res.status(200).json({ message: "Schedule updated successfully" });
    } else {
      res.status(404).json({ message: "Schedule not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /schedule/reset:
 *   post:
 *     summary: Reset a schedule
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Schedule reset successfully
 *       500:
 *         description: Server error
 */
router.post("/schedule/reset", async (req, res) => {
  const { user, date } = req.body;

  try {
    await Schedule.deleteMany({ user, date });
    res.status(200).json({ message: "Schedule reset successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /schedule/available:
 *   get:
 *     summary: Calculate available time slots for all members
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: The date to calculate available time slots for
 *     responses:
 *       200:
 *         description: A list of available time slots
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   startTime:
 *                     type: string
 *                     format: date-time
 *                   endTime:
 *                     type: string
 *                     format: date-time
 */
router.get("/schedule/available", (req, res) => {
  const { date } = req.query;

  // Collect all unavailable times for the given date
  const unavailableTimes = schedules
    .filter((schedule) => schedule.date === date)
    .flatMap((schedule) => schedule.unavailableTimes);

  // Logic to calculate available time slots
  const availableTimes = calculateAvailableTimes(unavailableTimes);

  res.status(200).json(availableTimes);
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

module.exports = router;
