// Helper para obtener cabeceras de autorización
function getHeaders(isMultipart = false) {
  const headers = {}
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json'
  }
  
  try {
    const raw = localStorage.getItem('educonecta_session')
    if (raw) {
      const session = JSON.parse(raw)
      if (session.token) {
        headers['Authorization'] = `Bearer ${session.token}`;
      }
    }
  } catch (e) {
    console.error('Error leyendo token de localStorage', e)
  }
  return headers
}

// ─────────────────────────────────────────────────────────────
//  1. GESTIÓN DE USUARIOS
// ─────────────────────────────────────────────────────────────

// Listar Usuarios
export async function getUsers(filters = {}) {
  const query = new URLSearchParams()
  if (filters.role) query.append('role', filters.role)
  if (filters.active !== undefined) query.append('active', filters.active)
  
  const res = await fetch(`/api/v1/users/?${query.toString()}`, {
    method: 'GET',
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Error al listar usuarios')
  return res.json()
}

// Buscar Usuarios
export async function searchUsers(q) {
  const res = await fetch(`/api/v1/users/search?q=${encodeURIComponent(q)}`, {
    method: 'GET',
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Error en búsqueda de usuarios')
  return res.json()
}

// Obtener Usuario por ID
export async function getUserDetails(userId) {
  const res = await fetch(`/api/v1/users/${userId}`, {
    method: 'GET',
    headers: getHeaders()
  })
  if (!res.ok) {
    const err = new Error('Usuario no encontrado')
    err.status = res.status
    throw err
  }
  return res.json()
}

// Crear Usuario
export async function createUser(data) {
  const res = await fetch('/api/v1/users/', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })

  if (!res.ok) {
    const d = await res.json().catch(() => ({}))
    const err = new Error(d.detail || 'Error al crear usuario')
    err.status = res.status
    throw err
  }
  return res.json()
}

// Actualizar Usuario
export async function updateUser(userId, data) {
  const res = await fetch(`/api/v1/users/${userId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Error al actualizar usuario')
  return res.json()
}

// Desactivar Usuario (Logical Delete)
export async function deactivateUser(userId) {
  const res = await fetch(`/api/v1/users/${userId}`, {
    method: 'DELETE',
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Error al desactivar usuario')
  return res.json()
}

// Vincular Padre y Estudiante Manualmente
export async function linkParentStudent(parentId, studentId) {
  const res = await fetch('/api/v1/users/parent-students', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ parent_id: parentId, student_id: studentId })
  })
  if (!res.ok) {
    const d = await res.json().catch(() => ({}))
    throw new Error(d.detail || 'Error al vincular cuentas')
  }
  return res.json()
}

// Obtener los Hijos de un Padre
export async function getParentChildren(parentId) {
  const res = await fetch(`/api/v1/users/parents/${parentId}/children`, {
    method: 'GET',
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Error al obtener hijos del encargado')
  return res.json()
}

// Obtener hijos del Encargado Autenticado
export async function getMyChildren() {
  const res = await fetch('/api/v1/users/my-children', {
    method: 'GET',
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Error al consultar sus hijos')
  return res.json()
}

// ─────────────────────────────────────────────────────────────
//  2. ASIGNACIONES ACADÉMICAS Y MATERIAS
// ─────────────────────────────────────────────────────────────

// Obtener materias asignadas a un estudiante
export async function getStudentSubjects(studentId, period = '2026') {
  const query = new URLSearchParams()
  if (period) query.append('period', period)
  
  const res = await fetch(`/api/v1/users/${studentId}/subjects?${query.toString()}`, {
    method: 'GET',
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Error al obtener materias del estudiante')
  return res.json()
}

// Asignar materias a un estudiante
export async function assignSubjects(studentId, assignments) {
  const res = await fetch(`/api/v1/users/${studentId}/subjects`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ assignments })
  })
  if (!res.ok) throw new Error('Error al asignar materias')
  return res.json()
}

// Eliminar materia de un estudiante
export async function removeSubjectFromStudent(studentId, subjectId, period = '2026') {
  const res = await fetch(`/api/v1/users/${studentId}/subjects/${subjectId}?period=${period}`, {
    method: 'DELETE',
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Error al remover materia del estudiante')
  return res.json()
}

// Listar todas las materias
export async function listSubjects() {
  const res = await fetch('/api/v1/users/subjects', {
    method: 'GET',
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Error al listar materias')
  return res.json()
}

// Crear una materia nueva
export async function createSubject(data) {
  const res = await fetch('/api/v1/users/subjects', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Error al crear materia')
  return res.json()
}

// Listar todos los grupos
export async function listGroups() {
  const res = await fetch('/api/v1/users/groups', {
    method: 'GET',
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Error al listar grupos')
  return res.json()
}

// Obtener detalles de un grupo (estudiantes y docentes)
export async function getGroupDetails(groupId) {
  const res = await fetch(`/api/v1/users/groups/${groupId}/details`, {
    method: 'GET',
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Error al obtener detalles de la sección')
  return res.json()
}

// ─────────────────────────────────────────────────────────────
//  3. IMPORTACIONES CSV Y AUTOMATIZACIÓN
// ─────────────────────────────────────────────────────────────

// Cargar archivo CSV de usuarios (Directo)
export async function uploadUsersCsv(file) {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch('/api/v1/users/import/users', {
    method: 'POST',
    headers: getHeaders(true),
    body: formData
  })
  if (!res.ok) throw new Error('Error al procesar el archivo CSV de usuarios')
  return res.json()
}

// Cargar archivo CSV de estudiantes (Directo)
export async function uploadStudentsCsv(file) {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch('/api/v1/users/import/students', {
    method: 'POST',
    headers: getHeaders(true),
    body: formData
  })
  if (!res.ok) throw new Error('Error al procesar el archivo CSV de estudiantes')
  return res.json()
}

// Ejecutar importación automatizada de usuarios desde archivo local
export async function runUsersAutomation() {
  const res = await fetch('/api/v1/automation/users', {
    method: 'POST',
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Error al ejecutar la automatización de usuarios')
  return res.json()
}

// Ejecutar importación automatizada de estudiantes desde archivo local
export async function runStudentsAutomation() {
  const res = await fetch('/api/v1/automation/students', {
    method: 'POST',
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Error al ejecutar la automatización de estudiantes')
  return res.json()
}

// ─────────────────────────────────────────────────────────────
//  4. MÓDULO DE ASISTENCIA
// ─────────────────────────────────────────────────────────────

export async function saveAttendance(data) {
  const res = await fetch('/api/v1/attendance', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    const d = await res.json().catch(() => ({}))
    throw new Error(d.detail || 'Error al registrar la asistencia')
  }
  return res.json()
}

export async function getAttendanceHistory(filters = {}) {
  const query = new URLSearchParams()
  if (filters.date) query.append('date', filters.date)
  if (filters.group_id) query.append('group_id', filters.group_id)
  if (filters.subject_id) query.append('subject_id', filters.subject_id)

  const res = await fetch(`/api/v1/attendance?${query.toString()}`, {
    method: 'GET',
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Error al obtener historial de asistencia')
  return res.json()
}

// Obtener asistencia mensual de un estudiante (vista de encargado)
export async function getStudentMonthlyAttendance(studentId, month, year = 2026) {
  const res = await fetch(`/api/v1/attendance/students/${studentId}/monthly?month=${month}&year=${year}`, {
    method: 'GET',
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Error al obtener la asistencia mensual del estudiante')
  return res.json()
}

// ─────────────────────────────────────────────────────────────
//  5. MÓDULO DE CALENDARIO
// ─────────────────────────────────────────────────────────────

// Obtener eventos vigentes del calendario asignados al aula del estudiante
export async function getStudentEvents(studentId, filters = {}) {
  const query = new URLSearchParams()
  if (filters.month) query.append('month', filters.month)
  if (filters.year) query.append('year', filters.year)

  const res = await fetch(`/api/v1/calendar/students/${studentId}/events?${query.toString()}`, {
    method: 'GET',
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Error al obtener los eventos del calendario')
  return res.json()
}

// Obtener el histórico de eventos de una sección (vista de docente)
export async function getGroupEvents(groupId, filters = {}) {
  const query = new URLSearchParams()
  query.append('group_id', groupId)
  if (filters.month) query.append('month', filters.month)
  if (filters.year) query.append('year', filters.year)

  const res = await fetch(`/api/v1/calendar/events?${query.toString()}`, {
    method: 'GET',
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Error al obtener los eventos de la sección')
  return res.json()
}

// Registrar un evento escolar vinculado a una sección (RF-23)
export async function createEvent(data) {
  const res = await fetch('/api/v1/calendar/events', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    const d = await res.json().catch(() => ({}))
    throw new Error(d.detail || 'Error al crear el evento')
  }
  return res.json()
}

// Actualizar un evento escolar (US-R3-FE-026)
export async function updateEvent(eventId, data) {
  const res = await fetch(`/api/v1/calendar/events/${eventId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    const d = await res.json().catch(() => ({}))
    throw new Error(d.detail || 'Error al actualizar el evento')
  }
  return res.json()
}

// Eliminar un evento escolar (US-R3-FE-026)
export async function deleteEvent(eventId) {
  const res = await fetch(`/api/v1/calendar/events/${eventId}`, {
    method: 'DELETE',
    headers: getHeaders()
  })
  if (!res.ok) {
    const d = await res.json().catch(() => ({}))
    throw new Error(d.detail || 'Error al eliminar el evento')
  }
  return res.json()
}
