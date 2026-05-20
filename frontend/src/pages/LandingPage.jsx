import { useNavigate } from 'react-router-dom'
import { ChefHat, QrCode, Smartphone, BarChart3, ArrowRight, Zap } from 'lucide-react'

const FEATURES = [
  {
    icon: QrCode,
    title: 'QR Code Ordering',
    desc: 'Customers scan and order instantly — no app download required.',
  },
  {
    icon: Zap,
    title: 'Real-Time Kitchen',
    desc: 'Orders reach the kitchen instantly via WebSocket connections.',
  },
  {
    icon: Smartphone,
    title: 'Mobile First',
    desc: 'Optimized for every device from phones to kitchen displays.',
  },
  {
    icon: BarChart3,
    title: 'Live Analytics',
    desc: 'Track revenue, popular items, and order trends in real time.',
  },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-dark-bg text-white overflow-hidden">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <span className="font-heading font-bold text-xl">ScanDine</span>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="btn-primary py-2 px-5 text-sm"
        >
          Sign In
        </button>
      </nav>

      {/* Hero */}
      <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
        {/* Background blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium mb-8">
            <Zap className="w-4 h-4" />
            Restaurant QR Ordering SaaS
          </div>

          <h1 className="font-heading font-black text-5xl sm:text-7xl leading-tight mb-6">
            Modern Ordering
            <br />
            <span className="text-primary">Powered by QR</span>
          </h1>

          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Give your customers a seamless dining experience. Scan, order, and track — no apps,
            no friction, no waiting.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="btn-primary flex items-center justify-center gap-2 text-base"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="btn-secondary flex items-center justify-center gap-2 text-base"
            >
              Admin Login
            </button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="glass p-6 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-heading font-bold text-white mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-dark-border py-6 text-center">
        <p className="text-gray-600 text-sm">
          ScanDine © {new Date().getFullYear()} · Restaurant QR Ordering Platform
        </p>
      </footer>
    </div>
  )
}
