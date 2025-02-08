// entity/EventDetail.js
const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "EventDetail",
  tableName: "event_details",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    time: {
      type: "varchar",
    },
    date: {
      type: "text",
    },
    color: {
      type: "varchar",
    },
    calendar_id: {
      type: "int",
    },
  },
  relations: {
    calendar: {
      target: "Calendar",
      type: "many-to-one",
      joinColumn: { name: "calendar_id" },
      inverseSide: "eventDetails",
    },
  },
});
