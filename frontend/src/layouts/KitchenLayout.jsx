import { Outlet } from 'react-router-dom'
import { ChefHat, Maximize2 } from 'lucide-react'
import useAuthStore from '../store/authStore'

export default function KitchenLayout() {
  const { user } = useAuthStore()

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  return (
    <div className="h-screen w-screen bg-[#0A0A0A] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 bg-[#111111] border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-white text-xl">Kitchen Display</h1>
            <p className="text-xs text-gray-500">ScanDine · Live Order Feed</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-300 font-medium">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
          <button
            onClick={handleFullscreen}
            title="Toggle Fullscreen"
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
