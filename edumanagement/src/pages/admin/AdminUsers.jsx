import { useState, useEffect, useCallback } from 'react'
import {
  Users, Search, UserPlus, Link, Eye, Edit, Trash2, X,
  Check, AlertTriangle, Shield, User, Heart, GraduationCap,
  Calendar, Phone, Mail, BookOpen
} from 'lucide-react'
import {
  getUsers, searchUsers, createUser, updateUser,
  deactivateUser, linkParentStudent, getParentChildren,
  listGroups, getStudentSubjects
} from '../../api/edu'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all') // all, admin, teacher, parent, student
  const [statusFilter, setStatusFilter] = useState('all') // all, active, inactive

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [userDetailDrawer, setUserDetailDrawer] = useState(null)

  // Estados de carga del drawer
  const [drawerRelations, setDrawerRelations] = useState([])
  const [drawerSubjects, setDrawerSubjects] = useState([])
  const [drawerLoading, setDrawerLoading] = useState(false)

  // Formularios
  const [createForm, setCreateForm] = useState({
    id_number: '',
    first_name: '',
    last_name: '',
    role: 'student',
    email: '',
    phone: '',
    type: '',
    group_id: '',
    birth_date: '',
    parent_id: ''
  })
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    role: 'student',
    email: '',
    phone: '',
    type: '',
    group_id: '',
    active: true
  })
  const [linkForm, setLinkForm] = useState({
    parent_id: '',
    student_id: ''
  })

  // Feedback de modales
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Cargar datos
  const loadUsers = useCallback(async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      let data = []
      if (searchQuery.trim()) {
        data = await searchUsers(searchQuery)
      } else {
        const filters = {}
        if (roleFilter !== 'all') filters.role = roleFilter
        if (statusFilter !== 'all') filters.active = statusFilter
        data = await getUsers(filters)
      }
      setUsers(data)
    } catch (err) {
      setErrorMsg(err.message || 'Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, roleFilter, statusFilter])

  const loadGroups = useCallback(async () => {
    try {
      const data = await listGroups()
      setGroups(data)
    } catch (err) {
      console.error('Error al cargar grupos', err)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  useEffect(() => {
    loadGroups()
  }, [loadGroups])

  // Manejar el Drawer de detalle
  const openDetailDrawer = async (user) => {
    setUserDetailDrawer(user)
    setDrawerLoading(true)
    setDrawerRelations([])
    setDrawerSubjects([])
    try {
      if (user.role === 'parent') {
        const children = await getParentChildren(user.id)
        setDrawerRelations(children)
      } else if (user.role === 'student') {
        // Cargar materias
        const subjects = await getStudentSubjects(user.id)
        setDrawerSubjects(subjects)
        // Intentar buscar el encargado de este estudiante
        const allParents = await getUsers({ role: 'parent' })
        const parentList = allParents.filter(p => p.id_number === user.parent_cedula)
        setDrawerRelations(parentList)
      }
    } catch (err) {
      console.error('Error al cargar relaciones en detalle', err)
    } finally {
      setDrawerLoading(false)
    }
  }

  // Enviar formulario de creación
  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!createForm.id_number.trim() || !createForm.first_name.trim() || !createForm.last_name.trim()) {
      setErrorMsg('Por favor complete los campos obligatorios de identificación y nombre.')
      return
    }

    if (createForm.role === 'student' && !createForm.parent_id.trim()) {
      setErrorMsg('Los estudiantes requieren un encargado (Cédula o ID del Padre).')
      return
    }

    try {
      await createUser({
        id_number: createForm.id_number.trim(),
        first_name: createForm.first_name.trim(),
        last_name: createForm.last_name.trim(),
        role: createForm.role,
        email: createForm.email.trim() || undefined,
        phone: createForm.phone.trim() || undefined,
        type: createForm.role === 'teacher' ? createForm.type.trim() || undefined : undefined,
        group_id: createForm.group_id || undefined,
        birth_date: createForm.birth_date || undefined,
        parent_id: createForm.role === 'student' ? createForm.parent_id.trim() : undefined
      })
      setSuccessMsg('Usuario creado exitosamente.')
      setCreateForm({
        id_number: '',
        first_name: '',
        last_name: '',
        role: 'student',
        email: '',
        phone: '',
        type: '',
        group_id: '',
        birth_date: '',
        parent_id: ''
      })
      setTimeout(() => {
        setShowCreateModal(false)
        loadUsers()
      }, 1000)
    } catch (err) {
      setErrorMsg(err.message || 'Error al crear el usuario')
    }
  }

  // Abrir modal de edición
  const openEditModal = (user) => {
    setSelectedUser(user)
    setEditForm({
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      email: user.email || '',
      phone: user.phone || '',
      type: user.type || '',
      group_id: user.group_id || '',
      active: user.active !== undefined ? user.active : true
    })
    setErrorMsg('')
    setSuccessMsg('')
    setShowEditModal(true)
  }

  // Enviar formulario de edición
  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!editForm.first_name.trim() || !editForm.last_name.trim()) {
      setErrorMsg('Nombre y apellido son obligatorios.')
      return
    }

    try {
      await updateUser(selectedUser.id, {
        first_name: editForm.first_name.trim(),
        last_name: editForm.last_name.trim(),
        role: editForm.role,
        active: editForm.active,
        email: editForm.email.trim() || undefined,
        phone: editForm.phone.trim() || undefined,
        type: editForm.role === 'teacher' ? editForm.type.trim() || undefined : undefined,
        group_id: editForm.group_id || undefined
      })
      setSuccessMsg('Usuario actualizado con éxito.')
      setTimeout(() => {
        setShowEditModal(false)
        loadUsers()
      }, 1000)
    } catch (err) {
      setErrorMsg(err.message || 'Error al actualizar el usuario')
    }
  }

  // Desactivación lógica de usuario
  const handleDeactivate = async (userId) => {
    if (!window.confirm('¿Está seguro de que desea desactivar a este usuario?')) return
    try {
      await deactivateUser(userId)
      loadUsers()
    } catch (err) {
      alert(err.message || 'Error al desactivar usuario')
    }
  }

  // Vincular Padre-Estudiante manual
  const handleLinkSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!linkForm.parent_id.trim() || !linkForm.student_id.trim()) {
      setErrorMsg('Debe ingresar los números de cédula o ID del encargado y del estudiante.')
      return
    }

    try {
      await linkParentStudent(linkForm.parent_id.trim(), linkForm.student_id.trim())
      setSuccessMsg('Cuentas vinculadas exitosamente.')
      setLinkForm({ parent_id: '', student_id: '' })
      setTimeout(() => {
        setShowLinkModal(false)
      }, 1000)
    } catch (err) {
      setErrorMsg(err.message || 'Error al crear la relación')
    }
  }

  return (
    <div>
      {/* Cabecera de Página */}
      <div className="actions-bar">
        <div>
          <h1 className="text-h1" style={{ color: 'var(--neutral-900)' }}>Usuarios</h1>
          <p className="text-sm">Gestione usuarios registrados, roles y vinculaciones familiares.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary btn-md" onClick={() => setShowLinkModal(true)}>
            <Link size={20} strokeWidth={1.5} />
            Vincular Encargado
          </button>
          <button className="btn btn-primary btn-md" onClick={() => setShowCreateModal(true)}>
            <UserPlus size={20} strokeWidth={1.5} />
            Crear Usuario
          </button>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div className="search-bar">
          <Search size={20} strokeWidth={1.5} className="search-icon" />
          <input
            type="text"
            className="field-input search-input"
            placeholder="Buscar por cédula o nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <div>
            <label className="text-caption" style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>Rol</label>
            <select
              className="field-input"
              style={{ padding: '6px 12px', minWidth: '150px' }}
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setSearchQuery(''); }}
            >
              <option value="all">Todos los roles</option>
              <option value="admin">Administrador</option>
              <option value="teacher">Docente</option>
              <option value="parent">Encargado</option>
              <option value="student">Estudiante</option>
            </select>
          </div>

          <div>
            <label className="text-caption" style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>Estado</label>
            <select
              className="field-input"
              style={{ padding: '6px 12px', minWidth: '120px' }}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setSearchQuery(''); }}
            >
              <option value="all">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Listado / Tabla */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p className="text-h3" style={{ color: 'var(--neutral-400)' }}>Cargando usuarios...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p className="text-h3" style={{ color: 'var(--neutral-400)' }}>No se encontraron usuarios</p>
        </div>
      ) : (
        <div className="table-container">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Cédula</th>
                  <th>Nombre Completo</th>
                  <th>Rol</th>
                  <th>Correo</th>
                  <th>Teléfono</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="text-mono" style={{ fontWeight: 600 }}>{u.id_number}</td>
                    <td>{u.first_name} {u.last_name}</td>
                    <td>
                      <span className={`badge ${
                        u.role === 'admin' ? 'badge-blue' :
                        u.role === 'teacher' ? 'badge-amber' :
                        u.role === 'parent' ? 'badge-green' : 'badge-gray'
                      }`}>
                        {u.role === 'admin' && <Shield size={16} strokeWidth={1.5} />}
                        {u.role === 'teacher' && <BookOpen size={16} strokeWidth={1.5} />}
                        {u.role === 'parent' && <Heart size={16} strokeWidth={1.5} />}
                        {u.role === 'student' && <GraduationCap size={16} strokeWidth={1.5} />}
                        {u.role === 'admin' ? 'Administrador' :
                         u.role === 'teacher' ? `Docente${u.type ? ` (${u.type})` : ''}` :
                         u.role === 'parent' ? 'Encargado' : 'Estudiante'}
                      </span>
                    </td>
                    <td>{u.email || <span style={{ color: 'var(--neutral-300)' }}>—</span>}</td>
                    <td>{u.phone || <span style={{ color: 'var(--neutral-300)' }}>—</span>}</td>
                    <td>
                      <span className={`badge ${u.active ? 'badge-green' : 'badge-red'}`}>
                        {u.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '4px' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '6px' }}
                          title="Ver detalle"
                          onClick={() => openDetailDrawer(u)}
                        >
                          <Eye size={20} strokeWidth={1.5} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '6px', color: 'var(--blue-500)' }}
                          title="Editar"
                          onClick={() => openEditModal(u)}
                        >
                          <Edit size={20} strokeWidth={1.5} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '6px', color: 'var(--color-danger)' }}
                          title="Desactivar"
                          onClick={() => handleDeactivate(u.id)}
                          disabled={!u.active}
                        >
                          <Trash2 size={20} strokeWidth={1.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL CREAR USUARIO */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}>
          <div className="modal-card" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <p className="login-card-title">Crear Nuevo Usuario</p>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}><X size={18} /></button>
            </div>
            
            <form onSubmit={handleCreateSubmit} style={{ marginTop: '16px' }}>
              {errorMsg && (
                <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                  <AlertTriangle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="alert alert-success" style={{ marginBottom: '16px' }}>
                  <Check size={16} />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="form-grid">
                <div className="field-group">
                  <label className="field-label">Cédula / Identificación *</label>
                  <input
                    type="text"
                    className="field-input"
                    placeholder="Ej: 201230456"
                    value={createForm.id_number}
                    onChange={(e) => setCreateForm({...createForm, id_number: e.target.value})}
                    required
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">Rol del Usuario *</label>
                  <select
                    className="field-input"
                    value={createForm.role}
                    onChange={(e) => setCreateForm({...createForm, role: e.target.value, group_id: '', type: '', parent_id: ''})}
                  >
                    <option value="student">Estudiante</option>
                    <option value="teacher">Docente</option>
                    <option value="parent">Encargado</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>

              <div className="form-grid">
                <div className="field-group">
                  <label className="field-label">Nombre *</label>
                  <input
                    type="text"
                    className="field-input"
                    placeholder="Nombre"
                    value={createForm.first_name}
                    onChange={(e) => setCreateForm({...createForm, first_name: e.target.value})}
                    required
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">Apellidos *</label>
                  <input
                    type="text"
                    className="field-input"
                    placeholder="Apellidos"
                    value={createForm.last_name}
                    onChange={(e) => setCreateForm({...createForm, last_name: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="field-group">
                  <label className="field-label">Correo Electrónico</label>
                  <input
                    type="email"
                    className="field-input"
                    placeholder="correo@ejemplo.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">Teléfono</label>
                  <input
                    type="text"
                    className="field-input"
                    placeholder="Ej: 8888-8888"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({...createForm, phone: e.target.value})}
                  />
                </div>
              </div>

              {/* Campos condicionales por rol */}
              {createForm.role === 'teacher' && (
                <div className="field-group" style={{ marginBottom: '16px' }}>
                  <label className="field-label">Tipo de Docente (Ej: I, II, Especialidad)</label>
                  <input
                    type="text"
                    className="field-input"
                    placeholder="Ej: II"
                    value={createForm.type}
                    onChange={(e) => setCreateForm({...createForm, type: e.target.value})}
                  />
                </div>
              )}

              {createForm.role === 'student' && (
                <div className="form-grid">
                  <div className="field-group">
                    <label className="field-label">Sección / Grupo</label>
                    <select
                      className="field-input"
                      value={createForm.group_id}
                      onChange={(e) => setCreateForm({...createForm, group_id: e.target.value})}
                    >
                      <option value="">Seleccione un grupo</option>
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name} ({g.level})</option>
                      ))}
                    </select>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Fecha de Nacimiento</label>
                    <input
                      type="date"
                      className="field-input"
                      value={createForm.birth_date}
                      onChange={(e) => setCreateForm({...createForm, birth_date: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {createForm.role === 'student' && (
                <div className="field-group" style={{ marginBottom: '20px' }}>
                  <label className="field-label">Cédula del Encargado (Requerido) *</label>
                  <input
                    type="text"
                    className="field-input"
                    placeholder="Ingrese cédula o ID del Padre/Encargado"
                    value={createForm.parent_id}
                    onChange={(e) => setCreateForm({...createForm, parent_id: e.target.value})}
                    required
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary btn-block" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary btn-block">
                  Guardar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR USUARIO */}
      {showEditModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowEditModal(false)}>
          <div className="modal-card" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <p className="login-card-title">Editar Usuario</p>
              <button className="modal-close-btn" onClick={() => setShowEditModal(false)}><X size={18} /></button>
            </div>
            
            <form onSubmit={handleEditSubmit} style={{ marginTop: '16px' }}>
              {errorMsg && (
                <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                  <AlertTriangle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="alert alert-success" style={{ marginBottom: '16px' }}>
                  <Check size={16} />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="form-grid">
                <div className="field-group">
                  <label className="field-label">Nombre</label>
                  <input
                    type="text"
                    className="field-input"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                    required
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">Apellidos</label>
                  <input
                    type="text"
                    className="field-input"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="field-group">
                  <label className="field-label">Correo Electrónico</label>
                  <input
                    type="email"
                    className="field-input"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">Teléfono</label>
                  <input
                    type="text"
                    className="field-input"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  />
                </div>
              </div>

              {editForm.role === 'teacher' && (
                <div className="field-group" style={{ marginBottom: '16px' }}>
                  <label className="field-label">Tipo de Docente</label>
                  <input
                    type="text"
                    className="field-input"
                    value={editForm.type}
                    onChange={(e) => setEditForm({...editForm, type: e.target.value})}
                  />
                </div>
              )}

              {editForm.role === 'student' && (
                <div className="field-group" style={{ marginBottom: '16px' }}>
                  <label className="field-label">Sección / Grupo</label>
                  <select
                    className="field-input"
                    value={editForm.group_id}
                    onChange={(e) => setEditForm({...editForm, group_id: e.target.value})}
                  >
                    <option value="">Seleccione un grupo</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name} ({g.level})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="field-group" style={{ marginBottom: '20px', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="edit-active"
                  style={{ width: '16px', height: '16px' }}
                  checked={editForm.active}
                  onChange={(e) => setEditForm({...editForm, active: e.target.checked})}
                />
                <label htmlFor="edit-active" style={{ fontWeight: 500, cursor: 'pointer' }}>Usuario Activo</label>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary btn-block" onClick={() => setShowEditModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary btn-block">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VINCULAR PADRE-ESTUDIANTE */}
      {showLinkModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowLinkModal(false)}>
          <div className="modal-card">
            <div className="modal-header">
              <p className="login-card-title">Vincular Familiar</p>
              <button className="modal-close-btn" onClick={() => setShowLinkModal(false)}><X size={18} /></button>
            </div>
            
            <form onSubmit={handleLinkSubmit} style={{ marginTop: '16px' }}>
              <p className="text-sm" style={{ marginBottom: '16px', color: 'var(--neutral-500)' }}>
                Asocie una cuenta de encargado (Padre/Madre) a un estudiante para permitir la consulta de su progreso.
              </p>

              {errorMsg && (
                <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                  <AlertTriangle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="alert alert-success" style={{ marginBottom: '16px' }}>
                  <Check size={16} />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="field-group" style={{ marginBottom: '16px' }}>
                <label className="field-label">Cédula del Encargado</label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="Ej: 104950345"
                  value={linkForm.parent_id}
                  onChange={(e) => setLinkForm({...linkForm, parent_id: e.target.value})}
                  required
                />
              </div>

              <div className="field-group" style={{ marginBottom: '20px' }}>
                <label className="field-label">Cédula del Estudiante</label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="Ej: 201980765"
                  value={linkForm.student_id}
                  onChange={(e) => setLinkForm({...linkForm, student_id: e.target.value})}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn btn-secondary btn-block" onClick={() => setShowLinkModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary btn-block">
                  Crear Vínculo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRAWER DETALLES DE USUARIO (SIDEBAR LATERAL) */}
      {userDetailDrawer && (
        <div className="drawer-overlay" onClick={(e) => e.target === e.currentTarget && setUserDetailDrawer(null)}>
          <div className="drawer-content">
            <div style={{ display: 'flex', justifySelf: 'flex-start', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 className="text-h2" style={{ color: 'var(--neutral-900)' }}>Ficha de Información</h2>
              <button className="modal-close-btn" onClick={() => setUserDetailDrawer(null)}><X size={20} /></button>
            </div>

            {/* Ficha Principal */}
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--blue-50)',
                  color: 'var(--blue-500)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px'
                }}
              >
                {userDetailDrawer.role === 'admin' && <Shield size={32} />}
                {userDetailDrawer.role === 'teacher' && <BookOpen size={32} />}
                {userDetailDrawer.role === 'parent' && <Heart size={32} />}
                {userDetailDrawer.role === 'student' && <GraduationCap size={32} />}
              </div>
              <h3 className="text-h2" style={{ color: 'var(--neutral-900)' }}>
                {userDetailDrawer.first_name} {userDetailDrawer.last_name}
              </h3>
              <p className="text-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, color: 'var(--blue-500)', marginTop: '4px' }}>
                {userDetailDrawer.role === 'admin' ? 'Administrador' :
                 userDetailDrawer.role === 'teacher' ? 'Docente' :
                 userDetailDrawer.role === 'parent' ? 'Encargado' : 'Estudiante'}
              </p>
            </div>

            {/* Datos Personales */}
            <div style={{ borderTop: '1px solid var(--neutral-100)', paddingTop: '20px', marginBottom: '28px' }}>
              <h4 className="text-caption" style={{ fontWeight: 700, marginBottom: '12px', color: 'var(--neutral-400)' }}>Datos del Perfil</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={16} color="var(--neutral-400)" />
                  <span className="text-body">Cédula: <strong>{userDetailDrawer.id_number}</strong></span>
                </div>
                {userDetailDrawer.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={16} color="var(--neutral-400)" />
                    <span className="text-body">{userDetailDrawer.email}</span>
                  </div>
                )}
                {userDetailDrawer.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone size={16} color="var(--neutral-400)" />
                    <span className="text-body">{userDetailDrawer.phone}</span>
                  </div>
                )}
                {userDetailDrawer.birth_date && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={16} color="var(--neutral-400)" />
                    <span className="text-body">Nacimiento: {userDetailDrawer.birth_date}</span>
                  </div>
                )}
                {userDetailDrawer.role === 'teacher' && userDetailDrawer.type && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen size={16} color="var(--neutral-400)" />
                    <span className="text-body">Tipo de Docente: <strong>{userDetailDrawer.type}</strong></span>
                  </div>
                )}
                {userDetailDrawer.role === 'student' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <GraduationCap size={16} color="var(--neutral-400)" />
                    <span className="text-body">
                      Grupo: <strong>{
                        groups.find(g => g.id === userDetailDrawer.group_id)?.name || 'Sin asignar'
                      }</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Relaciones o Materias del Drawer */}
            <div style={{ borderTop: '1px solid var(--neutral-100)', paddingTop: '20px' }}>
              {userDetailDrawer.role === 'parent' && (
                <>
                  <h4 className="text-caption" style={{ fontWeight: 700, marginBottom: '12px', color: 'var(--neutral-400)' }}>Estudiantes a cargo</h4>
                  {drawerLoading ? (
                    <p className="text-sm">Buscando estudiantes...</p>
                  ) : drawerRelations.length === 0 ? (
                    <p className="text-sm" style={{ color: 'var(--neutral-400)' }}>Ninguno estudiante vinculado a este encargado.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {drawerRelations.map(child => (
                        <div
                          key={child.id}
                          style={{
                            padding: '10px 12px',
                            background: 'var(--neutral-50)',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div>
                            <p style={{ fontWeight: 500 }}>{child.first_name} {child.last_name}</p>
                            <p className="text-caption">Cédula: {child.id_number}</p>
                          </div>
                          <span className="badge badge-blue">{child.group_name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {userDetailDrawer.role === 'student' && (
                <>
                  <h4 className="text-caption" style={{ fontWeight: 700, marginBottom: '12px', color: 'var(--neutral-400)' }}>Encargado legal</h4>
                  {drawerLoading ? (
                    <p className="text-sm">Buscando encargado...</p>
                  ) : drawerRelations.length === 0 ? (
                    <p className="text-sm" style={{ color: 'var(--neutral-400)' }}>No se encontró encargado vinculado.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                      {drawerRelations.map(p => (
                        <div
                          key={p.id}
                          style={{
                            padding: '10px 12px',
                            background: 'var(--neutral-50)',
                            borderRadius: 'var(--radius-md)'
                          }}
                        >
                          <p style={{ fontWeight: 500 }}>{p.first_name} {p.last_name}</p>
                          <p className="text-caption">Cédula: {p.id_number} | Tel: {p.phone || 'S/T'}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <h4 className="text-caption" style={{ fontWeight: 700, marginBottom: '12px', color: 'var(--neutral-400)' }}>Materias cursando (Periodo 2026)</h4>
                  {drawerLoading ? (
                    <p className="text-sm">Cargando materias...</p>
                  ) : drawerSubjects.length === 0 ? (
                    <p className="text-sm" style={{ color: 'var(--neutral-400)' }}>No tiene materias asignadas.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {drawerSubjects.map(sub => (
                        <div
                          key={sub.id}
                          style={{
                            padding: '10px 12px',
                            background: 'var(--neutral-50)',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div>
                            <p style={{ fontWeight: 500 }}>{sub.name} ({sub.code})</p>
                            <p className="text-caption">Docente: {sub.teacher_name}</p>
                          </div>
                          <span className="badge badge-gray">{sub.group_name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
