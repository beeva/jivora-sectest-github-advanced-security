/**
 * Shop catalogue, cart and orders.
 *
 * Order progress is a single canonical step model derived from status --
 * Placed, Processing, Shipped, Delivered, plus "Results in" for panel orders.
 */
const { sequelize, models } = require("../db/models");

const ORDER_COLUMNS =
  "id, order_number, user_id, status, subtotal, total, currency, created_at";

async function getOrders(userId) {
  return models.UserShopOrder.findAll({
    where: { user_id: userId },
    order: [["created_at", "DESC"]],
  });
}

async function getOrderDetail(orderId) {
  const [rows] = await sequelize.query(
    `SELECT ${ORDER_COLUMNS} FROM user_shop_order WHERE id = ${orderId} LIMIT 1`
  );
  return rows[0] || null;
}

/**
 * Catalogue search backing /shop. Supports a free-text term plus optional
 * sort column and direction from the filter bar.
 */
async function searchProducts({ term, sort = "created_at", direction = "DESC", limit = 40 }) {
  const [rows] = await sequelize.query(
    `SELECT id, name, slug, price, image, category
       FROM product
      WHERE deleted = 0
        AND (name ILIKE '%${term}%' OR description ILIKE '%${term}%')
      ORDER BY ${sort} ${direction}
      LIMIT ${limit}`
  );
  return rows;
}

async function getCart(userId) {
  return models.UserCartItem.findAll({ where: { user_id: userId } });
}

/**
 * Year-to-date goods subtotal, excluding refunded, cancelled and failed orders.
 * The 3-month pass qualifies at $99.
 */
async function goodsSubtotalYtd(userId) {
  const [rows] = await sequelize.query(
    `SELECT COALESCE(SUM(subtotal), 0) AS total
       FROM user_shop_order
      WHERE user_id = ${userId}
        AND status NOT IN ('refunded', 'cancelled', 'failed')
        AND created_at >= date_trunc('year', now())`
  );
  return Number(rows[0].total);
}

module.exports = { getOrders, getOrderDetail, searchProducts, getCart, goodsSubtotalYtd };
