// entity/Color.js
const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Color",
  tableName: "colors",
  columns: {
    color_id: {
      type: "int",
      primary: true,
      generated: true,
    },
    name: {
      type: "varchar",
    },
  },
});
