import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navigate } from 'react-router-dom'
import { KeyRound, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { changePassword } from '../api/auth'

const ROLE_DASHBOARD = {
  admin:   '/admin/dashboard',
  teacher: '/teacher/dashboard',
  parent:  '/parent/dashboard',
}

export default function ChangePassword() {
  const navigate = useNavigate()
  const { session, clearMustChange } = useAuth()

  const [form, setForm]         = useState({
    currentPassword: '',
    newPassword:     '',
    confirmPassword: '',
  })
  const [showPwd, setShowPwd]   = useState({ current: false, new: false, confirm: false })
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)
  const [fieldErr, setFieldErr] = useState({})

  // Solo accesible si la sesión requiere cambio obligatorio
  if (!session) {
    return <Navigate to="/login" replace />
  }
  if (!session.mustChangePassword) {
    return <Navigate to={ROLE_DASHBOARD[session.role] ?? '/login'} replace />
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setFieldErr(prev => ({ ...prev, [name]: '' }))
    setError('')
  }

  function toggleShow(key) {
    setShowPwd(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function validate() {
    const errs = {}
    if (!form.currentPassword) {
      errs.currentPassword = 'Ingrese su contraseña actual'
    }
    if (!form.newPassword) {
      errs.newPassword = 'Ingrese la nueva contraseña'
    } else if (form.newPassword.length < 8) {
      errs.newPassword = 'Debe tener al menos 8 caracteres'
    } else if (form.currentPassword && form.newPassword === form.currentPassword) {
      errs.newPassword = 'La nueva contraseña no puede ser igual a la actual'
    }
    if (!form.confirmPassword) {
      errs.confirmPassword = 'Confirme la nueva contraseña'
    } else if (form.newPassword && form.confirmPassword !== form.newPassword) {
      errs.confirmPassword = 'Las contraseñas no coinciden'
    }
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
      await changePassword(session.token, form.currentPassword, form.newPassword)

      clearMustChange()
      setSuccess(true)

      setTimeout(() => {
        navigate(ROLE_DASHBOARD[session.role] ?? '/login', { replace: true })
      }, 1200)
    } catch (err) {
      setError(err.message || 'No se pudo cambiar la contraseña. Intente de nuevo.')
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
      <div className="login-brand">
        <div className="login-brand-content">
          <p className="login-brand-eyebrow">Seguridad de la cuenta</p>
          <h1 className="login-brand-title">
            EduConecta<br />CR
          </h1>
          <p className="login-brand-sub">
            Por su seguridad, debe establecer una nueva contraseña antes de continuar
            con su primer ingreso a la plataforma.
          </p>
          <div className="login-brand-badge">
            <KeyRound size={13} strokeWidth={1.5} />
            Cambio obligatorio de contraseña
          </div>
        </div>
      </div>

      {/* Panel del formulario */}
      <div className="login-form-panel">
        <div className="login-card">
          <div className="login-card-header">
            <p className="login-card-title">Cambiar contraseña</p>
            <p className="login-card-desc">
              Hola{session?.first_name ? `, ${session.first_name}` : ''}, este es su primer ingreso.
            </p>
          </div>

          {success && (
            <div className="alert alert-success" style={{ marginBottom: '20px' }}>
              <CheckCircle2 size={16} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>Contraseña actualizada con éxito. Redirigiendo...</span>
            </div>
          )}

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '20px' }}>
              <AlertCircle size={16} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          <div className="login-fields">
            {/* Contraseña actual */}
            <div className="field-group">
              <label className="field-label" htmlFor="currentPassword">Contraseña actual</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type={showPwd.current ? 'text' : 'password'}
                  className={`field-input${fieldErr.currentPassword ? ' error' : ''}`}
                  placeholder="••••••••"
                  value={form.currentPassword}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  autoComplete="current-password"
                  disabled={loading || success}
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => toggleShow('current')}
                  style={togglePwdStyle}
                  tabIndex={-1}
                  aria-label={showPwd.current ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPwd.current
                    ? <EyeOff size={16} strokeWidth={1.5} />
                    : <Eye size={16} strokeWidth={1.5} />
                  }
                </button>
              </div>
              {fieldErr.currentPassword && (
                <span className="field-error">{fieldErr.currentPassword}</span>
              )}
            </div>

            {/* Nueva contraseña */}
            <div className="field-group">
              <label className="field-label" htmlFor="newPassword">Nueva contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPwd.new ? 'text' : 'password'}
                  className={`field-input${fieldErr.newPassword ? ' error' : ''}`}
                  placeholder="Mínimo 8 caracteres"
                  value={form.newPassword}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  autoComplete="new-password"
                  disabled={loading || success}
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => toggleShow('new')}
                  style={togglePwdStyle}
                  tabIndex={-1}
                  aria-label={showPwd.new ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPwd.new
                    ? <EyeOff size={16} strokeWidth={1.5} />
                    : <Eye size={16} strokeWidth={1.5} />
                  }
                </button>
              </div>
              {fieldErr.newPassword && (
                <span className="field-error">{fieldErr.newPassword}</span>
              )}
            </div>

            {/* Confirmar nueva contraseña */}
            <div className="field-group">
              <label className="field-label" htmlFor="confirmPassword">Confirmar nueva contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPwd.confirm ? 'text' : 'password'}
                  className={`field-input${fieldErr.confirmPassword ? ' error' : ''}`}
                  placeholder="Repita la nueva contraseña"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  autoComplete="new-password"
                  disabled={loading || success}
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => toggleShow('confirm')}
                  style={togglePwdStyle}
                  tabIndex={-1}
                  aria-label={showPwd.confirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPwd.confirm
                    ? <EyeOff size={16} strokeWidth={1.5} />
                    : <Eye size={16} strokeWidth={1.5} />
                  }
                </button>
              </div>
              {fieldErr.confirmPassword && (
                <span className="field-error">{fieldErr.confirmPassword}</span>
              )}
            </div>
          </div>

          <button
            className={`btn btn-primary btn-md btn-block${loading ? ' btn-loading' : ''}`}
            onClick={handleSubmit}
            disabled={loading || success}
          >
            {loading ? 'Guardando...' : 'Cambiar contraseña'}
          </button>
        </div>
      </div>
    </div>
  )
}

const togglePwdStyle = {
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
}
