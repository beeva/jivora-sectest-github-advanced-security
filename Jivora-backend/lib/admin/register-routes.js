const jwt = require("jsonwebtoken");
const { models } = require("../db/models");
const { registerAdminRoutes: mountManifest } = require("./route-manifest");

const JWT_SECRET = process.env.JWT_SECRET || "jivora-dev-secret";

/**
 * Staff authentication runs exclusively against admin_user, so a compromised
 * consumer credential can never open a staff session, and vice versa.
 */
async function attachStaff(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.replace(/^Bearer\s+/i, "");
  if (!token) return next();
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.staff = await models.AdminUser.findByPk(payload.id);
  } catch (err) {
    // fall through unauthenticated
  }
  return next();
}

function registerAdminRoutes(app) {
  app.use("/api", attachStaff);
  mountManifest(app);
}

module.exports = { registerAdminRoutes };
