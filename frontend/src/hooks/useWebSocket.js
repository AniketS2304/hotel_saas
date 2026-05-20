import { useEffect, useRef, useState } from 'react'
import useOrderStore from '../store/orderStore'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'
const MAX_BACKOFF = 30000 // 30 seconds max

/**
 * Custom hook to connect to a WebSocket for a restaurant.
 * Reconnects with exponential backoff on close/error.
 *
 * @param {string|null} restaurantId
 * @returns {{ isConnected: boolean }}
 */
export function useWebSocket(restaurantId) {
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const backoffRef = useRef(1000)
  const mountedRef = useRef(true)

  const addOrder = useOrderStore((s) => s.addOrder)
  const updateOrderStatus = useOrderStore((s) => s.updateOrderStatus)

  useEffect(() => {
    mountedRef.current = true
    if (!restaurantId) return

    const connect = () => {
      if (!mountedRef.current) return

      try {
        const ws = new WebSocket(`${WS_URL}/ws/${restaurantId}`)
        wsRef.current = ws

        ws.onopen = () => {
          if (!mountedRef.current) return
          setIsConnected(true)
          backoffRef.current = 1000 // Reset backoff on successful connection
        }

        ws.onmessage = (event) => {
          if (!mountedRef.current) return
          try {
            const { event: eventType, data } = JSON.parse(event.data)
            switch (eventType) {
              case 'new_order':
                addOrder(data)
                break
              case 'order_status_changed':
                updateOrderStatus(data.order_id, data.status)
                break
              default:
                break
            }
          } catch {
            // Ignore malformed messages
          }
        }

        ws.onerror = () => {
          // Will trigger onclose too
        }

        ws.onclose = () => {
          if (!mountedRef.current) return
          setIsConnected(false)

          // Exponential backoff reconnect
          const delay = Math.min(backoffRef.current, MAX_BACKOFF)
          backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF)

          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) connect()
          }, delay)
        }
      } catch {
        // Failed to create WebSocket; schedule reconnect
        const delay = Math.min(backoffRef.current, MAX_BACKOFF)
        backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF)
        reconnectTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) connect()
        }, delay)
      }
    }

    connect()

    return () => {
      mountedRef.current = false
      clearTimeout(reconnectTimeoutRef.current)
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.onerror = null
        wsRef.current.close()
      }
    }
  }, [restaurantId, addOrder, updateOrderStatus])

  return { isConnected }
}
