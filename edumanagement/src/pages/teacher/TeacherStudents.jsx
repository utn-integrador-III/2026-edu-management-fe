import { useState, useEffect, useCallback } from 'react'
import { GraduationCap, Users, Search, Phone, Mail, User, BookOpen } from 'lucide-react'
import { getUsers, listGroups, getParentChildren, getStudentSubjects } from '../../api/edu'

export default function TeacherStudents() {
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Detalles del estudiante seleccionado para el Drawer
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [studentParent, setStudentParent] = useState(null)
  const [studentSubjects, setStudentSubjects] = useState([])
  const [loadingDetails, setLoadingDetails] = useState(false)

  // Cargar grupos
  const loadGroups = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listGroups()
      setGroups(data)
      if (data.length > 0) {
        setSelectedGroup(data[0])
      }
    } catch (err) {
      console.error('Error al cargar grupos del docente', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Cargar estudiantes de la sección activa
  const loadStudents = useCallback(async () => {
    if (!selectedGroup) return
    setLoading(true)
    try {
      const data = await getUsers({ role: 'student', active: true })
      // Filtrar estudiantes por el grupo seleccionado
      const filtered = data.filter(s => s.group_id === selectedGroup.id)
      setStudents(filtered)
    } catch (err) {
      console.error('Error al cargar alumnos de la sección', err)
    } finally {
      setLoading(false)
    }
  }, [selectedGroup])

  useEffect(() => {
    loadGroups()
  }, [loadGroups])

  useEffect(() => {
    loadStudents()
  }, [selectedGroup, loadStudents])

  // Abrir ficha de alumno (Drawer)
  const handleOpenStudentDrawer = async (student) => {
    setSelectedStudent(student)
    setLoadingDetails(true)
    setStudentParent(null)
    setStudentSubjects([])
    try {
      // 1. Cargar materias
      const subs = await getStudentSubjects(student.id, '2026')
      setStudentSubjects(subs)

      // 2. Buscar encargado
      const allParents = await getUsers({ role: 'parent' })
      let parentFound = null
      for (const p of allParents) {
        const children = await getParentChildren(p.id)
        if (children.some(c => c.id === student.id)) {
          parentFound = p
          break
        }
      }
      setStudentParent(parentFound)
    } catch (err) {
      console.error('Error al cargar ficha de estudiante', err)
    } finally {
      setLoadingDetails(false)
    }
  }

  // Filtrar estudiantes por búsqueda
  const filteredStudents = students.filter(s => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      s.first_name.toLowerCase().includes(q) ||
      s.last_name.toLowerCase().includes(q) ||
      s.id_number.includes(q)
    )
  })

  return (
    <div>
      {/* Cabecera */}
      <div className="actions-bar">
        <div>
          <h1 className="text-h1" style={{ color: 'var(--neutral-900)' }}>Mis Estudiantes</h1>
          <p className="text-sm">Consulte los grupos a su cargo, lista de alumnos matriculados e información de contacto.</p>
        </div>
      </div>

      {/* Selector de Grupos/Secciones */}
      <div className="tabs-container">
        {groups.map(g => (
          <button
            key={g.id}
            className={`tab-button${selectedGroup?.id === g.id ? ' active' : ''}`}
            onClick={() => { setSelectedGroup(g); setSelectedStudent(null); }}
          >
            <Users size={20} strokeWidth={1.5} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
            Sección {g.name} ({g.level})
          </button>
        ))}
      </div>

      {/* Barra de Búsqueda */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div className="search-bar" style={{ maxWidth: '360px' }}>
          <Search size={20} strokeWidth={1.5} className="search-icon" />
          <input
            type="text"
            className="field-input search-input"
            placeholder="Buscar por nombre o cédula..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de Alumnos */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p className="text-h3" style={{ color: 'var(--neutral-400)' }}>Cargando lista de estudiantes...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <GraduationCap size={48} strokeWidth={1} color="var(--neutral-300)" style={{ marginBottom: '8px' }} />
          <p className="text-h3" style={{ color: 'var(--neutral-400)' }}>No hay estudiantes registrados en este grupo</p>
        </div>
      ) : (
        <div className="table-container">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Cédula</th>
                  <th>Nombre Completo</th>
                  <th>Sección</th>
                  <th>Nivel</th>
                  <th>Contacto</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(s => (
                  <tr key={s.id}>
                    <td className="text-mono" style={{ fontWeight: 600 }}>{s.id_number}</td>
                    <td style={{ fontWeight: 500, color: 'var(--neutral-900)' }}>{s.first_name} {s.last_name}</td>
                    <td><span className="badge badge-blue">{selectedGroup?.name}</span></td>
                    <td>{selectedGroup?.level}</td>
                    <td>{s.phone || s.email || <span style={{ color: 'var(--neutral-300)' }}>—</span>}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenStudentDrawer(s)}
                      >
                        Ver Ficha
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DRAWER/FICHA DEL ESTUDIANTE */}
      {selectedStudent && (
        <div className="drawer-overlay" onClick={(e) => e.target === e.currentTarget && setSelectedStudent(null)}>
          <div className="drawer-content">
            <div style={{ display: 'flex', justifySelf: 'flex-start', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 className="text-h2" style={{ color: 'var(--neutral-900)' }}>Expediente del Alumno</h2>
              <button className="modal-close-btn" onClick={() => setSelectedStudent(null)}>✕</button>
            </div>

            {/* Avatar & Info */}
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--blue-50)',
                  color: 'var(--blue-500)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '20px',
                  marginBottom: '12px'
                }}
              >
                {selectedStudent.first_name[0]}{selectedStudent.last_name[0]}
              </div>
              <h3 className="text-h2" style={{ color: 'var(--neutral-900)' }}>
                {selectedStudent.first_name} {selectedStudent.last_name}
              </h3>
              <p className="text-sm" style={{ color: 'var(--neutral-500)', marginTop: '2px' }}>
                Sección: <strong>{selectedGroup?.name} ({selectedGroup?.level})</strong>
              </p>
            </div>

            {/* Ficha General */}
            <div style={{ borderTop: '1px solid var(--neutral-100)', paddingTop: '20px', marginBottom: '28px' }}>
              <h4 className="text-caption" style={{ fontWeight: 700, marginBottom: '12px', color: 'var(--neutral-400)' }}>Detalles del Estudiante</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={16} strokeWidth={1.5} color="var(--neutral-400)" />
                  <span className="text-body">Cédula: <strong>{selectedStudent.id_number}</strong></span>
                </div>
                {selectedStudent.birth_date && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={16} strokeWidth={1.5} color="var(--neutral-400)" />
                    <span className="text-body">Nacimiento: {selectedStudent.birth_date}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Encargado legal */}
            <div style={{ borderTop: '1px solid var(--neutral-100)', paddingTop: '20px', marginBottom: '28px' }}>
              <h4 className="text-caption" style={{ fontWeight: 700, marginBottom: '12px', color: 'var(--neutral-400)' }}>Contacto del Encargado</h4>
              
              {loadingDetails ? (
                <p className="text-sm">Buscando encargado...</p>
              ) : !studentParent ? (
                <p className="text-sm" style={{ color: 'var(--neutral-400)' }}>No se encontró encargado registrado.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <p style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{studentParent.first_name} {studentParent.last_name}</p>
                  <p className="text-caption">Cédula: {studentParent.id_number}</p>
                  {studentParent.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                      <Phone size={16} strokeWidth={1.5} color="var(--neutral-400)" />
                      <span>{studentParent.phone}</span>
                    </div>
                  )}
                  {studentParent.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                      <Mail size={16} strokeWidth={1.5} color="var(--neutral-400)" />
                      <span>{studentParent.email}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Materias */}
            <div style={{ borderTop: '1px solid var(--neutral-100)', paddingTop: '20px' }}>
              <h4 className="text-caption" style={{ fontWeight: 700, marginBottom: '12px', color: 'var(--neutral-400)' }}>Materias inscritas (Periodo 2026)</h4>
              
              {loadingDetails ? (
                <p className="text-sm">Cargando materias...</p>
              ) : studentSubjects.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--neutral-400)' }}>No tiene materias asignadas.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {studentSubjects.map(sub => (
                    <div
                      key={sub.id}
                      style={{
                        padding: '10px 12px',
                        background: 'var(--neutral-50)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <p style={{ fontWeight: 600 }}>{sub.name}</p>
                        <p className="text-caption">{sub.code}</p>
                      </div>
                      <span className="badge badge-gray">{sub.group_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
