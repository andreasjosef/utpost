import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ApiError, LoginResponse, User } from '@utpost/shared'
import { post } from '@/api'

const readStoredUser = (): User | null => {
  const raw = localStorage.getItem('user')
  // Vi skrev själva det här värdet vid login, så vi litar på formen.
  return raw ? (JSON.parse(raw) as User) : null
}

export const useSessionStore = defineStore('session', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<User | null>(readStoredUser())

  const isAuthenticated = computed(() => Boolean(token.value && user.value))

  async function login(email: string, password: string): Promise<User> {
    const data = await post<LoginResponse | ApiError>('/auth/login', { email, password })

    if ('error' in data) {
      throw new Error(data.error || 'Kunde inte logga in')
    }

    token.value = data.token
    user.value = data.user

    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))

    return data.user
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return {
    token,
    user,
    isAuthenticated,
    login,
    logout,
  }
})
