import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, ShoppingBag, DollarSign, Star, Clock } from 'lucide-react'
import { getOrders } from '../../services/orderService'
import StatusBadge from '../../components/shared/StatusBadge'
import LoadingSpinner from '../../components/shared/LoadingSpinner'

const PERIOD_FILTERS = ['today', 'week', 'month']

function StatCard({ icon: Icon, label, value, sub, color = 'text-primary' }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
      <p className="text-2xl font-heading font-bold text-white mb-0.5">{value}</p>
      <p className="text-sm text-gray-400">{label}</p>
      {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
    </div>
  )
}

function CSSBar({ label, value, maxValue, color = 'bg-primary' }) {
  const pct = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-gray-300 truncate max-w-[70%]">{label}</span>
        <span className="text-gray-400 font-medium">{value}</span>
      </div>
      <div className="h-2 bg-dark-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function filterByPeriod(orders, period) {
  const now = new Date()
  return orders.filter((o) => {
    const d = new Date(o.created_at)
    if (period === 'today') {
      return d.toDateString() === now.toDateString()
    } else if (period === 'week') {
      const weekAgo = new Date(now)
      weekAgo.setDate(now.getDate() - 7)
      return d >= weekAgo
    } else {
      const monthAgo = new Date(now)
      monthAgo.setMonth(now.getMonth() - 1)
      return d >= monthAgo
    }
  })
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('today')

  const { data, isLoading } = useQuery({
    queryKey: ['orders-analytics'],
    queryFn: () => getOrders({ limit: 500 }).then((r) => r.data),
    staleTime: 60000,
  })

  const allOrders = data?.orders || data || []
  const periodOrders = filterByPeriod(allOrders, period)

  // Calculate stats
  const totalOrders = periodOrders.length
  const completedOrders = periodOrders.filter((o) => o.status === 'served')
  const totalRevenue = completedOrders.reduce((s, o) => s + Number(o.total_amount || 0), 0)
  const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0
  const pendingCount = periodOrders.filter((o) => o.status === 'pending').length

  // Item popularity
  const itemCounts = {}
  periodOrders.forEach((o) => {
    o.items?.forEach((item) => {
      itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity
    })
  })
  const sortedItems = Object.entries(itemCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
  const maxItemCount = sortedItems[0]?.[1] || 1
  const topItem = sortedItems[0]?.[0] || '—'

  // Status distribution
  const statusCounts = {
    pending: periodOrders.filter((o) => o.status === 'pending').length,
    accepted: periodOrders.filter((o) => o.status === 'accepted').length,
    preparing: periodOrders.filter((o) => o.status === 'preparing').length,
    ready: periodOrders.filter((o) => o.status === 'ready').length,
    served: completedOrders.length,
    cancelled: periodOrders.filter((o) => o.status === 'cancelled').length,
  }

  const recentOrders = [...allOrders]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10)

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-white text-2xl">Analytics</h1>
          <p className="text-gray-500 text-sm">Performance overview</p>
        </div>

        {/* Period Tabs */}
        <div className="flex gap-1 p-1 bg-dark-card rounded-xl border border-dark-border">
          {PERIOD_FILTERS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${
                period === p ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={ShoppingBag}
              label="Total Orders"
              value={totalOrders}
              sub={`${pendingCount} pending`}
            />
            <StatCard
              icon={DollarSign}
              label="Revenue"
              value={`₹${totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`}
              sub="From completed orders"
              color="text-green-400"
            />
            <StatCard
              icon={TrendingUp}
              label="Avg Order Value"
              value={`₹${avgOrderValue.toFixed(0)}`}
              sub={`${completedOrders.length} completed`}
              color="text-blue-400"
            />
            <StatCard
              icon={Star}
              label="Top Item"
              value={topItem}
              sub={sortedItems[0] ? `${sortedItems[0][1]} orders` : 'No data'}
              color="text-yellow-400"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Popular Items Chart */}
            <div className="card p-5">
              <h2 className="font-heading font-semibold text-white mb-4">Popular Items</h2>
              {sortedItems.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No data for this period</p>
              ) : (
                <div className="space-y-3">
                  {sortedItems.map(([name, count], i) => (
                    <CSSBar
                      key={name}
                      label={name}
                      value={count}
                      maxValue={maxItemCount}
                      color={i === 0 ? 'bg-primary' : 'bg-primary/60'}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Order Status Breakdown */}
            <div className="card p-5">
              <h2 className="font-heading font-semibold text-white mb-4">Order Status Breakdown</h2>
              {totalOrders === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No orders for this period</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(statusCounts).map(([status, count]) => (
                    <CSSBar
                      key={status}
                      label={status.charAt(0).toUpperCase() + status.slice(1)}
                      value={count}
                      maxValue={totalOrders}
                      color={
                        status === 'served'
                          ? 'bg-green-500'
                          : status === 'pending'
                          ? 'bg-yellow-500'
                          : status === 'preparing'
                          ? 'bg-orange-500'
                          : status === 'ready'
                          ? 'bg-green-400'
                          : status === 'cancelled'
                          ? 'bg-red-500'
                          : 'bg-blue-500'
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-dark-border">
              <h2 className="font-heading font-semibold text-white">Recent Orders</h2>
            </div>
            <div className="overflow-x-auto">
              {recentOrders.length === 0 ? (
                <div className="py-12 text-center text-gray-500 text-sm">No orders yet</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-border">
                      <th className="text-left text-xs text-gray-500 font-medium px-5 py-3">Order</th>
                      <th className="text-left text-xs text-gray-500 font-medium px-5 py-3">Table</th>
                      <th className="text-left text-xs text-gray-500 font-medium px-5 py-3">Items</th>
                      <th className="text-left text-xs text-gray-500 font-medium px-5 py-3">Total</th>
                      <th className="text-left text-xs text-gray-500 font-medium px-5 py-3">Status</th>
                      <th className="text-left text-xs text-gray-500 font-medium px-5 py-3">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-dark-border/50 hover:bg-white/2 transition-colors">
                        <td className="px-5 py-3 font-mono text-white text-sm font-semibold">
                          #{order.id?.slice(-6).toUpperCase()}
                        </td>
                        <td className="px-5 py-3 text-gray-300 text-sm">
                          {order.table_number != null ? `#${order.table_number}` : '—'}
                        </td>
                        <td className="px-5 py-3 text-gray-400 text-sm max-w-[200px] truncate">
                          {order.items?.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                        </td>
                        <td className="px-5 py-3 text-primary font-semibold text-sm">
                          ₹{Number(order.total_amount || 0).toFixed(2)}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-5 py-3 text-gray-500 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            {new Date(order.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
