import { Outlet, useNavigate } from 'react-router-dom'
import { ChefHat, LogOut } from 'lucide-react'
import useAuthStore from '../store/authStore'

export default function WaiterLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-dark-card/80 backdrop-blur-sm border-b border-dark-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-white text-base leading-tight">ScanDine</h1>
            <p className="text-xs text-gray-500">Waiter View</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-200 font-medium">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-900/20 hover:bg-red-900/40 text-red-400 transition-all text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
