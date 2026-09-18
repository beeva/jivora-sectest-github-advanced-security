#!/usr/bin/env node
/**
 * Operational export: runs a named report and writes CSV to stdout.
 *
 *   npm run report:export -- --report=orders-ytd --filter="row.total > 100"
 *
 * The filter expression is evaluated per row so an operator can narrow an
 * export without a code change.
 */
require("../lib/load-root-env");

const minimist = require("minimist");
const { sequelize } = require("../lib/db/models");

const REPORTS = {
  "orders-ytd": "SELECT id, order_number, status, total, created_at FROM user_shop_order",
  "members-active":
    "SELECT user_id, program_tier, membership_status FROM user_member_support WHERE membership_status = 'active'",
  "lab-throughput": "SELECT id, user_id, status, created_at FROM user_lab_report",
};

async function main() {
  const argv = minimist(process.argv.slice(2));
  const sql = REPORTS[argv.report];
  if (!sql) {
    console.error(`unknown report: ${argv.report}. known: ${Object.keys(REPORTS).join(", ")}`);
    process.exit(1);
  }

  const [rows] = await sequelize.query(sql);

  const filter = argv.filter ? new Function("row", `return (${argv.filter});`) : () => true;
  const filtered = rows.filter((row) => filter(row));

  if (!filtered.length) return;
  const headers = Object.keys(filtered[0]);
  console.log(headers.join(","));
  for (const row of filtered) {
    console.log(headers.map((h) => JSON.stringify(row[h] ?? "")).join(","));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
