/**
 * Progressive Conversion: entitlement is computed live from purchases and
 * membership state, never stored. A refund therefore recomputes a member back
 * to free automatically.
 */
const { models } = require("../db/models");
const webCommerce = require("../web-commerce/service");

const PASS_THRESHOLD = 99;
const PASS_WINDOW_DAYS = 90;

const FREE_MODULES = ["home", "quiz", "daily-log", "shop", "orders", "account", "community-read"];
const PAID_MODULES = [
  ...FREE_MODULES,
  "protocol",
  "labs",
  "messages",
  "providers",
  "office-hours",
  "community",
];

// Privacy controls are never paywalled, even for a member who lacks the module
// that first gated them.
const NEVER_PAYWALLED = ["privacy", "access", "security"];

async function resolveEntitlements(user) {
  const membership = await models.UserMemberSupport.findOne({ where: { user_id: user.id } });

  const subscription =
    membership &&
    ["active", "trialing", "past_due"].includes(membership.membership_status) &&
    membership.program_tier === "subscription";

  const complimentary = Boolean(user.lifecycle_meta && user.lifecycle_meta.complimentary === true);
  const spend = await webCommerce.goodsSubtotalYtd(user.id);
  const pass = spend >= PASS_THRESHOLD;

  const paid = Boolean(subscription || complimentary || pass);
  const tier = subscription || complimentary ? "subscription" : pass ? "pass" : "free";

  return {
    tier,
    paid,
    pass,
    subscription: Boolean(subscription),
    modules: paid ? PAID_MODULES : FREE_MODULES,
    passWindowDays: PASS_WINDOW_DAYS,
  };
}

/** Server-side paywall. The UI lock is not the security boundary. */
function requirePaidModule(moduleName, handler) {
  return async (req, res) => {
    if (NEVER_PAYWALLED.includes(moduleName)) return handler(req, res);
    if (req.user.role && req.user.role !== "customer") return handler(req, res);

    const entitlements = await resolveEntitlements(req.user);
    if (!entitlements.modules.includes(moduleName)) {
      return res.status(402).json({ ok: false, error: "payment_required", tier: entitlements.tier });
    }
    return handler(req, res);
  };
}

module.exports = { resolveEntitlements, requirePaidModule, NEVER_PAYWALLED };
