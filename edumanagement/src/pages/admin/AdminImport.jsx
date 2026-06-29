import { useState } from 'react'
import {
  Upload, FileSpreadsheet, Check,
  AlertTriangle, Info, HelpCircle, FileText
} from 'lucide-react'
import {
  uploadUsersCsv, uploadStudentsCsv
} from '../../api/edu'

export default function AdminImport() {
  // Carga Directa
  const [usersFile, setUsersFile] = useState(null)
  const [studentsFile, setStudentsFile] = useState(null)
  const [uploadingUsers, setUploadingUsers] = useState(false)
  const [uploadingStudents, setUploadingStudents] = useState(false)
  
  // Respuestas / Feedback
  const [usersResult, setUsersResult] = useState(null)
  const [studentsResult, setStudentsResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  // Manejar Carga de Usuarios CSV
  const handleUsersUpload = async (e) => {
    e.preventDefault()
    if (!usersFile) return
    setUploadingUsers(true)
    setUsersResult(null)
    setErrorMsg('')
    try {
      const data = await uploadUsersCsv(usersFile)
      setUsersResult(data)
    } catch (err) {
      setErrorMsg(err.message || 'Error al procesar archivo de usuarios')
    } finally {
      setUploadingUsers(false)
    }
  }

  // Manejar Carga de Estudiantes CSV
  const handleStudentsUpload = async (e) => {
    e.preventDefault()
    if (!studentsFile) return
    setUploadingStudents(true)
    setStudentsResult(null)
    setErrorMsg('')
    try {
      const data = await uploadStudentsCsv(studentsFile)
      setStudentsResult(data)
    } catch (err) {
      setErrorMsg(err.message || 'Error al procesar archivo de estudiantes')
    } finally {
      setUploadingStudents(false)
    }
  }
  return (
    <div>
      {/* Cabecera */}
      <div style={{ marginBottom: '28px' }}>
        <h1 className="text-h1" style={{ color: 'var(--neutral-900)' }}>Carga Masiva y Automatización</h1>
        <p className="text-sm">Suba archivos CSV de matrícula o ejecute procesos automatizados programados en el servidor.</p>
      </div>

      {errorMsg && (
        <div className="alert alert-error" style={{ marginBottom: '24px' }}>
          <AlertTriangle size={20} strokeWidth={1.5} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Columna Izquierda: Cargas directas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Carga de Usuarios */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <FileSpreadsheet size={20} strokeWidth={1.5} color="var(--blue-500)" />
              <p className="text-h3" style={{ color: 'var(--neutral-900)' }}>Cargar Archivo CSV: Usuarios</p>
            </div>
            <p className="text-sm" style={{ marginBottom: '16px' }}>
              Importa docentes, encargados u otros perfiles en lote. El sistema generará una contraseña temporal igual a su cédula.
            </p>

            <form onSubmit={handleUsersUpload} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="file"
                accept=".csv"
                className="field-input"
                style={{ padding: '5px 10px', flex: 1 }}
                onChange={(e) => setUsersFile(e.target.files[0])}
                required
              />
              <button
                type="submit"
                className={`btn btn-primary btn-md${uploadingUsers ? ' btn-loading' : ''}`}
                disabled={uploadingUsers || !usersFile}
              >
                <Upload size={20} strokeWidth={1.5} />
                {uploadingUsers ? 'Procesando...' : 'Cargar'}
              </button>
            </form>

            {/* Resultado de Carga de Usuarios */}
            {usersResult && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '16px',
                  background: 'var(--neutral-50)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--neutral-200)'
                }}
              >
                <p style={{ fontWeight: 600, fontSize: '13px', color: 'var(--neutral-700)', marginBottom: '10px' }}>Resumen de Importación</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center' }}>
                  <div style={{ background: '#fff', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
                    <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-success)' }}>{usersResult.created}</p>
                    <p style={{ fontSize: '10px', color: 'var(--neutral-400)', textTransform: 'uppercase' }}>Creados</p>
                  </div>
                  <div style={{ background: '#fff', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
                    <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--blue-500)' }}>{usersResult.updated}</p>
                    <p style={{ fontSize: '10px', color: 'var(--neutral-400)', textTransform: 'uppercase' }}>Editados</p>
                  </div>
                  <div style={{ background: '#fff', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
                    <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-warning)' }}>{usersResult.skipped}</p>
                    <p style={{ fontSize: '10px', color: 'var(--neutral-400)', textTransform: 'uppercase' }}>Omitidos</p>
                  </div>
                  <div style={{ background: '#fff', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
                    <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-danger)' }}>{usersResult.errors?.length || 0}</p>
                    <p style={{ fontSize: '10px', color: 'var(--neutral-400)', textTransform: 'uppercase' }}>Errores</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Carga de Estudiantes */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <FileSpreadsheet size={20} strokeWidth={1.5} color="var(--blue-500)" />
              <p className="text-h3" style={{ color: 'var(--neutral-900)' }}>Cargar Archivo CSV: Estudiantes</p>
            </div>
            <p className="text-sm" style={{ marginBottom: '16px' }}>
              Importa estudiantes en lote y asócialos a un encargado existente o crea su relación familiar de forma automática.
            </p>

            <form onSubmit={handleStudentsUpload} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="file"
                accept=".csv"
                className="field-input"
                style={{ padding: '5px 10px', flex: 1 }}
                onChange={(e) => setStudentsFile(e.target.files[0])}
                required
              />
              <button
                type="submit"
                className={`btn btn-primary btn-md${uploadingStudents ? ' btn-loading' : ''}`}
                disabled={uploadingStudents || !studentsFile}
              >
                <Upload size={20} strokeWidth={1.5} />
                {uploadingStudents ? 'Procesando...' : 'Cargar'}
              </button>
            </form>

            {/* Resultado de Carga de Estudiantes */}
            {studentsResult && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '16px',
                  background: 'var(--neutral-50)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--neutral-200)'
                }}
              >
                <p style={{ fontWeight: 600, fontSize: '13px', color: 'var(--neutral-700)', marginBottom: '10px' }}>Resumen de Importación</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', textAlign: 'center' }}>
                  <div style={{ background: '#fff', padding: '6px', borderRadius: 'var(--radius-sm)' }}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-success)' }}>{studentsResult.created}</p>
                    <p style={{ fontSize: '9px', color: 'var(--neutral-400)' }}>Creados</p>
                  </div>
                  <div style={{ background: '#fff', padding: '6px', borderRadius: 'var(--radius-sm)' }}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--blue-500)' }}>{studentsResult.linked}</p>
                    <p style={{ fontSize: '9px', color: 'var(--neutral-400)' }}>Vínculos</p>
                  </div>
                  <div style={{ background: '#fff', padding: '6px', borderRadius: 'var(--radius-sm)' }}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--neutral-700)' }}>{studentsResult.updated}</p>
                    <p style={{ fontSize: '9px', color: 'var(--neutral-400)' }}>Editados</p>
                  </div>
                  <div style={{ background: '#fff', padding: '6px', borderRadius: 'var(--radius-sm)' }}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-warning)' }}>{studentsResult.skipped}</p>
                    <p style={{ fontSize: '9px', color: 'var(--neutral-400)' }}>Omitidos</p>
                  </div>
                  <div style={{ background: '#fff', padding: '6px', borderRadius: 'var(--radius-sm)' }}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-danger)' }}>{studentsResult.errors?.length || 0}</p>
                    <p style={{ fontSize: '9px', color: 'var(--neutral-400)' }}>Errores</p>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Columna Derecha: Reporte de Consistencia y Ayuda */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Reporte de Consistencia */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <AlertTriangle size={20} strokeWidth={1.5} color="var(--blue-500)" />
              <p className="text-h3" style={{ color: 'var(--neutral-900)' }}>Reporte de Consistencia de Datos</p>
            </div>

            {(() => {
              const hasUsersErrors = usersResult?.errors && usersResult.errors.length > 0
              const hasStudentsErrors = studentsResult?.errors && studentsResult.errors.length > 0
              const hasAnyErrors = hasUsersErrors || hasStudentsErrors
              const hasAnyResult = usersResult || studentsResult

              if (hasAnyErrors) {
                return (
                  <div>
                    <div className="alert alert-error" style={{ marginBottom: '16px', fontSize: '12px' }}>
                      <span>Se detectaron inconsistencias en la validación de registros:</span>
                    </div>

                    <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {usersResult?.errors?.map((err, idx) => (
                        <div key={`u-err-${idx}`} style={{ padding: '10px', background: 'var(--color-danger-bg)', border: '1px solid rgba(220,38,38,0.1)', borderRadius: 'var(--radius-md)', fontSize: '12px', color: 'var(--color-danger)', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span>[Usuarios] {err}</span>
                        </div>
                      ))}
                      {studentsResult?.errors?.map((err, idx) => (
                        <div key={`s-err-${idx}`} style={{ padding: '10px', background: 'var(--color-danger-bg)', border: '1px solid rgba(220,38,38,0.1)', borderRadius: 'var(--radius-md)', fontSize: '12px', color: 'var(--color-danger)', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span>[Estudiantes] {err}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              }

              if (hasAnyResult) {
                const skipped = (usersResult?.skipped || 0) + (studentsResult?.skipped || 0)
                if (skipped > 0) {
                  return (
                    <div className="alert alert-warning" style={{ fontSize: '12px' }}>
                      <Info size={16} />
                      <span>Procesado con omisiones. Algunos registros ya existían en el sistema y fueron ignorados.</span>
                    </div>
                  )
                }

                return (
                  <div className="alert alert-success" style={{ fontSize: '12px' }}>
                    <Check size={16} />
                    <span>¡Consistencia al 100%! El archivo fue procesado con éxito sin inconsistencias.</span>
                  </div>
                )
              }

              return (
                <div>
                  <p className="text-sm" style={{ color: 'var(--neutral-500)', marginBottom: '16px', lineHeight: 1.5 }}>
                    Suba un archivo CSV en el panel izquierdo para evaluar su consistencia. El sistema ejecutará las siguientes comprobaciones automáticas:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neutral-700)' }}>
                      <Check size={16} color="var(--color-success)" style={{ flexShrink: 0 }} />
                      <span><strong>Cédulas Duplicadas:</strong> Rechazo de llaves repetidas.</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neutral-700)' }}>
                      <Check size={16} color="var(--color-success)" style={{ flexShrink: 0 }} />
                      <span><strong>Formatos Estándar:</strong> Validación de correos y teléfonos.</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neutral-700)' }}>
                      <Check size={16} color="var(--color-success)" style={{ flexShrink: 0 }} />
                      <span><strong>Encargado Obligatorio:</strong> Exclusión de estudiantes sin un padre registrado.</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neutral-700)' }}>
                      <Check size={16} color="var(--color-success)" style={{ flexShrink: 0 }} />
                      <span><strong>Cabeceras de Columnas:</strong> Chequeo de estructura requerida.</span>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Ayuda y especificaciones del CSV */}
          <div className="card" style={{ padding: '24px', background: 'linear-gradient(135deg, var(--blue-900) 0%, var(--blue-800) 100%)', color: '#fff', border: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <HelpCircle size={20} strokeWidth={1.5} color="var(--amber-300)" />
              <p className="text-h3" style={{ color: '#fff' }}>Especificaciones de los Archivos CSV</p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '12px', lineHeight: 1.5 }}>
              <div>
                <p style={{ fontWeight: 600, color: 'var(--amber-300)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={16} strokeWidth={1.5} /> CSV Usuarios
                </p>
                <p style={{ opacity: 0.8, marginTop: '2px' }}>
                  <strong>Encabezado requerido:</strong><br />
                  <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '4px', display: 'block', margin: '4px 0', fontFamily: 'monospace', fontSize: '11px', whiteSpace: 'nowrap', overflowX: 'auto' }}>
                    cedula;nombre;apellido1;apellido2;correo;telefono;tipo_usuario;accion
                  </code>
                  <strong>Separador:</strong> punto y coma (<code>;</code>)
                </p>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                <p style={{ fontWeight: 600, color: 'var(--amber-300)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={16} strokeWidth={1.5} /> CSV Estudiantes
                </p>
                <p style={{ opacity: 0.8, marginTop: '2px' }}>
                  <strong>Encabezado requerido:</strong><br />
                  <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '4px', display: 'block', margin: '4px 0', fontFamily: 'monospace', fontSize: '11px', whiteSpace: 'nowrap', overflowX: 'auto' }}>
                    cedula;nombre;apellido1;apellido2;nivel;seccion;cedula_padre;accion
                  </code>
                  <strong>Separador:</strong> punto y coma (<code>;</code>)
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
