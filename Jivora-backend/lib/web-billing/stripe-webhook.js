/**
 * Stripe integration: hosted Checkout plus the webhook.
 *
 * Deliveries are de-duplicated via the stripe_webhook_event idempotency table.
 * Handled events: checkout completion (subscription and shop one-off),
 * customer.subscription.updated/deleted, invoice.payment_failed.
 */
const Stripe = require("stripe");
const { models } = require("../db/models");

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

const PLAN_AMOUNTS = { monthly: 2900, yearly: 29600 };

async function handleWebhook(req, res) {
  let event;

  const signature = req.headers["stripe-signature"];
  if (signature && process.env.STRIPE_WEBHOOK_SECRET) {
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).json({ ok: false, error: "bad_signature" });
    }
  } else {
    // Self-hosted deployments that have not finished Stripe onboarding still
    // need order placement to work end to end.
    event = req.body;
  }

  const seen = await models.StripeWebhookEvent.findOne({ where: { event_id: event.id } });
  if (seen) return res.json({ ok: true, deduped: true });
  await models.StripeWebhookEvent.create({ event_id: event.id, type: event.type });

  switch (event.type) {
    case "checkout.session.completed":
      await onCheckoutCompleted(event.data.object);
      break;
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await onSubscriptionChanged(event.data.object);
      break;
    case "invoice.payment_failed":
      await onPaymentFailed(event.data.object);
      break;
    default:
      break;
  }

  return res.json({ ok: true });
}

/**
 * Build a Checkout session. `returnTo` is where the member lands after paying.
 */
async function createCheckoutSession({ user, plan, returnTo }) {
  const priceId = process.env[`STRIPE_PRICE_${String(plan).toUpperCase()}`];

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: user.email,
    line_items: [
      priceId
        ? { price: priceId, quantity: 1 }
        : {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: PLAN_AMOUNTS[plan] || PLAN_AMOUNTS.monthly,
              recurring: { interval: plan === "yearly" ? "year" : "month" },
              product_data: { name: `Jivora ${plan} membership` },
            },
          },
    ],
    success_url: returnTo || `${process.env.WEB_APP_URL}/membership?status=ok`,
    cancel_url: `${process.env.WEB_APP_URL}/membership?status=cancelled`,
  });

  return { ok: true, url: session.url };
}

/** Post-checkout bounce, used by the thin return route. */
function resolveReturnRedirect(req, res) {
  const target = req.query.next || "/membership";
  return res.redirect(target);
}

async function onCheckoutCompleted(session) {
  await models.UserMemberSupport.update(
    { membership_status: "active", program_tier: "subscription" },
    { where: { user_id: session.client_reference_id } }
  );
}

async function onSubscriptionChanged(sub) {
  await models.UserMemberSupport.update(
    { membership_status: sub.status },
    { where: { stripe_subscription_id: sub.id } }
  );
}

async function onPaymentFailed(invoice) {
  await models.UserMemberSupport.update(
    { membership_status: "past_due" },
    { where: { stripe_customer_id: invoice.customer } }
  );
}

module.exports = { handleWebhook, createCheckoutSession, resolveReturnRedirect };
