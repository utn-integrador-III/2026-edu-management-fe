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
  Plus,
  X,
  Users,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { listGroups, getGroupDetails, listSubjects, getGroupEvents, createEvent } from '../../api/edu'

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
  return dateObj.toLocaleDateString('es-CR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const EMPTY_FORM = {
  title: '',
  description: '',
  event_type: 'academico',
  start_date: todayStr(),
  end_date: '',
  start_time: '',
  end_time: '',
  location: '',
  subject_id: ''
}

export default function TeacherCalendar() {
  const { session } = useAuth()

  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [loadingGroups, setLoadingGroups] = useState(false)

  const [teacherSubjects, setTeacherSubjects] = useState([])

  const [events, setEvents] = useState([])
  const [loadingEvents, setLoadingEvents] = useState(false)

  const [year, setYear] = useState(2026)
  const [month, setMonth] = useState(7)

  const [selectedEvent, setSelectedEvent] = useState(null)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErr, setFormErr] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [createAlert, setCreateAlert] = useState(null)

  // Cargar secciones a las que el docente tiene acceso
  const loadGroups = useCallback(async () => {
    setLoadingGroups(true)
    try {
      const data = await listGroups()
      const sanitized = Array.isArray(data) ? data : []
      setGroups(sanitized)
      setSelectedGroup(sanitized.length > 0 ? sanitized[0] : null)
    } catch (err) {
      console.error('Error al cargar secciones del docente', err)
      setGroups([])
      setSelectedGroup(null)
    } finally {
      setLoadingGroups(false)
    }
  }, [])

  // Resolver las materias que el docente imparte en la sección seleccionada
  const loadTeacherSubjects = useCallback(async (group) => {
    if (!group) return
    try {
      const details = await getGroupDetails(group.id)
      let subjectsForTeacher = []

      if (details && Array.isArray(details.teachers) && details.teachers.length > 0) {
        const currentTeacher = details.teachers.find(t =>
          t.email === session?.email ||
          t.first_name?.toLowerCase() === session?.first_name?.toLowerCase() ||
          t.id === session?.id_number
        )
        if (currentTeacher && Array.isArray(currentTeacher.subjects)) {
          const allSubs = await listSubjects()
          const sanitizedSubs = Array.isArray(allSubs) ? allSubs : []
          subjectsForTeacher = sanitizedSubs.filter(sub => currentTeacher.subjects.includes(sub.name))
        }
      }

      if (subjectsForTeacher.length === 0) {
        const allSubs = await listSubjects()
        subjectsForTeacher = Array.isArray(allSubs) ? allSubs : []
      }

      setTeacherSubjects(subjectsForTeacher)
    } catch (err) {
      console.error('Error al resolver materias del docente', err)
      setTeacherSubjects([])
    }
  }, [session])

  const loadEvents = useCallback(async (groupId, m, y) => {
    if (!groupId) return
    setLoadingEvents(true)
    try {
      const data = await getGroupEvents(groupId, { month: m, year: y })
      setEvents(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error al cargar eventos de la sección', err)
      setEvents([])
    } finally {
      setLoadingEvents(false)
    }
  }, [])

  useEffect(() => {
    loadGroups()
  }, [loadGroups])

  useEffect(() => {
    if (selectedGroup) {
      loadTeacherSubjects(selectedGroup)
      loadEvents(selectedGroup.id, month, year)
    }
  }, [selectedGroup, month, year, loadTeacherSubjects, loadEvents])

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

  function openCreateModal() {
    setForm({ ...EMPTY_FORM, start_date: todayStr() })
    setFormErr({})
    setCreateAlert(null)
    setShowCreateModal(true)
  }

  function handleFormChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setFormErr(prev => ({ ...prev, [name]: '' }))
  }

  function validateForm() {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Ingrese un título para el evento'
    if (!form.start_date) errs.start_date = 'Seleccione la fecha de inicio'
    if (form.end_date && form.start_date && form.end_date < form.start_date) {
      errs.end_date = 'La fecha de fin no puede ser anterior a la de inicio'
    }
    if (form.start_time && form.end_time && form.end_time < form.start_time) {
      errs.end_time = 'La hora de fin no puede ser anterior a la de inicio'
    }
    return errs
  }

  async function handleCreateSubmit() {
    const errs = validateForm()
    if (Object.keys(errs).length) {
      setFormErr(errs)
      return
    }
    if (!selectedGroup) return

    setSubmitting(true)
    setCreateAlert(null)
    try {
      await createEvent({
        title: form.title.trim(),
        description: form.description.trim(),
        event_type: form.event_type,
        start_date: form.start_date,
        end_date: form.end_date || form.start_date,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        location: form.location.trim() || null,
        group_id: selectedGroup.id,
        subject_id: form.subject_id || null,
        organizer_name: `${session?.first_name ?? ''} ${session?.last_name ?? ''}`.trim() || 'Docente'
      })
      setCreateAlert({ type: 'success', message: 'Evento creado con éxito.' })
      await loadEvents(selectedGroup.id, month, year)
      setTimeout(() => setShowCreateModal(false), 900)
    } catch (err) {
      setCreateAlert({ type: 'error', message: err.message || 'No se pudo crear el evento.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ paddingBottom: '40px' }}>
      <div className="actions-bar">
        <div>
          <h1 className="text-h1" style={{ color: 'var(--neutral-900)' }}>Calendario de Sección</h1>
          <p className="text-sm">Registre exámenes, entregas, actividades y otros eventos para sus secciones a cargo.</p>
        </div>
        {selectedGroup && (
          <button className="btn btn-primary btn-md" onClick={openCreateModal}>
            <Plus size={20} strokeWidth={1.5} />
            Nuevo Evento
          </button>
        )}
      </div>

      {loadingGroups ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p className="text-h3" style={{ color: 'var(--neutral-400)' }}>Cargando secciones...</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px', maxWidth: '600px', margin: '0 auto' }}>
          <Users size={48} strokeWidth={1} color="var(--neutral-300)" style={{ marginBottom: '12px' }} />
          <p className="text-h2" style={{ color: 'var(--neutral-900)' }}>No tiene secciones asignadas</p>
          <p className="text-sm" style={{ marginTop: '8px' }}>
            Actualmente no figura como docente a cargo de ninguna sección en el sistema.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Selector de sección y periodo */}
          <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div className="tabs-container" style={{ marginBottom: 0 }}>
              {groups.map(g => (
                <button
                  key={g.id}
                  className={`tab-button${selectedGroup?.id === g.id ? ' active' : ''}`}
                  onClick={() => setSelectedGroup(g)}
                >
                  <Users size={18} strokeWidth={1.5} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                  Sección {g.name} ({g.level})
                </button>
              ))}
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

          {loadingEvents ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
              <p className="text-h3" style={{ color: 'var(--neutral-400)' }}>Cargando eventos de la sección...</p>
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

              {/* Panel lateral: eventos del mes */}
              <div className="card" style={{ padding: '20px', borderTop: '4px solid var(--blue-700)', position: 'sticky', top: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <CalendarDays size={20} color="var(--blue-700)" />
                  <p className="text-h3" style={{ color: 'var(--neutral-900)' }}>Eventos del Mes</p>
                </div>

                {upcomingEvents.length === 0 ? (
                  <div style={{ padding: '40px 10px', textAlign: 'center', color: 'var(--neutral-400)' }}>
                    <Info size={32} strokeWidth={1} style={{ marginBottom: '8px', color: 'var(--neutral-300)' }} />
                    <p className="text-sm">No hay eventos registrados para esta sección en este mes.</p>
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

      {/* Modal de creación de evento */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && !submitting && setShowCreateModal(false)}>
          <div className="modal-card" style={{ maxWidth: '520px', width: '90%' }}>
            <div className="modal-header">
              <p className="login-card-title">Nuevo Evento — Sección {selectedGroup?.name}</p>
              <button className="modal-close-btn" onClick={() => !submitting && setShowCreateModal(false)}>
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            {createAlert && (
              <div className={`alert alert-${createAlert.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom: '16px' }}>
                {createAlert.type === 'success' ? <CheckCircle2 size={16} strokeWidth={1.5} /> : <AlertCircle size={16} strokeWidth={1.5} />}
                <span>{createAlert.message}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="field-group">
                <label className="field-label" htmlFor="title">Título del evento</label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  className={`field-input${formErr.title ? ' error' : ''}`}
                  placeholder="Ej: Examen parcial de Matemáticas"
                  value={form.title}
                  onChange={handleFormChange}
                  disabled={submitting}
                />
                {formErr.title && <span className="field-error">{formErr.title}</span>}
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="description">Descripción</label>
                <textarea
                  id="description"
                  name="description"
                  className="field-input"
                  rows={3}
                  placeholder="Detalles adicionales para los padres y estudiantes..."
                  value={form.description}
                  onChange={handleFormChange}
                  disabled={submitting}
                  style={{ resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="field-group">
                  <label className="field-label" htmlFor="event_type">Tipo de evento</label>
                  <select
                    id="event_type"
                    name="event_type"
                    className="field-input"
                    value={form.event_type}
                    onChange={handleFormChange}
                    disabled={submitting}
                  >
                    {Object.entries(EVENT_TYPE_META).map(([key, meta]) => (
                      <option key={key} value={key}>{meta.label}</option>
                    ))}
                  </select>
                </div>

                <div className="field-group">
                  <label className="field-label" htmlFor="subject_id">Materia (opcional)</label>
                  <select
                    id="subject_id"
                    name="subject_id"
                    className="field-input"
                    value={form.subject_id}
                    onChange={handleFormChange}
                    disabled={submitting}
                  >
                    <option value="">General de la sección</option>
                    {teacherSubjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="field-group">
                  <label className="field-label" htmlFor="start_date">Fecha inicio</label>
                  <input
                    id="start_date"
                    name="start_date"
                    type="date"
                    className={`field-input${formErr.start_date ? ' error' : ''}`}
                    value={form.start_date}
                    onChange={handleFormChange}
                    disabled={submitting}
                  />
                  {formErr.start_date && <span className="field-error">{formErr.start_date}</span>}
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="end_date">Fecha fin (opcional)</label>
                  <input
                    id="end_date"
                    name="end_date"
                    type="date"
                    className={`field-input${formErr.end_date ? ' error' : ''}`}
                    value={form.end_date}
                    onChange={handleFormChange}
                    disabled={submitting}
                  />
                  {formErr.end_date && <span className="field-error">{formErr.end_date}</span>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="field-group">
                  <label className="field-label" htmlFor="start_time">Hora inicio (opcional)</label>
                  <input
                    id="start_time"
                    name="start_time"
                    type="time"
                    className="field-input"
                    value={form.start_time}
                    onChange={handleFormChange}
                    disabled={submitting}
                  />
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="end_time">Hora fin (opcional)</label>
                  <input
                    id="end_time"
                    name="end_time"
                    type="time"
                    className={`field-input${formErr.end_time ? ' error' : ''}`}
                    value={form.end_time}
                    onChange={handleFormChange}
                    disabled={submitting}
                  />
                  {formErr.end_time && <span className="field-error">{formErr.end_time}</span>}
                </div>
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="location">Ubicación (opcional)</label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  className="field-input"
                  placeholder="Ej: Aula 7-A, Gimnasio, Laboratorio..."
                  value={form.location}
                  onChange={handleFormChange}
                  disabled={submitting}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button
                className="btn btn-secondary btn-md"
                style={{ flex: 1 }}
                onClick={() => setShowCreateModal(false)}
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                className={`btn btn-primary btn-md${submitting ? ' btn-loading' : ''}`}
                style={{ flex: 1 }}
                onClick={handleCreateSubmit}
                disabled={submitting}
              >
                {submitting ? 'Guardando...' : 'Crear Evento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
