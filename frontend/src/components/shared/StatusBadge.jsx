const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    className: 'badge-pending',
  },
  accepted: {
    label: 'Approved',
    className: 'badge-accepted',
  },
  preparing: {
    label: 'Preparing',
    className: 'badge-preparing',
  },
  ready: {
    label: 'Ready',
    className: 'badge-ready',
  },
  served: {
    label: 'Served',
    className: 'badge-served',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'badge-cancelled',
  },
}

/**
 * StatusBadge — displays a colored pill for an order status
 * @param {{ status: string, className?: string }} props
 */
export default function StatusBadge({ status, className = '' }) {
  const config = STATUS_CONFIG[status] || { label: status, className: 'badge-pending' }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${config.className} ${className}`}
    >
      {config.label}
    </span>
  )
}
