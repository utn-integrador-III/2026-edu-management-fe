import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, Users, GraduationCap, BookOpen,
  ClipboardList, Star, CalendarDays, Upload, LogOut,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { logoutUser } from '../api/auth'

const ADMIN_NAV = [
  { to: '/admin/dashboard', label: 'Dashboard',         icon: LayoutDashboard },
  { to: '/admin/users',     label: 'Usuarios',          icon: Users           },
  { to: '/admin/students',  label: 'Estudiantes',       icon: GraduationCap   },
  { to: '/admin/groups',    label: 'Grupos y materias', icon: BookOpen        },
  { to: '/admin/attendance',label: 'Asistencia',        icon: ClipboardList   },
  { to: '/admin/grades',    label: 'Calificaciones',    icon: Star            },
  { to: '/admin/calendar',  label: 'Calendario',        icon: CalendarDays    },
  { to: '/admin/import',    label: 'Importar CSV',      icon: Upload          },
]

// Mapea la ruta actual a un título legible para el topbar
const ROUTE_LABELS = {
  '/admin/dashboard':  'Dashboard',
  '/admin/users':      'Usuarios',
  '/admin/students':   'Estudiantes',
  '/admin/groups':     'Grupos y materias',
  '/admin/attendance': 'Asistencia',
  '/admin/grades':     'Calificaciones',
  '/admin/calendar':   'Calendario',
  '/admin/import':     'Importar CSV',
}

function initials(first, last) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase()
}

export default function AppShell() {
  const { session, logout } = useAuth()
  const navigate            = useNavigate()

  const currentPath  = window.location.pathname
  const topbarTitle  = ROUTE_LABELS[currentPath] ?? 'Panel administrativo'

  async function handleLogout() {
    try {
      await logoutUser(session?.token)
    } catch {
      // logout siempre limpia la sesión local aunque falle el backend
    }
    logout()
    navigate('/admin-login', { replace: true })
  }

  return (
    <div className="app-shell">
      {/* ── Sidebar ───────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <p className="sidebar-logo-title">EduConecta CR</p>
          <p className="sidebar-logo-sub">Panel administrativo</p>
        </div>

        <nav className="sidebar-nav">
          <p className="sidebar-section-label">Menú</p>
          {ADMIN_NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `sidebar-item${isActive ? ' active' : ''}`
              }
            >
              <Icon size={18} strokeWidth={1.5} color="currentColor" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {initials(session?.first_name, session?.last_name)}
            </div>
            <div>
              <p className="sidebar-user-name">
                {session?.first_name} {session?.last_name}
              </p>
              <p className="sidebar-user-role">Administrador</p>
            </div>
          </div>
          <button className="sidebar-item" onClick={handleLogout}>
            <LogOut size={18} strokeWidth={1.5} color="currentColor" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Área principal ────────────────────── */}
      <div className="main-area">
        <header className="topbar">
          <span className="topbar-title">{topbarTitle}</span>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}