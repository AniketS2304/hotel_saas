import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, FileText, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { placeOrder } from '../../services/orderService'
import useCartStore from '../../store/cartStore'
import LoadingSpinner from '../../components/shared/LoadingSpinner'

export default function CheckoutPage() {
  const { restaurantId, tableId } = useParams()
  const navigate = useNavigate()

  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const { items, tableNumber, clearCart, getTotalPrice } = useCartStore()
  const totalPrice = getTotalPrice()

  const handleConfirmOrder = async () => {
    if (items.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    setLoading(true)
    try {
      const orderItems = items.map((item) => ({
        menu_item_id: item.id,
        quantity: item.quantity,
        special_note: item.special_note || '',
      }))

      const response = await placeOrder({
        restaurant_id: restaurantId,
        table_id: tableId,
        items: orderItems,
        notes: notes,
      })

      const orderId = response.data?.order?.id || response.data?.id
      localStorage.setItem('lastOrderId', orderId)
      clearCart()
      toast.success('Order placed successfully!')
      navigate(`/order/${orderId}/track`, { replace: true })
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        'Failed to place order. Please try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    navigate(-1)
    return null
  }

  return (
    <div className="min-h-screen bg-dark-bg pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-dark-bg/95 backdrop-blur-sm border-b border-dark-border px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-heading font-bold text-white text-2xl">Confirm Order</h1>
          {tableNumber != null && (
            <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              Table #{tableNumber}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Order Items Summary */}
        <div className="card p-5">
          <h2 className="font-heading font-semibold text-white mb-4 flex items-center gap-2">
            <Check className="w-5 h-5 text-primary" />
            Your Order
          </h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-dark-border last:border-0">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-primary/20 text-primary text-xs font-bold rounded-lg flex items-center justify-center">
                    {item.quantity}
                  </span>
                  <div>
                    <p className="text-sm text-white font-medium">{item.name}</p>
                    {item.special_note && (
                      <p className="text-xs text-gray-500 italic">Note: {item.special_note}</p>
                    )}
                  </div>
                </div>
                <span className="text-gray-300 text-sm font-medium">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Special Notes */}
        <div className="card p-5">
          <h2 className="font-heading font-semibold text-white mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Special Instructions
          </h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any allergies, special requests, or preferences..."
            rows={3}
            className="input resize-none"
          />
        </div>

        {/* Price Summary */}
        <div className="card p-5">
          <h2 className="font-heading font-semibold text-white mb-4">Bill Summary</h2>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm text-gray-400">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-dark-border mt-4 pt-4">
            <div className="flex justify-between font-bold text-white text-xl">
              <span>Grand Total</span>
              <span className="text-primary">₹{totalPrice.toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Pay at counter or to your waiter</p>
          </div>
        </div>
      </div>

      {/* Confirm Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-dark-bg/95 backdrop-blur-sm border-t border-dark-border">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleConfirmOrder}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-3 text-base"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                Placing Order...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Confirm Order · ₹{totalPrice.toFixed(2)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
