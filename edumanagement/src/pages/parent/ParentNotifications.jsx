import { useState, useEffect, useCallback } from 'react'
import { Bell, BellRing, CheckCircle2, AlertTriangle, CalendarClock, RefreshCcw } from 'lucide-react'
import { getNotifications, markNotificationRead } from '../../api/edu'

function formatDateTime(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString
  return date.toLocaleString('es-CR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function ParentNotifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [markingId, setMarkingId] = useState(null)

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getNotifications()
      setNotifications(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error al consultar notificaciones', err)
      setError(err.message || 'No fue posible cargar sus notificaciones. Intente nuevamente.')
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  async function handleMarkRead(id) {
    setMarkingId(id)
    try {
      await markNotificationRead(id)
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      )
    } catch (err) {
      console.error('Error al marcar notificación como leída', err)
      setError(err.message || 'No fue posible actualizar la notificación.')
    } finally {
      setMarkingId(null)
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length
  const visibleNotifications = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications

  return (
    <div style={{ paddingBottom: '40px' }}>
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="text-h1" style={{ color: 'var(--neutral-900)' }}>Notificaciones</h1>
          <p className="text-sm">Recordatorios de eventos del centro educativo, enviados 24 horas antes de su fecha.</p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={loadNotifications}
          disabled={loading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCcw size={16} strokeWidth={1.5} />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          <AlertTriangle size={20} strokeWidth={1.5} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <button
          className="btn"
          onClick={() => setFilter('all')}
          style={{
            padding: '6px 16px',
            borderRadius: 'var(--radius-full)',
            border: filter === 'all' ? '1px solid var(--blue-500)' : '1px solid var(--neutral-300)',
            background: filter === 'all' ? 'var(--blue-50)' : 'none',
            color: filter === 'all' ? 'var(--blue-700)' : 'var(--neutral-700)',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Todas ({notifications.length})
        </button>
        <button
          className="btn"
          onClick={() => setFilter('unread')}
          style={{
            padding: '6px 16px',
            borderRadius: 'var(--radius-full)',
            border: filter === 'unread' ? '1px solid var(--blue-500)' : '1px solid var(--neutral-300)',
            background: filter === 'unread' ? 'var(--blue-50)' : 'none',
            color: filter === 'unread' ? 'var(--blue-700)' : 'var(--neutral-700)',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          No leídas ({unreadCount})
        </button>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p className="text-h3" style={{ color: 'var(--neutral-400)' }}>Cargando notificaciones...</p>
        </div>
      ) : visibleNotifications.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px', maxWidth: '600px', margin: '0 auto' }}>
          <Bell size={48} strokeWidth={1} color="var(--neutral-300)" style={{ marginBottom: '12px' }} />
          <p className="text-h2" style={{ color: 'var(--neutral-900)' }}>
            {filter === 'unread' ? 'No tiene notificaciones sin leer' : 'No hay notificaciones'}
          </p>
          <p className="text-sm" style={{ marginTop: '8px' }}>
            Aquí aparecerán los recordatorios de eventos próximos de sus hijos.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {visibleNotifications.map(n => (
            <div
              key={n.id}
              className="card"
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                borderLeft: n.is_read ? '4px solid var(--neutral-200)' : '4px solid var(--blue-500)',
                background: n.is_read ? '#fff' : 'var(--blue-50)'
              }}
            >
              <div style={{ flexShrink: 0, marginTop: '2px' }}>
                {n.is_read ? (
                  <Bell size={20} strokeWidth={1.5} color="var(--neutral-400)" />
                ) : (
                  <BellRing size={20} strokeWidth={1.5} color="var(--blue-500)" />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--neutral-900)' }}>
                    {n.title || 'Recordatorio de evento'}
                  </p>
                  {!n.is_read && <span className="badge badge-blue">Nueva</span>}
                </div>

                {n.message && (
                  <p className="text-sm" style={{ marginTop: '4px', color: 'var(--neutral-700)' }}>
                    {n.message}
                  </p>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {n.event_date && (
                    <span className="text-caption" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <CalendarClock size={14} strokeWidth={1.5} />
                      Evento: {formatDateTime(n.event_date)}
                    </span>
                  )}
                  {n.student_name && (
                    <span className="badge badge-gray">{n.student_name}</span>
                  )}
                  {n.created_at && (
                    <span className="text-caption">Enviado: {formatDateTime(n.created_at)}</span>
                  )}
                </div>
              </div>

              {!n.is_read && (
                <button
                  className="btn btn-secondary"
                  onClick={() => handleMarkRead(n.id)}
                  disabled={markingId === n.id}
                  style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px' }}
                >
                  <CheckCircle2 size={14} strokeWidth={1.5} />
                  {markingId === n.id ? 'Guardando...' : 'Marcar leída'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
