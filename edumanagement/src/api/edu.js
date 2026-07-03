// ─────────────────────────────────────────────────────────────
//  Cambiar a false para usar el backend real (con proxy de Vite)
// ─────────────────────────────────────────────────────────────
const USE_MOCK = false

const delay = (ms = 500) => new Promise(r => setTimeout(r, ms))

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
//  BASE DE DATOS MOCK MUTABLE EN MEMORIA
// ─────────────────────────────────────────────────────────────
let _mockUsers = [
  {
    id: '64f91ba48c0840b2a8d3e911',
    id_number: '203450987',
    first_name: 'Carlos',
    last_name: 'Alvarado',
    email: 'c.alvarado@educonecta.cr',
    phone: '8877-6655',
    role: 'teacher',
    type: 'I',
    group_id: null,
    birth_date: '1985-04-12',
    is_adult: true,
    active: true,
    created_at: '2026-06-29T00:46:02.123456'
  },
  {
    id: '64f91ba48c0840b2a8d3e912',
    id_number: '12345678',
    first_name: 'Juan',
    last_name: 'Pérez García',
    email: 'j.perez@educonecta.cr',
    phone: '8888-1111',
    role: 'teacher',
    type: 'II',
    group_id: null,
    birth_date: '1980-01-01',
    is_adult: true,
    active: true,
    created_at: '2026-06-29T00:46:02.123456'
  },
  {
    id: '64f91ba48c0840b2a8d3e899',
    id_number: '104950345',
    first_name: 'Mario',
    last_name: 'Murillo',
    email: 'm.murillo@example.com',
    phone: '8989-1212',
    role: 'parent',
    type: null,
    group_id: null,
    birth_date: '1982-11-20',
    is_adult: true,
    active: true,
    created_at: '2026-06-29T00:46:02.123456'
  },
  {
    id: '64f91ba48c0840b2a8d3e898',
    id_number: '604420243',
    first_name: 'Caleb',
    last_name: 'Alvarado Salas',
    email: 'c.alvarado.salas@example.com',
    phone: '8787-3434',
    role: 'parent',
    type: null,
    group_id: null,
    birth_date: '1979-05-15',
    is_adult: true,
    active: true,
    created_at: '2026-06-29T00:46:02.123456'
  },
  {
    id: '64f91ba48c0840b2a8d3e999',
    id_number: '201980765',
    first_name: 'Jimena',
    last_name: 'Murillo',
    email: 'j.murillo@example.com',
    phone: '8344-9988',
    role: 'student',
    type: null,
    group_id: '64f91ba48c0840b2a8d3e900', // 7-A
    birth_date: '2012-07-15',
    is_adult: false,
    active: true,
    created_at: '2026-06-29T00:46:02.123456'
  },
  {
    id: '64f91ba48c0840b2a8d3e998',
    id_number: '202100554',
    first_name: 'Lucas',
    last_name: 'Alvarado',
    email: 'l.alvarado@example.com',
    phone: '8111-2222',
    role: 'student',
    type: null,
    group_id: '64f91ba48c0840b2a8d3e900', // 7-A
    birth_date: '2013-09-02',
    is_adult: false,
    active: true,
    created_at: '2026-06-29T00:46:02.123456'
  }
]

let _mockSubjects = [
  {
    id: '64f91ba48c0840b2a8d3e111',
    name: 'Matemáticas',
    code: 'MAT-7',
    level: 'Septimo'
  },
  {
    id: '64f91ba48c0840b2a8d3e112',
    name: 'Ciencias',
    code: 'CIE-7',
    level: 'Septimo'
  },
  {
    id: '64f91ba48c0840b2a8d3e113',
    name: 'Español',
    code: 'ESP-7',
    level: 'Septimo'
  },
  {
    id: '64f91ba48c0840b2a8d3e114',
    name: 'Estudios Sociales',
    code: 'SOC-7',
    level: 'Septimo'
  }
]

let _mockGroups = [
  {
    id: '64f91ba48c0840b2a8d3e900',
    name: '7-A',
    level: 'Septimo',
    created_at: '2026-06-29T00:46:02.123456'
  },
  {
    id: '64f91ba48c0840b2a8d3e901',
    name: '8-A',
    level: 'Octavo',
    created_at: '2026-06-29T00:46:02.123456'
  }
]

