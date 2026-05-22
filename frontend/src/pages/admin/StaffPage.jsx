import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getStaff, createStaff, updateStaff, deleteStaff } from '../../services/staffService'
import { Plus, Trash2, UserCheck, UserX, Eye, EyeOff, User, Mail, Lock, X } from 'lucide-react'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../components/shared/LoadingSpinner'

const ROLE_LABELS = { waiter: 'Waiter' }
const ROLE_COLORS = { waiter: 'bg-blue-900/40 text-blue-400 border-blue-700/40' }

function RoleBadge({ role }) {
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${ROLE_COLORS[role] || 'bg-gray-800 text-gray-400 border-gray-700'}`}>
      {ROLE_LABELS[role] || role}
    </span>
  )
}

function AddStaffModal({ onClose, onSuccess }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('waiter')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name || !email || !password) { toast.error('Please fill in all fields'); return }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      await createStaff({ name, email, password, role })
      toast.success(`${ROLE_LABELS[role]} account created!`)
      onSuccess()
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to create staff member')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass p-6 w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading font-bold text-white text-lg">Add Staff Member</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role selector */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="input"
              disabled={loading}
            >
              <option value="waiter">Waiter</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Staff member name" className="input pl-11" disabled={loading} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@restaurant.com" className="input pl-11" disabled={loading} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type={showPass ? 'text' : 'password'} value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters" className="input pl-11 pr-12" disabled={loading} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-dark-border text-gray-400 hover:text-white hover:border-gray-500 transition-all text-sm font-medium">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 btn-primary flex items-center justify-center gap-2">
              {loading ? <><LoadingSpinner size="sm" /> Creating...</> : <><Plus className="w-4 h-4" /> Create Account</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function StaffPage() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: () => getStaff().then((r) => r.data),
  })

  const staff = data || []

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }) => updateStaff(id, { is_active }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      toast.success(vars.is_active ? 'Staff member activated' : 'Staff member deactivated')
    },
    onError: () => toast.error('Failed to update staff member'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteStaff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      toast.success('Staff member removed')
    },
    onError: () => toast.error('Failed to remove staff member'),
  })

  const handleDelete = (member) => {
    if (window.confirm(`Remove ${member.name} from your staff?`)) {
      deleteMutation.mutate(member.id)
    }
  }

  return (
    <div className="animate-fade-in">
      {showModal && (
        <AddStaffModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false)
            queryClient.invalidateQueries({ queryKey: ['staff'] })
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-bold text-white text-2xl">Staff Management</h1>
          <p className="text-gray-500 text-sm mt-1">
            {staff.length} staff member{staff.length !== 1 ? 's' : ''} in your restaurant
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Staff
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          { label: 'Total Staff', value: staff.length, color: 'text-white' },
          { label: 'Active', value: staff.filter((s) => s.is_active).length, color: 'text-green-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4">
            <p className="text-gray-500 text-xs mb-1">{label}</p>
            <p className={`font-heading font-bold text-2xl ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Staff List */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : staff.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-4">👥</p>
          <h3 className="font-heading font-semibold text-white text-lg mb-2">No staff yet</h3>
          <p className="text-gray-500 text-sm mb-6">Add your first waiter to get started.</p>
          <button onClick={() => setShowModal(true)} className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Staff Member
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {staff.map((member) => (
            <div key={member.id}
              className={`card p-4 flex items-center gap-4 transition-all ${!member.is_active ? 'opacity-60' : ''}`}>
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold text-sm uppercase">
                  {member.name?.charAt(0)}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-white font-semibold text-sm truncate">{member.name}</p>
                  <RoleBadge role={member.role} />
                  {!member.is_active && (
                    <span className="text-xs text-red-400 bg-red-900/20 border border-red-700/30 px-2 py-0.5 rounded-full">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-xs truncate">{member.email}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleActiveMutation.mutate({ id: member.id, is_active: !member.is_active })}
                  title={member.is_active ? 'Deactivate' : 'Activate'}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    member.is_active
                      ? 'bg-green-900/20 text-green-400 hover:bg-green-900/40'
                      : 'bg-gray-800 text-gray-500 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {member.is_active ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleDelete(member)}
                  title="Remove"
                  className="w-8 h-8 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/40 flex items-center justify-center transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
