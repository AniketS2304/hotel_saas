import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ChefHat, Mail, Lock, User, UtensilsCrossed } from 'lucide-react'
import toast from 'react-hot-toast'
import { login as loginApi, register as registerApi } from '../../services/authService'
import useAuthStore from '../../store/authStore'
import LoadingSpinner from '../../components/shared/LoadingSpinner'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const [tab, setTab] = useState('login') // 'login' | 'register'
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  // Login fields
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register fields
  const [regName, setRegName] = useState('')
  const [regRestaurant, setRegRestaurant] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')

  const roleRedirects = { admin: '/admin/orders', waiter: '/waiter' }

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!loginEmail || !loginPassword) { toast.error('Please fill in all fields'); return }
    setLoading(true)
    try {
      const response = await loginApi(loginEmail, loginPassword)
      const { user, access_token, refresh_token } = response.data
      login(user, access_token, refresh_token)
      toast.success(`Welcome back, ${user.name}!`)
      navigate(roleRedirects[user.role] || '/admin/orders', { replace: true })
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!regName || !regRestaurant || !regEmail || !regPassword) {
      toast.error('Please fill in all fields'); return
    }
    if (regPassword.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      const response = await registerApi({
        name: regName,
        restaurant_name: regRestaurant,
        email: regEmail,
        password: regPassword,
      })
      const { user, access_token, refresh_token } = response.data
      login(user, access_token, refresh_token)
      toast.success(`Welcome to ScanDine, ${user.name}! 🎉`)
      navigate('/admin/orders', { replace: true })
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background gradient blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-900/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Card */}
      <div className="glass p-8 w-full max-w-md relative z-10 animate-slide-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
            <ChefHat className="w-9 h-9 text-white" />
          </div>
          <h1 className="font-heading font-bold text-white text-3xl mb-1">ScanDine</h1>
          <p className="text-gray-500 text-sm">
            {tab === 'login' ? 'Sign in to your restaurant dashboard' : 'Create your restaurant account'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-dark-muted rounded-xl p-1 mb-6 gap-1">
          {[
            { key: 'login', label: 'Sign In' },
            { key: 'register', label: 'Register' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                tab === key
                  ? 'bg-primary text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Login Form ── */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Email address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@restaurant.com"
                  className="input pl-11"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-11 pr-12"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-3 mt-2"
            >
              {loading ? <><LoadingSpinner size="sm" /> Signing in...</> : 'Sign In'}
            </button>
          </form>
        )}

        {/* ── Register Form ── */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Your Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="John Doe"
                  className="input pl-11"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Restaurant Name</label>
              <div className="relative">
                <UtensilsCrossed className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={regRestaurant}
                  onChange={(e) => setRegRestaurant(e.target.value)}
                  placeholder="The Grand Kitchen"
                  className="input pl-11"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Email address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="you@restaurant.com"
                  className="input pl-11"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="input pl-11 pr-12"
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-3 mt-2"
            >
              {loading ? <><LoadingSpinner size="sm" /> Creating account...</> : 'Create Restaurant Account'}
            </button>

            <p className="text-xs text-gray-600 text-center">
              By registering you agree to our terms of service.
            </p>
          </form>
        )}

        <p className="text-center text-xs text-gray-600 mt-6">
          Restaurant QR Ordering · ScanDine © 2024
        </p>
      </div>
    </div>
  )
}
