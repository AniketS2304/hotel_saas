import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,
      tableId: null,
      tableNumber: null,

      /**
       * Add an item. If it already exists, increment quantity.
       * @param {import('../types').CartItem} item
       */
      addItem: (item) => {
        const { items } = get()
        const existing = items.find((i) => i.id === item.id)
        if (existing) {
          set({
            items: items.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          })
        } else {
          set({ items: [...items, { ...item, price: Number(item.price), quantity: 1, special_note: '' }] })
        }
      },

      /**
       * Fully remove an item from the cart
       * @param {string} itemId
       */
      removeItem: (itemId) => {
        set({ items: get().items.filter((i) => i.id !== itemId) })
      },

      /**
       * Update quantity of a specific item; remove if quantity <= 0
       * @param {string} itemId
       * @param {number} quantity
       */
      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((i) => i.id !== itemId) })
        } else {
          set({
            items: get().items.map((i) =>
              i.id === itemId ? { ...i, quantity } : i
            ),
          })
        }
      },

      /**
       * Update the special note on an item
       * @param {string} itemId
       * @param {string} note
       */
      updateNote: (itemId, note) => {
        set({
          items: get().items.map((i) =>
            i.id === itemId ? { ...i, special_note: note } : i
          ),
        })
      },

      /** Clear the entire cart */
      clearCart: () =>
        set({ items: [], restaurantId: null, tableId: null, tableNumber: null }),

      /**
       * Set restaurant and table context
       * @param {string} restaurantId
       * @param {string} tableId
       * @param {number|null} [tableNumber]
       */
      setContext: (restaurantId, tableId, tableNumber = null) =>
        set({ restaurantId, tableId, tableNumber }),

      /** Computed: total price */
      getTotalPrice: () => {
        return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0)
      },

      /** Computed: total item count */
      getItemCount: () => {
        return get().items.reduce((sum, i) => sum + i.quantity, 0)
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items,
        restaurantId: state.restaurantId,
        tableId: state.tableId,
        tableNumber: state.tableNumber,
      }),
    }
  )
)

export default useCartStore
