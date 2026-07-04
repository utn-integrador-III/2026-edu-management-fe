# EduManagement — Frontend

Aplicación web construida con **React + Vite** y **Vanilla CSS** para la gestión escolar de instituciones educativas costarricenses. Conecta docentes, encargados (padres) y administración en un solo sistema integrado.

---

## Stack Tecnológico

- **Core**: React 19, React Router DOM 7, Vite 6
- **Estilos**: Vanilla CSS (Guía de estilos y sistema de tokens adaptado en [index.css](file:///c:/front/2026-edu-management-fe/2026-edu-management-fe/edumanagement/src/index.css))
- **Iconografía**: Lucide React (escala reglamentaria: 16px en insignias/detalles, 20px en botones/nav base, 24px/32px en destacados; `strokeWidth={1.5}`)

---

## Requisitos Previos

- Node.js 18+
- npm 9+

---

## Instalación y Arranque

1. **Instalar dependencias**:
   ```bash
   npm install
   ```
2. **Ejecutar en desarrollo**:
   ```bash
   npm run dev
   ```
   La aplicación quedará disponible en `http://localhost:5173`.

---

## Variables de Entorno y Proxy de Red

No se requiere archivo `.env` en desarrollo. El proxy de Vite enruta automáticamente las llamadas `/api/*` al backend configurado en `vite.config.js`.

Para apuntar a un backend alternativo (ej: Render en producción), edita el campo `target` en `vite.config.js`:
```js
proxy: {
  '/api': {
    target: 'https://two026-edu-management-api.onrender.com',
    changeOrigin: true,
    secure: false,
  }
}
```

---

## Estructura del Proyecto (Release 1)

```text
src/
├── api/
│   ├── auth.js              # Llamadas HTTP de autenticación (Login, recovery)
│   └── edu.js               # Llamadas HTTP escolares (CRUD, asignación, importaciones)
├── components/
│   └── AppShell.jsx         # Layout del panel (Sidebar + Topbar + Outlet)
├── context/
│   └── AuthContext.jsx      # Estado global de sesión con persistencia en localStorage
├── pages/
│   ├── AdminLogin.jsx        # Login split-screen exclusivo de administración
│   ├── UserLogin.jsx         # Login split-screen para docentes y encargados
│   ├── ChangePassword.jsx    # Portal de cambio de contraseña con auto-relogin integrado
│   ├── ResetPassword.jsx     # Restablecimiento por token de correo
│   ├── admin/
│   │   ├── AdminDashboard.jsx # Panel administrativo con conteo en vivo de base de datos
│   │   ├── AdminUsers.jsx     # CRUD de usuarios y vinculación manual encargado-alumno
│   │   ├── AdminStudents.jsx  # Expediente académico y asignación de materias
│   │   ├── AdminGroups.jsx    # Estructura del centro (secciones) y catálogo de asignaturas
│   │   └── AdminImport.jsx    # Carga de CSV con Reporte de Consistencia en tiempo real
│   ├── teacher/
│   │   └── TeacherStudents.jsx # Panel docente: secciones a cargo y expedientes
│   └── parent/
│       └── ParentChildren.jsx  # Panel encargado: consulta académica y materias de hijos
└── main.jsx                 # Árbol de rutas y guards de seguridad
```

---

## Mapa de Rutas y Control de Accesos

| Ruta | Componente | Acceso | Propósito |
| :--- | :--- | :--- | :--- |
| `/login` | `UserLogin` | Público | Portal de docentes y encargados (split-screen layout) |
| `/admin-login` | `AdminLogin` | Público | Portal exclusivo de administración (split-screen layout) |
| `/change-password` | `ChangePassword` | Sesión activa (`mustChangePassword: true`) | Cambio obligatorio de contraseña temporal |
| `/reset-password?token=xxx` | `ResetPassword` | Público | Recuperación de credenciales (link de correo) |
| `/admin/dashboard` | `AdminDashboard` | Rol `admin` | Indicadores y carga de matrícula |
| `/admin/users` | `AdminUsers` | Rol `admin` | CRUD de usuarios, filtros y detalles |
| `/admin/students` | `AdminStudents` | Rol `admin` | Carga académica y retiro de materias |
| `/admin/groups` | `AdminGroups` | Rol `admin` | Secciones y catálogo curricular |
| `/admin/import` | `AdminImport` | Rol `admin` | Importación y reporte de consistencia CSV |
| `/teacher/students` | `TeacherStudents` | Rol `teacher` | Expedientes de alumnos asignados |
| `/parent/children` | `ParentChildren` | Rol `parent` | Plan curricular y docentes de hijos |

---

## Estructura de Sesión (`localStorage`)

La sesión se almacena en `localStorage` bajo la clave `educonecta_session` con el siguiente esquema JSON:

```json
{
  "token": "eyJ...",
  "role": "admin | teacher | parent",
  "first_name": "Nombre",
  "last_name": "Apellidos",
  "mustChangePassword": false,
  "id_number": "102340567"
}
```

*Nota: La propiedad `id_number` se almacena localmente para posibilitar el mecanismo de re-autenticación automática en segundo plano tras un cambio de contraseña temporal exitoso.*

---

## Funciones de la API (`src/api/edu.js`)

| Función | Método | Endpoint | Descripción |
| :--- | :--- | :--- | :--- |
| `getUsers(filters)` | GET | `/api/v1/users/` | Lista usuarios y admite filtros de rol y actividad |
| `createUser(data)` | POST | `/api/v1/users/` | Crea nuevo usuario (los alumnos requieren `parent_id` válido) |
| `updateUser(id, data)` | PUT | `/api/v1/users/{id}` | Modifica campos del perfil del usuario |
| `deactivateUser(id)` | DELETE | `/api/v1/users/{id}` | Desactivación lógica de una cuenta |
| `getParentChildren(id)` | GET | `/api/v1/users/parents/{id}/children` | Lista los estudiantes vinculados a un encargado |
| `getStudentSubjects(id)` | GET | `/api/v1/users/{id}/subjects` | Consulta materias cursadas por periodo |
| `assignSubjects(id, list)` | POST | `/api/v1/users/{id}/subjects` | Asigna un bloque de materias a un alumno |
| `removeSubject(stdId, subId)` | DELETE | `/api/v1/users/{stdId}/subjects/{subId}` | Retira una materia asignada |
| `listGroups()` | GET | `/api/v1/users/groups` | Lista las secciones escolares registradas |
| `createSubject(data)` | POST | `/api/v1/users/subjects` | Crea una asignatura curricular en el catálogo |
| `uploadUsersCsv(file)` | POST | `/api/v1/users/import/users` | Carga de CSV de usuarios con reporte de errores |
| `uploadStudentsCsv(file)` | POST | `/api/v1/users/import/students` | Carga de CSV de estudiantes vinculados |

---

## Requerimientos y Reglas de Negocio (Release 1)

### RF-01: Inicio de Sesión
- Diseño dividido plano: Panel de marca izquierdo con fondo azul `#0F2347` e identificador ámbar `#F59E0B`; panel de formulario derecho en blanco puro `#fff` con iconos internos (`User`/`Lock`) y banner informativo de primer ingreso.
- El rol `admin` tiene restringido el acceso mediante `/login` tradicional; solo puede autenticarse en `/admin-login`.

### RF-02: Cambio de Contraseña en Primer Ingreso
- Al iniciar sesión con credenciales temporales, se redirige forzadamente a `/change-password`.
- Una vez procesada y confirmada la contraseña nueva, el frontend realiza un inicio de sesión transparente en segundo plano para actualizar el token JWT local y descartar la claim `mustChangePassword: true`, previniendo errores de autorización `403 Forbidden` subsiguientes en el dashboard.

### RF-03: Reporte de Consistencia de Datos (CSV)
- Los archivos cargados deben utilizar formato separado por punto y coma (`;`).
- El panel de **Consistencia de Datos** evalúa y lista fila por fila cualquier error (cédulas repetidas, estructuras inválidas de correo/teléfono o estudiantes omitidos por no encontrar a su encargado registrado previamente).

### RF-04: Clasificación del Tipo de Docente
- Los docentes almacenan en la base de datos el campo `type` (Categoría o Ciclo MEP: `I`, `II`, `III`, `IV`, `Especialidad`). Esta clasificación se expone de forma directa al lado de su rol en la tabla de usuarios y en el expediente de detalles.

---

## Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo local con Hot Module Replacement (HMR).
- `npm run build`: Genera el empaquetado optimizado de producción en el directorio `/dist`.
- `npm run preview`: Previsualiza localmente el build de producción compilado.
- `npm run lint`: Ejecuta el análisis estático de código con Oxlint.