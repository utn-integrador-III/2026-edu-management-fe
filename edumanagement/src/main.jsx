import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import './index.css'

// Páginas
import AdminLogin     from './pages/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AppShell       from './components/AppShell'

// ── Guard de ruta protegida ────────────────────────────────────
function RequireAuth({ role }) {
  const { session } = useAuth()

  if (!session) {
    return <Navigate to="/admin-login" replace />
  }
  if (role && session.role !== role) {
    return <Navigate to="/admin-login" replace />
  }
  if (session.mustChangePassword) {
    return <Navigate to="/change-password" replace />
  }

  return <Outlet />
}

// ── Si ya está autenticado, redirigir fuera del login ──────────
function RedirectIfAuth({ to = '/admin/dashboard' }) {
  const { session } = useAuth()
  if (session && session.role === 'admin') {
    return <Navigate to={to} replace />
  }
  return <Outlet />
}

// ── Árbol de rutas ─────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* Raíz → login admin */}
      <Route index element={<Navigate to="/admin-login" replace />} />

      {/* Login admin — si ya autenticado redirige al dashboard */}
      <Route element={<RedirectIfAuth to="/admin/dashboard" />}>
        <Route path="/admin-login" element={<AdminLogin />} />
      </Route>

      {/* Panel admin — requiere rol admin */}
      <Route element={<RequireAuth role="admin" />}>
        <Route element={<AppShell />}>
          <Route path="/admin/dashboard"  element={<AdminDashboard />} />
          {/* Rutas futuras — agregar componentes a medida que se desarrollen */}
          <Route path="/admin/users"      element={<PlaceholderPage title="Usuarios" />} />
          <Route path="/admin/students"   element={<PlaceholderPage title="Estudiantes" />} />
          <Route path="/admin/groups"     element={<PlaceholderPage title="Grupos y materias" />} />
          <Route path="/admin/attendance" element={<PlaceholderPage title="Asistencia" />} />
          <Route path="/admin/grades"     element={<PlaceholderPage title="Calificaciones" />} />
          <Route path="/admin/calendar"   element={<PlaceholderPage title="Calendario" />} />
          <Route path="/admin/import"     element={<PlaceholderPage title="Importar CSV" />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/admin-login" replace />} />
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