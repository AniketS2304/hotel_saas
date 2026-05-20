import { useState, useRef } from 'react'
import { X, Upload, Loader2, Leaf, Drumstick, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { uploadImage } from '../../services/menuService'
import LoadingSpinner from '../shared/LoadingSpinner'

/**
 * MenuItemForm — reusable modal form for creating/editing menu items
 * @param {{
 *   item?: import('../../types').MenuItem,
 *   categories: Array<{ id: string, name: string }>,
 *   onClose: () => void,
 *   onSave: (data: object) => Promise<void>
 * }} props
 */
export default function MenuItemForm({ item, categories, onClose, onSave }) {
  const [form, setForm] = useState({
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price || '',
    category_id: item?.category_id || categories[0]?.id || '',
    is_veg: item?.is_veg ?? true,
    is_available: item?.is_available ?? true,
    image_url: item?.image_url || '',
  })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef()

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await uploadImage(file)
      const url = res.data?.url || res.data?.image_url || res.data
      set('image_url', url)
      toast.success('Image uploaded successfully')
    } catch {
      toast.error('Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.price || !form.category_id) {
      toast.error('Please fill in all required fields')
      return
    }
    setSaving(true)
    try {
      await onSave({ ...form, price: parseFloat(form.price) })
      onClose()
    } catch {
      toast.error('Failed to save item')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm py-8 overflow-y-auto">
      <div className="card p-6 w-full max-w-lg animate-slide-up my-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading font-bold text-white text-lg">
            {item ? 'Edit Menu Item' : 'New Menu Item'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Image</label>
            <div className="flex items-center gap-3">
              <div
                onClick={() => fileRef.current?.click()}
                className="w-20 h-20 rounded-xl border-2 border-dashed border-dark-border hover:border-primary/60 flex items-center justify-center cursor-pointer bg-dark-muted overflow-hidden flex-shrink-0 transition-colors"
              >
                {form.image_url ? (
                  <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                ) : uploading ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                ) : (
                  <Upload className="w-5 h-5 text-gray-500" />
                )}
              </div>
              <div className="flex-1">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="btn-secondary py-2 px-4 text-sm w-full mb-2"
                >
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </button>
                <input
                  type="url"
                  value={form.image_url}
                  onChange={(e) => set('image_url', e.target.value)}
                  placeholder="Or paste image URL..."
                  className="input text-xs py-2"
                />
              </div>
              <input
                type="file"
                ref={fileRef}
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Paneer Butter Masala"
              className="input"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Brief description of the dish..."
              className="input resize-none"
              rows={2}
            />
          </div>

          {/* Price + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Price (₹) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
                placeholder="0.00"
                className="input"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Category <span className="text-red-400">*</span>
              </label>
              <select
                value={form.category_id}
                onChange={(e) => set('category_id', e.target.value)}
                className="input"
                required
              >
                <option value="">Select category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Veg + Available toggles */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => set('is_veg', !form.is_veg)}
              className={`flex items-center gap-2 flex-1 justify-center px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                form.is_veg
                  ? 'bg-green-900/30 border-green-700 text-green-400'
                  : 'bg-red-900/30 border-red-700 text-red-400'
              }`}
            >
              {form.is_veg ? (
                <Leaf className="w-4 h-4" />
              ) : (
                <Drumstick className="w-4 h-4" />
              )}
              {form.is_veg ? 'Veg' : 'Non-Veg'}
            </button>

            <button
              type="button"
              onClick={() => set('is_available', !form.is_available)}
              className={`flex items-center gap-2 flex-1 justify-center px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                form.is_available
                  ? 'bg-blue-900/30 border-blue-700 text-blue-400'
                  : 'bg-dark-muted border-dark-border text-gray-500'
              }`}
            >
              {form.is_available ? (
                <ToggleRight className="w-4 h-4" />
              ) : (
                <ToggleLeft className="w-4 h-4" />
              )}
              {form.is_available ? 'Available' : 'Unavailable'}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <LoadingSpinner size="sm" />
                  Saving...
                </>
              ) : item ? (
                'Save Changes'
              ) : (
                'Create Item'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
