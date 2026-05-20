import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Trash2, Download, QrCode as QrCodeIcon, Table } from 'lucide-react'
import { getTables, createTable, deleteTable } from '../../services/tableService'
import { getMyRestaurant } from '../../services/restaurantService'
import LoadingSpinner from '../../components/shared/LoadingSpinner'

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:5173'

function TableCard({ table, restaurantId, onDelete }) {
  const menuUrl = `${BASE_URL}/menu/${restaurantId}/${table.id}`
  const qrSrc = table.qr_code_url

  const handleDownload = async () => {
    try {
      const response = await fetch(qrSrc)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `table-${table.table_number}-qr.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch {
      window.open(qrSrc, '_blank')
    }
  }

  return (
    <div className="card p-5 flex flex-col items-center gap-4 hover:border-primary/30 transition-all group">
      {/* Table Number */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-primary" />
          <span className="font-heading font-bold text-white text-lg">Table #{table.table_number}</span>
        </div>
        <button
          onClick={() => {
            if (confirm(`Delete Table #${table.table_number}?`)) {
              onDelete(table.id)
            }
          }}
          className="text-gray-600 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-900/20"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* QR Code */}
      <div className="w-40 h-40 rounded-xl overflow-hidden bg-dark-muted border border-dark-border flex items-center justify-center">
        <img
          src={qrSrc}
          alt={`QR Code for Table ${table.table_number}`}
          className="w-full h-full object-contain p-2"
          loading="lazy"
        />
      </div>

      {/* URL */}
      <p className="text-xs text-gray-600 text-center break-all px-2 line-clamp-2">{menuUrl}</p>

      {/* Download */}
      <button
        onClick={handleDownload}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-sm font-medium transition-all"
      >
        <Download className="w-4 h-4" />
        Download QR
      </button>
    </div>
  )
}

export default function TablesPage() {
  const queryClient = useQueryClient()
  const [newTableNumber, setNewTableNumber] = useState('')

  const { data: restaurantData } = useQuery({
    queryKey: ['my-restaurant'],
    queryFn: () => getMyRestaurant().then((r) => r.data),
    staleTime: 300000,
  })
  const restaurant = restaurantData?.restaurant || restaurantData

  const { data: tablesData, isLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: () => getTables().then((r) => r.data),
  })
  const tables = tablesData?.tables || tablesData || []

  const createMutation = useMutation({
    mutationFn: createTable,
    onSuccess: () => {
      queryClient.invalidateQueries(['tables'])
      toast.success(`Table #${newTableNumber} created!`)
      setNewTableNumber('')
    },
    onError: () => toast.error('Failed to create table'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTable,
    onSuccess: () => {
      queryClient.invalidateQueries(['tables'])
      toast.success('Table deleted')
    },
    onError: () => toast.error('Failed to delete table'),
  })

  const handleAdd = (e) => {
    e.preventDefault()
    const parsed = parseInt(newTableNumber.trim(), 10)
    if (isNaN(parsed) || parsed < 1) {
      toast.error('Table number must be a valid number greater than or equal to 1')
      return
    }
    createMutation.mutate({ table_number: parsed })
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-bold text-white text-2xl">Tables & QR Codes</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {tables.length} table{tables.length !== 1 ? 's' : ''} · Scan QR to access menu
          </p>
        </div>
      </div>

      {/* Add Table Form */}
      <form onSubmit={handleAdd} className="flex gap-3 mb-8 max-w-sm">
        <div className="flex-1 relative">
          <QrCodeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={newTableNumber}
            onChange={(e) => setNewTableNumber(e.target.value)}
            placeholder="Table number (e.g. 1, A1)"
            className="input pl-10"
          />
        </div>
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="btn-primary flex items-center gap-2 flex-shrink-0"
        >
          {createMutation.isPending ? (
            <LoadingSpinner size="sm" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Add Table
        </button>
      </form>

      {/* Tables Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : tables.length === 0 ? (
        <div className="text-center py-20 card p-12">
          <div className="text-5xl mb-4">🪑</div>
          <h3 className="font-heading font-semibold text-white text-xl mb-2">No Tables Yet</h3>
          <p className="text-gray-500 text-sm">Add your first table to generate a QR code</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {tables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              restaurantId={restaurant?.id}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
