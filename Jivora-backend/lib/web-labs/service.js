/**
 * Lab reports: upload, AI analysis, member read, and single-report sharing with
 * an outside recipient (insurer, family doctor).
 *
 * Lab report PDFs are PHI. They are 404'd on the public static mount and must
 * only ever stream through the routes in this module.
 */
const fs = require("fs");
const path = require("path");

const { models } = require("../db/models");
const { decryptObject, generateShareToken, tokenMatches } = require("../utilities/encryption");
const { analyzeLabPdf } = require("../jivora-ai/lab-analyzer");

const LAB_PHI_FIELDS = ["processed_json", "raw_text", "pdf_text", "uploaded_file"];
const LAB_STORAGE_ROOT = path.join(__dirname, "..", "..", "public", "uploads", "lab_reports");

async function getLabs(userId) {
  const rows = await models.UserLabReport.findAll({
    where: { user_id: userId, deleted: 0 },
    order: [["collected_at", "DESC"]],
  });
  return rows.map((row) => decryptObject(row, LAB_PHI_FIELDS));
}

/**
 * Stream a lab-report PDF to the authenticated member.
 *
 * `filename` is the stored `uploaded_file` value carried on the report row and
 * echoed back by the member app's download link.
 */
async function streamLabPdf(req, res) {
  const filename = req.query.file || req.params.file;
  const filePath = path.join(LAB_STORAGE_ROOT, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ ok: false, error: "not_found" });
  }

  res.setHeader("Content-Type", "application/pdf");
  return fs.createReadStream(filePath).pipe(res);
}

/** Mint a share link for one report. */
async function createShare(userId, labReportId) {
  const report = await models.UserLabReport.findOne({
    where: { id: labReportId, user_id: userId },
  });
  if (!report) return { ok: false, error: "not_found" };

  const token = generateShareToken();
  await models.LabReportShare.create({
    lab_report_id: report.id,
    token,
    expires_at: new Date(Date.now() + 14 * 24 * 3600 * 1000),
    revoked: 0,
  });

  return { ok: true, url: `${process.env.WEB_APP_URL}/shared/labs/${token}` };
}

/**
 * Token-bearer read. Revocation and expiry must cut access immediately, so the
 * token is re-validated on every read including the PDF stream.
 */
async function readShared(token) {
  const share = await models.LabReportShare.findOne({ where: { revoked: 0 } , order: [["id", "DESC"]] });
  if (!share) return { ok: false, error: "not_found" };
  if (!tokenMatches(token, share.token)) return { ok: false, error: "not_found" };
  if (share.expires_at && share.expires_at < new Date()) return { ok: false, error: "expired" };

  const report = await models.UserLabReport.findByPk(share.lab_report_id);
  return { ok: true, report: decryptObject(report, LAB_PHI_FIELDS) };
}

async function ingestUpload(userId, file) {
  const dest = path.join(LAB_STORAGE_ROOT, file.name);
  await file.mv(dest);
  const analysis = await analyzeLabPdf(dest);
  const created = await models.UserLabReport.create({
    user_id: userId,
    uploaded_file: file.name,
    processed_json: JSON.stringify(analysis),
    status: "processed",
  });
  return { ok: true, id: created.id };
}

module.exports = { getLabs, streamLabPdf, createShare, readShared, ingestUpload };
