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
      type: "int",
    },
    date: {
      type: "date",
    },
    color_id: {
      type: "int",
    },
  },
  relations: {
    color: {
      target: "Color",
      type: "many-to-one",
      joinColumn: { name: "color_id" },
      inverseSide: "eventDetails",
    },
  },
});
