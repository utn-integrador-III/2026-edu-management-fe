import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, Users, GraduationCap, BookOpen,
  ClipboardList, Star, CalendarDays, Upload, LogOut, Bell, Heart,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { logoutUser } from '../api/auth'

const NAV_BY_ROLE = {
  admin: [
    { to: '/admin/dashboard',  label: 'Dashboard',         icon: LayoutDashboard },
    { to: '/admin/users',      label: 'Usuarios',          icon: Users           },
    { to: '/admin/students',   label: 'Estudiantes',       icon: GraduationCap   },
    { to: '/admin/groups',     label: 'Grupos y materias', icon: BookOpen        },
    { to: '/admin/attendance', label: 'Asistencia',        icon: ClipboardList   },
    { to: '/admin/grades',     label: 'Calificaciones',    icon: Star            },
    { to: '/admin/calendar',   label: 'Calendario',        icon: CalendarDays    },
    { to: '/admin/import',     label: 'Importar CSV',      icon: Upload          },
  ],
  teacher: [
    { to: '/teacher/dashboard',  label: 'Dashboard',       icon: LayoutDashboard },
    { to: '/teacher/attendance', label: 'Asistencia',      icon: ClipboardList   },
    { to: '/teacher/grades',     label: 'Calificaciones',  icon: Star            },
    { to: '/teacher/calendar',   label: 'Calendario',      icon: CalendarDays    },
    { to: '/teacher/students',   label: 'Mis estudiantes', icon: GraduationCap   },
  ],
  parent: [
    { to: '/parent/dashboard',     label: 'Inicio',          icon: LayoutDashboard },
    { to: '/parent/children',      label: 'Mis hijos',       icon: Heart           },
    { to: '/parent/attendance',    label: 'Asistencia',      icon: ClipboardList   },
    { to: '/parent/grades',        label: 'Calificaciones',  icon: Star            },
    { to: '/parent/calendar',      label: 'Calendario',      icon: CalendarDays    },
    { to: '/parent/notifications', label: 'Notificaciones',  icon: Bell            },
  ],
}

const ROLE_LABEL = {
  admin:   'Administrador',
  teacher: 'Docente',
  parent:  'Encargado',
}

const ROLE_SIDEBAR_SUB = {
  admin:   'Panel administrativo',
  teacher: 'Panel docente',
  parent:  'Panel de encargados',
}

const ROLE_LOGIN_ROUTE = {
  admin:   '/admin-login',
  teacher: '/login',
  parent:  '/login',
}

function initials(first, last) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase()
}

export default function AppShell() {
  const { session, logout } = useAuth()
  const navigate            = useNavigate()

  const role         = session?.role ?? 'admin'
  const navItems     = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.admin
  const currentPath  = window.location.pathname
  const topbarTitle  = navItems.find(item => item.to === currentPath)?.label
    ?? ROLE_SIDEBAR_SUB[role]

  async function handleLogout() {
    const loginRoute = ROLE_LOGIN_ROUTE[session?.role] ?? '/login'

    try {
      await logoutUser(session?.token)
    } catch {
      // logout siempre limpia la sesión local aunque falle el backend
    }
    logout()
    navigate(loginRoute, { replace: true })
  }

  return (
    <div className="app-shell">
      {/* ── Sidebar ───────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <p className="sidebar-logo-title">EduConecta CR</p>
          <p className="sidebar-logo-sub">{ROLE_SIDEBAR_SUB[role]}</p>
        </div>

        <nav className="sidebar-nav">
          <p className="sidebar-section-label">Menú</p>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `sidebar-item${isActive ? ' active' : ''}`
              }
            >
              <Icon size={20} strokeWidth={1.5} color="currentColor" />
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
              <p className="sidebar-user-role">{ROLE_LABEL[role]}</p>
            </div>
          </div>
          <button className="sidebar-item" onClick={handleLogout}>
            <LogOut size={20} strokeWidth={1.5} color="currentColor" />
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
