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
    <div className="relative flex items-center justify-center min-h-screen px-4 overflow-hidden bg-dark-bg">
      {/* Background gradient blobs */}
      <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none w-96 h-96 bg-primary/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 rounded-full pointer-events-none w-96 h-96 bg-orange-900/10 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md p-8 glass animate-slide-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center justify-center w-16 h-16 mb-4 shadow-lg bg-primary rounded-2xl shadow-primary/30">
            <ChefHat className="text-white w-9 h-9" />
          </div>
          <h1 className="mb-1 text-3xl font-bold text-white font-heading">ScanDine</h1>
          <p className="text-sm text-gray-500">
            {tab === 'login' ? 'Sign in to your restaurant dashboard' : 'Create your restaurant account'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 mb-6 bg-dark-muted rounded-xl">
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
              <label className="block mb-2 text-sm font-medium text-gray-400">Email address</label>
              <div className="relative">
                <Mail className="absolute w-4 h-4 text-gray-500 -translate-y-1/2 left-4 top-1/2" />
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
              <label className="block mb-2 text-sm font-medium text-gray-400">Password</label>
              <div className="relative">
                <Lock className="absolute w-4 h-4 text-gray-500 -translate-y-1/2 left-4 top-1/2" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-12 input pl-11"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute text-gray-500 transition-colors -translate-y-1/2 right-4 top-1/2 hover:text-gray-300"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center w-full gap-3 mt-2 btn-primary"
            >
              {loading ? <><LoadingSpinner size="sm" /> Signing in...</> : 'Sign In'}
            </button>
          </form>
        )}

        {/* ── Register Form ── */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-400">Your Name</label>
              <div className="relative">
                <User className="absolute w-4 h-4 text-gray-500 -translate-y-1/2 left-4 top-1/2" />
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
              <label className="block mb-2 text-sm font-medium text-gray-400">Restaurant Name</label>
              <div className="relative">
                <UtensilsCrossed className="absolute w-4 h-4 text-gray-500 -translate-y-1/2 left-4 top-1/2" />
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
              <label className="block mb-2 text-sm font-medium text-gray-400">Email address</label>
              <div className="relative">
                <Mail className="absolute w-4 h-4 text-gray-500 -translate-y-1/2 left-4 top-1/2" />
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
              <label className="block mb-2 text-sm font-medium text-gray-400">Password</label>
              <div className="relative">
                <Lock className="absolute w-4 h-4 text-gray-500 -translate-y-1/2 left-4 top-1/2" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="pr-12 input pl-11"
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute text-gray-500 transition-colors -translate-y-1/2 right-4 top-1/2 hover:text-gray-300"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center w-full gap-3 mt-2 btn-primary"
            >
              {loading ? <><LoadingSpinner size="sm" /> Creating account...</> : 'Create Restaurant Account'}
            </button>

            <p className="text-xs text-center text-gray-600">
              By registering you agree to our terms of service.
            </p>
          </form>
        )}

        <p className="mt-6 text-xs text-center text-gray-600">
          Restaurant QR Ordering · ScanDine © 2026
        </p>
      </div>
    </div>
  )
}
