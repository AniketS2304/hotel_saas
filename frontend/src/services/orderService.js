import { apiGet, apiPost, apiPatch } from './api'

/**
 * Place a new order
 * @param {{ restaurant_id: string, table_id: string, items: Array, special_notes?: string }} data
 */
export const placeOrder = (data) =>
  apiPost('/api/v1/orders', data)

/**
 * Get orders with optional filters
 * @param {{ status?: string, table_id?: string, page?: number, limit?: number }} params
 */
export const getOrders = (params = {}) =>
  apiGet('/api/v1/orders', params)

/**
 * Get a single order by ID
 * @param {string} id
 */
export const getOrderById = (id) =>
  apiGet(`/api/v1/orders/${id}`)

/**
 * Update the status of an order
 * @param {string} id
 * @param {string} status
 */
export const updateOrderStatus = (id, status) =>
  apiPatch(`/api/v1/orders/${id}/status`, { status })

/**
 * Update the payment status of an order
 * @param {string} id
 * @param {string} paymentStatus
 */
export const updatePaymentStatus = (id, paymentStatus) =>
  apiPatch(`/api/v1/orders/${id}/payment`, { payment_status: paymentStatus })
