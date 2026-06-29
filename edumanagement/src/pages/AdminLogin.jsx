import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Eye, EyeOff, AlertCircle, User, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { loginUser } from '../api/auth'

export default function AdminLogin() {
  const navigate  = useNavigate()
  const { login } = useAuth()

  const [form, setForm]       = useState({ id_number: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [fieldErr, setFieldErr] = useState({})

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setFieldErr(prev => ({ ...prev, [name]: '' }))
    setError('')
  }

  function validate() {
    const errs = {}
    if (!form.id_number.trim()) errs.id_number = 'Ingrese su usuario'
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

      if (data.role !== 'admin') {
        setError('Acceso denegado. Este portal es exclusivo para administradores.')
        return
      }

      login({ ...data, id_number: form.id_number.trim() })

      if (data.mustChangePassword) {
        navigate('/change-password')
      } else {
        navigate('/admin/dashboard')
      }
    } catch (err) {
      if (err.status === 401) {
        setError('Usuario o contraseña incorrectos.')
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
            Panel Administrativo · Costa Rica
          </p>
        </div>
      </div>

      {/* Panel del formulario */}
      <div className="login-form-panel">
        <div className="login-card">
          <div className="login-card-header" style={{ marginBottom: '28px' }}>
            <p className="login-card-title">Iniciar sesión</p>
            <p className="login-card-desc">Ingrese sus credenciales de administrador para acceder.</p>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '20px' }}>
              <AlertCircle size={20} strokeWidth={1.5} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <div className="login-fields">
            {/* Usuario */}
            <div className="field-group">
              <label className="field-label" htmlFor="id_number" style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>USUARIO ADMINISTRADOR</label>
              <div style={{ position: 'relative' }}>
                <User size={18} strokeWidth={1.5} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
                <input
                  id="id_number"
                  name="id_number"
                  type="text"
                  className={`field-input${fieldErr.id_number ? ' error' : ''}`}
                  style={{ paddingLeft: '40px' }}
                  placeholder="Número de cédula o usuario"
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
            </div>
          </div>

          <button
            className={`btn btn-primary btn-block btn-lg${loading ? ' btn-loading' : ''}`}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Ingresar al sistema'}
          </button>

          {/* Enlace de soporte al pie */}
          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--neutral-500)' }}>
            <span>¿Problemas para acceder? </span>
            <a
              href="#support"
              onClick={(e) => { e.preventDefault(); alert("Por favor contacte al administrador global del sistema o revise la configuración de su servidor."); }}
              style={{ color: 'var(--blue-500)', textDecoration: 'none', fontWeight: 600 }}
            >
              Contacte a soporte
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}