// Relación Padre-Estudiante
let _mockParentStudents = [
  {
    parent_id: '64f91ba48c0840b2a8d3e899', // Mario Murillo
    student_id: '64f91ba48c0840b2a8d3e999' // Jimena Murillo
  },
  {
    parent_id: '64f91ba48c0840b2a8d3e898', // Caleb Alvarado
    student_id: '64f91ba48c0840b2a8d3e998' // Lucas Alvarado
  }
]

// Relación Estudiante-Materias (Asignaciones)
let _mockAssignments = [
  {
    student_id: '64f91ba48c0840b2a8d3e999', // Jimena
    subject_id: '64f91ba48c0840b2a8d3e111', // Mate
    teacher_id: '64f91ba48c0840b2a8d3e911', // Carlos
    group_id: '64f91ba48c0840b2a8d3e900', // 7-A
    period: '2026'
  },
  {
    student_id: '64f91ba48c0840b2a8d3e999', // Jimena
    subject_id: '64f91ba48c0840b2a8d3e112', // Ciencias
    teacher_id: '64f91ba48c0840b2a8d3e912', // Juan
    group_id: '64f91ba48c0840b2a8d3e900',
    period: '2026'
  },
  {
    student_id: '64f91ba48c0840b2a8d3e998', // Lucas
    subject_id: '64f91ba48c0840b2a8d3e111', // Mate
    teacher_id: '64f91ba48c0840b2a8d3e911',
    group_id: '64f91ba48c0840b2a8d3e900',
    period: '2026'
  }
]

// ─────────────────────────────────────────────────────────────
//  1. GESTIÓN DE USUARIOS
// ─────────────────────────────────────────────────────────────

