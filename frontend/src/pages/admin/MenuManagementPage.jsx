import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, X, Upload, Loader2, ToggleLeft, ToggleRight, Leaf, Drumstick } from 'lucide-react'
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItem,
  uploadImage,
} from '../../services/menuService'
import LoadingSpinner from '../../components/shared/LoadingSpinner'

// ── Category Modal ────────────────────────────────────────────────────────────
function CategoryModal({ category, onClose, onSave }) {
  const [name, setName] = useState(category?.name || '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      await onSave(name.trim())
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
      <div className="card p-6 w-full max-w-sm animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-bold text-white text-lg">
            {category ? 'Edit Category' : 'New Category'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category name"
            className="input"
            autoFocus
          />
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? <LoadingSpinner size="sm" /> : category ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Menu Item Modal ───────────────────────────────────────────────────────────
function MenuItemModal({ item, categories, onClose, onSave }) {
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
      toast.success('Image uploaded')
    } catch {
      toast.error('Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.price || !form.category_id) {
      toast.error('Please fill in required fields')
      return
    }
    setSaving(true)
    try {
      await onSave({ ...form, price: parseFloat(form.price) })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm overflow-y-auto py-8">
      <div className="card p-6 w-full max-w-lg animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading font-bold text-white text-lg">
            {item ? 'Edit Menu Item' : 'New Menu Item'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image upload */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Image</label>
            <div className="flex items-center gap-3">
              <div
                onClick={() => fileRef.current?.click()}
                className="w-20 h-20 rounded-xl border-2 border-dashed border-dark-border hover:border-primary/60 flex items-center justify-center cursor-pointer bg-dark-muted overflow-hidden transition-colors"
              >
                {form.image_url ? (
                  <img src={form.image_url} alt="" className="w-full h-full object-cover" />
                ) : uploading ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                ) : (
                  <Upload className="w-5 h-5 text-gray-500" />
                )}
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="btn-secondary py-2 px-4 text-sm"
                >
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </button>
                <p className="text-xs text-gray-600 mt-1">JPG, PNG up to 5MB</p>
              </div>
              <input
                type="file"
                ref={fileRef}
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
            {/* Or URL */}
            <input
              type="url"
              value={form.image_url}
              onChange={(e) => set('image_url', e.target.value)}
              placeholder="Or paste image URL..."
              className="input mt-2 text-sm"
            />
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
              placeholder="Item name"
              className="input"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Describe the dish..."
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
                <option value="">Select...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Toggles */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => set('is_veg', !form.is_veg)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                form.is_veg
                  ? 'bg-green-900/30 border-green-700 text-green-400'
                  : 'bg-red-900/30 border-red-700 text-red-400'
              }`}
            >
              {form.is_veg ? <Leaf className="w-4 h-4" /> : <Drumstick className="w-4 h-4" />}
              {form.is_veg ? 'Veg' : 'Non-Veg'}
            </button>
            <button
              type="button"
              onClick={() => set('is_available', !form.is_available)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                form.is_available
                  ? 'bg-blue-900/30 border-blue-700 text-blue-400'
                  : 'bg-gray-800 border-dark-border text-gray-500'
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

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <LoadingSpinner size="sm" /> : item ? 'Save Changes' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MenuManagementPage() {
  const queryClient = useQueryClient()
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [categoryModal, setCategoryModal] = useState(null) // null | 'new' | category obj
  const [itemModal, setItemModal] = useState(null) // null | 'new' | item obj

  // Queries
  const { data: catsData, isLoading: catsLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories().then((r) => r.data),
  })
  const categories = catsData?.categories || catsData || []

  const { data: itemsData, isLoading: itemsLoading } = useQuery({
    queryKey: ['menu-items'],
    queryFn: () => getMenuItems().then((r) => r.data),
  })
  const allItems = itemsData?.items || itemsData?.menu_items || itemsData || []

  const filteredItems = selectedCategoryId
    ? allItems.filter((i) => i.category_id === selectedCategoryId)
    : allItems

  // Mutations
  const catMutation = useMutation({
    mutationFn: ({ id, name }) => (id ? updateCategory(id, { name }) : createCategory({ name })),
    onSuccess: () => {
      queryClient.invalidateQueries(['categories'])
      toast.success(categoryModal?.id ? 'Category updated' : 'Category created')
    },
    onError: () => toast.error('Operation failed'),
  })

  const deleteCatMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries(['categories'])
      toast.success('Category deleted')
      if (selectedCategoryId) setSelectedCategoryId(null)
    },
    onError: () => toast.error('Failed to delete category'),
  })

  const itemMutation = useMutation({
    mutationFn: ({ id, data }) => (id ? updateMenuItem(id, data) : createMenuItem(data)),
    onSuccess: () => {
      queryClient.invalidateQueries(['menu-items'])
      toast.success(itemModal?.id ? 'Item updated' : 'Item created')
    },
    onError: () => toast.error('Operation failed'),
  })

  const deleteItemMutation = useMutation({
    mutationFn: deleteMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries(['menu-items'])
      toast.success('Item deleted')
    },
    onError: () => toast.error('Failed to delete item'),
  })

  const toggleMutation = useMutation({
    mutationFn: toggleMenuItem,
    onSuccess: () => queryClient.invalidateQueries(['menu-items']),
    onError: () => toast.error('Toggle failed'),
  })

  return (
    <div className="animate-fade-in">
      <h1 className="font-heading font-bold text-white text-2xl mb-6">Menu Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Categories Panel ── */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-white">Categories</h2>
            <button
              onClick={() => setCategoryModal('new')}
              className="btn-primary py-1.5 px-3 text-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>

          {catsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategoryId(null)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  !selectedCategoryId
                    ? 'bg-primary/20 text-primary'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                All Items ({allItems.length})
              </button>
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group ${
                    selectedCategoryId === cat.id
                      ? 'bg-primary/20 border border-primary/30'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <button
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`text-sm font-medium flex-1 text-left ${
                      selectedCategoryId === cat.id ? 'text-primary' : 'text-gray-300'
                    }`}
                  >
                    {cat.name}
                    <span className="ml-2 text-xs text-gray-600">
                      ({allItems.filter((i) => i.category_id === cat.id).length})
                    </span>
                  </button>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setCategoryModal(cat)}
                      className="p-1 text-gray-500 hover:text-primary"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete category "${cat.name}"?`)) {
                          deleteCatMutation.mutate(cat.id)
                        }
                      }}
                      className="p-1 text-gray-500 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Items Panel ── */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-white">
              {selectedCategoryId
                ? categories.find((c) => c.id === selectedCategoryId)?.name || 'Items'
                : 'All Items'}
              <span className="ml-2 text-sm text-gray-500 font-normal">
                ({filteredItems.length})
              </span>
            </h2>
            <button
              onClick={() => {
                if (categories.length === 0) {
                  toast.error('Please add a category first before adding menu items')
                } else {
                  setItemModal('new')
                }
              }}
              className="btn-primary py-1.5 px-3 text-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>

          {itemsLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-3xl mb-3">🍽️</p>
              <p className="text-gray-500 text-sm">No items yet. Add your first menu item!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`card p-4 flex gap-3 transition-all hover:border-primary/30 ${
                    !item.is_available ? 'opacity-70' : ''
                  }`}
                >
                  {/* Image */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-dark-muted">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <div
                            className={`w-3 h-3 rounded border flex-shrink-0 ${
                              item.is_veg ? 'border-green-500' : 'border-red-500'
                            }`}
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full m-auto ${
                                item.is_veg ? 'bg-green-500' : 'bg-red-500'
                              }`}
                            />
                          </div>
                          <p className="text-white text-sm font-semibold truncate">{item.name}</p>
                        </div>
                        <p className="text-primary text-sm font-bold">₹{item.price}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => toggleMutation.mutate(item.id)}
                          title={item.is_available ? 'Mark unavailable' : 'Mark available'}
                          className={`p-1.5 rounded-lg transition-all ${
                            item.is_available
                              ? 'text-green-400 hover:bg-green-900/20'
                              : 'text-gray-600 hover:bg-white/5'
                          }`}
                        >
                          {item.is_available ? (
                            <ToggleRight className="w-4 h-4" />
                          ) : (
                            <ToggleLeft className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => setItemModal(item)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-primary hover:bg-primary/10 transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete "${item.name}"?`)) {
                              deleteItemMutation.mutate(item.id)
                            }
                          }}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {item.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{item.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Category Modal ── */}
      {categoryModal && (
        <CategoryModal
          category={categoryModal === 'new' ? null : categoryModal}
          onClose={() => setCategoryModal(null)}
          onSave={(name) =>
            catMutation.mutateAsync({
              id: categoryModal?.id,
              name,
            })
          }
        />
      )}

      {/* ── Menu Item Modal ── */}
      {itemModal && (
        <MenuItemModal
          item={itemModal === 'new' ? null : itemModal}
          categories={categories}
          onClose={() => setItemModal(null)}
          onSave={(data) =>
            itemMutation.mutateAsync({
              id: itemModal?.id,
              data,
            })
          }
        />
      )}
    </div>
  )
}
