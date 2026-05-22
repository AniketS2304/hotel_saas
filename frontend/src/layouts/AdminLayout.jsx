import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  ShoppingBag,
  UtensilsCrossed,
  QrCode,
  BarChart3,
  LogOut,
  ChefHat,
  Wifi,
  Users2,
} from 'lucide-react'
import useAuthStore from '../store/authStore'
import { useQuery } from '@tanstack/react-query'
import { getMyRestaurant } from '../services/restaurantService'
import { useWebSocket } from '../hooks/useWebSocket'

const navItems = [
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/menu', label: 'Menu', icon: UtensilsCrossed },
  { to: '/admin/tables', label: 'Tables', icon: QrCode },
  { to: '/admin/staff', label: 'Staff', icon: Users2 },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
]

export default function AdminLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const { data: restaurantData } = useQuery({
    queryKey: ['my-restaurant'],
    queryFn: () => getMyRestaurant().then((r) => r.data),
    enabled: !!user,
    staleTime: 300000,
  })

  const restaurant = restaurantData?.restaurant || restaurantData

  const { isConnected } = useWebSocket(restaurant?.id)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-dark-bg overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-64 flex-shrink-0 flex flex-col glass border-r border-white/10 rounded-none">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-white text-lg leading-tight">
                ScanDine
              </h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Restaurant name */}
        {restaurant && (
          <div className="px-6 py-3 border-b border-white/10">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Restaurant</p>
            <p className="text-sm text-gray-200 font-medium truncate">{restaurant.name}</p>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      isActive ? 'text-primary' : 'text-gray-500 group-hover:text-gray-300'
                    }`}
                  />
                  <span className="font-medium text-sm">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: user info + logout */}
        <div className="p-4 border-t border-white/10 space-y-3">
          {/* WebSocket connection indicator */}
          <div className="flex items-center gap-2 px-2">
            <Wifi
              className={`w-3 h-3 ${isConnected ? 'text-green-400' : 'text-red-400'}`}
            />
            <span className="text-xs text-gray-500">
              {isConnected ? 'Live updates active' : 'Reconnecting...'}
            </span>
          </div>

          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
              <span className="text-primary font-bold text-xs uppercase">
                {user?.name?.charAt(0) || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-200 font-medium truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-400 hover:bg-red-900/20 hover:text-red-400 transition-all duration-200 group"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 bg-dark-bg/80 backdrop-blur-sm border-b border-dark-border">
          <div>
            <h2 className="font-heading font-semibold text-white text-lg">
              {restaurant?.name || 'Your Restaurant'}
            </h2>
            <p className="text-xs text-gray-500">Restaurant Management</p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full animate-pulse-dot ${
                isConnected ? 'bg-green-400' : 'bg-red-400'
              }`}
            />
            <span className="text-xs text-gray-500">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>

        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
