import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { KeyRound, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'
import { resetPassword } from '../api/auth'

export default function ResetPassword() {
  const navigate            = useNavigate()
  const [searchParams]      = useSearchParams()
  const token               = searchParams.get('token') ?? ''

  const [form, setForm]         = useState({ newPassword: '', confirmPassword: '' })
  const [showPwd, setShowPwd]   = useState({ new: false, confirm: false })
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)
  const [fieldErr, setFieldErr] = useState({})

  // Token inválido o ausente
  if (!token) {
    return (
      <div className="login-root">
        <div className="login-brand">
          <div className="login-brand-content">
            <p className="login-brand-eyebrow">Seguridad de la cuenta</p>
            <h1 className="login-brand-title">EduConecta<br />CR</h1>
          </div>
        </div>
        <div className="login-form-panel">
          <div className="login-card">
            <div className="login-card-header">
              <p className="login-card-title">Enlace inválido</p>
            </div>
            <div className="alert alert-error" style={{ marginBottom: '20px' }}>
              <AlertCircle size={16} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                Este enlace de recuperación no es válido o ha expirado.
                Solicite uno nuevo desde la pantalla de inicio de sesión.
              </span>
            </div>
            <button
              className="btn btn-primary btn-md btn-block"
              onClick={() => navigate('/login', { replace: true })}
            >
              Volver al inicio de sesión
            </button>
          </div>
        </div>
      </div>
    )
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
    if (!form.newPassword) {
      errs.newPassword = 'Ingrese la nueva contraseña'
    } else if (form.newPassword.length < 8) {
      errs.newPassword = 'Debe tener al menos 8 caracteres'
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
      await resetPassword(token, form.newPassword)
      setSuccess(true)
      setTimeout(() => navigate('/login', { replace: true }), 2000)
    } catch (err) {
      setError(err.message || 'No se pudo restablecer la contraseña. El enlace puede haber expirado.')
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
            Establezca una nueva contraseña segura para su cuenta.
            El enlace de recuperación tiene una validez de 1 hora.
          </p>
          <div className="login-brand-badge">
            <KeyRound size={13} strokeWidth={1.5} />
            Restablecer contraseña
          </div>
        </div>
      </div>

      {/* Panel del formulario */}
      <div className="login-form-panel">
        <div className="login-card">
          <div className="login-card-header">
            <p className="login-card-title">Nueva contraseña</p>
            <p className="login-card-desc">Ingrese y confirme su nueva contraseña</p>
          </div>

          {success && (
            <div className="alert alert-success" style={{ marginBottom: '20px' }}>
              <CheckCircle2 size={16} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>Contraseña restablecida con éxito. Redirigiendo al inicio de sesión...</span>
            </div>
          )}

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '20px' }}>
              <AlertCircle size={16} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          <div className="login-fields">
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
                  autoFocus
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

            {/* Confirmar contraseña */}
            <div className="field-group">
              <label className="field-label" htmlFor="confirmPassword">Confirmar contraseña</label>
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
            {loading ? 'Guardando...' : 'Restablecer contraseña'}
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
