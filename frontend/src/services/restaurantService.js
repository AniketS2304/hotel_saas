import { apiGet, apiPut } from './api'

/**
 * Get the authenticated user's restaurant info
 */
export const getMyRestaurant = () =>
  apiGet('/api/v1/restaurants/me')

/**
 * Update restaurant details
 * @param {{ name?: string, description?: string, logo_url?: string }} data
 */
export const updateRestaurant = (data) =>
  apiPut('/api/v1/restaurants/me', data)
