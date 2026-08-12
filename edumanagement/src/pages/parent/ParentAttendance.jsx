import { useState, useEffect, useCallback } from 'react'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  User,
  Heart,
  Info,
  CalendarDays,
  FileSpreadsheet
} from 'lucide-react'
import { getMyChildren, getStudentSubjects, getStudentMonthlyAttendance } from '../../api/edu'

const MONTHS = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' }
]

const STATUS_CONFIG = {
  presente: {
    bg: 'var(--color-success-bg)',
    color: 'var(--color-success)',
    border: '1px solid #bbf7d0',
    label: 'Presente',
    dot: '#16A34A'
  },
  ausente: {
    bg: 'var(--color-danger-bg)',
    color: 'var(--color-danger)',
    border: '1px solid #fecaca',
    label: 'Ausente',
    dot: '#DC2626'
  },
  tardanza: {
    bg: 'var(--color-warning-bg)',
    color: 'var(--color-warning)',
    border: '1px solid #fef3c7',
    label: 'Tardanza',
    dot: '#F59E0B'
  },
  justificado: {
    bg: 'var(--color-info-bg)',
    color: 'var(--color-info)',
    border: '1px solid #bae6fd',
    label: 'Justificado',
    dot: '#0EA5E9'
  }
}

export default function ParentAttendance() {
  const [children, setChildren] = useState([])
  const [selectedChild, setSelectedChild] = useState(null)
  const [loadingChildren, setLoadingChildren] = useState(false)

  const [subjects, setSubjects] = useState([])

  const [attendance, setAttendance] = useState([])
  const [loadingAttendance, setLoadingAttendance] = useState(false)

  // Filtros
  const [year, setYear] = useState(2026) // Año académico activo
  const [month, setMonth] = useState(7) // Default Julio por año 2026
  const [subjectId, setSubjectId] = useState('')
  const [viewMode, setViewMode] = useState('calendar') // 'calendar' | 'list'
  const [activeDay, setActiveDay] = useState('') // Fecha seleccionada para el detalle

  // Cargar hijos vinculados a la cuenta
  const loadChildren = useCallback(async () => {
    setLoadingChildren(true)
    try {
      const list = await getMyChildren()
      const sanitized = Array.isArray(list) ? list : []
      setChildren(sanitized)
      if (sanitized.length > 0) {
        setSelectedChild(sanitized[0])
      } else {
        setSelectedChild(null)
      }
    } catch (err) {
      console.error('Error al obtener hijos del encargado', err)
      setChildren([])
      setSelectedChild(null)
    } finally {
      setLoadingChildren(false)
    }
  }, [])

  // Cargar materias de un hijo seleccionado
  const loadSubjects = useCallback(async (childId, y) => {
    if (!childId) return
    setLoadingSubjects(true)
    try {
      const data = await getStudentSubjects(childId, String(y))
      setSubjects(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error al cargar materias del hijo', err)
      setSubjects([])
    } finally {
      setLoadingSubjects(false)
    }
  }, [])

  // Cargar asistencia mensual
  const loadAttendance = useCallback(async (childId, m, y) => {
    if (!childId) return
    setLoadingAttendance(true)
    try {
      const data = await getStudentMonthlyAttendance(childId, m, y)
      const sanitized = Array.isArray(data) ? data : []
      setAttendance(sanitized)
      
      // Pre-seleccionar el primer día con registros si existe
      if (sanitized.length > 0) {
        const sortedDates = [...sanitized].sort((a, b) => a.date.localeCompare(b.date))
        setActiveDay(sortedDates[0].date)
      } else {
        setActiveDay('')
      }
    } catch (err) {
      console.error('Error al cargar asistencia mensual', err)
      setAttendance([])
      setActiveDay('')
    } finally {
      setLoadingAttendance(false)
    }
  }, [])

  useEffect(() => {
    loadChildren()
  }, [loadChildren])

  useEffect(() => {
    if (selectedChild) {
      loadSubjects(selectedChild.id, year)
      loadAttendance(selectedChild.id, month, year)
      setSubjectId('') // Reset de materia al cambiar de hijo o año
    }
  }, [selectedChild, month, year, loadSubjects, loadAttendance])

  // Filtrar asistencia en memoria según la materia seleccionada
  const filteredAttendance = attendance.filter(record => {
    return !subjectId || record.subject_id === subjectId
  })

  // Estadísticas del mes
  const totalLessons = filteredAttendance.length
  const presents = filteredAttendance.filter(r => r.status === 'presente').length
  const absences = filteredAttendance.filter(r => r.status === 'ausente').length
  const tardies = filteredAttendance.filter(r => r.status === 'tardanza').length
  const justified = filteredAttendance.filter(r => r.status === 'justificado').length
  
  // Rate: (presents + tardies + justified) / total
  const attendanceRate = totalLessons > 0 
    ? Math.round(((presents + tardies + justified) / totalLessons) * 100)
    : 100

  // Cambiar mes desde botones flecha
  const handlePrevMonth = () => {
    setMonth(prev => (prev === 1 ? 12 : prev - 1))
  }
  const handleNextMonth = () => {
    setMonth(prev => (prev === 12 ? 1 : prev + 1))
  }

  // Generar lógica de calendario para el mes seleccionado
  const firstDayOfMonth = new Date(year, month - 1, 1)
  const startDayOfWeek = firstDayOfMonth.getDay() // 0: Dom, 1: Lun, ...
  const daysInMonth = new Date(year, month, 0).getDate()

  const calendarCells = []
  
  // Celdas vacías previas
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarCells.push({ isPadding: true, key: `pad-${i}` })
  }

  // Celdas del mes
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const dayOfWeek = new Date(year, month - 1, d).getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    calendarCells.push({
      isPadding: false,
      dayNum: d,
      dateStr,
      isWeekend,
      key: `day-${d}`
    })
  }

  // Registros de la fecha activa para el panel lateral
  const activeDayRecords = attendance.filter(r => r.date === activeDay)

  // Formatear fecha legible
  const formatFullDate = (dateString) => {
    if (!dateString) return ''
    const cleanDateStr = dateString.split('T')[0]
    const [y, m, d] = cleanDateStr.split('-').map(Number)
    const dateObj = new Date(y, m - 1, d)
    return dateObj.toLocaleDateString('es-CR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* Cabecera de Página */}
      <div style={{ marginBottom: '28px' }}>
        <h1 className="text-h1" style={{ color: 'var(--neutral-900)' }}>Historial Mensual de Asistencia</h1>
        <p className="text-sm">Consulte el desglose diario de asistencia por materias y supervise la constancia escolar.</p>
      </div>

      {loadingChildren ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p className="text-h3" style={{ color: 'var(--neutral-400)' }}>Cargando información familiar...</p>
        </div>
      ) : children.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px', maxWidth: '600px', margin: '0 auto' }}>
          <Heart size={48} strokeWidth={1} color="var(--neutral-300)" style={{ marginBottom: '12px' }} />
          <p className="text-h2" style={{ color: 'var(--neutral-900)' }}>No hay estudiantes vinculados</p>
          <p className="text-sm" style={{ marginTop: '8px', marginBottom: '20px' }}>
            Su usuario no tiene estudiantes asignados en este momento.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Fila de Selección de Hijo */}
          <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="text-caption" style={{ fontWeight: 700, textTransform: 'uppercase', color: 'var(--neutral-400)' }}>Estudiante:</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {children.map(child => {
                  const isSelected = selectedChild && selectedChild.id === child.id
                  return (
                    <button
                      key={child.id}
                      onClick={() => setSelectedChild(child)}
                      style={{
                        padding: '6px 16px',
                        borderRadius: 'var(--radius-full)',
                        border: isSelected ? '1px solid var(--blue-500)' : '1px solid var(--neutral-300)',
                        background: isSelected ? 'var(--blue-50)' : 'none',
                        color: isSelected ? 'var(--blue-700)' : 'var(--neutral-700)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.12s'
                      }}
                    >
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: isSelected ? 'var(--blue-500)' : 'var(--neutral-400)'
                      }} />
                      {child.first_name} {child.last_name} ({child.group_name})
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-blue">Periodo Académico {year}</span>
            </div>
          </div>

          {/* Tarjetas de Estadísticas Resumen */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '16px'
          }}>
            <div className="card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '4px solid var(--blue-500)' }}>
              <span className="text-caption" style={{ fontWeight: 600, color: 'var(--neutral-400)', textTransform: 'uppercase' }}>Porcentaje</span>
              <span className="text-display" style={{ color: 'var(--blue-700)', fontSize: '28px' }}>{attendanceRate}%</span>
              <span style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>Asistencia mensual</span>
            </div>

            <div className="card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '4px solid var(--color-success)' }}>
              <span className="text-caption" style={{ fontWeight: 600, color: 'var(--neutral-400)', textTransform: 'uppercase' }}>Presente</span>
              <span className="text-display" style={{ color: 'var(--color-success)', fontSize: '28px' }}>{presents}</span>
              <span style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>Lecciones asistidas</span>
            </div>

            <div className="card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '4px solid var(--color-warning)' }}>
              <span className="text-caption" style={{ fontWeight: 600, color: 'var(--neutral-400)', textTransform: 'uppercase' }}>Tardanza</span>
              <span className="text-display" style={{ color: 'var(--color-warning)', fontSize: '28px' }}>{tardies}</span>
              <span style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>Llegadas tardías</span>
            </div>

            <div className="card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '4px solid var(--color-danger)' }}>
              <span className="text-caption" style={{ fontWeight: 600, color: 'var(--neutral-400)', textTransform: 'uppercase' }}>Ausente</span>
              <span className="text-display" style={{ color: 'var(--color-danger)', fontSize: '28px' }}>{absences}</span>
              <span style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>Ausencias sin justificar</span>
            </div>

            <div className="card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '4px solid var(--color-info)' }}>
              <span className="text-caption" style={{ fontWeight: 600, color: 'var(--neutral-400)', textTransform: 'uppercase' }}>Justificado</span>
              <span className="text-display" style={{ color: 'var(--color-info)', fontSize: '28px' }}>{justified}</span>
              <span style={{ fontSize: '11px', color: 'var(--neutral-500)' }}>Lecciones justificadas</span>
            </div>
          </div>

          {/* Fila de Filtros y Control de Vista */}
          <div className="card" style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              
              {/* Navegador de Meses */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid var(--neutral-300)', borderRadius: 'var(--radius-md)', padding: '2px 4px', background: 'var(--neutral-50)' }}>
                <button
                  onClick={handlePrevMonth}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', padding: '6px', borderRadius: '4px', color: 'var(--neutral-500)' }}
                  title="Mes anterior"
                >
                  <ChevronLeft size={16} />
                </button>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  style={{
                    border: 'none',
                    background: 'none',
                    fontWeight: 600,
                    fontSize: '14px',
                    color: 'var(--neutral-800)',
                    padding: '0 8px',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  {MONTHS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <button
                  onClick={handleNextMonth}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', padding: '6px', borderRadius: '4px', color: 'var(--neutral-500)' }}
                  title="Mes siguiente"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              
              {/* Selector de Año */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--neutral-300)',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--neutral-800)',
                    background: '#fff',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {[2025, 2026, 2027, 2028].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {/* Selector de Materias */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--neutral-300)',
                    fontSize: '13px',
                    background: '#fff',
                    outline: 'none',
                    minWidth: '180px'
                  }}
                >
                  <option value="">Todas las materias</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Toggle de Modo de Vista */}
            <div style={{ display: 'flex', background: 'var(--neutral-100)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-200)' }}>
              <button
                onClick={() => setViewMode('calendar')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '4px',
                  background: viewMode === 'calendar' ? '#fff' : 'none',
                  color: viewMode === 'calendar' ? 'var(--blue-700)' : 'var(--neutral-500)',
                  boxShadow: viewMode === 'calendar' ? 'var(--shadow-sm)' : 'none',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.1s'
                }}
              >
                <CalendarIcon size={16} />
                Calendario
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '4px',
                  background: viewMode === 'list' ? '#fff' : 'none',
                  color: viewMode === 'list' ? 'var(--blue-700)' : 'var(--neutral-500)',
                  boxShadow: viewMode === 'list' ? 'var(--shadow-sm)' : 'none',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.1s'
                }}
              >
                <ClipboardList size={16} />
                Lista mensual
              </button>
            </div>
          </div>

          {/* Contenedor Principal de Vista */}
          {loadingAttendance ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
              <p className="text-h3" style={{ color: 'var(--neutral-400)' }}>Cargando registros de asistencia...</p>
            </div>
          ) : viewMode === 'calendar' ? (
            
            /* VISTA DE CALENDARIO COMPUESTA */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>
              
              {/* Calendario Grid */}
              <div className="card" style={{ padding: '20px' }}>
                
                {/* Cabecera del Grid (Nombres de días) */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '8px',
                  textAlign: 'center',
                  marginBottom: '10px'
                }}>
                  {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day, idx) => (
                    <div key={idx} style={{
                      fontWeight: 700,
                      color: idx === 0 || idx === 6 ? 'var(--neutral-400)' : 'var(--neutral-600)',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      paddingBottom: '8px',
                      borderBottom: '1px solid var(--neutral-200)'
                    }}>
                      {day}
                    </div>
                  ))}
                </div>

                {/* Días del Calendario */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gridAutoRows: 'minmax(90px, auto)',
                  gap: '8px'
                }}>
                  {calendarCells.map((cell) => {
                    if (cell.isPadding) {
                      return <div key={cell.key} style={{ background: 'var(--neutral-50)', borderRadius: 'var(--radius-sm)', opacity: 0.3 }} />
                    }

                    const dayAttendance = attendance.filter(r => r.date === cell.dateStr)
                    const matchesFilter = dayAttendance.filter(r => !subjectId || r.subject_id === subjectId)
                    const isActive = activeDay === cell.dateStr
                    
                    // Colores de borde y sombra interactivos
                    let cellBg = '#fff'
                    let cellBorder = '1px solid var(--neutral-200)'
                    
                    if (cell.isWeekend) {
                      cellBg = 'var(--neutral-50)'
                    } else if (isActive) {
                      cellBorder = '2px solid var(--blue-500)'
                      cellBg = 'var(--blue-50)'
                    }

                    return (
                      <div
                        key={cell.key}
                        onClick={() => matchesFilter.length > 0 && setActiveDay(cell.dateStr)}
                        style={{
                          background: cellBg,
                          border: cellBorder,
                          borderRadius: 'var(--radius-md)',
                          padding: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          minHeight: '90px',
                          cursor: matchesFilter.length === 0 ? 'default' : 'pointer',
                          transition: 'all 0.12s',
                          boxShadow: isActive ? 'var(--shadow-md)' : 'none',
                          transform: isActive ? 'translateY(-1px)' : 'none',
                          opacity: cell.isWeekend ? 0.7 : 1
                        }}
                      >
                        {/* Número del día */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{
                            fontWeight: 700,
                            fontSize: '13px',
                            color: cell.isWeekend ? 'var(--neutral-400)' : (isActive ? 'var(--blue-700)' : 'var(--neutral-800)'),
                            background: isActive ? 'var(--blue-100)' : 'none',
                            padding: isActive ? '2px 6px' : '0',
                            borderRadius: '4px'
                          }}>
                            {cell.dayNum}
                          </span>

                          {/* Indicador de incidencias en este día */}
                          {matchesFilter.some(r => r.status !== 'presente') && (
                            <span style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: matchesFilter.some(r => r.status === 'ausente') 
                                ? 'var(--color-danger)' 
                                : (matchesFilter.some(r => r.status === 'tardanza') ? 'var(--color-warning)' : 'var(--color-info)')
                            }} />
                          )}
                        </div>

                        {/* Lista de pills de materias registradas en este día */}
                        {matchesFilter.length > 0 && (
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            marginTop: '6px'
                          }}>
                            {matchesFilter.map(rec => {
                              const config = STATUS_CONFIG[rec.status] || { bg: 'var(--neutral-100)', color: 'var(--neutral-600)', label: 'Desconocido' }
                              return (
                                <div
                                  key={rec.id}
                                  title={`${rec.subject_name}: ${config.label}`}
                                  style={{
                                    fontSize: '9px',
                                    padding: '2px 4px',
                                    borderRadius: '4px',
                                    background: config.bg,
                                    color: config.color,
                                    border: config.border,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    fontWeight: '700',
                                    textAlign: 'center',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '3px'
                                  }}
                                >
                                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: config.dot }} />
                                  {rec.subject_code || rec.subject_name.substring(0, 3).toUpperCase()}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Panel de Detalle del Día Seleccionado */}
              <div className="card" style={{ padding: '20px', borderTop: '4px solid var(--blue-700)', position: 'sticky', top: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <CalendarDays size={20} color="var(--blue-700)" />
                  <p className="text-h3" style={{ color: 'var(--neutral-900)' }}>Detalle del Día</p>
                </div>

                {activeDay ? (
                  <div>
                    <p style={{
                      fontWeight: 700,
                      fontSize: '13px',
                      color: 'var(--neutral-800)',
                      marginBottom: '16px',
                      textTransform: 'capitalize',
                      borderBottom: '1px solid var(--neutral-100)',
                      paddingBottom: '8px'
                    }}>
                      {formatFullDate(activeDay)}
                    </p>

                    {activeDayRecords.length === 0 ? (
                      <div style={{ padding: '20px 10px', textAlign: 'center', color: 'var(--neutral-400)' }}>
                        <Info size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
                        <p className="text-sm">No hay lecciones registradas para este día.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {activeDayRecords.map(rec => {
                          const config = STATUS_CONFIG[rec.status] || {}
                          return (
                            <div key={rec.id} style={{
                              padding: '12px 14px',
                              borderRadius: 'var(--radius-md)',
                              background: 'var(--neutral-50)',
                              border: '1px solid var(--neutral-200)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                  <span className="badge badge-gray" style={{ fontSize: '10px', fontWeight: 700, marginBottom: '2px', display: 'inline-block' }}>{rec.subject_code}</span>
                                  <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--neutral-900)' }}>{rec.subject_name}</p>
                                </div>
                                <span style={{
                                  fontSize: '11px',
                                  padding: '3px 8px',
                                  borderRadius: 'var(--radius-full)',
                                  background: config.bg,
                                  color: config.color,
                                  border: config.border,
                                  fontWeight: 600
                                }}>
                                  {config.label}
                                </span>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid var(--neutral-200)', paddingTop: '8px', fontSize: '11px', color: 'var(--neutral-500)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <User size={12} />
                                  <span>Docente: <strong style={{ color: 'var(--neutral-700)' }}>{rec.teacher_name}</strong></span>
                                </div>
                                {rec.status === 'tardanza' && rec.arrival_time && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-warning)' }}>
                                    <Clock size={12} />
                                    <span>Llegada: <strong>{rec.arrival_time} hs</strong></span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: '40px 10px', textAlign: 'center', color: 'var(--neutral-400)' }}>
                    <Info size={32} strokeWidth={1} style={{ marginBottom: '8px', color: 'var(--neutral-300)' }} />
                    <p className="text-sm">Haga clic en un día del calendario que contenga lecciones para ver su detalle detallado aquí.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            
            /* VISTA DE LISTA MENSUAL */
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <FileSpreadsheet size={20} color="var(--blue-700)" />
                <p className="text-h3" style={{ color: 'var(--neutral-900)' }}>Desglose Detallado de Asistencia</p>
              </div>

              {filteredAttendance.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--neutral-400)', border: '2px dashed var(--neutral-200)', borderRadius: 'var(--radius-md)' }}>
                  <Info size={32} style={{ color: 'var(--neutral-300)', marginBottom: '8px' }} />
                  <p>No se encontraron registros de asistencia para los filtros seleccionados.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--neutral-200)' }}>
                        <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--neutral-600)', fontSize: '12px', textTransform: 'uppercase' }}>Fecha</th>
                        <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--neutral-600)', fontSize: '12px', textTransform: 'uppercase' }}>Materia</th>
                        <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--neutral-600)', fontSize: '12px', textTransform: 'uppercase' }}>Docente</th>
                        <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--neutral-600)', fontSize: '12px', textTransform: 'uppercase' }}>Estado</th>
                        <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--neutral-600)', fontSize: '12px', textTransform: 'uppercase' }}>Llegada tardía</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAttendance
                        .sort((a, b) => b.date.localeCompare(a.date)) // Orden descendente (más recientes primero)
                        .map((rec) => {
                          const config = STATUS_CONFIG[rec.status] || {}
                          return (
                            <tr key={rec.id} style={{ borderBottom: '1px solid var(--neutral-100)', transition: 'background 0.1s' }} className="hover-row">
                              <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--neutral-800)', fontSize: '13px' }}>
                                {formatFullDate(rec.date)}
                              </td>
                              <td style={{ padding: '14px 16px' }}>
                                <span className="badge badge-gray" style={{ fontSize: '10px', display: 'inline-block', marginBottom: '2px' }}>{rec.subject_code}</span>
                                <p style={{ fontWeight: 600, fontSize: '13px', color: 'var(--neutral-900)' }}>{rec.subject_name}</p>
                              </td>
                              <td style={{ padding: '14px 16px', color: 'var(--neutral-700)', fontSize: '13px' }}>
                                {rec.teacher_name}
                              </td>
                              <td style={{ padding: '14px 16px' }}>
                                <span style={{
                                  fontSize: '11px',
                                  padding: '4px 10px',
                                  borderRadius: 'var(--radius-full)',
                                  background: config.bg,
                                  color: config.color,
                                  border: config.border,
                                  fontWeight: 600,
                                  display: 'inline-block'
                                }}>
                                  {config.label}
                                </span>
                              </td>
                              <td style={{ padding: '14px 16px', color: rec.status === 'tardanza' ? 'var(--color-warning)' : 'var(--neutral-400)', fontSize: '13px', fontWeight: rec.status === 'tardanza' ? '600' : 'normal' }}>
                                {rec.status === 'tardanza' && rec.arrival_time ? `${rec.arrival_time} hs` : '—'}
                              </td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  )
}
