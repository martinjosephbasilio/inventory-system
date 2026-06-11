import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref(null)
  const user = ref(null)
  const isAuthenticated = ref(false)

  // Initialize from localStorage (run immediately)
  const init = () => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (storedToken && storedUser) {
      token.value = storedToken
      user.value = JSON.parse(storedUser)
      isAuthenticated.value = true
      return true
    }
    return false
  }

  // Actions
  const setToken = (newToken) => {
    token.value = newToken
    isAuthenticated.value = true
    localStorage.setItem('token', newToken)
  }

  const setUser = (newUser) => {
    user.value = newUser
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  const logout = () => {
    token.value = null
    user.value = null
    isAuthenticated.value = false
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const restoreSession = () => {
    return init()
  }

  const getToken = () => {
    return token.value || localStorage.getItem('token')
  }

  const getUser = () => {
    return user.value || JSON.parse(localStorage.getItem('user') || 'null')
  }

  // Auto-initialize when store is created
  init()

  return {
    // State
    token,
    user,
    isAuthenticated,
    // Actions
    setToken,
    setUser,
    logout,
    restoreSession,
    // Getters
    getToken,
    getUser
  }
})