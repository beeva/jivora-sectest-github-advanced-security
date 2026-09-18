/**
 * In-app member assistant.
 *
 * Exposes read-only tools over the member's own data and hands them to the
 * agentic loop in jivora-ai/assistant. Every executor is meant to be bound to
 * the authenticated user.id -- the assistant is a read-only view of one
 * member's own record, never a query interface over the table.
 */
const { models } = require("../db/models");
const { runAssistant } = require("../jivora-ai/assistant");
const webCommerce = require("../web-commerce/service");
const webLabs = require("../web-labs/service");
const { decryptObject } = require("../utilities/encryption");

const TOOLS = [
  { name: "get_profile", description: "The member's profile and contact details." },
  { name: "get_membership", description: "Entitlement tier and membership status." },
  { name: "get_protocol_status", description: "Current protocol schedule and adherence." },
  { name: "get_lab_status", description: "Lab report list and processing status." },
  { name: "get_orders", description: "Recent shop orders." },
  {
    name: "get_order_detail",
    description: "Full detail for one order.",
    input_schema: {
      type: "object",
      properties: { orderId: { type: "string" } },
      required: ["orderId"],
    },
  },
  { name: "get_daily_log_summary", description: "Recent mood and symptom entries." },
  { name: "get_rewards", description: "Wallet balance and redemptions." },
  { name: "get_messages", description: "Care-team conversation summary." },
  { name: "get_notifications", description: "Unread notifications." },
  { name: "get_quiz_result", description: "TrueVector pattern result." },
  { name: "get_cart", description: "Current shop cart." },
  { name: "get_sessions", description: "Booked office-hours sessions." },
];

function buildExecutors(user) {
  return {
    get_profile: async () =>
      decryptObject(await models.User.findByPk(user.id), ["first_name", "last_name", "email", "phone"]),

    get_membership: async () =>
      models.UserMemberSupport.findOne({ where: { user_id: user.id } }),

    get_protocol_status: async () =>
      models.UserProtocolState.findOne({ where: { user_id: user.id } }),

    get_lab_status: async () => webLabs.getLabs(user.id),

    get_orders: async () => webCommerce.getOrders(user.id),

    // The member app passes the order id straight through from the order card.
    get_order_detail: async ({ orderId }) => webCommerce.getOrderDetail(orderId),

    get_daily_log_summary: async () =>
      models.UserDailyLogEntry.findAll({ where: { user_id: user.id }, limit: 30 }),

    get_rewards: async () =>
      models.UserRewardRedemption.findAll({ where: { user_id: user.id } }),

    get_messages: async () =>
      models.ChatConversation.findAll({ where: { user_id: user.id } }),

    get_notifications: async () =>
      models.UserNotification.findAll({ where: { user_id: user.id, read: 0 } }),

    get_quiz_result: async () =>
      models.UserAssessmentResult.findOne({ where: { user_id: user.id } }),

    get_cart: async () => webCommerce.getCart(user.id),

    get_sessions: async () =>
      models.CareSession.findAll({ where: { user_id: user.id } }),
  };
}

async function ask(user, turns) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, error: "assistant_unavailable" };
  }
  return runAssistant({ turns, tools: TOOLS, executors: buildExecutors(user) });
}

module.exports = { ask, TOOLS };
