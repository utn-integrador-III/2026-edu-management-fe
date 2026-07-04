import { useState, useEffect, useCallback } from 'react'
import {
  GraduationCap, Search, Plus, Trash2, Heart,
  BookOpen, Calendar, Check, AlertTriangle, User,
  Mail, Phone, X
} from 'lucide-react'
import {
  getUsers, getStudentSubjects, assignSubjects,
  removeSubjectFromStudent, listSubjects, listGroups,
  getParentChildren
} from '../../api/edu'

export default function AdminStudents() {
  const [students, setStudents] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  
  // Datos académicos del estudiante seleccionado
  const [subjects, setSubjects] = useState([])
  const [parents, setParents] = useState([])
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)

  // Catálogos
  const [allSubjects, setAllSubjects] = useState([])
  const [allTeachers, setAllTeachers] = useState([])
  const [allGroups, setAllGroups] = useState([])

  // Modal de asignación
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignForm, setAssignForm] = useState({
    subject_id: '',
    teacher_id: '',
    group_id: '',
    period: '2026'
  })

  // Feedback
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Cargar estudiantes (role = student)
  const loadStudents = useCallback(async () => {
    setLoadingStudents(true)
    try {
      const data = await getUsers({ role: 'student', active: true })
      setStudents(data)
      if (data.length > 0 && !selectedStudent) {
        setSelectedStudent(data[0])
      }
    } catch (err) {
      console.error('Error al cargar estudiantes', err)
    } finally {
      setLoadingStudents(false)
    }
  }, [selectedStudent])

  // Cargar catálogos
  const loadCatalogs = useCallback(async () => {
    try {
      const subs = await listSubjects()
      const grps = await listGroups()
      const tchs = await getUsers({ role: 'teacher', active: true })
      
      setAllSubjects(subs)
      setAllGroups(grps)
      setAllTeachers(tchs)
    } catch (err) {
      console.error('Error al cargar catálogos académicos', err)
    }
  }, [])

  // Cargar detalles de materias y encargados del estudiante seleccionado
  const loadStudentDetails = useCallback(async (student) => {
    if (!student) return
    setLoadingDetails(true)
    try {
      // 1. Cargar materias asignadas
      const subList = await getStudentSubjects(student.id, '2026')
      setSubjects(subList)

      // 2. Buscar encargado
      const allParents = await getUsers({ role: 'parent' })
      const parentList = allParents.filter(p => p.id_number === student.parent_cedula)
      setParents(parentList)
    } catch (err) {
      console.error('Error al cargar detalles de estudiante', err)
    } finally {
      setLoadingDetails(false)
    }
  }, [])

  useEffect(() => {
    loadStudents()
    loadCatalogs()
  }, [loadStudents, loadCatalogs])

  useEffect(() => {
    loadStudentDetails(selectedStudent)
  }, [selectedStudent, loadStudentDetails])

  // Filtrar estudiantes por búsqueda
  const filteredStudents = students.filter(s => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return true
    return (
      s.first_name.toLowerCase().includes(query) ||
      s.last_name.toLowerCase().includes(query) ||
      s.id_number.includes(query)
    )
  })

  // Enviar formulario de asignación
  const handleAssignSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!assignForm.subject_id) {
      setErrorMsg('Debe seleccionar una materia.')
      return
    }

    try {
      const assignments = [
        {
          subject_id: assignForm.subject_id,
          teacher_id: assignForm.teacher_id || undefined,
          group_id: assignForm.group_id || selectedStudent.group_id || undefined,
          period: assignForm.period
        }
      ]

      await assignSubjects(selectedStudent.id, assignments)
      setSuccessMsg('Materia asignada con éxito.')
      setAssignForm({
        subject_id: '',
        teacher_id: '',
        group_id: '',
        period: '2026'
      })
      setTimeout(() => {
        setShowAssignModal(false)
        loadStudentDetails(selectedStudent)
      }, 1000)
    } catch (err) {
      setErrorMsg(err.message || 'Error al asignar la materia')
    }
  }

  // Eliminar asignación de materia
  const handleRemoveSubject = async (subjectId) => {
    if (!window.confirm('¿Está seguro de que desea retirar esta materia del estudiante?')) return
    try {
      await removeSubjectFromStudent(selectedStudent.id, subjectId, '2026')
      loadStudentDetails(selectedStudent)
    } catch (err) {
      alert(err.message || 'Error al retirar materia')
    }
  }

  return (
    <div>
      {/* Cabecera */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="text-h1" style={{ color: 'var(--neutral-900)' }}>Expediente Académico</h1>
        <p className="text-sm">Asigne asignaturas, asocie docentes y gestione el plan de estudios por estudiante.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Panel Izquierdo: Lista de Estudiantes */}
        <div className="card" style={{ padding: '20px', minHeight: '520px', display: 'flex', flexDirection: 'column' }}>
          <p className="text-h3" style={{ color: 'var(--neutral-900)', marginBottom: '12px' }}>Estudiantes</p>
          
          <div className="search-bar" style={{ maxWidth: '100%', marginBottom: '16px' }}>
            <Search size={20} strokeWidth={1.5} className="search-icon" />
            <input
              type="text"
              className="field-input search-input"
              placeholder="Buscar estudiante..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {loadingStudents ? (
            <p className="text-sm" style={{ color: 'var(--neutral-400)', textAlign: 'center', marginTop: '20px' }}>Cargando lista...</p>
          ) : filteredStudents.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--neutral-400)', textAlign: 'center', marginTop: '20px' }}>No hay resultados</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '420px', paddingRight: '4px' }}>
              {filteredStudents.map(s => {
                const group = allGroups.find(g => g.id === s.group_id)
                const isSelected = selectedStudent && selectedStudent.id === s.id
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStudent(s)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      background: isSelected ? 'var(--blue-50)' : 'none',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'background 0.1s'
                    }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--radius-full)',
                        background: isSelected ? 'var(--blue-500)' : 'var(--neutral-100)',
                        color: isSelected ? '#fff' : 'var(--neutral-500)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: '12px',
                        flexShrink: 0
                      }}
                    >
                      {s.first_name[0]}{s.last_name[0]}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <p style={{ fontWeight: 500, fontSize: '13px', color: isSelected ? 'var(--blue-700)' : 'var(--neutral-900)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {s.first_name} {s.last_name}
                      </p>
                      <p className="text-caption">
                        Cédula: {s.id_number} {group && `| ${group.name}`}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Panel Derecho: Perfil de Asignaciones del Estudiante */}
        <div>
          {selectedStudent ? (
            <div>
              {/* Header Ficha Estudiante */}
              <div className="student-profile-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div className="student-avatar-big">
                    {selectedStudent.first_name[0]}{selectedStudent.last_name[0]}
                  </div>
                  <div>
                    <h2 className="text-h1" style={{ margin: 0 }}>
                      {selectedStudent.first_name} {selectedStudent.last_name}
                    </h2>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
                      Estudiante • Cédula: {selectedStudent.id_number} • Grupo actual:{' '}
                      <strong>{
                        allGroups.find(g => g.id === selectedStudent.group_id)?.name || 'Sin asignar'
                      }</strong>
                    </p>
                  </div>
                </div>
                <button className="btn btn-secondary btn-md" onClick={() => setShowAssignModal(true)}>
                  <Plus size={20} strokeWidth={1.5} />
                  Asignar Materia
                </button>
              </div>

              {/* Ficha Encargados */}
              <div className="card" style={{ marginBottom: '24px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Heart size={20} strokeWidth={1.5} color="var(--color-danger)" />
                  <p className="text-h3" style={{ color: 'var(--neutral-900)' }}>Información de Familiares / Encargados</p>
                </div>
                {loadingDetails ? (
                  <p className="text-sm">Buscando encargado...</p>
                ) : parents.length === 0 ? (
                  <div className="alert alert-warning">
                    <AlertTriangle size={20} strokeWidth={1.5} />
                    <span>Este estudiante no tiene un encargado registrado. Regístrelo en el módulo de Usuarios.</span>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                    {parents.map(p => (
                      <div
                        key={p.id}
                        style={{
                          border: '1px solid var(--neutral-200)',
                          borderRadius: 'var(--radius-md)',
                          padding: '14px',
                          background: 'var(--neutral-50)',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px'
                        }}
                      >
                        <User size={32} color="var(--neutral-400)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <p style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{p.first_name} {p.last_name}</p>
                          <p className="text-caption" style={{ marginTop: '2px' }}>Cédula: {p.id_number}</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                            {p.email && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--neutral-500)' }}>
                                <Mail size={16} strokeWidth={1.5} /> {p.email}
                              </div>
                            )}
                            {p.phone && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--neutral-500)' }}>
                                <Phone size={16} strokeWidth={1.5} /> {p.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ficha Materias Asignadas */}
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <BookOpen size={20} strokeWidth={1.5} color="var(--blue-500)" />
                  <p className="text-h3" style={{ color: 'var(--neutral-900)' }}>Plan de Estudios (Periodo 2026)</p>
                </div>

                {loadingDetails ? (
                  <p className="text-sm" style={{ color: 'var(--neutral-400)', textAlign: 'center', padding: '40px' }}>Cargando asignaturas...</p>
                ) : subjects.length === 0 ? (
                  <div
                    style={{
                      border: '2px dashed var(--neutral-200)',
                      borderRadius: 'var(--radius-md)',
                      padding: '40px',
                      textAlign: 'center',
                      color: 'var(--neutral-400)'
                    }}
                  >
                    <BookOpen size={36} strokeWidth={1} style={{ marginBottom: '8px', color: 'var(--neutral-300)' }} />
                    <p style={{ fontWeight: 500 }}>No hay materias asignadas para este periodo.</p>
                    <p className="text-sm">Asigne una nueva materia usando el botón superior.</p>
                  </div>
                ) : (
                  <div className="student-subjects-grid">
                    {subjects.map(sub => (
                      <div className="subject-card" key={sub.id}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <span className="badge badge-gray" style={{ fontSize: '10px' }}>{sub.code}</span>
                            <span className="badge badge-blue">{sub.group_name}</span>
                          </div>
                          <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--neutral-900)' }}>{sub.name}</p>
                          <p className="text-sm" style={{ marginTop: '8px', color: 'var(--neutral-500)' }}>
                            Docente: <strong>{sub.teacher_name}</strong>
                          </p>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--neutral-100)', marginTop: '16px', paddingTop: '12px' }}>
                          <span className="text-caption" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={16} strokeWidth={1.5} /> Periodo {sub.period}
                          </span>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--color-danger)', padding: '4px' }}
                            title="Retirar materia"
                            onClick={() => handleRemoveSubject(sub.id)}
                          >
                            <Trash2 size={20} strokeWidth={1.5} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card" style={{ display: 'grid', placeItems: 'center', minHeight: '520px', color: 'var(--neutral-300)' }}>
              <div style={{ textAlign: 'center' }}>
                <GraduationCap size={64} strokeWidth={1} style={{ marginBottom: '12px' }} />
                <p className="text-h3" style={{ color: 'var(--neutral-400)' }}>Seleccione un Estudiante</p>
                <p className="text-sm">Elija un alumno de la lista para ver su expediente y asignaturas.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL ASIGNAR MATERIA */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowAssignModal(false)}>
          <div className="modal-card">
            <div className="modal-header">
              <p className="login-card-title">Asignar Materia</p>
              <button className="modal-close-btn" onClick={() => setShowAssignModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleAssignSubmit} style={{ marginTop: '16px' }}>
              <p className="text-sm" style={{ marginBottom: '16px', color: 'var(--neutral-50)' }}>
                Asigne una asignatura a {selectedStudent?.first_name} {selectedStudent?.last_name}.
              </p>

              {errorMsg && (
                <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                  <AlertTriangle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="alert alert-success" style={{ marginBottom: '16px' }}>
                  <Check size={16} />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="field-group" style={{ marginBottom: '16px' }}>
                <label className="field-label">Asignatura *</label>
                <select
                  className="field-input"
                  value={assignForm.subject_id}
                  onChange={(e) => setAssignForm({...assignForm, subject_id: e.target.value})}
                  required
                >
                  <option value="">Seleccione asignatura...</option>
                  {allSubjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code}) - {s.level}</option>
                  ))}
                </select>
              </div>

              <div className="field-group" style={{ marginBottom: '16px' }}>
                <label className="field-label">Docente Asignado</label>
                <select
                  className="field-input"
                  value={assignForm.teacher_id}
                  onChange={(e) => setAssignForm({...assignForm, teacher_id: e.target.value})}
                >
                  <option value="">Seleccione docente...</option>
                  {allTeachers.map(t => (
                    <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                  ))}
                </select>
              </div>

              <div className="form-grid">
                <div className="field-group">
                  <label className="field-label">Sección / Grupo</label>
                  <select
                    className="field-input"
                    value={assignForm.group_id}
                    onChange={(e) => setAssignForm({...assignForm, group_id: e.target.value})}
                  >
                    <option value="">Grupo actual del alumno</option>
                    {allGroups.map(g => (
                      <option key={g.id} value={g.id}>{g.name} ({g.level})</option>
                    ))}
                  </select>
                </div>
                <div className="field-group">
                  <label className="field-label">Periodo Escolar</label>
                  <input
                    type="text"
                    className="field-input"
                    value={assignForm.period}
                    onChange={(e) => setAssignForm({...assignForm, period: e.target.value})}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary btn-block" onClick={() => setShowAssignModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary btn-block">
                  Asignar Materia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
