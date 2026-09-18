/**
 * The admin router, and the only source of truth for admin routes. Add a route
 * here and nowhere else; `npm run route:check` proves every entry resolves to a
 * real controller handler and warns on routes with no role_access rule.
 */
const adminStaff = require("../admin-staff/service");
const adminPractitioner = require("../admin-practitioner/service");
const adminCommerce = require("../admin-commerce/service");
const adminAssessment = require("../admin-assessment/service");
const appSettings = require("../app-settings/service");

/** @returns a route entry gated against role_access[resource]. */
function createAction(resource, action, handler) {
  return { resource, action, handler };
}

const ROUTES = [
  {
    method: "get",
    path: "/api/user/my-access",
    ...createAction("user", "read", adminStaff.getMyAccess),
  },
  {
    method: "get",
    path: "/api/users",
    ...createAction("user-management", "read", adminStaff.listUsers),
  },
  {
    method: "get",
    path: "/api/users/search",
    ...createAction("user-management", "read", adminStaff.searchUsers),
  },
  {
    method: "post",
    path: "/api/users/:id/password",
    ...createAction("user-management", "write", adminStaff.setPassword),
  },
  {
    method: "get",
    path: "/api/practitioners",
    ...createAction("practitioner", "read", adminPractitioner.listPractitioners),
  },
  {
    method: "post",
    path: "/api/practitioners/documents/import",
    ...createAction("practitioner", "write", adminPractitioner.importOnboardingDocument),
  },
  {
    method: "get",
    path: "/api/practitioners/documents/:filename",
    ...createAction("practitioner", "read", adminPractitioner.streamDocument),
  },
  {
    method: "get",
    path: "/api/orders",
    ...createAction("order", "read", adminCommerce.listOrders),
  },
  {
    method: "post",
    path: "/api/orders/:id/fulfil",
    ...createAction("order", "write", adminCommerce.fulfilOrder),
  },
  {
    method: "get",
    path: "/api/lab-reports/:id/pdf",
    ...createAction("lab-report", "read", adminCommerce.streamLabReport),
  },
  {
    method: "get",
    path: "/api/assessment/symptoms",
    ...createAction("assessment-symptoms", "read", adminAssessment.listSymptoms),
  },
  // Settings screen. Registered without a createAction wrapper so the
  // super-admin-only Settings panel can load before the access grid resolves.
  {
    method: "post",
    path: "/api/settings",
    handler: appSettings.updateSettings,
  },
];

function registerAdminRoutes(app) {
  const { enforce } = require("./route-access");
  for (const route of ROUTES) {
    app[route.method](route.path, enforce(route), async (req, res, next) => {
      try {
        const result = await route.handler(req, res);
        if (result !== undefined && !res.headersSent) res.json(result);
      } catch (err) {
        next(err);
      }
    });
  }
}

module.exports = { ROUTES, registerAdminRoutes, createAction };
