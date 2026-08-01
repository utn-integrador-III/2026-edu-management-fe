// ── Login ─────────────────────────────────────────────────────
export async function loginUser(id_number, password) {
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
  await fetch('/api/v1/auth/logout', {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
  })
}

// ── Cambio de contraseña ──────────────────────────────────────
export async function changePassword(token, currentPassword, newPassword) {
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
export async function recoverPassword(id_number) {
  const res = await fetch('/api/v1/auth/recover-password', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ id_number }), 
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.detail || 'No se pudo procesar la solicitud')
  }

  return res.json().catch(() => ({ sent: true }))
}

// ── Restablecer contraseña ────────────────────────────────────
export async function resetPassword(token, newPassword) {
  const res = await fetch('/api/v1/auth/reset-password', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ token, newPassword }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.detail || 'Error al restablecer la contraseña')
  }
}