import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Clock, CheckCircle } from 'lucide-react'
import { getOrderById } from '../../services/orderService'
import { useWebSocket } from '../../hooks/useWebSocket'
import useOrderStore from '../../store/orderStore'
import LoadingSpinner from '../../components/shared/LoadingSpinner'

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: CheckCircle, desc: 'We received your order' },
  { key: 'accepted', label: 'Approved', icon: CheckCircle, desc: 'Restaurant confirmed your order' },
]

function getStatusIndex(status) {
  if (status === 'cancelled') return -1
  if (['accepted', 'preparing', 'ready', 'served'].includes(status)) return 1
  return 0
}

function isApproved(status) {
  return ['accepted', 'preparing', 'ready', 'served'].includes(status)
}

function useElapsedTime(startTime) {
  const [elapsed, setElapsed] = useState('')

  useEffect(() => {
    const update = () => {
      if (!startTime) return
      const diff = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000)
      if (diff < 60) setElapsed(`${diff}s ago`)
      else if (diff < 3600) setElapsed(`${Math.floor(diff / 60)}m ago`)
      else setElapsed(`${Math.floor(diff / 3600)}h ago`)
    }

    update()
    const id = setInterval(update, 30000)
    return () => clearInterval(id)
  }, [startTime])

  return elapsed
}

export default function OrderTrackingPage() {
  const { orderId } = useParams()
  const orders = useOrderStore((s) => s.orders)

  const { data, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => getOrderById(orderId).then((r) => r.data),
    refetchInterval: 30000,
  })

  const orderFromApi = data?.order || data
  // Merge with realtime store (store updates take priority for status)
  const storeOrder = orders.find((o) => o.id === orderId)
  const order = storeOrder
    ? { ...orderFromApi, status: storeOrder.status }
    : orderFromApi

  const { isConnected } = useWebSocket(order?.restaurant_id)
  const elapsed = useElapsedTime(order?.created_at)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
        <div className="card p-8 text-center max-w-sm">
          <p className="text-4xl mb-4">❓</p>
          <h2 className="font-heading font-bold text-white text-xl mb-2">Order Not Found</h2>
          <p className="text-gray-500 text-sm">We couldn't find your order.</p>
        </div>
      </div>
    )
  }

  const currentStepIndex = getStatusIndex(order.status)
  const isCancelled = order.status === 'cancelled'

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-dark-bg" />
        <div className="relative z-10 px-4 pt-10 pb-8 text-center max-w-lg mx-auto">
          <div className="text-5xl mb-4">
            {isApproved(order.status) ? '🎉' : order.status === 'cancelled' ? '❌' : '🍳'}
          </div>
          <h1 className="font-heading font-bold text-white text-3xl mb-2">
            {isApproved(order.status)
              ? 'Order Approved!'
              : order.status === 'cancelled'
              ? 'Order Cancelled'
              : 'Tracking Your Order'}
          </h1>
          <p className="text-gray-400 text-sm">
            Order #{orderId.slice(-6).toUpperCase()}
            {order.table_number != null && ` · Table #${order.table_number}`}
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-500">{elapsed}</span>
            <span className="text-gray-700 mx-2">·</span>
            <div
              className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`}
            />
            <span className="text-xs text-gray-600">
              {isConnected ? 'Live updates' : 'Polling every 30s'}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-12 space-y-6">
        {/* Status Timeline */}
        {!isCancelled && (
          <div className="card p-6">
            <h2 className="font-heading font-semibold text-white mb-6">Order Status</h2>
            <div className="space-y-0">
              {STATUS_STEPS.map((step, index) => {
                const isCompleted = index <= currentStepIndex
                const isCurrent = index === currentStepIndex
                const isLast = index === STATUS_STEPS.length - 1
                const Icon = step.icon

                return (
                  <div key={step.key} className="flex gap-4">
                    {/* Line + dot */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                          isCurrent
                            ? 'bg-primary shadow-lg shadow-primary/40 ring-4 ring-primary/20'
                            : isCompleted
                            ? 'bg-primary/30 border-2 border-primary'
                            : 'bg-dark-muted border-2 border-dark-border'
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 ${
                            isCurrent ? 'text-white' : isCompleted ? 'text-primary' : 'text-gray-600'
                          }`}
                        />
                      </div>
                      {!isLast && (
                        <div
                          className={`w-0.5 h-10 mt-1 transition-all duration-500 ${
                            index < currentStepIndex ? 'bg-primary' : 'bg-dark-border'
                          }`}
                        />
                      )}
                    </div>

                    {/* Text */}
                    <div className="pb-10">
                      <p
                        className={`font-semibold text-sm transition-colors ${
                          isCurrent ? 'text-primary' : isCompleted ? 'text-white' : 'text-gray-600'
                        }`}
                      >
                        {step.label}
                        {isCurrent && (
                          <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                            Current
                          </span>
                        )}
                      </p>
                      <p className={`text-xs mt-0.5 ${isCurrent ? 'text-gray-400' : 'text-gray-600'}`}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="card p-5">
          <h2 className="font-heading font-semibold text-white mb-4">Order Items</h2>
          <div className="space-y-3">
            {(order.items || []).map((item, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-dark-border last:border-0">
                <div>
                  <p className="text-sm text-white font-medium">
                    {item.quantity}× {item.name}
                  </p>
                  {item.special_note && (
                    <p className="text-xs text-gray-500 italic">Note: {item.special_note}</p>
                  )}
                </div>
                <span className="text-gray-300 text-sm">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-dark-border pt-4 mt-4 flex justify-between">
            <span className="font-bold text-white">Total</span>
            <span className="font-bold text-primary text-lg">
              ₹{Number(order.total_amount || 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
