import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Heart, GraduationCap, BookOpen, Upload,
  Calendar, FileSpreadsheet, ArrowRight, Shield, CheckCircle
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getUsers, listGroups } from '../../api/edu'

export default function AdminDashboard() {
  const { session } = useAuth()
  const [stats, setStats] = useState({
    teachers: 0,
    parents: 0,
    students: 0,
    groups: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const [allUsers, allGroups] = await Promise.all([
          getUsers(),
          listGroups()
        ])

        const teachers = allUsers.filter(u => u.role === 'teacher').length
        const parents = allUsers.filter(u => u.role === 'parent').length
        const students = allUsers.filter(u => u.role === 'student').length

        setStats({
          teachers,
          parents,
          students,
          groups: allGroups.length
        })
      } catch (err) {
        console.error('Error cargando estadísticas del dashboard', err)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  return (
    <div>
      {/* Cabecera del Panel */}
      <div style={{ marginBottom: '28px' }}>
        <h1 className="text-h1" style={{ color: 'var(--neutral-900)', marginBottom: '4px' }}>
          Edu Management — Panel de Administración
        </h1>
        <p className="text-sm">
          Bienvenido, {session?.first_name || 'Administrador'}. Controle el estado del centro escolar, gestione expedientes o importe datos.
        </p>
      </div>

      {/* Alerta de Última Carga Exitosa */}
      <div className="alert alert-success" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <CheckCircle size={20} strokeWidth={1.5} />
        <span>Última carga exitosa: <strong>42 estudiantes</strong> importados el 25 jun 2026 — 10:14 a.m.</span>
      </div>

      {/* Grid de Métricas */}
      <div className="grid-dashboard" style={{ marginBottom: '32px' }}>
        <div className="metric-card">
          <div className="metric-icon-box blue">
            <Users size={24} strokeWidth={1.5} />
          </div>
          <div className="metric-info">
            <p className="metric-value">{loading ? '...' : stats.teachers}</p>
            <p className="metric-label" style={{ fontWeight: 600 }}>DOCENTES</p>
            <p className="text-caption" style={{ marginTop: '2px', color: 'var(--neutral-400)' }}>Activos en el sistema</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box green">
            <Heart size={24} strokeWidth={1.5} />
          </div>
          <div className="metric-info">
            <p className="metric-value">{loading ? '...' : stats.parents}</p>
            <p className="metric-label" style={{ fontWeight: 600 }}>PADRES / TUTORES</p>
            <p className="text-caption" style={{ marginTop: '2px', color: 'var(--neutral-400)' }}>Registrados y vinculados</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box amber">
            <GraduationCap size={24} strokeWidth={1.5} />
          </div>
          <div className="metric-info">
            <p className="metric-value">{loading ? '...' : stats.students}</p>
            <p className="metric-label" style={{ fontWeight: 600 }}>ESTUDIANTES</p>
            <p className="text-caption" style={{ marginTop: '2px', color: 'var(--neutral-400)' }}>En {stats.groups} grupos activos</p>
          </div>
        </div>
      </div>

      {/* Accesos Rápidos a Módulos del Release 1 */}
      <div style={{ marginBottom: '32px' }}>
        <p className="text-h3" style={{ color: 'var(--neutral-900)', marginBottom: '16px' }}>Módulos de Gestión</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          
          <Link to="/admin/users" style={{ textDecoration: 'none' }}>
            <div className="subject-card" style={{ cursor: 'pointer', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div className="metric-icon-box blue" style={{ width: '36px', height: '36px' }}>
                  <Shield size={18} strokeWidth={1.5} />
                </div>
                <p style={{ fontWeight: 700, color: 'var(--neutral-900)' }}>Gestión de Usuarios</p>
              </div>
              <p className="text-caption" style={{ color: 'var(--neutral-500)', lineHeight: 1.4, marginBottom: '16px' }}>
                Administre cuentas de docentes, encargados y estudiantes. Realice altas manuales, ediciones y mapeo de relaciones familiares.
              </p>
              <span className="text-caption" style={{ color: 'var(--blue-500)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: 'auto' }}>
                Ir a Usuarios <ArrowRight size={14} />
              </span>
            </div>
          </Link>

          <Link to="/admin/students" style={{ textDecoration: 'none' }}>
            <div className="subject-card" style={{ cursor: 'pointer', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div className="metric-icon-box amber" style={{ width: '36px', height: '36px' }}>
                  <GraduationCap size={18} strokeWidth={1.5} />
                </div>
                <p style={{ fontWeight: 700, color: 'var(--neutral-900)' }}>Expedientes y Materias</p>
              </div>
              <p className="text-caption" style={{ color: 'var(--neutral-500)', lineHeight: 1.4, marginBottom: '16px' }}>
                Consulte las fichas de los alumnos, asigne nuevas materias curriculares a su plan de estudio, defina el profesor y retire materias.
              </p>
              <span className="text-caption" style={{ color: 'var(--blue-500)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: 'auto' }}>
                Ir a Expedientes <ArrowRight size={14} />
              </span>
            </div>
          </Link>

          <Link to="/admin/groups" style={{ textDecoration: 'none' }}>
            <div className="subject-card" style={{ cursor: 'pointer', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div className="metric-icon-box green" style={{ width: '36px', height: '36px' }}>
                  <BookOpen size={18} strokeWidth={1.5} />
                </div>
                <p style={{ fontWeight: 700, color: 'var(--neutral-900)' }}>Estructura y Catálogo</p>
              </div>
              <p className="text-caption" style={{ color: 'var(--neutral-500)', lineHeight: 1.4, marginBottom: '16px' }}>
                Cree y configure los niveles escolares, secciones/grupos de estudio, y el catálogo global de materias académicas autorizadas.
              </p>
              <span className="text-caption" style={{ color: 'var(--blue-500)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: 'auto' }}>
                Ir a Estructura <ArrowRight size={14} />
              </span>
            </div>
          </Link>

          <Link to="/admin/import" style={{ textDecoration: 'none' }}>
            <div className="subject-card" style={{ cursor: 'pointer', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div className="metric-icon-box blue" style={{ width: '36px', height: '36px', background: 'rgba(14,165,233,0.1)', color: 'var(--color-info)' }}>
                  <Upload size={18} strokeWidth={1.5} />
                </div>
                <p style={{ fontWeight: 700, color: 'var(--neutral-900)' }}>Carga Masiva (CSV)</p>
              </div>
              <p className="text-caption" style={{ color: 'var(--neutral-500)', lineHeight: 1.4, marginBottom: '16px' }}>
                Suba archivos de matrícula escolar, importe docentes o corra scripts locales del servidor para automatizar la inserción de registros.
              </p>
              <span className="text-caption" style={{ color: 'var(--blue-500)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: 'auto' }}>
                Ir a Importar CSV <ArrowRight size={14} />
              </span>
            </div>
          </Link>

        </div>
      </div>

      {/* Historial de Cargas */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <FileSpreadsheet size={20} strokeWidth={1.5} color="var(--blue-500)" />
          <p className="text-h3" style={{ color: 'var(--neutral-900)' }}>Historial de cargas de matrícula</p>
        </div>

        <div className="table-container">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Archivo</th>
                  <th>Tipo</th>
                  <th>Registros</th>
                  <th>Estado</th>
                  <th>Errores</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-caption" style={{ fontWeight: 500 }}>25 jun 2026, 10:14</td>
                  <td style={{ fontWeight: 600 }}>padres_jun2026.csv</td>
                  <td>
                    <span className="badge badge-blue">PADRES</span>
                  </td>
                  <td style={{ fontWeight: 600 }}>134</td>
                  <td>
                    <span className="badge badge-green">EXITOSO</span>
                  </td>
                  <td style={{ color: 'var(--neutral-400)' }}>—</td>
                </tr>
                <tr>
                  <td className="text-caption" style={{ fontWeight: 500 }}>20 jun 2026, 09:03</td>
                  <td style={{ fontWeight: 600 }}>estudiantes_2026.csv</td>
                  <td>
                    <span className="badge badge-blue">ESTUDIANTES</span>
                  </td>
                  <td style={{ fontWeight: 600 }}>287</td>
                  <td>
                    <span className="badge badge-green">EXITOSO</span>
                  </td>
                  <td style={{ color: 'var(--neutral-400)' }}>—</td>
                </tr>
                <tr>
                  <td className="text-caption" style={{ fontWeight: 500 }}>18 jun 2026, 14:30</td>
                  <td style={{ fontWeight: 600 }}>docentes_inicial.csv</td>
                  <td>
                    <span className="badge badge-blue">DOCENTES</span>
                  </td>
                  <td style={{ fontWeight: 600 }}>18</td>
                  <td>
                    <span className="badge badge-amber">CON ERRORES</span>
                  </td>
                  <td style={{ color: 'var(--color-danger)', fontWeight: 600 }}>2 correos duplicados</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}