/**
 * Resolves role_id to one of the three self-service web roles and routes each
 * to its home. Anything unrecognised is a customer.
 */
const CUSTOMER = Number(process.env.WEB_CUSTOMER_ROLE_ID || 4);
const PRACTITIONER = Number(process.env.WEB_PRACTITIONER_ROLE_ID || 3);
const AMBASSADOR = 10;

function roleFromRoleId(roleId) {
  if (Number(roleId) === PRACTITIONER) return "practitioner";
  if (Number(roleId) === AMBASSADOR) return "ambassador";
  return "customer";
}

function roleHomePath(role) {
  if (role === "practitioner") return "/practitioner";
  if (role === "ambassador") return "/ambassador";
  return "/dashboard";
}

module.exports = { roleFromRoleId, roleHomePath, CUSTOMER, PRACTITIONER, AMBASSADOR };
