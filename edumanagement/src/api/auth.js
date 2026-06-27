// ─────────────────────────────────────────────────────────────
//  Cambiar a false cuando el backend esté disponible
// ─────────────────────────────────────────────────────────────
const USE_MOCK = true

const delay = (ms = 500) => new Promise(r => setTimeout(r, ms))

// Credencial de admin hardcodeada (solo para desarrollo)
const ADMIN_CREDENTIALS = {
  id_number: 'admin',
  password:  'admin123',
  response: {
    token:              'mock-jwt-admin-token',
    role:               'admin',
    first_name:         'Administrador',
    last_name:          'Sistema',
    mustChangePassword: false,
  },
}

// ── Login ─────────────────────────────────────────────────────
export async function loginUser(id_number, password) {
  if (USE_MOCK) {
    await delay()

    if (
      id_number === ADMIN_CREDENTIALS.id_number &&
      password  === ADMIN_CREDENTIALS.password
    ) {
      return ADMIN_CREDENTIALS.response
    }

    // Simular respuesta 401 del backend
    const err = new Error('Credenciales incorrectas')
    err.status = 401
    throw err
  }

  const res = await fetch('/api/v1/auth/login', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ id_number, password }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    const err  = new Error(data.detail || 'Error al iniciar sesión')
    err.status = res.status
    throw err
  }

  return res.json()
}

// ── Logout ────────────────────────────────────────────────────
export async function logoutUser(token) {
  if (USE_MOCK) {
    await delay(200)
    return
  }

  await fetch('/api/v1/auth/logout', {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
  })
  // No lanzar error en logout — limpiar sesión de todos modos
}

// ── Cambio de contraseña ──────────────────────────────────────
export async function changePassword(token, currentPassword, newPassword) {
  if (USE_MOCK) {
    await delay()
    if (newPassword.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres')
    }
    return
  }

  const res = await fetch('/api/v1/auth/change-password', {
    method:  'PUT',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.detail || 'Error al cambiar contraseña')
  }
}