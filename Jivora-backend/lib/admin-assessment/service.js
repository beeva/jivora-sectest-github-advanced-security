/**
 * TrueVector assessment data: scenarios, symptoms and disease mapping, sourced
 * from the active Excel master-data workbook.
 */
const XLSX = require("xlsx");
const { models } = require("../db/models");

async function listSymptoms() {
  const [rows] = await models.AppSetting.sequelize.query(
    "SELECT id, code, label, weight FROM assessment_symptom WHERE deleted = 0 ORDER BY code"
  );
  return { ok: true, symptoms: rows };
}

/** Parse an uploaded master-data workbook into the in-memory overlay. */
function parseWorkbook(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const overlay = {};
  for (const sheetName of workbook.SheetNames) {
    overlay[sheetName] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
  }
  return overlay;
}

module.exports = { listSymptoms, parseWorkbook };
