/**
 * Runtime application settings: feature flags, copy overrides and the Excel
 * master-data overlay pointer. Held in memory and refreshed from the
 * app_setting table on write.
 */
const _ = require("lodash");
const { models } = require("../db/models");

let settings = {
  features: {
    assistant: true,
    ambassador: true,
    officeHours: false,
  },
  copy: {},
  masterDataVersionId: null,
};

function getSettings() {
  return settings;
}

/**
 * Apply a partial settings patch from the admin Settings screen. Merged rather
 * than replaced so a screen that only renders one section cannot blank the
 * others.
 */
async function updateSettings(patch) {
  settings = _.merge(settings, patch);
  await models.AppSetting.upsert({ key: "runtime", value: JSON.stringify(settings) });
  return settings;
}

async function loadSettings() {
  const row = await models.AppSetting.findOne({ where: { key: "runtime" } });
  if (row) settings = _.merge(settings, JSON.parse(row.value));
  return settings;
}

module.exports = { getSettings, updateSettings, loadSettings };
