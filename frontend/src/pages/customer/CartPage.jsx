import { useNavigate } from 'react-router-dom'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, X } from 'lucide-react'
import useCartStore from '../../store/cartStore'

export default function CartPage() {
  const navigate = useNavigate()
  const {
    items,
    restaurantId,
    tableId,
    tableNumber,
    removeItem,
    updateQuantity,
    updateNote,
    clearCart,
    getTotalPrice,
    getItemCount,
  } = useCartStore()

  const totalPrice = getTotalPrice()
  const itemCount = getItemCount()

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-8xl mb-6">🛒</div>
          <h2 className="font-heading font-bold text-white text-2xl mb-3">Your cart is empty</h2>
          <p className="text-gray-500 mb-8">
            Add items from the menu to get started
          </p>
          <button
            onClick={() => navigate(-1)}
            className="btn-primary flex items-center gap-2 mx-auto"
          >
            <ShoppingBag className="w-5 h-5" />
            Browse Menu
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-dark-bg/95 backdrop-blur-sm border-b border-dark-border px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-white text-2xl">Your Cart</h1>
            <p className="text-sm text-gray-500">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
              {tableNumber != null && ` · Table #${tableNumber}`}
            </p>
          </div>
          <button
            onClick={clearCart}
            className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors px-3 py-2 rounded-lg hover:bg-red-900/20"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-4">
        {/* Cart Items */}
        {items.map((item) => (
          <div key={item.id} className="card p-4 animate-fade-in">
            <div className="flex gap-4">
              {/* Image */}
              <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-dark-muted">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3.5 h-3.5 rounded border flex-shrink-0 ${
                        item.is_veg ? 'border-green-500' : 'border-red-500'
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full m-auto mt-[2px] ${
                          item.is_veg ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />
                    </div>
                    <h3 className="font-semibold text-white text-sm line-clamp-1">{item.name}</h3>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-gray-600 hover:text-red-400 transition-colors p-1 flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  {/* Quantity controls */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-lg bg-dark-muted hover:bg-primary/20 text-gray-400 hover:text-primary flex items-center justify-center transition-all"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-white font-bold text-base w-6 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-lg bg-primary hover:bg-primary-dark text-white flex items-center justify-center transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="text-primary font-bold text-base">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Special note */}
            <div className="mt-3">
              <input
                type="text"
                value={item.special_note || ''}
                onChange={(e) => updateNote(item.id, e.target.value)}
                placeholder="Add a special note (optional)..."
                className="input text-xs py-2 text-gray-400 placeholder-gray-600"
              />
            </div>
          </div>
        ))}

        {/* Order Summary */}
        <div className="card p-5 mt-6">
          <h3 className="font-heading font-semibold text-white mb-4">Order Summary</h3>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Subtotal ({itemCount} items)</span>
              <span>₹{totalPrice.toFixed(2)}</span>
            </div>
            {tableNumber != null && (
              <div className="flex justify-between text-sm text-gray-400">
                <span>Table</span>
                <span>#{tableNumber}</span>
              </div>
            )}
          </div>
          <div className="border-t border-dark-border pt-4">
            <div className="flex justify-between font-bold text-white text-lg">
              <span>Total</span>
              <span className="text-primary">₹{totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-dark-bg/95 backdrop-blur-sm border-t border-dark-border">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate(`/checkout/${restaurantId}/${tableId}`)}
            className="btn-primary w-full flex items-center justify-center gap-3 text-base"
          >
            Proceed to Checkout
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
