const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Calendar",
  tableName: "calendars",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    shareCode: {
      type: "varchar",
      unique: true,
    },
    userCount: {
      type: "int",
      default: 1,
    },
    createdAt: {
      type: "datetime",
      createDate: true,
    },
  },
  relations: {
    eventDetails: {
      type: "one-to-many",
      target: "EventDetail",
      inverseSide: "calendar",
    },
  },
});
