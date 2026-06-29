# EduManagement — Frontend

Aplicación web construida con **React + Vite** para la gestión escolar de instituciones educativas costarricenses.

---

## Stack

- React 19
- React Router DOM 7
- Vite 8
- Lucide React (íconos)

---

## Requisitos previos

- Node.js 18+
- npm 9+

---

## Instalación y arranque

```bash
npm install
npm run dev
```

La app queda disponible en `http://localhost:5173`.

---

## Variables de entorno

No se requiere archivo `.env` en desarrollo. El proxy de Vite enruta automáticamente las llamadas `/api/*` al backend configurado en `vite.config.js`.

Para cambiar el backend destino, editá esta línea en `vite.config.js`:

```js
target: 'https://two026-edu-management-api.onrender.com',
```

---

## Estructura del proyecto

```
src/
├── api/
│   └── auth.js              # Todas las llamadas HTTP de autenticación
├── components/
│   └── AppShell.jsx         # Layout principal: sidebar + topbar + outlet
├── context/
│   └── AuthContext.jsx      # Estado global de sesión (localStorage)
├── pages/
│   ├── AdminLogin.jsx        # Login exclusivo para administradores
│   ├── UserLogin.jsx         # Login para docentes y encargados
│   ├── ChangePassword.jsx    # Cambio obligatorio en primer ingreso
│   ├── ResetPassword.jsx     # Restablecimiento por link de correo
│   ├── admin/
│   │   └── AdminDashboard.jsx
│   ├── teacher/
│   │   └── TeacherDashboard.jsx
│   └── parent/
│       └── ParentDashboard.jsx
└── main.jsx                 # Árbol de rutas y guards de autenticación
```

---

## Rutas

| Ruta | Componente | Acceso |
|------|-----------|--------|
| `/login` | `UserLogin` | Público |
| `/admin-login` | `AdminLogin` | Público |
| `/change-password` | `ChangePassword` | Sesión activa con `mustChangePassword: true` |
| `/reset-password?token=xxx` | `ResetPassword` | Público (llega por link de correo) |
| `/admin/dashboard` | `AdminDashboard` | Rol `admin` |
| `/teacher/dashboard` | `TeacherDashboard` | Rol `teacher` |
| `/parent/dashboard` | `ParentDashboard` | Rol `parent` |

---

## Autenticación

La sesión se guarda en `localStorage` bajo la clave `educonecta_session` con esta forma:

```json
{
  "token": "eyJ...",
  "role": "admin | teacher | parent",
  "first_name": "Juan",
  "last_name": "Pérez",
  "mustChangePassword": false
}
```

El contexto `AuthContext` expone:

| Función | Descripción |
|---------|-------------|
| `session` | Objeto de sesión actual o `null` |
| `login(data)` | Guarda la sesión en estado y localStorage |
| `logout()` | Limpia estado y localStorage |
| `clearMustChange()` | Marca `mustChangePassword: false` tras el cambio |

---

## Módulo `src/api/auth.js`

Todas las llamadas al backend pasan por este archivo. Para alternar entre mock y backend real:

```js
const USE_MOCK = false  // true = datos de prueba locales, false = backend real
```

### Funciones disponibles

| Función | Método | Endpoint | Descripción |
|---------|--------|----------|-------------|
| `loginUser(id_number, password)` | POST | `/api/v1/auth/login` | RF-01 |
| `logoutUser(token)` | POST | `/api/v1/auth/logout` | RF-04 |
| `changePassword(token, currentPassword, newPassword)` | PUT | `/api/v1/auth/change-password` | RF-02 |
| `recoverPassword(id_number)` | POST | `/api/v1/auth/recover-password` | RF-03 |
| `resetPassword(token, newPassword)` | POST | `/api/v1/auth/reset-password` | RF-03 |

---

## Requerimientos funcionales implementados

### RF-01 — Inicio de sesión
- El usuario ingresa su cédula y contraseña
- El backend valida y devuelve un JWT con rol, nombre y flag `mustChangePassword`
- Se redirige al dashboard según el rol (`admin`, `teacher`, `parent`)
- Los administradores solo pueden ingresar por `/admin-login`

### RF-02 — Cambio obligatorio en primer ingreso
- Si `mustChangePassword: true` en la sesión, cualquier ruta protegida redirige a `/change-password`
- El usuario debe ingresar su contraseña actual y una nueva (mínimo 8 caracteres)
- Al completar, `mustChangePassword` se marca `false` y se redirige al dashboard

### RF-03 — Recuperación de contraseña
- Desde `/login`, el usuario abre el modal "¿Olvidó su contraseña?" e ingresa su cédula
- El backend busca el correo asociado y envía un link con token (válido 1 hora)
- El link apunta a `/reset-password?token=xxx`
- El usuario ingresa y confirma su nueva contraseña

### RF-04 — Cierre de sesión
- El botón "Cerrar sesión" en el sidebar llama al backend para invalidar el token (blacklist)
- Sin importar la respuesta del backend, la sesión local siempre se limpia

---

## Guards de ruta

Definidos en `main.jsx`:

- **`RequireAuth`** — redirige a login si no hay sesión activa o si el rol no coincide. Si `mustChangePassword: true`, redirige a `/change-password`.
- **`RedirectIfAuth`** — si el usuario ya tiene sesión válida, lo saca del login y lo manda directo a su dashboard.

---

## Roles

| Rol | Portal de ingreso | Dashboard |
|-----|------------------|-----------|
| `admin` | `/admin-login` | `/admin/dashboard` |
| `teacher` | `/login` | `/teacher/dashboard` |
| `parent` | `/login` | `/parent/dashboard` |

Los estudiantes (`student`) no tienen acceso al frontend — el backend rechaza sus credenciales en el login.

---

## Scripts disponibles

```bash
npm run dev      # Servidor de desarrollo con HMR
npm run build    # Build de producción en /dist
npm run preview  # Preview del build de producción
npm run lint     # Linter con oxlint
```