import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getOrders, updateOrderStatus } from '../../services/orderService'
import useOrderStore from '../../store/orderStore'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import { Clock } from 'lucide-react'

const COLUMN_STATUSES = ['pending', 'accepted', 'preparing']

const STATUS_COLORS = {
  pending: 'border-yellow-500/60 bg-yellow-500/5',
  accepted: 'border-blue-500/60 bg-blue-500/5',
  preparing: 'border-primary/60 bg-primary/5',
}

const STATUS_HEADER_COLORS = {
  pending: 'text-yellow-400 border-yellow-500/30 bg-yellow-900/20',
  accepted: 'text-blue-400 border-blue-500/30 bg-blue-900/20',
  preparing: 'text-orange-400 border-orange-500/30 bg-orange-900/20',
}

const NEXT_STATUS = {
  pending: { label: 'Accept', next: 'accepted' },
  accepted: { label: 'Start Cooking', next: 'preparing' },
  preparing: { label: 'Mark Ready', next: 'ready' },
}

function useElapsedMin(startTime) {
  const [elapsed, setElapsed] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)
  useEffect(() => {
    const update = () => {
      if (!startTime) return
      const diff = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000)
      if (diff < 60) setElapsed(`${diff}s`)
      else setElapsed(`${Math.floor(diff / 60)}m ${diff % 60}s`)
      setIsUrgent(diff > 5 * 60)
    }
    update()
    const id = setInterval(update, 10000)
    return () => clearInterval(id)
  }, [startTime])
  return { elapsed, isUrgent }
}

function OrderCard({ order, onAction }) {
  const { elapsed, isUrgent: timeUrgent } = useElapsedMin(order.created_at)
  const next = NEXT_STATUS[order.status]
  const isUrgent = order.status === 'pending' && timeUrgent

  return (
    <div
      className={`rounded-2xl border-2 p-4 ${STATUS_COLORS[order.status]} ${
        isUrgent ? 'animate-pulse border-red-500/80' : ''
      } transition-all`}
    >
      {/* Table Number */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-gray-500 text-xs uppercase tracking-wider">Table</span>
          <h3 className="font-heading font-black text-white text-4xl leading-none">
            {order.table_number != null ? order.table_number : '—'}
          </h3>
        </div>
        <div className="text-right">
          <p className="font-mono text-gray-500 text-xs">#{order.id?.slice(-6).toUpperCase()}</p>
          <div className="flex items-center gap-1 mt-1">
            <Clock className="w-3 h-3 text-gray-500" />
            <span
              className={`text-sm font-semibold ${
                isUrgent ? 'text-red-400' : 'text-gray-400'
              }`}
            >
              {elapsed}
            </span>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-1.5 mb-4">
        {order.items?.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-7 h-7 flex-shrink-0 rounded-lg bg-black/30 text-white text-sm font-bold flex items-center justify-center">
              {item.quantity}
            </span>
            <span className="text-white font-medium text-sm">{item.name}</span>
          </div>
        ))}
      </div>

      {/* Special notes */}
      {order.special_notes && (
        <div className="mb-3 px-3 py-2 rounded-xl bg-yellow-900/30 border border-yellow-700/40">
          <p className="text-yellow-300 text-xs font-medium">⚠️ {order.special_notes}</p>
        </div>
      )}

      {/* Action Button */}
      {next && (
        <button
          onClick={() => onAction(order.id, next.next)}
          className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm bg-white/10 hover:bg-primary hover:text-white text-gray-200 border border-white/10 hover:border-primary transition-all duration-200"
        >
          {next.label}
        </button>
      )}
    </div>
  )
}

function playKitchenAlert() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const playNote = (freq, start, duration) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.4, ctx.currentTime + start)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + duration)
    }
    playNote(523, 0, 0.3)
    playNote(659, 0.2, 0.3)
    playNote(784, 0.4, 0.5)
  } catch {
    // Audio unavailable
  }
}

export default function KitchenDisplayPage() {
  const prevPendingCount = useRef(0)
  const hasInteracted = useRef(false)

  const storeOrders = useOrderStore((s) => s.orders)
  const setOrders = useOrderStore((s) => s.setOrders)

  const { data, isLoading } = useQuery({
    queryKey: ['kitchen-orders'],
    queryFn: () =>
      getOrders({ status: 'pending,accepted,preparing' }).then((r) => r.data),
    refetchInterval: 30000,
    onSuccess: (d) => {
      const orders = d?.orders || d || []
      setOrders(orders)
    },
  })

  useEffect(() => {
    const orders = data?.orders || data || []
    if (orders.length > 0) setOrders(orders)
  }, [data, setOrders])

  // Sound alert on new order
  useEffect(() => {
    const pendingCount = storeOrders.filter((o) => o.status === 'pending').length
    if (
      hasInteracted.current &&
      prevPendingCount.current < pendingCount
    ) {
      playKitchenAlert()
    }
    prevPendingCount.current = pendingCount
  }, [storeOrders])

  // Track first user interaction (needed for audio)
  useEffect(() => {
    const handler = () => {
      hasInteracted.current = true
    }
    window.addEventListener('click', handler, { once: true })
    return () => window.removeEventListener('click', handler)
  }, [])

  const mutation = useMutation({
    mutationFn: ({ id, status }) => updateOrderStatus(id, status),
    onSuccess: (_, { id, status }) => {
      useOrderStore.getState().updateOrderStatus(id, status)
    },
  })

  // Active kitchen orders only
  const activeOrders = storeOrders.filter((o) =>
    COLUMN_STATUSES.includes(o.status)
  )

  if (isLoading && storeOrders.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-hidden p-4">
      {/* Columns */}
      <div className="h-full grid grid-cols-3 gap-4">
        {COLUMN_STATUSES.map((status) => {
          const colOrders = activeOrders
            .filter((o) => o.status === status)
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

          return (
            <div key={status} className="flex flex-col min-h-0">
              {/* Column Header */}
              <div
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl border mb-3 flex-shrink-0 ${STATUS_HEADER_COLORS[status]}`}
              >
                <span className="font-heading font-bold text-base capitalize">{status}</span>
                <span className="font-bold text-lg">{colOrders.length}</span>
              </div>

              {/* Scrollable Orders */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {colOrders.length === 0 ? (
                  <div className="flex items-center justify-center h-32 rounded-xl border border-dashed border-white/10">
                    <p className="text-gray-700 text-sm">No orders</p>
                  </div>
                ) : (
                  colOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onAction={(id, nextStatus) => mutation.mutate({ id, status: nextStatus })}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
