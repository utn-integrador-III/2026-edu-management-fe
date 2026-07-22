import { useState, useEffect, useCallback } from 'react'
import { Calendar, Users, BookOpen, ClipboardList, CheckCircle2, AlertTriangle, Clock, History, Save, Check } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { listGroups, getGroupDetails, getUsers, listSubjects, saveAttendance, getAttendanceHistory } from '../../api/edu'

export default function TeacherAttendance() {
  const { session } = useAuth()
  
  // Tabs: 'register' | 'history'
  const [activeTab, setActiveTab] = useState('register')
  
  // --- Estados para Registro ---
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  
  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState(null)
  
  const [date, setDate] = useState(() => {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })
  
  const [students, setStudents] = useState([])
  const [attendanceRecords, setAttendanceRecords] = useState({})
  
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [alert, setAlert] = useState(null) // { type: 'success' | 'error', message: '' }
  
  // --- Estados para Historial ---
  const [historyFilters, setHistoryFilters] = useState({
    date: (() => {
      const d = new Date()
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    })(),
    groupId: '',
    subjectId: ''
  })
  const [historyRecords, setHistoryRecords] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyAlert, setHistoryAlert] = useState(null)

  // Obtener hora actual en formato HH:MM
  const getCurrentTimeStr = () => {
    const d = new Date()
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }

  // Cargar grupos iniciales del docente
  const loadInitialData = useCallback(async () => {
    setLoading(true)
    setAlert(null)
    try {
      const groupsData = await listGroups()
      setGroups(groupsData)
      if (groupsData.length > 0) {
        setSelectedGroup(groupsData[0])
        // Establecer también para filtros de historial
        setHistoryFilters(prev => ({ ...prev, groupId: groupsData[0].id }))
      }
    } catch (err) {
      console.error('Error al cargar grupos del docente', err)
      setAlert({ type: 'error', message: 'No se pudieron cargar los grupos asignados.' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  // Cargar estudiantes y materias cuando cambia el grupo seleccionado
  const loadGroupDetails = useCallback(async () => {
    if (!selectedGroup) return
    setLoading(true)
    setAlert(null)
    setStudents([])
    setSubjects([])
    setSelectedSubject(null)
    setAttendanceRecords({})
    
    try {
      // 1. Obtener detalles del grupo (estudiantes y materias asociadas a profesores)
      const details = await getGroupDetails(selectedGroup.id)
      
      // Estudiantes
      const studentsList = details.students || []
      setStudents(studentsList)
      
      // Inicializar registros de asistencia en 'presente' por defecto
      const initialRecords = {}
      studentsList.forEach(s => {
        initialRecords[s.id] = { status: 'presente', arrivalTime: null }
      });
      setAttendanceRecords(initialRecords)

      // 2. Resolver materias del docente en este grupo
      let teacherSubjects = []
      
      if (details.teachers && details.teachers.length > 0) {
        // Buscar al docente actual en la lista de profesores de este grupo
        const currentTeacher = details.teachers.find(t => 
          t.email === session?.email || 
          t.first_name?.toLowerCase() === session?.first_name?.toLowerCase() ||
          t.id === session?.id_number
        )
        
        if (currentTeacher && currentTeacher.subjects) {
          // El backend nos devuelve nombres de materias, necesitamos mapearlas a IDs
          const allSubs = await listSubjects()
          teacherSubjects = allSubs.filter(sub => currentTeacher.subjects.includes(sub.name))
        }
      }
      
      // Fallback: Si no se encuentran materias asignadas explícitamente, listar todas las materias
      if (teacherSubjects.length === 0) {
        const allSubs = await listSubjects()
        // Opcional: filtrar por nivel si coincide
        teacherSubjects = allSubs.filter(sub => !sub.level || sub.level.toLowerCase() === selectedGroup.level?.toLowerCase())
        if (teacherSubjects.length === 0) {
          teacherSubjects = allSubs
        }
      }
      
      setSubjects(teacherSubjects)
      if (teacherSubjects.length > 0) {
        setSelectedSubject(teacherSubjects[0])
        setHistoryFilters(prev => ({ ...prev, subjectId: teacherSubjects[0].id }))
      }
      
    } catch (err) {
      console.error('Error al cargar los detalles del grupo', err)
      
      // Doble-capa de Fallback si falla getGroupDetails
      try {
        const allUsers = await getUsers({ role: 'student', active: true })
        const filteredStudents = allUsers.filter(s => s.group_id === selectedGroup.id)
        setStudents(filteredStudents)
        
        const initialRecords = {}
        filteredStudents.forEach(s => {
          initialRecords[s.id] = { status: 'presente', arrivalTime: null }
        });
        setAttendanceRecords(initialRecords)
        
        const allSubs = await listSubjects()
        setSubjects(allSubs)
        if (allSubs.length > 0) {
          setSelectedSubject(allSubs[0])
        }
      } catch (fallbackErr) {
        console.error('Error en fallback de carga', fallbackErr)
        setAlert({ type: 'error', message: 'Error al cargar los alumnos y asignaturas de la sección.' })
      }
    } finally {
      setLoading(false)
    }
  }, [selectedGroup, session])

  useEffect(() => {
    loadGroupDetails()
  }, [selectedGroup, loadGroupDetails])

  // Manejo de cambios en botones de estado
  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        status,
        arrivalTime: status === 'tardanza' ? getCurrentTimeStr() : null
      }
    }))
  };

  // Manejo de cambios en el selector de hora (Tardanza)
  const handleTimeChange = (studentId, time) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        arrivalTime: time
      }
    }))
  };

  // Acción rápida: Marcar todos como presente
  const markAllPresent = () => {
    const updated = {}
    students.forEach(s => {
      updated[s.id] = { status: 'presente', arrivalTime: null }
    })
    setAttendanceRecords(updated)
    setAlert({ type: 'info', message: 'Se marcaron todos los estudiantes como Presente.' })
    setTimeout(() => setAlert(null), 3000)
  };

  // Guardar Asistencia
  const handleSubmitAttendance = async () => {
    setAlert(null)
    
    // Validaciones
    if (!selectedGroup) {
      setAlert({ type: 'error', message: 'Debe seleccionar una sección.' })
      return
    }
    if (!selectedSubject) {
      setAlert({ type: 'error', message: 'Debe seleccionar una materia.' })
      return
    }
    if (!date) {
      setAlert({ type: 'error', message: 'Debe seleccionar una fecha.' })
      return
    }
    if (students.length === 0) {
      setAlert({ type: 'error', message: 'No hay estudiantes inscritos en esta sección para registrar asistencia.' })
      return
    }

    // Comprobar que todos los estudiantes tengan estado y hora de llegada si es tardanza
    const recordsPayload = []
    let hasValidationErrors = false
    let validationMsg = ''

    for (const student of students) {
      const record = attendanceRecords[student.id]
      if (!record || !record.status) {
        hasValidationErrors = true
        validationMsg = 'Por favor, asigne un estado de asistencia a todos los estudiantes.'
        break
      }
      if (record.status === 'tardanza' && !record.arrivalTime) {
        hasValidationErrors = true
        validationMsg = `Debe especificar la hora de llegada para el estudiante ${student.first_name} ${student.last_name}.`
        break
      }

      recordsPayload.push({
        student_id: student.id,
        status: record.status,
        arrival_time: record.arrivalTime
      })
    }

    if (hasValidationErrors) {
      setAlert({ type: 'error', message: validationMsg })
      return
    }

    // Armar payload
    const payload = {
      date,
      group_id: selectedGroup.id,
      subject_id: selectedSubject.id,
      records: recordsPayload
    }

    setSubmitting(true)
    try {
      await saveAttendance(payload)
      setAlert({ type: 'success', message: 'Asistencia guardada exitosamente en el sistema.' })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error(err)
      setAlert({ type: 'error', message: err.message || 'Error al guardar el registro de asistencia.' })
    } finally {
      setSubmitting(false)
    }
  };

  // --- Funciones de Historial ---
  const loadHistory = async () => {
    setLoadingHistory(true)
    setHistoryAlert(null)
    setHistoryRecords([])
    
    try {
      const data = await getAttendanceHistory({
        date: historyFilters.date,
        group_id: historyFilters.groupId,
        subject_id: historyFilters.subjectId
      })
      setHistoryRecords(data)
      if (data.length === 0) {
        setHistoryAlert({ type: 'info', message: 'No se encontraron registros para la fecha y filtros seleccionados.' })
      }
    } catch (err) {
      console.error(err)
      setHistoryAlert({ type: 'error', message: 'Error al cargar el historial de asistencia.' })
    } finally {
      setLoadingHistory(false)
    }
  };

  // Cargar historial por defecto en la pestaña de historial al activarse
  useEffect(() => {
    if (activeTab === 'history' && historyFilters.groupId && historyFilters.subjectId) {
      loadHistory()
    }
  }, [activeTab])

  // Estilos visuales para los botones de estado
  const getButtonStyle = (statusType, activeStatus) => {
    const isActive = statusType === activeStatus
    switch (statusType) {
      case 'presente':
        return {
          background: isActive ? 'var(--color-success-bg)' : '#fff',
          color: isActive ? 'var(--color-success)' : 'var(--neutral-500)',
          border: `1px solid ${isActive ? 'var(--color-success)' : 'var(--neutral-300)'}`,
          fontWeight: isActive ? '600' : '400',
          padding: '8px 14px',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          transition: 'all 0.15s',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          outline: 'none',
          boxShadow: isActive ? '0 0 0 2px rgba(22,163,74,0.1)' : 'none'
        }
      case 'ausente':
        return {
          background: isActive ? 'var(--color-danger-bg)' : '#fff',
          color: isActive ? 'var(--color-danger)' : 'var(--neutral-500)',
          border: `1px solid ${isActive ? 'var(--color-danger)' : 'var(--neutral-300)'}`,
          fontWeight: isActive ? '600' : '400',
          padding: '8px 14px',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          transition: 'all 0.15s',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          outline: 'none',
          boxShadow: isActive ? '0 0 0 2px rgba(220,38,38,0.1)' : 'none'
        }
      case 'tardanza':
        return {
          background: isActive ? 'var(--color-warning-bg)' : '#fff',
          color: isActive ? 'var(--color-warning)' : 'var(--neutral-500)',
          border: `1px solid ${isActive ? 'var(--color-warning)' : 'var(--neutral-300)'}`,
          fontWeight: isActive ? '600' : '400',
          padding: '8px 14px',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          transition: 'all 0.15s',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          outline: 'none',
          boxShadow: isActive ? '0 0 0 2px rgba(245,158,11,0.1)' : 'none'
        }
    }
  }

  // Helper para mostrar badges en el historial
  const renderHistoryBadge = (status, arrivalTime) => {
    if (status === 'presente') {
      return <span className="badge-dot badge-dot-presente">Presente</span>
    } else if (status === 'ausente') {
      return <span className="badge-dot badge-dot-ausente">Ausente</span>
    } else if (status === 'tardanza') {
      return (
        <span className="badge-dot badge-dot-tardio">
          Tardanza ({arrivalTime || 'S/H'})
        </span>
      )
    }
    return <span className="badge-dot badge-dot-sin-registrar">Sin registrar</span>
  }

  return (
    <div>
      {/* Cabecera de Página */}
      <div className="actions-bar" style={{ marginBottom: '16px' }}>
        <div>
          <h1 className="text-h1" style={{ color: 'var(--neutral-900)' }}>Control de Asistencia</h1>
          <p className="text-sm">Gestione la asistencia diaria de sus estudiantes por materia y sección.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container" style={{ marginBottom: '24px' }}>
        <button
          className={`tab-button${activeTab === 'register' ? ' active' : ''}`}
          onClick={() => setActiveTab('register')}
        >
          <ClipboardList size={18} style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline' }} />
          Registrar Asistencia
        </button>
        <button
          className={`tab-button${activeTab === 'history' ? ' active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={18} style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline' }} />
          Historial de Registros
        </button>
      </div>

      {/* ALERTAS GENERALES */}
      {alert && (
        <div className={`alert alert-${alert.type}`} style={{ marginBottom: '20px' }}>
          {alert.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
          <span style={{ fontWeight: 500 }}>{alert.message}</span>
        </div>
      )}

      {/* ---------------- PESTAÑA: REGISTRAR ASISTENCIA ---------------- */}
      {activeTab === 'register' && (
        <>
          {/* Tarjeta de Filtros de Registro */}
          <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
            <h3 className="text-caption" style={{ fontWeight: 700, textTransform: 'uppercase', marginBottom: '16px', color: 'var(--neutral-400)' }}>
              Filtros de Registro
            </h3>
            
            <div className="form-grid-3">
              {/* Campo de Fecha */}
              <div className="field-group">
                <label className="field-label">Fecha de Asistencia</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="date"
                    className="field-input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              {/* Selector de Sección */}
              <div className="field-group">
                <label className="field-label">Sección / Grupo</label>
                <select
                  className="field-input"
                  value={selectedGroup?.id || ''}
                  onChange={(e) => {
                    const group = groups.find(g => g.id === e.target.value)
                    setSelectedGroup(group || null)
                  }}
                  disabled={groups.length === 0}
                >
                  {groups.length === 0 ? (
                    <option value="">No hay secciones asignadas</option>
                  ) : (
                    groups.map(g => (
                      <option key={g.id} value={g.id}>
                        Sección {g.name} ({g.level})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Selector de Materia */}
              <div className="field-group">
                <label className="field-label">Asignatura / Materia</label>
                <select
                  className="field-input"
                  value={selectedSubject?.id || ''}
                  onChange={(e) => {
                    const sub = subjects.find(s => s.id === e.target.value)
                    setSelectedSubject(sub || null)
                  }}
                  disabled={subjects.length === 0}
                >
                  {subjects.length === 0 ? (
                    <option value="">No hay asignaturas disponibles</option>
                  ) : (
                    subjects.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Listado de Estudiantes para Pasar Lista */}
          {loading ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <p className="text-h3" style={{ color: 'var(--neutral-400)' }}>Cargando información del grupo...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <Users size={48} strokeWidth={1} color="var(--neutral-300)" style={{ marginBottom: '12px' }} />
              <p className="text-h2" style={{ color: 'var(--neutral-900)' }}>No se encontraron estudiantes</p>
              <p className="text-sm" style={{ marginTop: '8px' }}>
                Asegúrese de haber seleccionado una sección válida y que posea alumnos matriculados.
              </p>
            </div>
          ) : (
            <div className="card" style={{ padding: '0px', overflow: 'hidden' }}>
              {/* Barra de Acciones Rápidas */}
              <div
                style={{
                  padding: '16px 24px',
                  background: 'var(--neutral-50)',
                  borderBottom: '1px solid var(--neutral-200)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div>
                  <p className="text-h3" style={{ color: 'var(--neutral-900)' }}>
                    Pasar Lista: <span style={{ color: 'var(--blue-500)' }}>{students.length} alumnos</span>
                  </p>
                  <p className="text-caption">
                    Fecha: {date} | Materia: {selectedSubject?.name}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={markAllPresent}
                >
                  <Check size={16} />
                  Marcar todos como Presente
                </button>
              </div>

              {/* Tabla de Estudiantes */}
              <div className="table-responsive">
                <table className="table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ width: '150px' }}>Cédula</th>
                      <th>Nombre Completo</th>
                      <th style={{ width: '380px' }}>Estado de Asistencia</th>
                      <th style={{ width: '180px' }}>Hora de Llegada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(student => {
                      const record = attendanceRecords[student.id] || { status: 'presente', arrivalTime: null }
                      return (
                        <tr key={student.id}>
                          {/* Cédula */}
                          <td className="text-mono" style={{ fontWeight: 600 }}>{student.id_number}</td>
                          
                          {/* Nombre */}
                          <td style={{ fontWeight: 500, color: 'var(--neutral-900)' }}>
                            {student.first_name} {student.last_name}
                          </td>
                          
                          {/* Botones de Selección de Asistencia */}
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                type="button"
                                style={getButtonStyle('presente', record.status)}
                                onClick={() => handleStatusChange(student.id, 'presente')}
                              >
                                Presente
                              </button>
                              <button
                                type="button"
                                style={getButtonStyle('ausente', record.status)}
                                onClick={() => handleStatusChange(student.id, 'ausente')}
                              >
                                Ausente
                              </button>
                              <button
                                type="button"
                                style={getButtonStyle('tardanza', record.status)}
                                onClick={() => handleStatusChange(student.id, 'tardanza')}
                              >
                                Tardanza
                              </button>
                            </div>
                          </td>

                          {/* Entrada de Hora de Llegada (Dinámica) */}
                          <td>
                            {record.status === 'tardanza' ? (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <Clock size={14} color="var(--color-warning)" />
                                <input
                                  type="time"
                                  className="field-input"
                                  style={{
                                    width: '100px',
                                    padding: '5px 8px',
                                    fontSize: '12px',
                                    border: '1px solid var(--color-warning)',
                                    borderRadius: 'var(--radius-md)',
                                    outline: 'none',
                                    background: 'var(--color-warning-bg)'
                                  }}
                                  value={record.arrivalTime || ''}
                                  onChange={(e) => handleTimeChange(student.id, e.target.value)}
                                />
                              </div>
                            ) : (
                              <span style={{ color: 'var(--neutral-300)', fontSize: '12px' }}>—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Botón de Enviar Formulario */}
              <div
                style={{
                  padding: '24px',
                  background: 'var(--neutral-50)',
                  borderTop: '1px solid var(--neutral-200)',
                  display: 'flex',
                  justifyContent: 'flex-end'
                }}
              >
                <button
                  type="button"
                  className={`btn btn-primary btn-lg ${submitting ? 'btn-loading' : ''}`}
                  disabled={submitting}
                  onClick={handleSubmitAttendance}
                  style={{ minWidth: '180px' }}
                >
                  <Save size={18} />
                  {submitting ? 'Guardando...' : 'Guardar Asistencia'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ---------------- PESTAÑA: HISTORIAL DE ASISTENCIA ---------------- */}
      {activeTab === 'history' && (
        <>
          {/* Tarjeta de Filtros de Historial */}
          <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
            <h3 className="text-caption" style={{ fontWeight: 700, textTransform: 'uppercase', marginBottom: '16px', color: 'var(--neutral-400)' }}>
              Filtros de Búsqueda
            </h3>
            
            <div className="form-grid-3" style={{ marginBottom: '16px' }}>
              {/* Fecha Historial */}
              <div className="field-group">
                <label className="field-label">Fecha del Registro</label>
                <input
                  type="date"
                  className="field-input"
                  value={historyFilters.date}
                  onChange={(e) => setHistoryFilters(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>

              {/* Grupo Historial */}
              <div className="field-group">
                <label className="field-label">Sección / Grupo</label>
                <select
                  className="field-input"
                  value={historyFilters.groupId}
                  onChange={(e) => setHistoryFilters(prev => ({ ...prev, groupId: e.target.value }))}
                >
                  <option value="">-- Seleccione Sección --</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>
                      Sección {g.name} ({g.level})
                    </option>
                  ))}
                </select>
              </div>

              {/* Materia Historial */}
              <div className="field-group">
                <label className="field-label">Materia</label>
                <select
                  className="field-input"
                  value={historyFilters.subjectId}
                  onChange={(e) => setHistoryFilters(prev => ({ ...prev, subjectId: e.target.value }))}
                >
                  <option value="">-- Seleccione Materia --</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-primary btn-md"
                onClick={loadHistory}
                disabled={loadingHistory || !historyFilters.groupId || !historyFilters.subjectId}
              >
                <SearchIcon size={16} />
                {loadingHistory ? 'Buscando...' : 'Buscar Historial'}
              </button>
            </div>
          </div>

          {/* ALERTAS HISTORIAL */}
          {historyAlert && (
            <div className={`alert alert-${historyAlert.type}`} style={{ marginBottom: '20px' }}>
              {historyAlert.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
              <span style={{ fontWeight: 500 }}>{historyAlert.message}</span>
            </div>
          )}

          {/* Listado de Historial Encontrado */}
          {loadingHistory ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <p className="text-h3" style={{ color: 'var(--neutral-400)' }}>Cargando registros históricos...</p>
            </div>
          ) : historyRecords.length > 0 ? (
            historyRecords.map((historyLog, index) => {
              // Estadísticas para mostrar en la cabecera
              const total = historyLog.records?.length || 0
              const presentCount = historyLog.records?.filter(r => r.status === 'presente').length || 0
              const absentCount = historyLog.records?.filter(r => r.status === 'ausente').length || 0
              const lateCount = historyLog.records?.filter(r => r.status === 'tardanza').length || 0

              const presentPercent = total > 0 ? Math.round((presentCount / total) * 100) : 0
              const absentPercent = total > 0 ? Math.round((absentCount / total) * 100) : 0
              const latePercent = total > 0 ? Math.round((lateCount / total) * 100) : 0

              const currentGrp = groups.find(g => g.id === historyLog.group_id)
              const currentSub = subjects.find(s => s.id === historyLog.subject_id)

              return (
                <div key={historyLog.id || index} className="card" style={{ padding: '0px', overflow: 'hidden', marginBottom: '32px' }}>
                  {/* Encabezado del Historial Log */}
                  <div
                    style={{
                      padding: '20px 24px',
                      background: 'var(--blue-900)',
                      color: '#fff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '16px'
                    }}
                  >
                    <div>
                      <h2 className="text-h2" style={{ color: '#fff' }}>
                        Registro de Asistencia
                      </h2>
                      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
                        Fecha: <strong>{historyLog.date}</strong> | Sección: <strong>{currentGrp?.name || 'Sección'}</strong> | Materia: <strong>{currentSub?.name || 'Materia'}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Tarjetas de Métricas de Asistencia (Alineado con el diseño premium) */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '16px',
                      padding: '20px 24px',
                      background: 'var(--neutral-50)',
                      borderBottom: '1px solid var(--neutral-200)'
                    }}
                  >
                    {/* Tarjeta Alumnos */}
                    <div style={{ background: '#fff', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-200)' }}>
                      <p className="text-caption">Alumnos Evaluados</p>
                      <p className="text-h1" style={{ color: 'var(--neutral-900)', marginTop: '4px' }}>{total}</p>
                    </div>
                    {/* Tarjeta Presentes */}
                    <div style={{ background: '#fff', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-200)' }}>
                      <p className="text-caption" style={{ color: 'var(--color-success)' }}>Presentes</p>
                      <p className="text-h1" style={{ color: 'var(--color-success)', marginTop: '4px' }}>
                        {presentCount} <span style={{ fontSize: '13px', fontWeight: 'normal', color: 'var(--neutral-500)' }}>({presentPercent}%)</span>
                      </p>
                    </div>
                    {/* Tarjeta Ausentes */}
                    <div style={{ background: '#fff', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-200)' }}>
                      <p className="text-caption" style={{ color: 'var(--color-danger)' }}>Ausentes</p>
                      <p className="text-h1" style={{ color: 'var(--color-danger)', marginTop: '4px' }}>
                        {absentCount} <span style={{ fontSize: '13px', fontWeight: 'normal', color: 'var(--neutral-500)' }}>({absentPercent}%)</span>
                      </p>
                    </div>
                    {/* Tarjeta Tardanzas */}
                    <div style={{ background: '#fff', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-200)' }}>
                      <p className="text-caption" style={{ color: 'var(--color-warning)' }}>Tardanzas</p>
                      <p className="text-h1" style={{ color: 'var(--color-warning)', marginTop: '4px' }}>
                        {lateCount} <span style={{ fontSize: '13px', fontWeight: 'normal', color: 'var(--neutral-500)' }}>({latePercent}%)</span>
                      </p>
                    </div>
                  </div>

                  {/* Detalle de Lista de Estudiantes en el Historial */}
                  <div className="table-responsive">
                    <table className="table" style={{ margin: 0 }}>
                      <thead>
                        <tr>
                          <th>Cédula</th>
                          <th>Estudiante</th>
                          <th>Estado de Asistencia</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyLog.records?.map(rec => {
                          const studentInfo = students.find(s => s.id === rec.student_id) || 
                                              { first_name: 'Estudiante', last_name: 'Desconocido', id_number: 'N/A' }
                          return (
                            <tr key={rec.student_id}>
                              <td className="text-mono" style={{ fontWeight: 600 }}>{studentInfo.id_number}</td>
                              <td style={{ color: 'var(--neutral-900)', fontWeight: 500 }}>
                                {studentInfo.first_name} {studentInfo.last_name}
                              </td>
                              <td>{renderHistoryBadge(rec.status, rec.arrival_time)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })
          ) : (
            !loadingHistory && (
              <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--neutral-400)' }}>
                Seleccione una Sección y Materia, luego presione "Buscar Historial" para visualizar los registros de asistencia.
              </div>
            )
          )}
        </>
      )}
    </div>
  )
}

// Icono auxiliar de búsqueda
function SearchIcon({ size = 20, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}
