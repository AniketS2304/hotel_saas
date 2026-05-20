import { apiPost, apiGet } from './api'

/**
 * Login with email and password
 * @param {string} email
 * @param {string} password
 */
export const login = (email, password) =>
  apiPost('/api/v1/auth/login', { email, password })

/**
 * Register a new user
 * @param {{ name: string, email: string, password: string, role?: string }} data
 */
export const register = (data) =>
  apiPost('/api/v1/auth/register', data)

/**
 * Refresh access token
 * @param {string} token
 */
export const refreshToken = (token) =>
  apiPost('/api/v1/auth/refresh', { refresh_token: token })

/**
 * Get current authenticated user info
 */
export const getMe = () =>
  apiGet('/api/v1/auth/me')
