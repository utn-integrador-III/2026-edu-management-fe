import { useAuth } from '../../context/AuthContext'
import { LayoutDashboard } from 'lucide-react'

export default function AdminDashboard() {
  const { session } = useAuth()

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 className="text-h1" style={{ color: 'var(--neutral-900)', marginBottom: '4px' }}>
          Bienvenido, {session?.first_name}
        </h1>
        <p className="text-sm">
          Panel de administración — EduConecta CR
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          placeItems: 'center',
          minHeight: '320px',
          background: '#fff',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          gap: '12px',
          flexDirection: 'column',
          color: 'var(--neutral-300)',
        }}
      >
        <LayoutDashboard size={48} strokeWidth={1} />
        <p className="text-h3" style={{ color: 'var(--neutral-400)' }}>
          Dashboard en construcción
        </p>
        <p className="text-sm">
          Las métricas y resúmenes aparecerán aquí en el próximo release.
        </p>
      </div>
    </div>
  )
}