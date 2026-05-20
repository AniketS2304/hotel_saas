import { useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getOrders, updateOrderStatus } from '../../services/orderService'
import { useWebSocket } from '../../hooks/useWebSocket'
import useAuthStore from '../../store/authStore'
import useOrderStore from '../../store/orderStore'
import StatusBadge from '../../components/shared/StatusBadge'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { CheckCircle, Clock } from 'lucide-react'

// Simplified flow: pending -> accepted (admin approves) -> served (waiter delivers)
// 'preparing' and 'ready' are legacy kitchen statuses, kept here for backward compat
const ACTIVE_STATUSES = ['pending', 'accepted', 'preparing', 'ready']

function useElapsed(startTime) {
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

function OrderCard({ order, onMarkServed }) {
  const elapsed = useElapsed(order.created_at)
  // In the simplified flow (no kitchen), 'accepted' is the state where waiter delivers.
  // Legacy 'ready' state is also actionable in case of existing data.
  const isActionable = order.status === 'accepted' || order.status === 'ready'

  return (
    <div
      className={`card p-4 transition-all ${
        isActionable ? 'border-green-500/50 bg-green-900/5' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-heading font-bold text-white text-2xl">
              {order.table_number != null ? `#${order.table_number}` : '—'}
            </span>
            <StatusBadge status={order.status} />
          </div>
          <p className="font-mono text-gray-600 text-xs">
            #{order.id?.slice(-6).toUpperCase()}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-gray-500 text-sm flex-shrink-0">
          <Clock className="w-3.5 h-3.5" />
          {elapsed}
        </div>
      </div>

      {/* Items */}
      <div className="space-y-1 mb-4">
        {order.items?.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="text-primary font-bold">{item.quantity}×</span>
            <span className="text-gray-300">{item.name}</span>
          </div>
        ))}
      </div>

      {/* Amount */}
      <div className="flex items-center justify-between">
        <span className="text-primary font-bold">₹{Number(order.total_amount || 0).toFixed(2)}</span>
        {isActionable && (
          <button
            onClick={() => onMarkServed(order.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-semibold transition-all"
          >
            <CheckCircle className="w-4 h-4" />
            Mark Served
          </button>
        )}
      </div>
    </div>
  )
}

export default function WaiterPage() {
  const [tab, setTab] = useState('active') // 'active' | 'actionable'

  // Get restaurant ID from auth store (already in JWT — no extra API call needed)
  const restaurantId = useAuthStore((s) => s.user?.restaurant_id)

  const { isConnected } = useWebSocket(restaurantId)
  const storeOrders = useOrderStore((s) => s.orders)
  const setOrders = useOrderStore((s) => s.setOrders)

  const { data, isLoading } = useQuery({
    queryKey: ['waiter-orders'],
    queryFn: () => getOrders({}).then((r) => r.data),
    refetchInterval: 30000,
  })

  useEffect(() => {
    const orders = data?.orders || data || []
    if (orders.length > 0) setOrders(orders)
  }, [data, setOrders])

  const mutation = useMutation({
    mutationFn: (id) => updateOrderStatus(id, 'served'),
    onSuccess: (_, id) => {
      useOrderStore.getState().updateOrderStatus(id, 'served')
      toast.success('Order marked as served!')
    },
    onError: () => toast.error('Failed to update order'),
  })

  const activeOrders = storeOrders.filter((o) => ACTIVE_STATUSES.includes(o.status))
  // 'accepted' is the actionable state in the simplified flow (no kitchen)
  const actionableOrders = storeOrders.filter((o) => o.status === 'accepted' || o.status === 'ready')

  const displayOrders = tab === 'actionable' ? actionableOrders : activeOrders

  // Group by table
  const grouped = displayOrders.reduce((acc, order) => {
    const tbl = order.table_number ?? 'unknown'
    if (!acc[tbl]) acc[tbl] = []
    acc[tbl].push(order)
    return acc
  }, {})

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-bold text-white text-2xl">Waiter Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
            <div
              className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}
            />
            <span className="text-xs text-gray-500">
              {isConnected ? 'Live updates' : 'Reconnecting...'}
            </span>
          </div>
        </div>
        {actionableOrders.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-900/30 border border-green-700/40">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 font-semibold text-sm">
              {actionableOrders.length} ready to serve
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'active', label: 'All Active', count: activeOrders.length },
          { key: 'actionable', label: 'Ready to Serve', count: actionableOrders.length },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === key
                ? 'bg-primary text-white'
                : 'bg-dark-card border border-dark-border text-gray-400 hover:text-white'
            }`}
          >
            {label}
            {count > 0 && (
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  tab === key ? 'bg-white/20' : 'bg-dark-muted'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading && storeOrders.length === 0 ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : displayOrders.length === 0 ? (
        <div className="text-center py-20 card p-12">
          <p className="text-4xl mb-4">{tab === 'actionable' ? '✅' : '🍽️'}</p>
          <h3 className="font-heading font-semibold text-white text-lg mb-2">
            {tab === 'actionable' ? 'All caught up!' : 'No active orders'}
          </h3>
          <p className="text-gray-500 text-sm">
            {tab === 'actionable'
              ? 'No approved orders to serve right now.'
              : 'New orders will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped)
            .sort(([a], [b]) => {
              const aHasActionable = grouped[a].some((o) => o.status === 'accepted' || o.status === 'ready')
              const bHasActionable = grouped[b].some((o) => o.status === 'accepted' || o.status === 'ready')
              return bHasActionable - aHasActionable
            })
            .map(([tableNum, orders]) => (
              <div key={tableNum}>
                <h2 className="font-heading font-bold text-white text-lg mb-3 flex items-center gap-2">
                  <span className="w-2 h-6 bg-primary rounded-full" />
                  Table #{tableNum}
                  <span className="text-sm text-gray-500 font-normal">
                    ({orders.length} order{orders.length !== 1 ? 's' : ''})
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {orders
                    .sort((a, b) => {
                      const priority = { ready: 0, preparing: 1, accepted: 2, pending: 3 }
                      return (priority[a.status] ?? 9) - (priority[b.status] ?? 9)
                    })
                    .map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onMarkServed={(id) => mutation.mutate(id)}
                      />
                    ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
