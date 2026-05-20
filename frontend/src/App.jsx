import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import router from './routes'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1A1A1A',
            color: '#F9FAFB',
            border: '1px solid #2A2A2A',
          },
          success: {
            iconTheme: { primary: '#F97316', secondary: '#0F0F0F' },
          },
          error: {
            iconTheme: { primary: '#EF4444', secondary: '#0F0F0F' },
          },
        }}
      />
    </QueryClientProvider>
  )
}
