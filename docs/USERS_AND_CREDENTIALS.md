# Usuarios y Credenciales — MedControl Clinical Suite

> Fuente de verdad: `src/app/core/services/auth.service.ts` (MOCK_USERS).
> Credenciales iniciales (login de prueba) + acceso por rol.

---

## Credenciales

| # | Rol | Nombre | Email | Contraseña |
|---|---|---|---|---|
| 1 | Administrador | Administradora Central | `admin@medcontrol.com` | `admin123` |
| 2 | Médica | Dra. Noemí Aguirre | `aguirre@medcontrol.com` | `doctor123` |
| 3 | Médico | Dr. Jorge Mawad | `mawad@medcontrol.com` | `doctor123` |
| 4 | Médica | Dra. Sandra Muñoz | `munoz@medcontrol.com` | `doctor123` |

**Contraseña por defecto de médicos:** `doctor123`

---

## Acceso por rol

### Administrador (`admin`)
| Módulo | Acceso |
|---|---|
| Dashboard de Citas | Sí — puede ver TODOS los médicos y filtrar por cada uno |
| Pacientes & Historial Clínico | Sí |
| Agenda & Disponibilidad | Sí |
| Recetas & Exámenes | Sí |
| Notificaciones & Alertas | Sí |
| Configuración del Sistema | Sí |
| Header: Configuración | Visible |
| Header: Cerrar Sesión | Visible |

### Médico (`doctor`)
| Módulo | Acceso |
|---|---|
| Dashboard de Citas | Sí — solo ve SUS citas (bloqueado a su doctorId) |
| Pacientes & Historial Clínico | Sí |
| Recetas & Exámenes | Sí |
| Notificaciones & Alertas | Sí |
| Agenda & Disponibilidad | **NO** |
| Configuración del Sistema | **NO** |
| Header: Configuración | **NO** (oculto) |
| Header: Mi Agenda Clínica | Visible |

---

## Notas de implementación

- Auth 100% en memoria (sin persistencia). Un refresh cierra la sesión (re-login).
- No hay recuperación de contraseña ni registro de usuarios.
- La vista login (`/login`) se renderiza fuera del shell de la app (sin header ni sidebar).
- Botón "Credenciales de prueba" en el login muestra las 4 cuentas disponibles.
- `AuthService.getDoctorId()` devuelve el `doctorId` asociado al usuario (solo médicos).
- `AuthService.isDoctor()` fuerza el dashboard a mostrar solo las citas del médico logueado (`selectedDoctorId` bloqueado a su id en el constructor de `DashboardComponent`).
- Archivos relacionados:
  - `src/app/core/services/auth.service.ts` — servicio de auth (MOCK_USERS, login/logout)
  - `src/app/core/guards/auth.guard.ts` — guard de rutas
  - `src/app/views/login/login.component.ts` — vista de login
  - `src/app/app.routes.ts` — rutas protegidas con `canActivate: [authGuard]`
