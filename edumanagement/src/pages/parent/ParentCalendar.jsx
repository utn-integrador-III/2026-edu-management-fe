import { useState, useEffect, useCallback } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  MapPin,
  User,
  BookOpen,
  Clock,
  Info,
  Heart,
  X
} from 'lucide-react'
import { getMyChildren, getStudentEvents } from '../../api/edu'

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

const EVENT_TYPE_META = {
  academico:  { label: 'Académico',  bg: 'var(--blue-50)',         color: 'var(--blue-500)',      dot: 'var(--blue-500)' },
  evaluacion: { label: 'Evaluación', bg: 'var(--color-danger-bg)', color: 'var(--color-danger)',  dot: 'var(--color-danger)' },
  entrega:    { label: 'Entrega',    bg: 'var(--color-warning-bg)',color: 'var(--color-warning)', dot: 'var(--color-warning)' },
  reunion:    { label: 'Reunión',    bg: 'var(--color-info-bg)',   color: 'var(--color-info)',    dot: 'var(--color-info)' },
  actividad:  { label: 'Actividad',  bg: 'var(--amber-100)',       color: 'var(--amber-700)',     dot: 'var(--amber-700)' },
  feriado:    { label: 'Feriado',    bg: 'var(--color-success-bg)',color: 'var(--color-success)', dot: 'var(--color-success)' }
}

function eventTypeMeta(type) {
  return EVENT_TYPE_META[type] || { label: 'Evento', bg: 'var(--neutral-100)', color: 'var(--neutral-600)', dot: 'var(--neutral-400)' }
}

