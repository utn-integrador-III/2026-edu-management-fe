import { useState, useEffect, useCallback } from 'react'
import { GraduationCap, BookOpen, User, Calendar, Heart, ShieldAlert } from 'lucide-react'
import { getMyChildren, getStudentSubjects } from '../../api/edu'

export default function ParentChildren() {
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedChild, setSelectedChild] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [loadingSubjects, setLoadingSubjects] = useState(false)

  // Cargar hijos vinculados a la cuenta
  const loadChildren = useCallback(async () => {
    setLoading(true)
    try {
      const list = await getMyChildren()
      setChildren(list)
      if (list.length > 0) {
        setSelectedChild(list[0])
      }
    } catch (err) {
      console.error('Error al obtener hijos del encargado', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Cargar materias de un hijo seleccionado
  const loadSubjects = useCallback(async (child) => {
    if (!child) return
    setLoadingSubjects(true)
    try {
      const data = await getStudentSubjects(child.id, '2026')
      setSubjects(data)
    } catch (err) {
      console.error('Error al cargar materias del hijo', err)
    } finally {
      setLoadingSubjects(false)
    }
  }, [])

  useEffect(() => {
    loadChildren()
  }, [loadChildren])

  useEffect(() => {
    loadSubjects(selectedChild)
  }, [selectedChild, loadSubjects])

  return (
    <div>
      {/* Cabecera */}
      <div style={{ marginBottom: '28px' }}>
        <h1 className="text-h1" style={{ color: 'var(--neutral-900)' }}>Información de Estudiantes</h1>
        <p className="text-sm">Consulte el perfil académico, secciones y materias asignadas a sus hijos.</p>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p className="text-h3" style={{ color: 'var(--neutral-400)' }}>Cargando información familiar...</p>
        </div>
      ) : children.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px', maxWidth: '600px', margin: '0 auto' }}>
          <Heart size={48} strokeWidth={1} color="var(--neutral-300)" style={{ marginBottom: '12px' }} />
          <p className="text-h2" style={{ color: 'var(--neutral-900)' }}>No hay estudiantes vinculados</p>
          <p className="text-sm" style={{ marginTop: '8px', marginBottom: '20px' }}>
            Su usuario de encargado no tiene estudiantes asignados en el sistema en este momento.
          </p>
          <div className="alert alert-info">
            <ShieldAlert size={16} />
            <span>Por favor, solicite a la administración del centro educativo vincular su cuenta a la cédula de sus hijos.</span>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px', alignItems: 'start' }}>
          
          {/* Columna Izquierda: Botones de Hijos */}
          <div className="card" style={{ padding: '16px' }}>
            <p className="text-caption" style={{ fontWeight: 700, color: 'var(--neutral-400)', marginBottom: '12px', textTransform: 'uppercase' }}>Sus Estudiantes</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {children.map(child => {
                const isSelected = selectedChild && selectedChild.id === child.id
                return (
                  <button
                    key={child.id}
                    onClick={() => setSelectedChild(child)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      background: isSelected ? 'var(--blue-50)' : 'none',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'background 0.12s'
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: 'var(--radius-full)',
                        background: isSelected ? 'var(--blue-500)' : 'var(--neutral-100)',
                        color: isSelected ? '#fff' : 'var(--neutral-500)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: '12px',
                        flexShrink: 0
                      }}
                    >
                      {child.first_name[0]}{child.last_name[0]}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <p style={{ fontWeight: 600, fontSize: '13px', color: isSelected ? 'var(--blue-700)' : 'var(--neutral-900)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {child.first_name} {child.last_name}
                      </p>
                      <p className="text-caption" style={{ marginTop: '2px' }}>
                        Grupo: {child.group_name}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Columna Derecha: Detalles del Hijo */}
          <div>
            {selectedChild && (
              <div>
                {/* Cabecera Ficha Hijo */}
                <div
                  className="student-profile-header"
                  style={{
                    background: 'linear-gradient(135deg, var(--amber-700) 0%, var(--blue-800) 100%)',
                    marginBottom: '24px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div className="student-avatar-big" style={{ background: 'var(--amber-600)' }}>
                      {selectedChild.first_name[0]}{selectedChild.last_name[0]}
                    </div>
                    <div>
                      <h2 className="text-h1" style={{ margin: 0, color: '#fff' }}>
                        {selectedChild.first_name} {selectedChild.last_name}
                      </h2>
                      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)', marginTop: '2px' }}>
                        Cédula Estudiante: <strong>{selectedChild.id_number}</strong> • Grupo: <strong>{selectedChild.group_name}</strong>
                      </p>
                    </div>
                  </div>
                  <span className="badge badge-amber" style={{ color: '#fff', border: '1px solid rgba(255,255,255,0.4)', padding: '5px 12px' }}>
                    Periodo Escolar 2026
                  </span>
                </div>

                {/* Materias y Profesores */}
                <div className="card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                    <BookOpen size={20} strokeWidth={1.5} color="var(--amber-700)" />
                    <p className="text-h3" style={{ color: 'var(--neutral-900)' }}>Asignaturas Registradas</p>
                  </div>

                  {loadingSubjects ? (
                    <p className="text-sm" style={{ color: 'var(--neutral-400)', textAlign: 'center', padding: '30px' }}>Cargando materias...</p>
                  ) : subjects.length === 0 ? (
                    <div style={{ border: '2px dashed var(--neutral-200)', borderRadius: 'var(--radius-md)', padding: '40px', textAlign: 'center', color: 'var(--neutral-400)' }}>
                      <BookOpen size={32} style={{ color: 'var(--neutral-300)', marginBottom: '8px' }} />
                      <p style={{ fontWeight: 500 }}>No hay materias registradas para este periodo.</p>
                    </div>
                  ) : (
                    <div className="student-subjects-grid">
                      {subjects.map(sub => (
                        <div
                          key={sub.id}
                          className="subject-card"
                          style={{
                            borderLeft: '4px solid var(--amber-700)',
                            padding: '16px 20px',
                            minHeight: '120px'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span className="badge badge-gray" style={{ fontSize: '10px', fontWeight: 600 }}>{sub.code}</span>
                              <span className="badge badge-blue" style={{ fontSize: '10px' }}>{sub.group_name}</span>
                            </div>
                            <p style={{ fontWeight: 700, fontSize: '14px', color: 'var(--neutral-900)' }}>{sub.name}</p>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid var(--neutral-100)', marginTop: '14px', paddingTop: '10px' }}>
                            <User size={16} strokeWidth={1.5} color="var(--neutral-400)" />
                            <p className="text-caption">
                              Docente: <strong style={{ color: 'var(--neutral-700)' }}>{sub.teacher_name}</strong>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
