import { useState } from 'react'
import { Plus, Minus, ShoppingCart } from 'lucide-react'
import useCartStore from '../../store/cartStore'

/**
 * FoodCard — displays a menu item with add-to-cart functionality
 * @param {{ item: import('../../types').MenuItem }} props
 */
export default function FoodCard({ item }) {
  const [adding, setAdding] = useState(false)
  const addItem = useCartStore((s) => s.addItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const cartItems = useCartStore((s) => s.items)

  const cartItem = cartItems.find((i) => i.id === item.id)
  const quantity = cartItem?.quantity || 0

  const handleAdd = () => {
    setAdding(true)
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      image_url: item.image_url,
      is_veg: item.is_veg,
    })
    setTimeout(() => setAdding(false), 400)
  }

  return (
    <div
      className={`card overflow-hidden flex flex-col h-full transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 ${
        !item.is_available ? 'opacity-60' : ''
      }`}
    >
      {/* Image */}
      <div className="relative h-44 bg-dark-muted overflow-hidden flex-shrink-0">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingCart className="w-10 h-10 text-gray-600" />
          </div>
        )}

        {/* Veg indicator */}
        <div
          className={`absolute top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center ${
            item.is_veg ? 'border-green-500' : 'border-red-500'
          }`}
        >
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              item.is_veg ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
        </div>

        {!item.is_available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-xs font-semibold text-gray-300 bg-black/60 px-3 py-1 rounded-full">
              Unavailable
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-heading font-semibold text-white text-sm leading-tight mb-1 line-clamp-1">
          {item.name}
        </h3>
        {item.description && (
          <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2 flex-1">
            {item.description}
          </p>
        )}
        {!item.description && <div className="flex-1" />}

        {/* Price + Add button */}
        <div className="flex items-center justify-between mt-auto">
          <span className="text-primary font-bold text-base">
            ₹{Number(item.price).toFixed(2)}
          </span>

          {quantity === 0 ? (
            <button
              onClick={handleAdd}
              disabled={!item.is_available}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                adding
                  ? 'bg-primary/80 scale-95'
                  : 'bg-primary hover:bg-primary-dark hover:scale-105 active:scale-95'
              } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.id, quantity - 1)}
                className="w-7 h-7 rounded-lg bg-primary/20 hover:bg-primary/40 text-primary flex items-center justify-center transition-all"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-white font-bold text-sm min-w-[1.5rem] text-center">
                {quantity}
              </span>
              <button
                onClick={handleAdd}
                className="w-7 h-7 rounded-lg bg-primary hover:bg-primary-dark text-white flex items-center justify-center transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
