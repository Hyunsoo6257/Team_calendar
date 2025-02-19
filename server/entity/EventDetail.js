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
      type: "date",
    },
    color: {
      type: "varchar",
    },
  },
  relations: {
    calendar: {
      type: "many-to-one",
      target: "Calendar",
      joinColumn: {
        name: "calendar_id",
      },
      onDelete: "CASCADE",
    },
  },
});
