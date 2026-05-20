import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from './api'
import api from './api'

// ── Public ──────────────────────────────────────────────────────────────────

/**
 * Fetch the public menu for a given restaurant
 * @param {string} restaurantId
 */
export const getPublicMenu = (restaurantId, tableId) =>
  apiGet(`/api/v1/menu/${restaurantId}${tableId ? `?table_id=${tableId}` : ''}`)

// ── Categories (admin) ───────────────────────────────────────────────────────

export const getCategories = () =>
  apiGet('/api/v1/categories')

export const createCategory = (data) =>
  apiPost('/api/v1/categories', data)

export const updateCategory = (id, data) =>
  apiPut(`/api/v1/categories/${id}`, data)

export const deleteCategory = (id) =>
  apiDelete(`/api/v1/categories/${id}`)

// ── Menu Items (admin) ───────────────────────────────────────────────────────

export const getMenuItems = () =>
  apiGet('/api/v1/menu-items')

export const createMenuItem = (data) =>
  apiPost('/api/v1/menu-items', data)

export const updateMenuItem = (id, data) =>
  apiPut(`/api/v1/menu-items/${id}`, data)

export const deleteMenuItem = (id) =>
  apiDelete(`/api/v1/menu-items/${id}`)

export const toggleMenuItem = (id) =>
  apiPatch(`/api/v1/menu-items/${id}/toggle`)

/**
 * Upload an image file via FormData
 * @param {File} file
 */
export const uploadImage = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/api/v1/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
