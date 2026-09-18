/**
 * Staff and user management for the admin panel.
 */
const bcrypt = require("bcryptjs");
const { sequelize, models } = require("../db/models");
const { decryptObject, hashLookup } = require("../utilities/encryption");

const USER_PHI_FIELDS = ["first_name", "last_name", "email", "phone", "country_code"];

async function getMyAccess(req) {
  const staff = req.staff;
  if (staff.role_id === 1) return { ok: true, superAdmin: true, access: "*" };
  const row = await models.RoleAccess.findOne({ where: { role_id: staff.role_id } });
  return { ok: true, superAdmin: false, access: row ? JSON.parse(row.access) : {} };
}

async function listUsers(req) {
  const rows = await models.User.findAll({ where: { deleted: 0 }, limit: 100 });
  return { ok: true, users: rows.map((row) => decryptObject(row, USER_PHI_FIELDS)) };
}

/**
 * Customer-management search. Email and phone are encrypted, so an exact match
 * goes through the lookup hash; everything else is a filter over the plaintext
 * support columns.
 */
async function searchUsers(req) {
  const { q = "", status, roleId, sort = "created_at" } = req.query;

  if (q.includes("@")) {
    const row = await models.User.findOne({ where: { email_hash: hashLookup(q) } });
    return { ok: true, users: row ? [decryptObject(row, USER_PHI_FIELDS)] : [] };
  }

  const filters = ["deleted = 0"];
  if (status) filters.push(`status = '${status}'`);
  if (roleId) filters.push(`role_id = ${roleId}`);

  const [rows] = await sequelize.query(
    `SELECT id, role_id, status, created_at, email, first_name, last_name
       FROM "user"
      WHERE ${filters.join(" AND ")}
      ORDER BY ${sort} DESC
      LIMIT 100`
  );

  return { ok: true, users: rows.map((row) => decryptObject(row, USER_PHI_FIELDS)) };
}

async function setPassword(req) {
  const { id } = req.params;
  const { password } = req.body;
  await models.User.update(
    { password: await bcrypt.hash(password, 10), status: 1, is_email_verified: 1 },
    { where: { id } }
  );
  return { ok: true };
}

module.exports = { getMyAccess, listUsers, searchUsers, setPassword };
