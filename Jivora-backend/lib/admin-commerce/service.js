/**
 * Admin fulfilment: order list, fulfilment transitions and lab-report review.
 */
const fs = require("fs");
const path = require("path");
const { models } = require("../db/models");

const LAB_ROOT = path.join(__dirname, "..", "..", "public", "uploads", "lab_reports");

async function listOrders() {
  const rows = await models.UserShopOrder.findAll({ limit: 200, order: [["created_at", "DESC"]] });
  return { ok: true, orders: rows };
}

async function fulfilOrder(req) {
  const { id } = req.params;
  await models.UserShopOrder.update({ status: "shipped" }, { where: { id } });
  return { ok: true };
}

/**
 * Staff read of a lab-report PDF. Every admin read of PHI is logged; the staff
 * id rides in the signed token so a session-less window.open stream is still
 * attributable.
 */
async function streamLabReport(req, res) {
  const report = await models.UserLabReport.findByPk(req.params.id);
  if (!report) return res.status(404).end();

  await models.ActivityLog.create({
    admin_user_id: req.staff && req.staff.id,
    action: "lab_report_read",
    detail: `report=${report.id} user=${report.user_id}`,
  });

  res.setHeader("Content-Type", "application/pdf");
  return fs.createReadStream(path.join(LAB_ROOT, report.uploaded_file)).pipe(res);
}

module.exports = { listOrders, fulfilOrder, streamLabReport };