// Listar Usuarios
export async function getUsers(filters = {}) {
  if (USE_MOCK) {
    await delay()
    let list = [..._mockUsers]
    if (filters.role) {
      list = list.filter(u => u.role === filters.role)
    }
    if (filters.active !== undefined) {
      const activeBool = filters.active === 'true' || filters.active === true
      list = list.filter(u => u.active === activeBool)
    }
    return list
  }

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
  if (USE_MOCK) {
    await delay()
    const query = q.toLowerCase().trim()
    if (!query) return []
    return _mockUsers.filter(u => 
      u.first_name.toLowerCase().includes(query) ||
      u.last_name.toLowerCase().includes(query) ||
      u.id_number.includes(query) ||
      u.role.toLowerCase().includes(query)
    )
  }

  const res = await fetch(`/api/v1/users/search?q=${encodeURIComponent(q)}`, {
    method: 'GET',
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Error en búsqueda de usuarios')
  return res.json()
}

// Obtener Usuario por ID
export async function getUserDetails(userId) {
  if (USE_MOCK) {
    await delay()
    const found = _mockUsers.find(u => u.id === userId)
    if (!found) {
      const err = new Error('Usuario no encontrado')
      err.status = 404
      throw err
    }
    return found
  }

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
  if (USE_MOCK) {
    await delay()
    // Validar duplicado
    if (_mockUsers.some(u => u.id_number === data.id_number)) {
      const err = new Error('Ya existe un usuario con ese número de cédula')
      err.status = 409
      throw err
    }

    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      id_number: data.id_number,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email || null,
      phone: data.phone || null,
      role: data.role,
      type: data.type || null,
      group_id: data.group_id || null,
      birth_date: data.birth_date || null,
      is_adult: data.role !== 'student',
      active: true,
      created_at: new Date().toISOString()
    }

    _mockUsers.push(newUser)

    // Si es estudiante y se proporcionó padre, creamos la vinculación
    if (data.role === 'student' && data.parent_id) {
      // Buscar el padre
      const parent = _mockUsers.find(u => u.id === data.parent_id || u.id_number === data.parent_id)
      if (parent) {
        _mockParentStudents.push({
          parent_id: parent.id,
          student_id: newUser.id
        })
      }
    }

    return newUser
  }

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
  if (USE_MOCK) {
    await delay()
    const idx = _mockUsers.findIndex(u => u.id === userId)
    if (idx === -1) throw new Error('Usuario no encontrado')

    _mockUsers[idx] = {
      ..._mockUsers[idx],
      first_name: data.first_name,
      last_name: data.last_name,
      role: data.role,
      active: data.active !== undefined ? data.active : _mockUsers[idx].active,
      email: data.email || null,
      phone: data.phone || null,
      type: data.type || null,
      group_id: data.group_id || null
    }

    return _mockUsers[idx]
  }

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
  if (USE_MOCK) {
    await delay()
    const idx = _mockUsers.findIndex(u => u.id === userId)
    if (idx === -1) throw new Error('Usuario no encontrado')
    _mockUsers[idx].active = false
    return { message: 'User deactivated' }
  }

  const res = await fetch(`/api/v1/users/${userId}`, {
    method: 'DELETE',
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Error al desactivar usuario')
  return res.json()
}

// Vincular Padre y Estudiante Manualmente
export async function linkParentStudent(parentId, studentId) {
  if (USE_MOCK) {
    await delay()
    // Buscar padre y estudiante
    const parent = _mockUsers.find(u => (u.id === parentId || u.id_number === parentId) && u.role === 'parent')
    const student = _mockUsers.find(u => (u.id === studentId || u.id_number === studentId) && u.role === 'student')
    
    if (!parent) throw new Error('Padre/encargado no encontrado')
    if (!student) throw new Error('Estudiante no encontrado')

    // Evitar duplicados
    const exists = _mockParentStudents.some(
      rel => rel.parent_id === parent.id && rel.student_id === student.id
    )

    if (!exists) {
      _mockParentStudents.push({
        parent_id: parent.id,
        student_id: student.id
      })
    }

    return {
      parent_id: parent.id,
      parent_name: `${parent.first_name} ${parent.last_name}`,
      parent_cedula: parent.id_number,
      student_id: student.id,
      student_name: `${student.first_name} ${student.last_name}`,
      student_cedula: student.id_number,
      message: 'Relationship linked successfully'
    }
  }

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
  if (USE_MOCK) {
    await delay()
    const parent = _mockUsers.find(u => u.id === parentId || u.id_number === parentId)
    if (!parent) return []

    const rels = _mockParentStudents.filter(r => r.parent_id === parent.id)
    const childrenIds = rels.map(r => r.student_id)
    
    return _mockUsers
      .filter(u => childrenIds.includes(u.id))
      .map(child => {
        const group = _mockGroups.find(g => g.id === child.group_id)
        return {
          id: child.id,
          id_number: child.id_number,
          first_name: child.first_name,
          last_name: child.last_name,
          role: child.role,
          group_id: child.group_id,
          group_name: group ? group.name : 'Sin asignar',
          parent_cedula: parent.id_number,
          active: child.active
        }
      })
  }

  const res = await fetch(`/api/v1/users/parents/${parentId}/children`, {
    method: 'GET',
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Error al obtener hijos del encargado')
  return res.json()
}

// Obtener hijos del Encargado Autenticado
export async function getMyChildren() {
  if (USE_MOCK) {
    await delay()
    let activeParentId = null
    try {
      const raw = localStorage.getItem('educonecta_session')
      if (raw) {
        const session = JSON.parse(raw)
        const matched = _mockUsers.find(u => u.id_number === session.id_number)
        if (matched) activeParentId = matched.id
      }
    } catch {}

    if (!activeParentId) return []
    return getParentChildren(activeParentId)
  }

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
  if (USE_MOCK) {
    await delay()
    const student = _mockUsers.find(u => u.id === studentId || u.id_number === studentId)
    if (!student) return []

    const list = _mockAssignments.filter(a => a.student_id === student.id && a.period === period)
    
    return list.map(item => {
      const subject = _mockSubjects.find(s => s.id === item.subject_id)
      const teacher = _mockUsers.find(u => u.id === item.teacher_id)
      const group = _mockGroups.find(g => g.id === item.group_id)

      return {
        id: item.subject_id,
        name: subject ? subject.name : 'Materia desconocida',
        code: subject ? subject.code : 'S/C',
        level: subject ? subject.level : 'Sin asignar',
        teacher_name: teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Sin docente',
        group_name: group ? group.name : 'Sin sección',
        period: item.period
      }
    })
  }

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
  if (USE_MOCK) {
    await delay()
    const student = _mockUsers.find(u => u.id === studentId || u.id_number === studentId)
    if (!student) throw new Error('Estudiante no encontrado')

    assignments.forEach(assign => {
      const exists = _mockAssignments.some(a => 
        a.student_id === student.id &&
        a.subject_id === assign.subject_id &&
        a.period === (assign.period || '2026')
      )
      
      if (!exists) {
        _mockAssignments.push({
          student_id: student.id,
          subject_id: assign.subject_id,
          teacher_id: assign.teacher_id || null,
          group_id: assign.group_id || student.group_id || null,
          period: assign.period || '2026'
        })
      }
    })

    return { message: 'Subjects assigned successfully' }
  }

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
  if (USE_MOCK) {
    await delay()
    const student = _mockUsers.find(u => u.id === studentId || u.id_number === studentId)
    if (!student) throw new Error('Estudiante no encontrado')

    const initialLen = _mockAssignments.length
    _mockAssignments = _mockAssignments.filter(a => 
      !(a.student_id === student.id && a.subject_id === subjectId && a.period === period)
    )

    if (_mockAssignments.length === initialLen) {
      throw new Error('Asignación no encontrada')
    }

    return { message: 'Subject removed from student' }
  }

  const res = await fetch(`/api/v1/users/${studentId}/subjects/${subjectId}?period=${period}`, {
    method: 'DELETE',
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Error al remover materia del estudiante')
  return res.json()
}

// Listar todas las materias
export async function listSubjects() {
  if (USE_MOCK) {
    await delay()
    return [..._mockSubjects]
  }

  const res = await fetch('/api/v1/users/subjects', {
    method: 'GET',
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Error al listar materias')
  return res.json()
}

// Crear una materia nueva
export async function createSubject(data) {
  if (USE_MOCK) {
    await delay()
    const newSub = {
      id: Math.random().toString(36).substr(2, 9),
      name: data.name,
      code: data.code,
      level: data.level
    }
    _mockSubjects.push(newSub)
    return newSub
  }

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
  if (USE_MOCK) {
    await delay()
    return [..._mockGroups]
  }

  const res = await fetch('/api/v1/users/groups', {
    method: 'GET',
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Error al listar grupos')
  return res.json()
}

// Obtener detalles de un grupo (estudiantes y docentes)
export async function getGroupDetails(groupId) {
  if (USE_MOCK) {
    await delay()
    const group = _mockGroups.find(g => g.id === groupId)
    if (!group) throw new Error('Grupo no encontrado')
    
    const groupStudents = _mockUsers.filter(u => u.group_id === group.id && u.role === 'student' && u.active)
    
    const links = _mockAssignments.filter(a => a.group_id === group.id)
    const teachersMap = {}
    links.forEach(link => {
      const teacher = _mockUsers.find(u => u.id === link.teacher_id)
      const subject = _mockSubjects.find(s => s.id === link.subject_id)
      if (teacher && subject) {
        if (!teachersMap[teacher.id]) {
          teachersMap[teacher.id] = {
            id: teacher.id,
            first_name: teacher.first_name,
            last_name: teacher.last_name,
            email: teacher.email,
            phone: teacher.phone,
            subjects: []
          }
        }
        if (!teachersMap[teacher.id].subjects.includes(subject.name)) {
          teachersMap[teacher.id].subjects.push(subject.name)
        }
      }
    })
    
    return {
      group,
      students: groupStudents,
      teachers: Object.values(teachersMap)
    }
  }

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
  if (USE_MOCK) {
    await delay(1200)
    return {
      created: 15,
      updated: 2,
      deactivated: 0,
      skipped: 1,
      errors: []
    }
  }

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
  if (USE_MOCK) {
    await delay(1200)
    return {
      created: 10,
      updated: 0,
      deactivated: 0,
      linked: 10,
      skipped: 0,
      errors: []
    }
  }

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
  if (USE_MOCK) {
    await delay(1000)
    return {
      message: 'User CSV automation executed successfully',
      summary: {
        inserted: 24,
        updated: 1,
        deleted: 0
      }
    }
  }

  const res = await fetch('/api/v1/automation/users', {
    method: 'POST',
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Error al ejecutar la automatización de usuarios')
  return res.json()
}

// Ejecutar importación automatizada de estudiantes desde archivo local
export async function runStudentsAutomation() {
  if (USE_MOCK) {
    await delay(1000)
    return {
      message: 'Student CSV automation executed successfully',
      summary: {
        inserted: 18,
        updated: 0,
        deleted: 0
      }
    }
  }

  const res = await fetch('/api/v1/automation/students', {
    method: 'POST',
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Error al ejecutar la automatización de estudiantes')
  return res.json()
}
