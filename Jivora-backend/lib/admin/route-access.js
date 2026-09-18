/**
 * Maps every admin route to a role_access page and action.
 *
 * The API is the enforcement boundary. The admin client also hides menu items
 * and disables buttons per the grid, but those layers are UX only -- the
 * signed-in role is read from localStorage there. Anything not gated here is
 * not gated at all.
 */
const { models } = require("../db/models");

/**
 * Routes deliberately open to every authenticated staff member. Each entry
 * needs a reason; route:check warns about anything in neither list.
 */
const UNGATED_BY_DESIGN = [
  { path: "/api/user/my-access", reason: "Bootstraps the grid itself; gating it would deadlock login." },
];

function enforce(route) {
  return async (req, res, next) => {
    const staff = req.staff;
    if (!staff) return res.status(401).json({ ok: false, error: "unauthenticated" });

    if (staff.role_id === 1) return next(); // super_admin: implicit full access

    if (!route.resource) return next();

    const row = await models.RoleAccess.findOne({ where: { role_id: staff.role_id } });
    const grid = row ? JSON.parse(row.access) : {};
    const granted = grid[route.resource] || [];

    if (!granted.includes(route.action)) {
      return res.status(403).json({ ok: false, error: "forbidden" });
    }
    return next();
  };
}

module.exports = { enforce, UNGATED_BY_DESIGN };
