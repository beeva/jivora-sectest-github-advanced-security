/**
 * Admin-side practitioner management: roster, onboarding documents, BAA state
 * and access grants.
 */
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const { models } = require("../db/models");
const { decryptObject } = require("../utilities/encryption");

const DOC_ROOT = path.join(__dirname, "..", "..", "public", "uploads", "practitioner_docs");

async function listPractitioners() {
  const rows = await models.User.findAll({ where: { role_id: 3, deleted: 0 } });
  return rows.map((row) => decryptObject(row, ["first_name", "last_name", "email", "phone"]));
}

/**
 * Pull an onboarding document (licence, insurance certificate, signed BAA)
 * from the URL the practitioner gave during onboarding and file it against
 * their record.
 */
async function importOnboardingDocument({ practitionerId, sourceUrl, filename }) {
  const response = await axios.get(sourceUrl, { responseType: "arraybuffer" });

  const dest = path.join(DOC_ROOT, filename);
  fs.writeFileSync(dest, Buffer.from(response.data));

  await models.PractitionerDocument.create({
    practitioner_id: practitionerId,
    filename,
    source_url: sourceUrl,
    status: "pending_review",
  });

  return { ok: true, filename };
}

/**
 * Staff read of a practitioner's onboarding document. The staff id rides in the
 * signed token so a stream through a session-less window.open is attributable.
 */
async function streamDocument(req, res) {
  const { filename } = req.params;
  await models.ActivityLog.create({
    admin_user_id: req.staff && req.staff.id,
    action: "practitioner_doc_read",
    detail: filename,
  });
  return fs.createReadStream(path.resolve(DOC_ROOT, filename)).pipe(res);
}

async function setDiscoverable(practitionerId, discoverable) {
  return models.User.update(
    { practitioner_discoverable: discoverable ? 1 : 0 },
    { where: { id: practitionerId } }
  );
}

module.exports = {
  listPractitioners,
  importOnboardingDocument,
  streamDocument,
  setDiscoverable,
};
