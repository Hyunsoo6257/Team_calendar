# TIME 4 TEAM Web App

![Project_1](https://github.com/user-attachments/assets/1a1af200-18ad-4c48-b21f-ed113a1a782d)

## Description
Built a full-stack scheduling application from concept to deployment, enabling teams to efficiently find common available time slots by creating and sharing calendar URLs.

## Duration
2025.01 ~ 2025.02

## Technology
- React
- Node.js
- MySQL
- AWS EC2

## Member
- Full stack: 1

## How to Use

### 1. Pick the Color
Choose one of five colors (red, yellow, green, blue, purple) to present yourself in the shared calendar.

### 2. Select the Time
Click on the time slots between 6:00 am and 25:00 am to mark when you are not available.

### 3. See the Available Time
View common available time slots that work for all users in the shared calendar.

## Database Structure

### Schedule Management
- `server/entity/Calendar.js`: Calendar entity with shareCode and user management
- `server/entity/EventDetail.js`: Event details with time, date and color
- `server/entity/Color.js`: Color management for user identification

Feature that let users manage personal events - add, view, delete within the calendar with each color

**Relevant file**: `server/route.js`
- `/schedule/create`: endpoint for adding events
- `/schedule/delete`: endpoint for removing events

### Automatic Availability Calculation
Developed an algorithm that automatically calculates common available times by comparing users' unavailable times, analyzing hourly blocks (6 AM to 1 AM) over 30 days to identify overlapping free slots.

**Relevant file**: `server/route/route.js/available-times`: endpoint with the availability calculation

### Shared Calendar System
Developed a full-stack shared calendar system that allows users to create and join a calendar using a unique shareCode. Implemented a user limit of five per calendar and stored each user's calendarId and group available Times to manage shared schedules efficiently.

**Relevant file**: `server/routes/route.js`
- `/calendar/create`: endpoint that generates a unique shareCode
- `/calendar/join/:sharecode`: endpoint for joining calendars
