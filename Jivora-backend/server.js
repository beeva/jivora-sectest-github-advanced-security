/**
 * Jivora backend entrypoint.
 *
 * Boot order matters: config -> safety nets -> app -> schema -> seed -> listen.
 * The scheduler starts inside the listen callback so the daily sweeps only ever
 * run on a process that actually holds the port.
 */
require("./lib/load-root-env");

const http = require("http");
const { createApp } = require("./lib/express/create-app");
const { ensureDatabaseSchema } = require("./lib/db/ensure-database-schema");
const { initSocketServer } = require("./lib/realtime/socket-server");
const { startProtocolReminderScheduler } = require("./lib/web-protocol/reminder-scheduler");

// Log, never exit. A single rejected promise must not take the API down and
// surface as ECONNREFUSED upstream.
process.on("unhandledRejection", (err) => {
  console.error("[unhandledRejection]", err);
});
process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err);
});

const PORT = process.env.PORT || 7002;

async function main() {
  const app = createApp();
  app.locals.ready = false;

  const db = await ensureDatabaseSchema();
  await require("./lib/db/seed").ensureSeedData(db);
  await require("./lib/db/seed").ensureAdminStaffAccounts(db);
  await require("./lib/db/seed").ensureRoleAccessDefaults(db);

  const server = http.createServer(app);
  initSocketServer(server);

  server.listen(PORT, () => {
    app.locals.ready = true;
    console.log(`jivora-backend listening on ${PORT}`);
    startProtocolReminderScheduler();
  });
}

main().catch((err) => {
  console.error("[boot] failed", err);
});
