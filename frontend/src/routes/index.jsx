import { createBrowserRouter, Navigate } from 'react-router-dom'
import ProtectedRoute from '../components/shared/ProtectedRoute'

// Layouts
import AdminLayout from '../layouts/AdminLayout'
import CustomerLayout from '../layouts/CustomerLayout'
// import KitchenLayout from '../layouts/KitchenLayout'  // KITCHEN DISABLED
import WaiterLayout from '../layouts/WaiterLayout'

// Pages
import LandingPage from '../pages/LandingPage'
import LoginPage from '../pages/auth/LoginPage'
import MenuPage from '../pages/customer/MenuPage'
import CartPage from '../pages/customer/CartPage'
import CheckoutPage from '../pages/customer/CheckoutPage'
import OrderTrackingPage from '../pages/customer/OrderTrackingPage'
import OrdersPage from '../pages/admin/OrdersPage'
import MenuManagementPage from '../pages/admin/MenuManagementPage'
import TablesPage from '../pages/admin/TablesPage'
import AnalyticsPage from '../pages/admin/AnalyticsPage'
// import KitchenDisplayPage from '../pages/kitchen/KitchenDisplayPage'  // KITCHEN DISABLED
import WaiterPage from '../pages/waiter/WaiterPage'


const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  // ── Customer routes ──────────────────────────────────────────────────────
  {
    element: <CustomerLayout />,
    children: [
      {
        path: '/menu/:restaurantId/:tableId',
        element: <MenuPage />,
      },
      {
        path: '/cart',
        element: <CartPage />,
      },
      {
        path: '/checkout/:restaurantId/:tableId',
        element: <CheckoutPage />,
      },
      {
        path: '/order/:orderId/track',
        element: <OrderTrackingPage />,
      },
    ],
  },
  // ── Admin routes ─────────────────────────────────────────────────────────
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/admin/orders" replace />,
      },
      {
        path: 'orders',
        element: <OrdersPage />,
      },
      {
        path: 'menu',
        element: <MenuManagementPage />,
      },
      {
        path: 'tables',
        element: <TablesPage />,
      },
      {
        path: 'analytics',
        element: <AnalyticsPage />,
      },
    ],
  },
  // ── Kitchen route (DISABLED) ──────────────────────────────────────────────
  // {
  //   path: '/kitchen',
  //   element: (
  //     <ProtectedRoute allowedRoles={['kitchen', 'admin']}>
  //       <KitchenLayout />
  //     </ProtectedRoute>
  //   ),
  //   children: [
  //     {
  //       index: true,
  //       element: <KitchenDisplayPage />,
  //     },
  //   ],
  // },
  // ── Waiter route ─────────────────────────────────────────────────────────
  {
    path: '/waiter',
    element: (
      <ProtectedRoute allowedRoles={['waiter', 'admin']}>
        <WaiterLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <WaiterPage />,
      },
    ],
  },
])

export default router
