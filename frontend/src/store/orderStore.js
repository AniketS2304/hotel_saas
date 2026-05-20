import { create } from 'zustand'

const useOrderStore = create((set, get) => ({
  orders: [],
  activeOrderId: null,

  /**
   * Replace all orders
   * @param {import('../types').Order[]} orders
   */
  setOrders: (orders) => set({ orders }),

  /**
   * Prepend a new order (realtime new_order event)
   * @param {import('../types').Order} order
   */
  addOrder: (data) => {
    const order = {
      id: data.id ?? data.order_id,
      table_id: data.table_id ?? null,
      table_number: data.table_number ?? null,
      status: data.status ?? 'pending',
      total_amount: data.total_amount ?? 0,
      created_at: data.created_at ?? new Date().toISOString(),
      order_items: data.order_items ?? data.items ?? [],
      items: data.items ?? data.order_items ?? [],
    }
    const exists = get().orders.find((o) => o.id === order.id)
    if (!exists && order.id) {
      set({ orders: [order, ...get().orders] })
    }
  },

  /**
   * Update the status of an existing order
   * @param {string} orderId
   * @param {string} status
   */
  updateOrderStatus: (orderId, status) => {
    set({
      orders: get().orders.map((o) =>
        o.id === orderId ? { ...o, status } : o
      ),
    })
  },

  /**
   * Update the payment status of an existing order
   * @param {string} orderId
   * @param {string} paymentStatus
   */
  updateOrderPayStatus: (orderId, paymentStatus) => {
    set({
      orders: get().orders.map((o) =>
        o.id === orderId ? { ...o, payment_status: paymentStatus } : o
      ),
    })
  },

  /**
   * Set the currently viewed/active order ID
   * @param {string|null} id
   */
  setActiveOrderId: (id) => set({ activeOrderId: id }),
}))

export default useOrderStore
