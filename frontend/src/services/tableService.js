import { apiGet, apiPost, apiDelete } from './api'

/**
 * Get all tables for the authenticated restaurant
 */
export const getTables = () =>
  apiGet('/api/v1/tables')

/**
 * Create a new table
 * @param {{ number: string }} data
 */
export const createTable = (data) =>
  apiPost('/api/v1/tables', data)

/**
 * Delete a table by ID
 * @param {string} id
 */
export const deleteTable = (id) =>
  apiDelete(`/api/v1/tables/${id}`)
