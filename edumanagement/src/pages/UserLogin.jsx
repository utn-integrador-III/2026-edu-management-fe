import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Eye, EyeOff, AlertCircle, X, CheckCircle2, User, Lock } from 'lucide-react'
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

      login({ ...data, id_number: form.id_number.trim() })

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
      <div className="login-brand">
        <div className="login-brand-logo">
          <span style={{ fontWeight: 700, fontSize: '24px', letterSpacing: '-0.5px', color: '#fff' }}>Edu </span>
          <span style={{ fontWeight: 700, fontSize: '24px', letterSpacing: '-0.5px', color: 'var(--amber-500)' }}>Management</span>
        </div>

        <div className="login-brand-center">
          <h1 className="login-brand-title">
            Asistencia y<br />
            comunicación escolar,<br />
            <span style={{ color: 'var(--amber-500)' }}>sin papeleo.</span>
          </h1>
        </div>

        <div className="login-brand-footer">
          <p style={{ opacity: 0.6, fontSize: '13px', color: '#fff', fontWeight: 500 }}>
            Plataforma de gestión escolar · Costa Rica
          </p>
        </div>
      </div>

      {/* Panel del formulario */}
      <div className="login-form-panel">
        <div className="login-card">
          <div className="login-card-header" style={{ marginBottom: '28px' }}>
            <p className="login-card-title">Iniciar sesión</p>
            <p className="login-card-desc">Ingrese su cédula y contraseña para acceder.</p>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '20px' }}>
              <AlertCircle size={20} strokeWidth={1.5} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <div className="login-fields">
            {/* Cédula */}
            <div className="field-group">
              <label className="field-label" htmlFor="id_number" style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>NÚMERO DE CÉDULA</label>
              <div style={{ position: 'relative' }}>
                <User size={18} strokeWidth={1.5} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
                <input
                  id="id_number"
                  name="id_number"
                  type="text"
                  className={`field-input${fieldErr.id_number ? ' error' : ''}`}
                  style={{ paddingLeft: '40px' }}
                  placeholder="1-0456-7890"
                  value={form.id_number}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  autoComplete="username"
                  autoFocus
                  disabled={loading}
                />
              </div>
              {fieldErr.id_number && (
                <span className="field-error">{fieldErr.id_number}</span>
              )}
            </div>

            {/* Contraseña */}
            <div className="field-group">
              <label className="field-label" htmlFor="password" style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>CONTRASEÑA</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} strokeWidth={1.5} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
                <input
                  id="password"
                  name="password"
                  type={showPwd ? 'text' : 'password'}
                  className={`field-input${fieldErr.password ? ' error' : ''}`}
                  style={{ paddingLeft: '40px', paddingRight: '40px' }}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--neutral-400)',
                    display: 'flex',
                    padding: '2px',
                  }}
                  tabIndex={-1}
                  aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPwd
                    ? <EyeOff size={18} strokeWidth={1.5} />
                    : <Eye size={18} strokeWidth={1.5} />
                  }
                </button>
              </div>
              {fieldErr.password && (
                <span className="field-error">{fieldErr.password}</span>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
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
          </div>

          <button
            className={`btn btn-primary btn-block btn-lg${loading ? ' btn-loading' : ''}`}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Ingresar al sistema'}
          </button>

          {/* Banner de primer ingreso en color ámbar */}
          <div
            style={{
              marginTop: '24px',
              padding: '12px 16px',
              background: 'var(--color-warning-bg)',
              borderLeft: '4px solid var(--color-warning)',
              borderRadius: '0 var(--radius-md) var(--radius-md) 0',
              fontSize: '12px',
              color: 'var(--neutral-900)',
              lineHeight: '1.4',
              textAlign: 'left'
            }}
          >
            <strong>Primer ingreso:</strong> al iniciar sesión se le solicitará cambiar su contraseña temporal.
          </div>

          {/* Enlace de soporte al pie */}
          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--neutral-500)' }}>
            <span>Problemas de acceso · </span>
            <a
              href="#support"
              onClick={(e) => { e.preventDefault(); alert("Por favor contacte al personal administrativo de su centro educativo para restablecer sus credenciales."); }}
              style={{ color: 'var(--blue-500)', textDecoration: 'none', fontWeight: 600 }}
            >
              Contacte a su administrador
            </a>
          </div>
        </div>
      </div>

      {showRecover && (
        <RecoverPasswordModal onClose={() => setShowRecover(false)} />
      )}
    </div>
  )
}

function RecoverPasswordModal({ onClose }) {
  const [idNumber, setIdNumber] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [sent, setSent]         = useState(false)

  async function handleSubmit() {
    if (!idNumber.trim()) {
      setError('Ingrese su número de cédula')
      return
    }

    setLoading(true)
    setError('')

    try {
      await recoverPassword(idNumber.trim())
      setSent(true)
    } catch {
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
              Ingrese su número de cédula. Si tiene un correo registrado,
              le enviaremos un enlace para restablecer su contraseña.
            </p>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: '20px' }}>
                <AlertCircle size={16} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{error}</span>
              </div>
            )}

            <div className="field-group" style={{ marginBottom: '24px' }}>
              <label className="field-label" htmlFor="recover-id">Número de cédula</label>
              <input
                id="recover-id"
                name="id_number"
                type="text"
                className={`field-input${error ? ' error' : ''}`}
                placeholder="Ej: 604420243"
                value={idNumber}
                onChange={e => { setIdNumber(e.target.value); setError('') }}
                onKeyDown={handleKeyDown}
                autoComplete="username"
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
                Si su cédula tiene un correo registrado, recibirá un enlace
                para restablecer su contraseña en los próximos minutos.
              </span>
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
