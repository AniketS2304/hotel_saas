import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Bell, ChevronDown, ChevronUp, DollarSign, RefreshCw } from 'lucide-react'
import { getOrders, updateOrderStatus, updatePaymentStatus } from '../../services/orderService'
import useOrderStore from '../../store/orderStore'
import StatusBadge from '../../components/shared/StatusBadge'
import LoadingSpinner from '../../components/shared/LoadingSpinner'

const STATUS_FILTERS = ['all', 'pending', 'accepted']

const NEXT_STATUS = {
  pending: 'accepted',
}

const APPROVE_LABEL = 'Approve Order'

const isApproved = (status) =>
  ['accepted', 'preparing', 'ready', 'served'].includes(status)

function useElapsedTime(startTime) {
  const [elapsed, setElapsed] = useState('')
  useEffect(() => {
    const update = () => {
      if (!startTime) return
      const diff = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000)
      if (diff < 60) setElapsed(`${diff}s`)
      else if (diff < 3600) setElapsed(`${Math.floor(diff / 60)}m`)
      else setElapsed(`${Math.floor(diff / 3600)}h`)
    }
    update()
    const id = setInterval(update, 30000)
    return () => clearInterval(id)
  }, [startTime])
  return elapsed
}

function OrderRow({ order, onStatusUpdate, onPaymentUpdate, isExpanded, onToggle }) {
  const elapsed = useElapsedTime(order.created_at)
  const nextStatus = NEXT_STATUS[order.status]

  return (
    <div
      className={`card overflow-hidden transition-all duration-200 ${
        order.status === 'pending'
          ? 'border-yellow-800/60'
          : isApproved(order.status)
          ? 'border-green-800/40'
          : ''
      }`}
    >
      {/* Main row */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/2"
        onClick={onToggle}
      >
        {/* Pulsing dot for pending */}
        {order.status === 'pending' && (
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse-dot flex-shrink-0" />
        )}

        <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Order ID</p>
            <p className="font-mono font-bold text-white text-sm">
              #{order.id?.slice(-6).toUpperCase()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Table</p>
            <p className="font-semibold text-white text-sm">
              {order.table_number != null ? `#${order.table_number}` : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Items</p>
            <p className="text-sm text-gray-300 truncate">
              {order.items?.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Total</p>
            <p className="font-bold text-primary text-sm">₹{Number(order.total_amount || 0).toFixed(2)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <StatusBadge status={order.status} />
          <span className="text-xs text-gray-500">{elapsed}</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="border-t border-dark-border p-4 animate-fade-in bg-dark-bg/30">
          <div className="space-y-2 mb-4">
            {order.items?.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-300">
                  {item.quantity}× {item.name}
                  {item.special_note && (
                    <span className="text-gray-500 ml-2 italic">({item.special_note})</span>
                  )}
                </span>
                <span className="text-gray-400">₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          {order.special_notes && (
            <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-800/40 rounded-xl">
              <p className="text-xs text-yellow-400 font-medium mb-1">Special Instructions</p>
              <p className="text-sm text-gray-300">{order.special_notes}</p>
            </div>
          )}

          {/* Payment */}
          <div className="flex items-center justify-between mb-4 p-3 rounded-xl bg-dark-muted/30 border border-dark-border">
            <div className="flex items-center gap-2">
              <DollarSign className={`w-4 h-4 ${order.payment_status === 'paid' ? 'text-green-400' : 'text-gray-500'}`} />
              <span className="text-sm text-gray-300">
                Payment: <span className={`font-semibold ${order.payment_status === 'paid' ? 'text-green-400' : 'text-yellow-400'}`}>{order.payment_status}</span>
              </span>
            </div>
            <button
              onClick={() => onPaymentUpdate(order.id, order.payment_status === 'paid' ? 'unpaid' : 'paid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                order.payment_status === 'paid'
                  ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
                  : 'bg-green-600 hover:bg-green-500 text-white'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              {order.payment_status === 'paid' ? 'Mark as Unpaid' : 'Mark as Paid'}
            </button>
          </div>

          {nextStatus && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => onStatusUpdate(order.id, nextStatus)}
                className="btn-primary py-2 px-4 text-sm"
              >
                {nextStatus === 'accepted' ? APPROVE_LABEL : `Mark as ${nextStatus}`}
              </button>
              {order.status !== 'cancelled' && (
                <button
                  onClick={() => onStatusUpdate(order.id, 'cancelled')}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-800/50 transition-all"
                >
                  Cancel Order
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.start()
    osc.stop(ctx.currentTime + 0.5)
  } catch {
    // Audio not available
  }
}

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedIds, setExpandedIds] = useState(new Set())
  const prevOrderCount = useRef(0)

  const storeOrders = useOrderStore((s) => s.orders)
  const setOrders = useOrderStore((s) => s.setOrders)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['orders', statusFilter],
    queryFn: () =>
      getOrders(statusFilter !== 'all' ? { status: statusFilter } : {}).then((r) => r.data),
    refetchInterval: 30000,
    onSuccess: (d) => {
      const orders = d?.orders || d || []
      setOrders(orders)
    },
  })

  // Sync fetched orders to store
  useEffect(() => {
    const orders = data?.orders || data || []
    if (orders.length > 0) setOrders(orders)
  }, [data, setOrders])

  // Play beep on new order
  useEffect(() => {
    const currentCount = storeOrders.filter((o) => o.status === 'pending').length
    if (prevOrderCount.current > 0 && currentCount > prevOrderCount.current) {
      playBeep()
      toast.custom(
        <div className="flex items-center gap-3 card p-3 pr-5 shadow-2xl border-primary/30">
          <Bell className="w-5 h-5 text-primary animate-pulse" />
          <span className="text-sm font-semibold text-white">New order received!</span>
        </div>,
        { duration: 4000 }
      )
    }
    prevOrderCount.current = currentCount
  }, [storeOrders])

  const mutation = useMutation({
    mutationFn: ({ id, status }) => updateOrderStatus(id, status),
    onSuccess: (_, { id, status }) => {
      useOrderStore.getState().updateOrderStatus(id, status)
      toast.success(status === 'accepted' ? 'Order approved!' : `Order updated to ${status}`)
    },
    onError: () => toast.error('Failed to update order status'),
  })

  const paymentMutation = useMutation({
    mutationFn: ({ id, payment_status }) => updatePaymentStatus(id, payment_status),
    onSuccess: (res) => {
      const order = res.data
      useOrderStore.getState().updateOrderPayStatus(order.id, order.payment_status)
      toast.success(`Payment ${order.payment_status === 'paid' ? 'marked as paid' : 'reverted to unpaid'}`)
    },
    onError: () => toast.error('Failed to update payment status'),
  })

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Use store orders for display (includes realtime updates)
  const matchesFilter = (o) => {
    if (statusFilter === 'all') return true
    if (statusFilter === 'accepted') return isApproved(o.status)
    return o.status === statusFilter
  }

  const displayOrders =
    storeOrders.length > 0
      ? storeOrders.filter(matchesFilter)
      : (data?.orders || data || []).filter(matchesFilter)

  const pendingCount = storeOrders.filter((o) => o.status === 'pending').length

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-bold text-white text-2xl">Orders</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {pendingCount > 0 && (
              <span className="text-yellow-400 font-medium">{pendingCount} pending · </span>
            )}
            {displayOrders.length} orders
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="btn-secondary flex items-center gap-2 py-2 px-4"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
              statusFilter === status
                ? 'bg-primary text-white'
                : 'bg-dark-card border border-dark-border text-gray-400 hover:text-white'
            }`}
          >
            {status === 'accepted' ? 'Approved' : status}
            {status === 'pending' && pendingCount > 0 && (
              <span className="ml-2 bg-yellow-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {isLoading && storeOrders.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : displayOrders.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">📋</p>
          <h3 className="font-heading font-semibold text-white text-lg mb-2">No orders</h3>
          <p className="text-gray-500 text-sm">
            {statusFilter === 'all' ? 'No orders yet.' : `No ${statusFilter} orders.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayOrders.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              isExpanded={expandedIds.has(order.id)}
              onToggle={() => toggleExpand(order.id)}
              onStatusUpdate={(id, status) => mutation.mutate({ id, status })}
              onPaymentUpdate={(id, payment_status) => paymentMutation.mutate({ id, payment_status })}
            />
          ))}
        </div>
      )}
    </div>
  )
}
