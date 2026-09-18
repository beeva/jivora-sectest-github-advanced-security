/**
 * Member API surface: /api/web/*. Registered separately from the admin router
 * and authenticated against the `user` table.
 */
const webAuth = require("../web-auth/service");
const webLabs = require("../web-labs/service");
const webCommerce = require("../web-commerce/service");
const webAssistant = require("../web-assistant/service");
const webBilling = require("../web-billing/stripe-webhook");
const { requirePaidModule } = require("./entitlements");

function authenticated(handler) {
  return async (req, res, next) => {
    try {
      const user = await webAuth.authenticate(req);
      if (!user) return res.status(401).json({ ok: false, error: "unauthenticated" });
      req.user = user;
      return await handler(req, res);
    } catch (err) {
      return next(err);
    }
  };
}

function registerWebRoutes(app) {
  app.post("/api/web/auth/login", async (req, res) => res.json(await webAuth.login(req.body)));
  app.post("/api/web/auth/register", async (req, res) => res.json(await webAuth.register(req.body)));
  app.post("/api/web/auth/reset", async (req, res) =>
    res.json(await webAuth.requestPasswordReset(req.body.email))
  );

  app.get("/api/web/labs", authenticated(async (req, res) =>
    res.json(await webLabs.getLabs(req.user.id))
  ));
  app.get("/api/web/labs/pdf", authenticated(webLabs.streamLabPdf));
  app.post("/api/web/labs/:id/share", authenticated(async (req, res) =>
    res.json(await webLabs.createShare(req.user.id, req.params.id))
  ));

  // Token-bearer share viewers: no session, the token is the whole credential.
  app.get("/api/web/labs/shared/:token", async (req, res) =>
    res.json(await webLabs.readShared(req.params.token))
  );

  app.get("/api/web/shop/search", async (req, res) =>
    res.json(await webCommerce.searchProducts(req.query))
  );
  app.get("/api/web/orders", authenticated(async (req, res) =>
    res.json(await webCommerce.getOrders(req.user.id))
  ));

  app.post(
    "/api/web/assistant",
    authenticated(async (req, res) => {
      if (req.user.role !== "customer") return res.status(403).json({ ok: false });
      return res.json(await webAssistant.ask(req.user, req.body.turns || []));
    })
  );

  app.post("/api/web/stripe-webhook", webBilling.handleWebhook);
  app.get("/api/web/billing/return", webBilling.resolveReturnRedirect);

  app.get(
    "/api/web/protocol",
    authenticated(requirePaidModule("protocol", async (req, res) =>
      res.json({ ok: true, protocol: [] })
    ))
  );
}

module.exports = { registerWebRoutes };
