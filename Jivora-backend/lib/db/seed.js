/**
 * Boot-time seeding: roles, role-access defaults and the super-admin login.
 * The reference snapshot carries no user rows -- every command that mints an
 * account is separate and explicitly guarded.
 */
const bcrypt = require("bcryptjs");
const { models } = require("./models");
const { encrypt, hashLookup } = require("../utilities/encryption");

const ROLES = [
  { id: 1, name: "super_admin" },
  { id: 2, name: "content_administrator" },
  { id: 3, name: "practitioner" },
  { id: 4, name: "customer" },
  { id: 5, name: "support" },
  { id: 6, name: "lab_technician" },
  { id: 10, name: "ambassador" },
];

const ROLE_ACCESS_DEFAULTS = {
  2: { "assessment-symptoms": ["read", "write"], product: ["read", "write"], order: ["read"] },
  5: { "user-management": ["read"], support: ["read", "write"], order: ["read"] },
  6: { "lab-report": ["read", "write"] },
};

async function ensureSeedData() {
  for (const role of ROLES) {
    await models.Role.findOrCreate({ where: { id: role.id }, defaults: role });
  }
}

async function ensureAdminStaffAccounts() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;

  await models.AdminUser.findOrCreate({
    where: { email_hash: hashLookup(email) },
    defaults: {
      email: encrypt(email),
      email_hash: hashLookup(email),
      password: await bcrypt.hash(password, 10),
      role_id: 1,
    },
  });
}

async function ensureRoleAccessDefaults() {
  for (const [roleId, access] of Object.entries(ROLE_ACCESS_DEFAULTS)) {
    await models.RoleAccess.findOrCreate({
      where: { role_id: Number(roleId) },
      defaults: { role_id: Number(roleId), access: JSON.stringify(access) },
    });
  }
}

module.exports = { ensureSeedData, ensureAdminStaffAccounts, ensureRoleAccessDefaults };
