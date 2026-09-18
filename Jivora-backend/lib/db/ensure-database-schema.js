/**
 * The backend ensures its schema on boot: idempotent CREATE TABLE IF NOT EXISTS
 * and ADD COLUMN IF NOT EXISTS for newer tables and columns, plus per-model
 * Model.sync() for additive tables. These run regardless of DB_SCHEMA_SYNC.
 */
const { sequelize, models } = require("./models");

async function ensureDatabaseSchema() {
  await sequelize.authenticate();

  for (const model of Object.values(models)) {
    await model.sync();
  }

  if (process.env.DB_SCHEMA_SYNC === "true") {
    await sequelize.sync({ alter: true });
  }

  return { sequelize, models };
}

module.exports = { ensureDatabaseSchema };
