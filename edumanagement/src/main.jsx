import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import './index.css'

// Páginas
import AdminLogin       from './pages/AdminLogin'
import UserLogin        from './pages/UserLogin'
import ChangePassword   from './pages/ChangePassword'
import ResetPassword    from './pages/ResetPassword'
import AdminDashboard   from './pages/admin/AdminDashboard'
import AdminUsers       from './pages/admin/AdminUsers'
import AdminStudents    from './pages/admin/AdminStudents'
import AdminGroups      from './pages/admin/AdminGroups'
import AdminImport      from './pages/admin/AdminImport'
import TeacherDashboard  from './pages/teacher/TeacherDashboard'
import TeacherStudents   from './pages/teacher/TeacherStudents'
import TeacherAttendance from './pages/teacher/TeacherAttendance'
import ParentDashboard   from './pages/parent/ParentDashboard'
import ParentChildren   from './pages/parent/ParentChildren'
import AppShell         from './components/AppShell'

const ROLE_DASHBOARD = {
  admin:   '/admin/dashboard',
  teacher: '/teacher/dashboard',
  parent:  '/parent/dashboard',
}

const ROLE_LOGIN = {
  admin:   '/admin-login',
  teacher: '/login',
  parent:  '/login',
}

// ── Guard de ruta protegida ────────────────────────────────────
function RequireAuth({ role }) {
  const { session } = useAuth()

  if (!session) {
    return <Navigate to={role === 'admin' ? '/admin-login' : '/login'} replace />
  }
  if (role && session.role !== role) {
    return <Navigate to={ROLE_LOGIN[session.role] ?? '/login'} replace />
  }
  if (session.mustChangePassword) {
    return <Navigate to="/change-password" replace />
  }

  return <Outlet />
}

// ── Si ya está autenticado, redirigir fuera del login ──────────
function RedirectIfAuth({ allowedRoles }) {
  const { session } = useAuth()
  if (session && allowedRoles.includes(session.role)) {
    if (session.mustChangePassword) {
      return <Navigate to="/change-password" replace />
    }
    return <Navigate to={ROLE_DASHBOARD[session.role]} replace />
  }
  return <Outlet />
}

// ── Árbol de rutas ─────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* Raíz → login de docentes/encargados */}
      <Route index element={<Navigate to="/login" replace />} />

      {/* Login docentes y encargados */}
      <Route element={<RedirectIfAuth allowedRoles={['teacher', 'parent']} />}>
        <Route path="/login" element={<UserLogin />} />
      </Route>

      {/* Login admin */}
      <Route element={<RedirectIfAuth allowedRoles={['admin']} />}>
        <Route path="/admin-login" element={<AdminLogin />} />
      </Route>

      {/* RF-02: Cambio obligatorio de contraseña */}
      <Route path="/change-password" element={<ChangePassword />} />

      {/* RF-03: Restablecer contraseña via token (llega por link del correo) */}
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Panel admin — requiere rol admin */}
      <Route element={<RequireAuth role="admin" />}>
        <Route element={<AppShell />}>
          <Route path="/admin/dashboard"  element={<AdminDashboard />} />
          <Route path="/admin/users"      element={<AdminUsers />} />
          <Route path="/admin/students"   element={<AdminStudents />} />
          <Route path="/admin/groups"     element={<AdminGroups />} />
          <Route path="/admin/attendance" element={<PlaceholderPage title="Asistencia" />} />
          <Route path="/admin/grades"     element={<PlaceholderPage title="Calificaciones" />} />
          <Route path="/admin/calendar"   element={<PlaceholderPage title="Calendario" />} />
          <Route path="/admin/import"     element={<AdminImport />} />
        </Route>
      </Route>

      {/* Panel docente — requiere rol teacher */}
      <Route element={<RequireAuth role="teacher" />}>
        <Route element={<AppShell />}>
          <Route path="/teacher/dashboard"  element={<TeacherDashboard />} />
          <Route path="/teacher/attendance" element={<TeacherAttendance />} />
          <Route path="/teacher/grades"     element={<PlaceholderPage title="Calificaciones" />} />
          <Route path="/teacher/calendar"   element={<PlaceholderPage title="Calendario" />} />
          <Route path="/teacher/students"   element={<TeacherStudents />} />
        </Route>
      </Route>

      {/* Panel encargado — requiere rol parent */}
      <Route element={<RequireAuth role="parent" />}>
        <Route element={<AppShell />}>
          <Route path="/parent/dashboard"     element={<ParentDashboard />} />
          <Route path="/parent/children"      element={<ParentChildren />} />
          <Route path="/parent/attendance"    element={<PlaceholderPage title="Asistencia" />} />
          <Route path="/parent/grades"        element={<PlaceholderPage title="Calificaciones" />} />
          <Route path="/parent/calendar"      element={<PlaceholderPage title="Calendario" />} />
          <Route path="/parent/notifications" element={<PlaceholderPage title="Notificaciones" />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

function PlaceholderPage({ title }) {
  return (
    <div>
      <h1 className="text-h1" style={{ marginBottom: '24px', color: 'var(--neutral-900)' }}>
        {title}
      </h1>
      <div
        style={{
          display: 'grid',
          placeItems: 'center',
          minHeight: '280px',
          background: '#fff',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          color: 'var(--neutral-400)',
        }}
      >
        <p className="text-h3" style={{ color: 'var(--neutral-400)' }}>
          Módulo en desarrollo
        </p>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
