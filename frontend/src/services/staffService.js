import { apiGet, apiPost, apiPatch, apiDelete } from './api'

export const getStaff = () => apiGet('/api/v1/staff')

export const createStaff = (data) => apiPost('/api/v1/staff', data)

export const updateStaff = (id, data) => apiPatch(`/api/v1/staff/${id}`, data)

export const deleteStaff = (id) => apiDelete(`/api/v1/staff/${id}`)
