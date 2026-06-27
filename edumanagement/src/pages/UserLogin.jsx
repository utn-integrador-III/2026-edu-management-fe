import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Eye, EyeOff, AlertCircle, X, Mail, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { loginUser, recoverPassword } from '../api/auth'

export default function UserLogin() {
  const navigate  = useNavigate()
  const { login } = useAuth()

  const [form, setForm]         = useState({ id_number: '', password: '' })
  const [showPwd, setShowPwd]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [fieldErr, setFieldErr] = useState({})

  const [showRecover, setShowRecover] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setFieldErr(prev => ({ ...prev, [name]: '' }))
    setError('')
  }

  function validate() {
    const errs = {}
    if (!form.id_number.trim()) errs.id_number = 'Ingrese su número de cédula'
    if (!form.password)         errs.password  = 'Ingrese su contraseña'
    return errs
  }

  async function handleSubmit() {
    const errs = validate()
    if (Object.keys(errs).length) {
      setFieldErr(errs)
      return
    }

    setLoading(true)
    setError('')

    try {
      const data = await loginUser(form.id_number.trim(), form.password)

      if (data.role === 'admin') {
        setError('Este portal es para docentes y encargados. Use el acceso de administrador.')
        return
      }

      login(data)

      if (data.mustChangePassword) {
        navigate('/change-password')
        return
      }

      if (data.role === 'teacher') {
        navigate('/teacher/dashboard')
      } else if (data.role === 'parent') {
        navigate('/parent/dashboard')
      }
    } catch (err) {
      if (err.status === 401) {
        setError('Credenciales incorrectas. Verifique su cédula y contraseña.')
      } else {
        setError('No se pudo conectar con el servidor. Intente de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="login-root">
      {/* Panel de marca */}
      <div className="login-brand login-brand-warm">
        <div className="login-brand-content">
          <p className="login-brand-eyebrow login-brand-eyebrow-warm">Comunidad educativa</p>
          <h1 className="login-brand-title">
            EduConecta<br />CR
          </h1>
          <p className="login-brand-sub">
            Acompañamos a docentes y familias en el seguimiento del progreso escolar.
            Consulte asistencia, calificaciones y novedades de sus estudiantes en un solo lugar.
          </p>
          <div className="login-brand-badge login-brand-badge-warm">
            <Heart size={13} strokeWidth={1.5} />
            Portal para docentes y encargados
          </div>
        </div>
      </div>

      {/* Panel del formulario */}
      <div className="login-form-panel">
        <div className="login-card">
          <div className="login-card-header">
            <p className="login-card-title">Bienvenido</p>
            <p className="login-card-desc">Ingrese con su número de cédula</p>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '20px' }}>
              <AlertCircle size={16} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          <div className="login-fields">
            {/* Cédula */}
            <div className="field-group">
              <label className="field-label" htmlFor="id_number">Cédula</label>
              <input
                id="id_number"
                name="id_number"
                type="text"
                className={`field-input${fieldErr.id_number ? ' error' : ''}`}
                placeholder="Número de cédula"
                value={form.id_number}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                autoComplete="username"
                autoFocus
                disabled={loading}
              />
              {fieldErr.id_number && (
                <span className="field-error">{fieldErr.id_number}</span>
              )}
            </div>

            {/* Contraseña */}
            <div className="field-group">
              <label className="field-label" htmlFor="password">Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  name="password"
                  type={showPwd ? 'text' : 'password'}
                  className={`field-input${fieldErr.password ? ' error' : ''}`}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  autoComplete="current-password"
                  disabled={loading}
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--neutral-500)',
                    display: 'flex',
                    padding: '2px',
                  }}
                  tabIndex={-1}
                  aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPwd
                    ? <EyeOff size={16} strokeWidth={1.5} />
                    : <Eye size={16} strokeWidth={1.5} />
                  }
                </button>
              </div>
              {fieldErr.password && (
                <span className="field-error">{fieldErr.password}</span>
              )}

              <button
                type="button"
                className="login-forgot-link"
                onClick={() => setShowRecover(true)}
                disabled={loading}
              >
                ¿Olvidó su contraseña?
              </button>
            </div>
          </div>

          <button
            className={`btn btn-primary btn-md btn-block${loading ? ' btn-loading' : ''}`}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Verificando...' : 'Ingresar'}
          </button>

          <p className="login-footer-text">
            ¿Problemas para acceder? Contacte a la administración del centro educativo.
          </p>
        </div>
      </div>

      {showRecover && (
        <RecoverPasswordModal onClose={() => setShowRecover(false)} />
      )}
    </div>
  )
}

// ── Modal de recuperación de contraseña ─────────────────────────
function RecoverPasswordModal({ onClose }) {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [sent, setSent]       = useState(false)

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }

  async function handleSubmit() {
    if (!email.trim()) {
      setError('Ingrese su correo electrónico')
      return
    }
    if (!isValidEmail(email.trim())) {
      setError('Ingrese un correo electrónico válido')
      return
    }

    setLoading(true)
    setError('')

    try {
      await recoverPassword(email.trim())
      setSent(true)
    } catch {
      // No revelar detalles del servidor — mostrar el mismo mensaje de éxito
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSubmit()
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-card">
        <div className="modal-header">
          <p className="login-card-title">Recuperar contraseña</p>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {!sent ? (
          <>
            <p className="modal-desc">
              Ingrese el correo electrónico asociado a su cuenta. Le enviaremos
              un enlace para restablecer su contraseña.
            </p>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: '20px' }}>
                <AlertCircle size={16} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{error}</span>
              </div>
            )}

            <div className="field-group" style={{ marginBottom: '24px' }}>
              <label className="field-label" htmlFor="recover-email">Correo electrónico</label>
              <input
                id="recover-email"
                name="email"
                type="email"
                className={`field-input${error ? ' error' : ''}`}
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                onKeyDown={handleKeyDown}
                autoComplete="email"
                autoFocus
                disabled={loading}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-secondary btn-md"
                style={{ flex: 1 }}
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                className={`btn btn-primary btn-md${loading ? ' btn-loading' : ''}`}
                style={{ flex: 1 }}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="alert alert-success" style={{ marginBottom: '20px' }}>
              <CheckCircle2 size={16} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                Si el correo está registrado, recibirá un enlace para restablecer
                su contraseña en los próximos minutos.
              </span>
            </div>

            <div
              className="text-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}
            >
              <Mail size={16} strokeWidth={1.5} />
              <span>{email}</span>
            </div>

            <button
              className="btn btn-primary btn-md btn-block"
              onClick={onClose}
            >
              Entendido
            </button>
          </>
        )}
      </div>
    </div>
  )
}
