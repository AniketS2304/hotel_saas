import { Navigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

/**
 * ProtectedRoute — guards a route based on authentication and role
 * @param {{ children: React.ReactNode, allowedRoles?: string[] }} props
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { token, user } = useAuthStore.getState()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate page based on role
    const roleRedirects = {
      admin: '/admin/orders',
      // kitchen: '/kitchen',  // KITCHEN DISABLED
      waiter: '/waiter',
    }
    const redirect = roleRedirects[user.role] || '/login'
    return <Navigate to={redirect} replace />
  }

  return children
}
