import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,

      /**
       * Login: store user data and tokens
       * @param {import('../types').User} userData
       * @param {string} token
       * @param {string} refreshToken
       */
      login: (userData, token, refreshToken) => {
        localStorage.setItem('auth_token', token)
        set({ user: userData, token, refreshToken })
      },

      /**
       * Logout: clear everything
       */
      logout: () => {
        localStorage.removeItem('auth_token')
        set({ user: null, token: null, refreshToken: null })
      },

      /**
       * Update just the user object (e.g. after profile update)
       * @param {import('../types').User} user
       */
      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
      }),
    }
  )
)

export default useAuthStore
