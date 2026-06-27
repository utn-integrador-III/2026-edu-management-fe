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

// Usuarios mock — docentes y encargados
const MOCK_USERS = [
  {
    id_number: '12345678',
    password:  '12345678',
    response: {
      token:              'mock-jwt-teacher-token',
      role:               'teacher',
      first_name:         'Juan',
      last_name:          'Pérez García',
      mustChangePassword: true,  // simula primer login
    },
  },
  {
    id_number: '604420243',
    password:  '604420243',
    response: {
      token:              'mock-jwt-parent-token',
      role:               'parent',
      first_name:         'Caleb',
      last_name:          'Alvarado Salas',
      mustChangePassword: false,
    },
  },
]

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

    const found = MOCK_USERS.find(
      u => u.id_number === id_number && u.password === password
    )
    if (found) return found.response

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

// ── Recuperar contraseña ──────────────────────────────────────
export async function recoverPassword(email) {
  if (USE_MOCK) {
    await delay()
    // Simula envío de correo — no revela si el email existe o no
    return { sent: true }
  }

  const res = await fetch('/api/v1/auth/recover-password', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.detail || 'No se pudo procesar la solicitud')
  }

  return res.json().catch(() => ({ sent: true }))
}