function formatFullDate(dateString) {
  if (!dateString) return ''
  const [y, m, d] = dateString.split('-').map(Number)
  const dateObj = new Date(y, m - 1, d)
  return dateObj.toLocaleDateString('es-CR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export default function ParentCalendar() {
  const [children, setChildren] = useState([])
  const [selectedChild, setSelectedChild] = useState(null)
  const [loadingChildren, setLoadingChildren] = useState(false)

  const [events, setEvents] = useState([])
  const [loadingEvents, setLoadingEvents] = useState(false)

  const [year, setYear] = useState(2026)
  const [month, setMonth] = useState(7)

  const [selectedEvent, setSelectedEvent] = useState(null)

  const loadChildren = useCallback(async () => {
    setLoadingChildren(true)
    try {
      const list = await getMyChildren()
      const sanitized = Array.isArray(list) ? list : []
      setChildren(sanitized)
      setSelectedChild(sanitized.length > 0 ? sanitized[0] : null)
    } catch (err) {
      console.error('Error al obtener hijos del encargado', err)
      setChildren([])
      setSelectedChild(null)
    } finally {
      setLoadingChildren(false)
    }
  }, [])

  const loadEvents = useCallback(async (childId, m, y) => {
    if (!childId) return
    setLoadingEvents(true)
    try {
      const data = await getStudentEvents(childId, { month: m, year: y })
      setEvents(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error al cargar eventos del calendario', err)
      setEvents([])
    } finally {
      setLoadingEvents(false)
    }
  }, [])

  useEffect(() => {
    loadChildren()
  }, [loadChildren])

  useEffect(() => {
    if (selectedChild) {
      loadEvents(selectedChild.id, month, year)
    }
  }, [selectedChild, month, year, loadEvents])

  const handlePrevMonth = () => {
    setMonth(prev => (prev === 1 ? 12 : prev - 1))
    if (month === 1) setYear(prev => prev - 1)
  }
  const handleNextMonth = () => {
    setMonth(prev => (prev === 12 ? 1 : prev + 1))
    if (month === 12) setYear(prev => prev + 1)
  }

  const firstDayOfMonth = new Date(year, month - 1, 1)
  const startDayOfWeek = firstDayOfMonth.getDay()
  const daysInMonth = new Date(year, month, 0).getDate()

  const calendarCells = []
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarCells.push({ isPadding: true, key: `pad-${i}` })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    calendarCells.push({ isPadding: false, dayNum: d, dateStr, key: `day-${d}` })
  }

  const eventsForDate = (dateStr) => events.filter(e => e.start_date <= dateStr && e.end_date >= dateStr)

  const upcomingEvents = [...events].sort((a, b) => a.start_date.localeCompare(b.start_date))

  return (
    <div style={{ paddingBottom: '40px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 className="text-h1" style={{ color: 'var(--neutral-900)' }}>Calendario Académico</h1>
        <p className="text-sm">Consulte las actividades, evaluaciones y eventos vigentes asignados a la sección de su hijo(a).</p>
      </div>

      {loadingChildren ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p className="text-h3" style={{ color: 'var(--neutral-400)' }}>Cargando información familiar...</p>
        </div>
      ) : children.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px', maxWidth: '600px', margin: '0 auto' }}>
          <Heart size={48} strokeWidth={1} color="var(--neutral-300)" style={{ marginBottom: '12px' }} />
          <p className="text-h2" style={{ color: 'var(--neutral-900)' }}>No hay estudiantes vinculados</p>
          <p className="text-sm" style={{ marginTop: '8px' }}>
            Su usuario no tiene estudiantes asignados en este momento.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Selección de hijo y periodo */}
          <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="text-caption" style={{ fontWeight: 700, textTransform: 'uppercase', color: 'var(--neutral-400)' }}>Estudiante:</span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
                        gap: '6px'
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid var(--neutral-300)', borderRadius: 'var(--radius-md)', padding: '2px 4px', background: 'var(--neutral-50)' }}>
              <button onClick={handlePrevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', padding: '6px', borderRadius: '4px', color: 'var(--neutral-500)' }} title="Mes anterior">
                <ChevronLeft size={16} />
              </button>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                style={{ border: 'none', background: 'none', fontWeight: 600, fontSize: '14px', color: 'var(--neutral-800)', padding: '0 8px', cursor: 'pointer', outline: 'none' }}
              >
                {MONTHS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <button onClick={handleNextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', padding: '6px', borderRadius: '4px', color: 'var(--neutral-500)' }} title="Mes siguiente">
                <ChevronRight size={16} />
              </button>
              <span className="badge badge-blue" style={{ marginLeft: '6px' }}>{year}</span>
            </div>
          </div>

          {/* Leyenda de tipos de evento */}
          <div className="card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span className="text-caption" style={{ fontWeight: 700, color: 'var(--neutral-400)', textTransform: 'uppercase' }}>Leyenda:</span>
            {Object.entries(EVENT_TYPE_META).map(([key, meta]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: meta.dot }} />
                <span className="text-caption">{meta.label}</span>
              </div>
            ))}
          </div>

          {loadingEvents ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
              <p className="text-h3" style={{ color: 'var(--neutral-400)' }}>Cargando eventos del calendario...</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>

              {/* Grid del calendario */}
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center', marginBottom: '10px' }}>
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(96px, auto)', gap: '8px' }}>
                  {calendarCells.map(cell => {
                    if (cell.isPadding) {
                      return <div key={cell.key} style={{ background: 'var(--neutral-50)', borderRadius: 'var(--radius-sm)', opacity: 0.3 }} />
                    }

                    const dayEvents = eventsForDate(cell.dateStr)
                    const dayOfWeek = new Date(year, month - 1, cell.dayNum).getDay()
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

                    return (
                      <div
                        key={cell.key}
                        style={{
                          background: isWeekend ? 'var(--neutral-50)' : '#fff',
                          border: '1px solid var(--neutral-200)',
                          borderRadius: 'var(--radius-md)',
                          padding: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          minHeight: '96px',
                          opacity: isWeekend ? 0.7 : 1
                        }}
                      >
                        <span style={{ fontWeight: 700, fontSize: '13px', color: isWeekend ? 'var(--neutral-400)' : 'var(--neutral-800)' }}>
                          {cell.dayNum}
                        </span>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {dayEvents.map(evt => {
                            const meta = eventTypeMeta(evt.event_type)
                            return (
                              <button
                                key={evt.id}
                                onClick={() => setSelectedEvent(evt)}
                                title={evt.title}
                                style={{
                                  fontSize: '10px',
                                  padding: '3px 6px',
                                  borderRadius: '4px',
                                  background: meta.bg,
                                  color: meta.color,
                                  border: 'none',
                                  textAlign: 'left',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
                                {evt.title}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Panel lateral: próximos eventos */}
              <div className="card" style={{ padding: '20px', borderTop: '4px solid var(--blue-700)', position: 'sticky', top: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <CalendarDays size={20} color="var(--blue-700)" />
                  <p className="text-h3" style={{ color: 'var(--neutral-900)' }}>Eventos del Mes</p>
                </div>

                {upcomingEvents.length === 0 ? (
                  <div style={{ padding: '40px 10px', textAlign: 'center', color: 'var(--neutral-400)' }}>
                    <Info size={32} strokeWidth={1} style={{ marginBottom: '8px', color: 'var(--neutral-300)' }} />
                    <p className="text-sm">No hay eventos registrados para este mes.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {upcomingEvents.map(evt => {
                      const meta = eventTypeMeta(evt.event_type)
                      return (
                        <button
                          key={evt.id}
                          onClick={() => setSelectedEvent(evt)}
                          style={{
                            padding: '10px 12px',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--neutral-50)',
                            border: '1px solid var(--neutral-200)',
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: meta.bg, color: meta.color, fontWeight: 700 }}>
                              {meta.label}
                            </span>
                            <span className="text-caption">{formatFullDate(evt.start_date)}</span>
                          </div>
                          <p style={{ fontWeight: 700, fontSize: '13px', color: 'var(--neutral-900)' }}>{evt.title}</p>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de detalle del evento */}
      {selectedEvent && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setSelectedEvent(null)}>
          <div className="modal-card" style={{ maxWidth: '480px', width: '90%' }}>
            <div className="modal-header">
              <span
                className="badge"
                style={{
                  background: eventTypeMeta(selectedEvent.event_type).bg,
                  color: eventTypeMeta(selectedEvent.event_type).color,
                  fontWeight: 700
                }}
              >
                {eventTypeMeta(selectedEvent.event_type).label}
              </span>
              <button className="modal-close-btn" onClick={() => setSelectedEvent(null)}>
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <h2 className="text-h2" style={{ color: 'var(--neutral-900)', marginBottom: '8px' }}>
              {selectedEvent.title}
            </h2>

            <p className="text-caption" style={{ textTransform: 'capitalize', marginBottom: '20px' }}>
              {formatFullDate(selectedEvent.start_date)}
              {selectedEvent.end_date !== selectedEvent.start_date && ` — ${formatFullDate(selectedEvent.end_date)}`}
            </p>

            {selectedEvent.description && (
              <p className="text-body" style={{ color: 'var(--neutral-700)', marginBottom: '20px', lineHeight: 1.5 }}>
                {selectedEvent.description}
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--neutral-100)', paddingTop: '16px' }}>
              {(selectedEvent.start_time || selectedEvent.end_time) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} strokeWidth={1.5} color="var(--neutral-400)" />
                  <span className="text-body">
                    {selectedEvent.start_time || '—'}{selectedEvent.end_time ? ` a ${selectedEvent.end_time}` : ''}
                  </span>
                </div>
              )}
              {selectedEvent.location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={16} strokeWidth={1.5} color="var(--neutral-400)" />
                  <span className="text-body">{selectedEvent.location}</span>
                </div>
              )}
              {selectedEvent.subject_name && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={16} strokeWidth={1.5} color="var(--neutral-400)" />
                  <span className="text-body">Materia: <strong>{selectedEvent.subject_name}</strong></span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={16} strokeWidth={1.5} color="var(--neutral-400)" />
                <span className="text-body">Organiza: <strong>{selectedEvent.organizer_name}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarDays size={16} strokeWidth={1.5} color="var(--neutral-400)" />
                <span className="text-body">Sección: <strong>{selectedEvent.group_name}</strong></span>
              </div>
            </div>

            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedEvent(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
