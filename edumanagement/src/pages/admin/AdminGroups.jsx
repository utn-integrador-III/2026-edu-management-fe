import { useState, useEffect, useCallback } from 'react'
import {
  BookOpen, Layers, Plus, Book, Calendar, X,
  Check, AlertTriangle, ChevronRight, Hash
} from 'lucide-react'
import {
  listGroups, listSubjects, createSubject, getUsers
} from '../../api/edu'

export default function AdminGroups() {
  const [activeTab, setActiveTab] = useState('groups') // groups, subjects
  
  const [groups, setGroups] = useState([])
  const [subjects, setSubjects] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)

  // Modal crear materia
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [form, setForm] = useState({
    name: '',
    code: '',
    level: 'Septimo'
  })

  // Feedback
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const gList = await listGroups()
      setGroups(gList)

      const sList = await listSubjects()
      setSubjects(sList)

      const uList = await getUsers({ role: 'student', active: true })
      setStudents(uList)
    } catch (err) {
      console.error('Error al cargar datos de grupos/materias', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Crear materia submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!form.name.trim() || !form.code.trim() || !form.level.trim()) {
      setErrorMsg('Todos los campos son obligatorios.')
      return
    }

    try {
      await createSubject({
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        level: form.level
      })
      setSuccessMsg('Materia registrada con éxito.')
      setForm({ name: '', code: '', level: 'Septimo' })
      setTimeout(() => {
        setShowCreateModal(false)
        loadData()
      }, 1000)
    } catch (err) {
      setErrorMsg(err.message || 'Error al registrar la materia')
    }
  }

  // Contar estudiantes en un grupo
  const getStudentCount = (groupId) => {
    return students.filter(s => s.group_id === groupId).length
  }

  return (
    <div>
      {/* Cabecera */}
      <div className="actions-bar">
        <div>
          <h1 className="text-h1" style={{ color: 'var(--neutral-900)' }}>Estructura Académica</h1>
          <p className="text-sm">Gestione las secciones activas y el catálogo global de asignaturas.</p>
        </div>
        {activeTab === 'subjects' && (
          <button className="btn btn-primary btn-md" onClick={() => setShowCreateModal(true)}>
            <Plus size={20} strokeWidth={1.5} />
            Nueva Asignatura
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-button${activeTab === 'groups' ? ' active' : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          <Layers size={20} strokeWidth={1.5} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
          Grupos y Secciones ({groups.length})
        </button>
        <button
          className={`tab-button${activeTab === 'subjects' ? ' active' : ''}`}
          onClick={() => setActiveTab('subjects')}
        >
          <BookOpen size={20} strokeWidth={1.5} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
          Catálogo de Materias ({subjects.length})
        </button>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p className="text-h3" style={{ color: 'var(--neutral-400)' }}>Cargando catálogo...</p>
        </div>
      ) : activeTab === 'groups' ? (
        /* VISTA DE GRUPOS */
        <div className="grid-dashboard">
          {groups.map(g => {
            const count = getStudentCount(g.id)
            return (
              <div key={g.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px', border: '1px solid var(--neutral-200)' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--blue-50)',
                        color: 'var(--blue-500)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700
                      }}
                    >
                      {g.name}
                    </div>
                    <span className="badge badge-blue">{g.level}</span>
                  </div>
                  <p className="text-h2" style={{ color: 'var(--neutral-900)', fontSize: '16px' }}>Sección {g.name}</p>
                  <p className="text-sm" style={{ marginTop: '4px' }}>Nivel de Educación Escolar</p>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--neutral-100)', marginTop: '20px', paddingTop: '12px' }}>
                  <span className="text-caption" style={{ fontWeight: 500 }}>
                    {count} {count === 1 ? 'Estudiante inscrito' : 'Estudiantes inscritos'}
                  </span>
                  <ChevronRight size={20} strokeWidth={1.5} color="var(--neutral-400)" />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* VISTA DE MATERIAS */
        <div className="table-container">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre de la Asignatura</th>
                  <th>Nivel Curricular</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map(s => (
                  <tr key={s.id}>
                    <td className="text-mono" style={{ fontWeight: 600 }}>
                      <span className="badge badge-gray" style={{ gap: '2px' }}>
                        <Hash size={16} strokeWidth={1.5} /> {s.code}
                      </span>
                    </td>
                    <td style={{ fontSize: '14px', fontWeight: 500, color: 'var(--neutral-900)' }}>{s.name}</td>
                    <td>{s.level}</td>
                    <td>
                      <span className="badge badge-green">Activo</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL CREAR MATERIA */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}>
          <div className="modal-card">
            <div className="modal-header">
              <p className="login-card-title">Registrar Asignatura</p>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}><X size={20} strokeWidth={1.5} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ marginTop: '16px' }}>
              {errorMsg && (
                <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                  <AlertTriangle size={20} strokeWidth={1.5} />
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="alert alert-success" style={{ marginBottom: '16px' }}>
                  <Check size={20} strokeWidth={1.5} />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="field-group" style={{ marginBottom: '16px' }}>
                <label className="field-label">Nombre de la Materia *</label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="Ej: Educación Cívica"
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  required
                />
              </div>

              <div className="form-grid">
                <div className="field-group">
                  <label className="field-label">Código Único *</label>
                  <input
                    type="text"
                    className="field-input"
                    placeholder="Ej: CIV-7"
                    value={form.code}
                    onChange={(e) => setForm({...form, code: e.target.value})}
                    required
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">Nivel Curricular *</label>
                  <select
                    className="field-input"
                    value={form.level}
                    onChange={(e) => setForm({...form, level: e.target.value})}
                  >
                    <option value="Septimo">Sétimo</option>
                    <option value="Octavo">Octavo</option>
                    <option value="Noveno">Noveno</option>
                    <option value="Decimo">Décimo</option>
                    <option value="Undecimo">Undécimo</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary btn-block" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary btn-block">
                  Registrar Materia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
