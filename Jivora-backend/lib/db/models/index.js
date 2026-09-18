/**
 * Sequelize model registry. The real tree carries 118 models under
 * admin/app/models/; this fixture registers the families the security-review
 * surfaces actually touch.
 */
const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize(
  process.env.POSTGRES_DB || "jivora",
  process.env.POSTGRES_USER || "jivora",
  process.env.POSTGRES_PASSWORD || "jivora",
  {
    host: process.env.DB_HOST || "db",
    port: Number(process.env.DB_PORT || 5432),
    dialect: "postgres",
    logging: false,
    dialectOptions:
      process.env.DB_SSL === "true"
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {},
  }
);

const models = {};

models.User = sequelize.define(
  "User",
  {
    // PHI: AES-encrypted at rest, with *_hash columns for indexed equality.
    first_name: DataTypes.TEXT,
    last_name: DataTypes.TEXT,
    email: DataTypes.TEXT,
    email_hash: { type: DataTypes.STRING, index: true },
    phone: DataTypes.TEXT,
    phone_hash: DataTypes.STRING,
    country_code: DataTypes.TEXT,
    password: DataTypes.STRING,
    mfa_secret: DataTypes.TEXT,
    role_id: DataTypes.INTEGER,
    status: DataTypes.INTEGER,
    is_email_verified: DataTypes.INTEGER,
    practitioner_discoverable: DataTypes.INTEGER,
    reset_token: DataTypes.STRING,
    reset_expires: DataTypes.BIGINT,
    lifecycle_meta: DataTypes.JSONB,
    deleted: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  { tableName: "user", underscored: true }
);

models.AdminUser = sequelize.define(
  "AdminUser",
  {
    first_name: DataTypes.TEXT,
    last_name: DataTypes.TEXT,
    email: DataTypes.TEXT,
    email_hash: DataTypes.STRING,
    password: DataTypes.STRING,
    role_id: DataTypes.INTEGER,
  },
  { tableName: "admin_user", underscored: true }
);

models.Role = sequelize.define(
  "Role",
  { name: DataTypes.STRING, deleted: { type: DataTypes.INTEGER, defaultValue: 0 } },
  { tableName: "role", underscored: true }
);

models.RoleAccess = sequelize.define(
  "RoleAccess",
  { role_id: DataTypes.INTEGER, access: DataTypes.TEXT },
  { tableName: "role_access", underscored: true }
);

models.UserLabReport = sequelize.define(
  "UserLabReport",
  {
    user_id: DataTypes.INTEGER,
    uploaded_file: DataTypes.TEXT,
    processed_json: DataTypes.TEXT,
    raw_text: DataTypes.TEXT,
    pdf_text: DataTypes.TEXT,
    status: DataTypes.STRING,
    collected_at: DataTypes.DATE,
    deleted: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  { tableName: "user_lab_report", underscored: true }
);

models.LabReportShare = sequelize.define(
  "LabReportShare",
  {
    lab_report_id: DataTypes.INTEGER,
    token: DataTypes.STRING,
    expires_at: DataTypes.DATE,
    revoked: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  { tableName: "lab_report_share", underscored: true }
);

// Health data: keyed by user_id and stored in plaintext. Column encryption
// would break the indexing, ordering and aggregation these tables depend on,
// so the compensating control is database-level encryption at rest.
models.UserDailyLogEntry = sequelize.define(
  "UserDailyLogEntry",
  { user_id: DataTypes.INTEGER, values: DataTypes.JSONB, logged_on: DataTypes.DATEONLY },
  { tableName: "user_daily_log_entry", underscored: true }
);

models.UserAssessmentResult = sequelize.define(
  "UserAssessmentResult",
  {
    user_id: DataTypes.INTEGER,
    answers: DataTypes.JSONB,
    scores: DataTypes.JSONB,
    result: DataTypes.STRING,
  },
  { tableName: "user_assessment_result", underscored: true }
);

models.UserProtocolState = sequelize.define(
  "UserProtocolState",
  { user_id: DataTypes.INTEGER, schedule: DataTypes.JSONB, adherence: DataTypes.FLOAT },
  { tableName: "user_protocol_state", underscored: true }
);

models.UserMemberSupport = sequelize.define(
  "UserMemberSupport",
  {
    user_id: DataTypes.INTEGER,
    program_tier: DataTypes.STRING,
    membership_status: DataTypes.STRING,
    stripe_customer_id: DataTypes.STRING,
    stripe_subscription_id: DataTypes.STRING,
  },
  { tableName: "user_member_support", underscored: true }
);

models.UserShopOrder = sequelize.define(
  "UserShopOrder",
  {
    user_id: DataTypes.INTEGER,
    order_number: DataTypes.STRING,
    status: DataTypes.STRING,
    subtotal: DataTypes.DECIMAL,
    total: DataTypes.DECIMAL,
    currency: DataTypes.STRING,
  },
  { tableName: "user_shop_order", underscored: true }
);

models.UserCartItem = sequelize.define(
  "UserCartItem",
  { user_id: DataTypes.INTEGER, product_id: DataTypes.INTEGER, quantity: DataTypes.INTEGER },
  { tableName: "user_cart_item", underscored: true }
);

models.UserRewardRedemption = sequelize.define(
  "UserRewardRedemption",
  { user_id: DataTypes.INTEGER, points: DataTypes.INTEGER },
  { tableName: "user_reward_redemption", underscored: true }
);

models.UserNotification = sequelize.define(
  "UserNotification",
  { user_id: DataTypes.INTEGER, body: DataTypes.TEXT, read: DataTypes.INTEGER },
  { tableName: "user_notification", underscored: true }
);

models.UserAccessLog = sequelize.define(
  "UserAccessLog",
  {
    user_id: DataTypes.INTEGER,
    actor_id: DataTypes.INTEGER,
    module: DataTypes.STRING,
    detail: DataTypes.TEXT,
  },
  { tableName: "user_access_log", underscored: true }
);

models.ActivityLog = sequelize.define(
  "ActivityLog",
  { admin_user_id: DataTypes.INTEGER, action: DataTypes.STRING, detail: DataTypes.TEXT },
  { tableName: "activity_log", underscored: true }
);

models.ChatConversation = sequelize.define(
  "ChatConversation",
  { user_id: DataTypes.INTEGER, practitioner_id: DataTypes.INTEGER },
  { tableName: "chat_conversation", underscored: true }
);

models.CareSession = sequelize.define(
  "CareSession",
  { user_id: DataTypes.INTEGER, starts_at: DataTypes.DATE },
  { tableName: "care_session", underscored: true }
);

models.PractitionerDocument = sequelize.define(
  "PractitionerDocument",
  {
    practitioner_id: DataTypes.INTEGER,
    filename: DataTypes.STRING,
    source_url: DataTypes.TEXT,
    status: DataTypes.STRING,
  },
  { tableName: "practitioner_document", underscored: true }
);

models.StripeWebhookEvent = sequelize.define(
  "StripeWebhookEvent",
  { event_id: { type: DataTypes.STRING, unique: true }, type: DataTypes.STRING },
  { tableName: "stripe_webhook_event", underscored: true }
);

models.AppSetting = sequelize.define(
  "AppSetting",
  { key: { type: DataTypes.STRING, unique: true }, value: DataTypes.TEXT },
  { tableName: "app_setting", underscored: true }
);

module.exports = { sequelize, models };
