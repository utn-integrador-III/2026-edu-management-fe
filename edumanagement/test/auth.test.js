import { vi, describe, it, expect, beforeEach } from 'vitest'
import { loginUser, logoutUser, changePassword, recoverPassword, resetPassword } from '../src/api/auth'

describe('Auth API Functions', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    mockFetch.mockReset()
    localStorage.clear()
  })

  describe('loginUser', () => {
    it('sends POST request to /api/v1/auth/login and returns response JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'jwt-token', role: 'admin' })
      })

      const result = await loginUser('12345678', 'password123')

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_number: '12345678', password: 'password123' })
      })
      expect(result).toEqual({ token: 'jwt-token', role: 'admin' })
    })

    it('throws error when response is not ok', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Credenciales incorrectas' })
      })

      await expect(loginUser('12345678', 'wrong')).rejects.toThrow('Credenciales incorrectas')
    })
  })

  describe('logoutUser', () => {
    it('sends POST request to /api/v1/auth/logout with auth header', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })

      await logoutUser('some-token')

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer some-token'
        }
      })
    })
  })

  describe('changePassword', () => {
    it('sends PUT request to /api/v1/auth/change-password with token and passwords', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })

      await changePassword('token123', 'oldPassword', 'newPassword')

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token123'
        },
        body: JSON.stringify({ currentPassword: 'oldPassword', newPassword: 'newPassword' })
      })
    })

    it('throws error on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Password too weak' })
      })

      await expect(changePassword('t', 'o', 'n')).rejects.toThrow('Password too weak')
    })
  })

  describe('recoverPassword', () => {
    it('sends POST request to /api/v1/auth/recover-password', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sent: true })
      })

      const result = await recoverPassword('102340567')

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/recover-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_number: '102340567' })
      })
      expect(result).toEqual({ sent: true })
    })

    it('throws error on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'User not found' })
      })

      await expect(recoverPassword('9999')).rejects.toThrow('User not found')
    })
  })

  describe('resetPassword', () => {
    it('sends POST request to /api/v1/auth/reset-password', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })

      await resetPassword('recover-token', 'myNewPassword123')

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'recover-token', newPassword: 'myNewPassword123' })
      })
    })

    it('throws error on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Token expired' })
      })

      await expect(resetPassword('expired', 'newpass')).rejects.toThrow('Token expired')
    })
  })
})
