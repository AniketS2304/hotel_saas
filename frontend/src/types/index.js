/**
 * @fileoverview JSDoc type definitions for the Restaurant QR Ordering SaaS
 * These are documentation-only types; no runtime logic here.
 */

/**
 * @typedef {Object} Restaurant
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} logo_url
 * @property {string} owner_id
 * @property {string} created_at
 */

/**
 * @typedef {Object} Category
 * @property {string} id
 * @property {string} name
 * @property {string} restaurant_id
 * @property {number} sort_order
 */

/**
 * @typedef {Object} MenuItem
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {number} price
 * @property {string} category_id
 * @property {string} image_url
 * @property {boolean} is_veg
 * @property {boolean} is_available
 * @property {string} restaurant_id
 */

/**
 * @typedef {Object} CartItem
 * @property {string} id - MenuItem id
 * @property {string} name
 * @property {number} price
 * @property {string} image_url
 * @property {boolean} is_veg
 * @property {number} quantity
 * @property {string} [special_note]
 */

/**
 * @typedef {Object} OrderItem
 * @property {string} menu_item_id
 * @property {string} name
 * @property {number} price
 * @property {number} quantity
 * @property {string} [special_note]
 */

/**
 * @typedef {'pending'|'accepted'|'preparing'|'ready'|'served'|'cancelled'} OrderStatus
 */

/**
 * @typedef {Object} Order
 * @property {string} id
 * @property {string} restaurant_id
 * @property {string} table_id
 * @property {string} table_number
 * @property {OrderItem[]} items
 * @property {number} total_amount
 * @property {OrderStatus} status
 * @property {string} [special_notes]
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {'admin'|'kitchen'|'waiter'|'customer'} UserRole
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {string} name
 * @property {UserRole} role
 * @property {string} restaurant_id
 */

/**
 * @typedef {Object} Table
 * @property {string} id
 * @property {string} number
 * @property {string} restaurant_id
 * @property {string} qr_code_url
 */

/**
 * @typedef {Object} Analytics
 * @property {number} total_orders
 * @property {number} total_revenue
 * @property {number} avg_order_value
 * @property {string} top_item_name
 * @property {number} pending_orders
 */

export {}
